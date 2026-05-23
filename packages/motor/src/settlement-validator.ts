/**
 * Spec: Fase 3 §11 — settlement-validator.
 *
 * Recebe uma proposta de acordo + capacidade do usuario + estado do motor.
 * Retorna recomendacao { accept | negotiate_lower | reject } com razao
 * humana.
 */

import type { FinancialState } from "./types";

export type SettlementRecommendation = "accept" | "negotiate_lower" | "reject";

export interface SettlementProposalInput {
	debtId: string;
	debtRemaining: number; // totalAmount - amountPaid
	proposalCashAmount: number | null;
	proposalInstallments: number | null;
	proposalInstallmentAmount: number | null;
	proposalDeadline: Date | null;
	safeCapacity: number;
	financialState: FinancialState;
	now: Date;
}

export interface SettlementEvaluationResult {
	debtId: string;
	recommendation: SettlementRecommendation;
	maxSafeInstallment: number | null;
	discountPercent: number | null;
	wouldCauseNegativeCashflow: boolean;
	reasoning: string;
}

const DISCOUNT_MIN_ACCEPT = 0.3; // >= 30%
const DISCOUNT_NEGOTIATE = 0.15; // 15-30%
const SAFE_INSTALLMENT_RATIO = 0.7; // max 70% da capacidade

export function evaluateSettlement(input: SettlementProposalInput): SettlementEvaluationResult {
	const maxSafeInstallment =
		input.safeCapacity > 0 ? input.safeCapacity * SAFE_INSTALLMENT_RATIO : 0;

	// Estados criticos: bloqueia aceitar acordo que comprometa essenciais.
	const stateBlocksAccept =
		input.financialState === "practical_insolvency" || input.financialState === "monthly_deficit";

	// Cenario A: proposta a vista (cash).
	if (input.proposalCashAmount !== null) {
		return evaluateCashProposal(input, maxSafeInstallment, stateBlocksAccept);
	}

	// Cenario B: proposta parcelada.
	if (input.proposalInstallmentAmount !== null) {
		return evaluateInstallmentProposal(input, maxSafeInstallment, stateBlocksAccept);
	}

	return {
		debtId: input.debtId,
		recommendation: "reject",
		maxSafeInstallment,
		discountPercent: null,
		wouldCauseNegativeCashflow: false,
		reasoning: "Proposta sem valor à vista nem parcelado — pedir números concretos.",
	};
}

function evaluateCashProposal(
	input: SettlementProposalInput,
	maxSafeInstallment: number,
	stateBlocksAccept: boolean,
): SettlementEvaluationResult {
	const cash = input.proposalCashAmount as number;
	const discountPercent = input.debtRemaining > 0 ? 1 - cash / input.debtRemaining : 0;
	const fitsInCapacity = cash <= input.safeCapacity;

	if (!fitsInCapacity) {
		return {
			debtId: input.debtId,
			recommendation: "negotiate_lower",
			maxSafeInstallment,
			discountPercent,
			wouldCauseNegativeCashflow: true,
			reasoning: `O valor à vista não cabe na capacidade segura deste mês. Negocie parcelado de no máximo R$${maxSafeInstallment.toFixed(2)} por mês.`,
		};
	}

	if (stateBlocksAccept) {
		return {
			debtId: input.debtId,
			recommendation: "reject",
			maxSafeInstallment,
			discountPercent,
			wouldCauseNegativeCashflow: false,
			reasoning:
				"Mesmo com desconto, o estado financeiro atual exige proteger essenciais primeiro. Pause negociação.",
		};
	}

	if (discountPercent >= DISCOUNT_MIN_ACCEPT) {
		return {
			debtId: input.debtId,
			recommendation: "accept",
			maxSafeInstallment,
			discountPercent,
			wouldCauseNegativeCashflow: false,
			reasoning: `Desconto de ${(discountPercent * 100).toFixed(0)}% cabe no orçamento. Aceitar.`,
		};
	}

	if (discountPercent >= DISCOUNT_NEGOTIATE) {
		return {
			debtId: input.debtId,
			recommendation: "negotiate_lower",
			maxSafeInstallment,
			discountPercent,
			wouldCauseNegativeCashflow: false,
			reasoning: `Desconto modesto (${(discountPercent * 100).toFixed(0)}%). Tente negociar mais.`,
		};
	}

	return {
		debtId: input.debtId,
		recommendation: "reject",
		maxSafeInstallment,
		discountPercent,
		wouldCauseNegativeCashflow: false,
		reasoning: "Desconto muito pequeno — não compensa quitar à vista agora.",
	};
}

function evaluateInstallmentProposal(
	input: SettlementProposalInput,
	maxSafeInstallment: number,
	stateBlocksAccept: boolean,
): SettlementEvaluationResult {
	const installment = input.proposalInstallmentAmount as number;
	const fitsInCapacity = installment <= maxSafeInstallment;

	if (!fitsInCapacity) {
		return {
			debtId: input.debtId,
			recommendation: "negotiate_lower",
			maxSafeInstallment,
			discountPercent: null,
			wouldCauseNegativeCashflow: true,
			reasoning: `Parcela proposta (R$${installment.toFixed(2)}) ultrapassa o limite seguro (R$${maxSafeInstallment.toFixed(2)}). Negocie reduzir.`,
		};
	}

	if (stateBlocksAccept) {
		return {
			debtId: input.debtId,
			recommendation: "reject",
			maxSafeInstallment,
			discountPercent: null,
			wouldCauseNegativeCashflow: false,
			reasoning:
				"Estado financeiro atual exige proteger essenciais primeiro. Pause antes de aceitar parcelamento.",
		};
	}

	return {
		debtId: input.debtId,
		recommendation: "accept",
		maxSafeInstallment,
		discountPercent: null,
		wouldCauseNegativeCashflow: false,
		reasoning: "Parcela cabe na capacidade segura. Aceitar.",
	};
}
