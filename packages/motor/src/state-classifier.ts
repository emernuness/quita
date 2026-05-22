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
	const { capacity, debtsTotalMonthlyAmount, hasCriticalRiskDebt, debtsTotalRemaining = 0 } = input;

	if (isInsolvent(capacity)) return "practical_insolvency";
	if (isOverindebted(capacity, debtsTotalMonthlyAmount, debtsTotalRemaining))
		return "overindebtedness";
	if (capacity.safeCapacity < 0) return "monthly_deficit";

	const safeRatio =
		capacity.incomeNetMonthly > 0 ? capacity.safeCapacity / capacity.incomeNetMonthly : 0;

	if (safeRatio < TIGHT_BUDGET_RATIO) return "tight_budget";
	if (hasCriticalRiskDebt) return "tight_budget"; // upgrade defensivo

	return "healthy_with_debt";
}

function isInsolvent(c: CapacityBreakdown): boolean {
	// Fix H-04 + conformidade com spec §17.1: renda zero ou abaixo do
	// minimo vital regional => insolvencia pratica.
	if (c.incomeNetMonthly <= 0) return true;
	return c.incomeNetMonthly < c.minimumVital;
}

/**
 * Spec Fase 3 §7.4: superendividamento (Lei 14.181/2021) tem 2 critérios
 * alternativos — qualquer um caracteriza overindebtedness:
 *
 * 1. Parcelas mensais > 70% da renda líquida (critério rápido).
 * 2. Dívidas não cabem em 60 meses pagando 100% da capacidade segura
 *    (critério estrutural — quitação inviável sem ajuste).
 *
 * O segundo é checado apenas se o primeiro falha — evita custo de
 * cálculo quando o primeiro já decide. `debtsTotalRemaining` somatório
 * do restante (totalAmount - amountPaid) das dívidas ativas.
 */
const OVERINDEBT_HORIZON_MONTHS = 60;

function isOverindebted(
	c: CapacityBreakdown,
	debtsMonthly: number,
	debtsTotalRemaining: number,
): boolean {
	if (c.incomeNetMonthly <= 0) return false;
	if (debtsMonthly > c.incomeNetMonthly * OVERINDEBTEDNESS_RATIO) return true;
	// Critério estrutural: capacidade segura cobre a dívida em 60 meses?
	if (c.safeCapacity > 0 && debtsTotalRemaining > c.safeCapacity * OVERINDEBT_HORIZON_MONTHS) {
		return true;
	}
	return false;
}

function decideConfidence(input: StateClassifierInput): "high" | "medium" | "low" {
	if (input.diagnosisLevel === "detailed") return "high";
	if (input.diagnosisLevel === "basic") return "medium";
	return "low";
}
