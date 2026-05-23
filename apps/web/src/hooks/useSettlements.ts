"use client";

import { apiPost } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export interface SettlementEvaluation {
	id: string;
	recommendation: "accept" | "negotiate_lower" | "reject";
	maxSafeInstallment: number | null;
	discountPercent: number | null;
	wouldCauseNegativeCashflow: boolean;
	reasoning: string;
	capacityAtEvaluation: number;
	usedOcr: boolean;
	ocrExtractedData?: Record<string, unknown> | null;
}

export interface EvaluateSettlementPayload {
	debtId: string;
	proposalCashAmount?: number;
	proposalInstallments?: number;
	proposalInstallmentAmount?: number;
	proposalDeadline?: string;
}

export function useEvaluateSettlement() {
	return useMutation({
		mutationFn: (payload: EvaluateSettlementPayload) =>
			apiPost<SettlementEvaluation>("/settlements/evaluate", payload),
	});
}

export function useEvaluateFromImage() {
	return useMutation({
		mutationFn: (payload: { debtId: string; imageBase64: string }) =>
			apiPost<SettlementEvaluation>("/settlements/validate-from-image", payload),
	});
}
