/**
 * Spec: Fase 3 §7.5 — Regra de suavização de transição de estado.
 *
 * Resolve DT-17. Evita oscilação do estado financeiro a cada flutuação
 * de renda/despesa mensal.
 *
 * Regra: PIORA exige 2 meses consecutivos no estado pior. MELHORA é
 * aplicada imediatamente. Estados mais críticos (rank maior) representam
 * piora.
 *
 * Ranking (maior = pior):
 *   0 healthy_with_debt
 *   1 tight_budget
 *   2 monthly_deficit
 *   3 overindebtedness
 *   4 practical_insolvency
 */

import type { FinancialState } from "./types";

const STATE_RANK: Record<FinancialState, number> = {
	healthy_with_debt: 0,
	tight_budget: 1,
	monthly_deficit: 2,
	overindebtedness: 3,
	practical_insolvency: 4,
};

export interface SmoothingInput {
	rawState: FinancialState; // estado bruto detectado neste mes
	lastState: FinancialState | null; // ultimo estado persistido
	lastRawState?: FinancialState | null; // raw_state do snapshot anterior (se houver)
}

export interface SmoothingResult {
	smoothedState: FinancialState;
	transitionType: "stable" | "improvement" | "downgrade_pending" | "downgrade_applied";
	pendingDowngradeFor: FinancialState | null;
}

export function applySmoothingRule(input: SmoothingInput): SmoothingResult {
	const { rawState, lastState, lastRawState } = input;

	// Sem historico → primeira observacao sempre vence.
	if (lastState === null) {
		return {
			smoothedState: rawState,
			transitionType: "stable",
			pendingDowngradeFor: null,
		};
	}

	const rawRank = STATE_RANK[rawState];
	const lastRank = STATE_RANK[lastState];

	// Estado igual → estavel.
	if (rawRank === lastRank) {
		return {
			smoothedState: rawState,
			transitionType: "stable",
			pendingDowngradeFor: null,
		};
	}

	// Melhora (rank menor) → aplica imediatamente.
	if (rawRank < lastRank) {
		return {
			smoothedState: rawState,
			transitionType: "improvement",
			pendingDowngradeFor: null,
		};
	}

	// Piora (rank maior). Exige 2 meses consecutivos no estado pior.
	// Se mes anterior tambem ja detectava esse estado pior, aplica.
	if (lastRawState !== null && lastRawState !== undefined) {
		const lastRawRank = STATE_RANK[lastRawState];
		if (lastRawRank >= rawRank) {
			return {
				smoothedState: rawState,
				transitionType: "downgrade_applied",
				pendingDowngradeFor: null,
			};
		}
	}

	// Primeira deteccao da piora — mantem estado anterior, sinaliza pendencia.
	return {
		smoothedState: lastState,
		transitionType: "downgrade_pending",
		pendingDowngradeFor: rawState,
	};
}

export function stateRank(state: FinancialState): number {
	return STATE_RANK[state];
}
