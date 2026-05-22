/**
 * Spec: Fase 3 §14 — monthly-plan-generator (orquestrador puro).
 *
 * Junta as 11 outras pecas em um pipeline deterministico:
 *
 *   capacity-calculator
 *           |
 *           v
 *   state-classifier -> mode-selector
 *           |
 *           v
 *   priority-engine + strategy-selector
 *           |
 *           v
 *   simulator (3 cenarios)
 *           |
 *           v
 *   actions geradas (ja respeitando OPERATION_MODE_RULES)
 *
 * O orquestrador eh PURO. Toda I/O (carregar usuario, despesas,
 * dividas, salvar MonthlyActionPlan, RecommendedAction) acontece no
 * NestJS service que envolve esta funcao.
 */

import { calculateCapacity } from "./capacity-calculator";
import {
	type ClassifiedDebt,
	type PriorityScoreOutput,
	calculatePriorityBatch,
} from "./priority-engine";
import { type SimulationResult, type SimulatorDebt, runSimulation } from "./simulator";
import { classifyState } from "./state-classifier";
import {
	type PlanStrategy,
	type PreferredStrategy,
	getAllowedActions,
	selectStrategy,
} from "./strategy-selector";
import type {
	ActionType,
	CapacityBreakdown,
	CapacityCalculatorInput,
	DiagnosisLevel,
	FinancialState,
	MotorContext,
	MotorResult,
	OperationMode,
} from "./types";

export interface MonthlyPlanGeneratorInput {
	context: MotorContext;
	capacity: CapacityCalculatorInput;
	debts: ClassifiedDebt[];
	debtsTotalMonthlyAmount: number;
	hasCriticalRiskDebt: boolean;
	diagnosisLevel: DiagnosisLevel;
	preferredStrategy: PreferredStrategy | null;
	smallDebtsCount: number;
	highInterestDebtsCount: number;
}

export interface RecommendedActionDraft {
	order: number;
	actionType: ActionType;
	targetDebtId: string | null;
	targetLabel: string;
	amount: number | null;
	reason: string;
}

export interface MonthlyPlanDraft {
	financialState: FinancialState;
	operationMode: OperationMode;
	strategy: PlanStrategy;
	capacity: CapacityBreakdown;
	mainGoal: string;
	actions: RecommendedActionDraft[];
	simulation: SimulationResult;
	priorities: PriorityScoreOutput[];
}

export function generateMonthlyPlan(
	input: MonthlyPlanGeneratorInput,
): MotorResult<MonthlyPlanDraft> {
	const warnings: string[] = [];
	const internalWarnings: string[] = [];

	const capacity = calculateCapacity(input.capacity);

	if (capacity.safeCapacity < 0) {
		warnings.push("Suas saídas obrigatórias estão maiores que sua renda este mês.");
	}

	const stateResult = classifyState({
		capacity,
		debtsTotalMonthlyAmount: input.debtsTotalMonthlyAmount,
		hasCriticalRiskDebt: input.hasCriticalRiskDebt,
		diagnosisLevel: input.diagnosisLevel,
	});

	if (stateResult.confidence === "low") {
		warnings.push("Diagnóstico inicial — refine seus dados para um plano mais preciso.");
	}

	const strategy = selectStrategy({
		financialState: stateResult.state,
		mode: stateResult.mode,
		debtsCount: input.debts.length,
		smallDebtsCount: input.smallDebtsCount,
		highInterestDebtsCount: input.highInterestDebtsCount,
		preferredStrategy: input.preferredStrategy,
	});

	const priorities = calculatePriorityBatch(input.debts, {
		safeCapacity: capacity.safeCapacity,
		financialState: stateResult.state,
	});

	const allowedActions = new Set<ActionType>(getAllowedActions(stateResult.mode));

	const actions = generateActions(priorities, input.debts, allowedActions, stateResult.mode);

	const simulation = runSimulation({
		debts: input.debts.map(toSimulatorDebt),
		safeCapacity: Math.max(0, capacity.safeCapacity),
		strategy: strategy === "crisis" ? "snowball" : strategy,
	});

	if (simulation.optimized.estimatedMonths === null) {
		internalWarnings.push("simulator: nao foi possivel projetar quitacao em <= 120 meses");
	}

	return {
		data: {
			financialState: stateResult.state,
			operationMode: stateResult.mode,
			strategy,
			capacity,
			mainGoal: deriveMainGoal(stateResult.state, stateResult.mode),
			actions,
			simulation,
			priorities,
		},
		warnings,
		internalWarnings,
	};
}

function generateActions(
	priorities: PriorityScoreOutput[],
	debts: ClassifiedDebt[],
	allowed: Set<ActionType>,
	mode: OperationMode,
): RecommendedActionDraft[] {
	const debtById = new Map(debts.map((d) => [d.id, d]));
	const out: RecommendedActionDraft[] = [];

	for (let i = 0; i < priorities.length; i += 1) {
		const p = priorities[i];
		const debt = debtById.get(p.debtId);
		if (!debt) continue;

		const actionType = pickActionType(debt, allowed, mode);
		if (!actionType) continue;

		out.push({
			order: i + 1,
			actionType,
			targetDebtId: debt.id,
			targetLabel: `Dívida ${debt.id.slice(0, 8)}`, // orquestrador NestJS substitui pelo creditor
			amount: debt.monthlyAmount,
			reason: p.reason,
		});
	}

	return out;
}

function pickActionType(
	debt: ClassifiedDebt,
	allowed: Set<ActionType>,
	mode: OperationMode,
): ActionType | null {
	// Em survival, so monitor/wait/review/pause. Pay e negotiate bloqueados.
	if (mode === "survival" || mode === "protection") {
		if (allowed.has("pause")) return "pause";
		if (allowed.has("wait")) return "wait";
		return "monitor";
	}

	if (debt.hasLegalRisk && allowed.has("negotiate")) return "negotiate";
	if (debt.monthlyAmount && debt.monthlyAmount > 0 && allowed.has("pay")) return "pay";
	if (allowed.has("review")) return "review";
	return "monitor";
}

function toSimulatorDebt(d: ClassifiedDebt): SimulatorDebt {
	return {
		id: d.id,
		remainingAmount: Math.max(0, d.totalAmount - d.amountPaid),
		interestRateMonthly: d.interestRateMonthly ?? 0,
		monthlyMinimum: d.monthlyAmount ?? 0,
	};
}

function deriveMainGoal(state: FinancialState, mode: OperationMode): string {
	switch (state) {
		case "healthy_with_debt":
			return "Quitar dívidas no menor tempo possível mantendo folga mensal.";
		case "tight_budget":
			return "Estabilizar orçamento criando folga antes de acelerar quitação.";
		case "monthly_deficit":
			return "Sair do vermelho mensal: cortar gastos e pausar dívidas não essenciais.";
		case "overindebtedness":
			return "Renegociar em bloco (Lei 14.181) e proteger renda + moradia.";
		case "practical_insolvency":
			return "Garantir essenciais e buscar apoio (defensoria, PROCON, Consumidor.gov).";
		default:
			return `Operando em modo ${mode}.`;
	}
}
