import type { FinancialState, OperationMode } from "./types";

/**
 * Mapeia estado financeiro -> modo de operacao do app.
 *
 * Spec: Fase 1 §7.5 + Fase 3 §7.8 (STATE_TO_MODE).
 *
 * - healthy_with_debt    -> payoff       (foco em quitar)
 * - tight_budget         -> stabilization (estabilizar antes de quitar)
 * - monthly_deficit      -> crisis_mode  (cortar gasto, pausar dividas)
 * - overindebtedness     -> protection   (Lei 14.181, renegociacao mass)
 * - practical_insolvency -> survival     (essenciais + apoio externo)
 */
export function selectMode(state: FinancialState): OperationMode {
	switch (state) {
		case "healthy_with_debt":
			return "payoff";
		case "tight_budget":
			return "stabilization";
		case "monthly_deficit":
			return "crisis_mode";
		case "overindebtedness":
			return "protection";
		case "practical_insolvency":
			return "survival";
	}
}
