import type { ActionType, FinancialState, OperationMode } from "./types";

export type PlanStrategy = "snowball" | "avalanche" | "hybrid" | "crisis";

export type PreferredStrategy = PlanStrategy | "undecided";

/**
 * Constante critica do motor (Fase 3 §9.3).
 *
 * Define quais ActionType cada modo pode emitir. Validacao inviolavel:
 * **modo `survival` NUNCA gera `pay` ou `negotiate`**.
 */
export const OPERATION_MODE_RULES: Record<OperationMode, ActionType[]> = {
	payoff: ["pay", "negotiate", "cut", "review", "monitor"],
	stabilization: ["pay", "negotiate", "cut", "review", "monitor"],
	crisis_mode: ["pay", "negotiate", "pause", "cut", "wait", "refuse", "review"],
	protection: ["negotiate", "pause", "wait", "refuse", "review", "monitor"],
	survival: ["pause", "wait", "review", "monitor"],
};

export interface StrategySelectorInput {
	financialState: FinancialState;
	mode: OperationMode;
	debtsCount: number;
	smallDebtsCount: number; // dividas com restante < 1000
	highInterestDebtsCount: number; // juros mensal > 5%
	preferredStrategy: PreferredStrategy | null;
}

export function selectStrategy(input: StrategySelectorInput): PlanStrategy {
	// 1. Estados criticos forcam crisis (override de preferencia)
	if (
		input.financialState === "monthly_deficit" ||
		input.financialState === "overindebtedness" ||
		input.financialState === "practical_insolvency"
	) {
		return "crisis";
	}

	// 2. Preferencia declarada do usuario respeitada (estados nao-criticos)
	if (input.preferredStrategy && input.preferredStrategy !== "undecided") {
		return input.preferredStrategy;
	}

	// 3. Auto-selecao: snowball para muitas pequenas; avalanche se juros altos
	//    dominam; hybrid no meio.
	if (input.smallDebtsCount >= 3) return "snowball";
	if (input.highInterestDebtsCount >= 2) return "avalanche";
	return "hybrid";
}

export function getAllowedActions(mode: OperationMode): ActionType[] {
	return OPERATION_MODE_RULES[mode];
}

/**
 * Guarda inviolavel: bloqueia geracao de `pay`/`negotiate` em `survival`.
 * Chame antes de adicionar uma acao ao plano.
 */
export function isActionAllowed(action: ActionType, mode: OperationMode): boolean {
	return OPERATION_MODE_RULES[mode].includes(action);
}
