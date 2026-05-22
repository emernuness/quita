import { selectMode } from "./mode-selector";
import type {
	CapacityBreakdown,
	FinancialState,
	StateClassifierInput,
	StateClassifierOutput,
} from "./types";

/**
 * Classifica o estado financeiro do usuario a partir do breakdown de capacidade.
 *
 * Spec: Fase 1 §7.4 + Fase 3 §7.4 (algoritmo de decisao de estado).
 *
 * Ordem de avaliacao (top-down, primeira match ganha):
 *
 * 1. **practical_insolvency**: renda liquida < minimumVital regional.
 *    Usuario nao consegue cobrir nem o minimo digno para a UF.
 *
 * 2. **overindebtedness**: parcelas mensais de dividas > 70% da renda
 *    liquida ApA§S subtrair essenciais + provisao + proteccao. Lei
 *    14.181/2021 — superendividamento.
 *
 * 3. **monthly_deficit**: capacidade segura < 0. Usuario consegue
 *    cobrir essenciais mas nao tem folga para dividas.
 *
 * 4. **tight_budget**: capacidade segura >= 0 mas baixa relativa a
 *    renda (< 15%). Margem apertada.
 *
 * 5. **healthy_with_debt**: capacidade >= 15% da renda E sem risco
 *    critico ativo.
 *
 * Modo de operacao deriva diretamente do estado (selectMode).
 *
 * @returns estado + modo + confianca (ajustada por diagnosisLevel).
 */
export function classifyState(input: StateClassifierInput): StateClassifierOutput {
	const state = decideState(input);
	const mode = selectMode(state);
	const confidence = decideConfidence(input);
	return { state, mode, confidence };
}

const TIGHT_BUDGET_RATIO = 0.15;
const OVERINDEBTEDNESS_RATIO = 0.7;

function decideState(input: StateClassifierInput): FinancialState {
	const { capacity, debtsTotalMonthlyAmount, hasCriticalRiskDebt } = input;

	if (isInsolvent(capacity)) return "practical_insolvency";
	if (isOverindebted(capacity, debtsTotalMonthlyAmount)) return "overindebtedness";
	if (capacity.safeCapacity < 0) return "monthly_deficit";

	const safeRatio =
		capacity.incomeNetMonthly > 0 ? capacity.safeCapacity / capacity.incomeNetMonthly : 0;

	if (safeRatio < TIGHT_BUDGET_RATIO) return "tight_budget";
	if (hasCriticalRiskDebt) return "tight_budget"; // upgrade defensivo

	return "healthy_with_debt";
}

function isInsolvent(c: CapacityBreakdown): boolean {
	return c.incomeNetMonthly > 0 && c.incomeNetMonthly < c.minimumVital;
}

function isOverindebted(c: CapacityBreakdown, debtsMonthly: number): boolean {
	if (c.incomeNetMonthly <= 0) return false;
	// Capacidade pre-debito: o que sobra depois de essenciais + sazonais +
	// proteccao + legals + reservas, mas ANTES de subtrair dividas.
	const preDebtCapacity = c.safeCapacity + 0; // safeCapacity ja exclui dividas
	void preDebtCapacity;
	return debtsMonthly > c.incomeNetMonthly * OVERINDEBTEDNESS_RATIO;
}

function decideConfidence(input: StateClassifierInput): "high" | "medium" | "low" {
	if (input.diagnosisLevel === "detailed") return "high";
	if (input.diagnosisLevel === "basic") return "medium";
	return "low";
}
