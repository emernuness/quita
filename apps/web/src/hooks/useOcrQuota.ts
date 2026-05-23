"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface OcrQuota {
	used: number;
	limit: number;
	planType: "free" | "premium";
	resetsAt: string;
}

export function useOcrQuota() {
	return useQuery({
		queryKey: ["ocr", "quota"],
		queryFn: () => apiGet<OcrQuota>("/ocr/quota"),
	});
}

export interface SignedUploadResponse {
	uploadUrl: string;
	key: string;
}

export function useOcrSignedUpload() {
	return useMutation({
		mutationFn: (contentType: string) =>
			apiPost<SignedUploadResponse, { contentType: string }>("/ocr/signed-upload-url", {
				contentType,
			}),
	});
}

export interface OcrExtractedSettlement {
	type: "settlement_proposal";
	creditor: string | null;
	cashAmount: number | null;
	installments: number | null;
	installmentAmount: number | null;
	deadline: string | null;
	confidence: "high" | "medium" | "low";
}

export function useOcrExtractByKey() {
	return useMutation({
		mutationFn: (input: { key: string; type: "settlement_proposal" }) =>
			apiPost<{ extracted: OcrExtractedSettlement; key: string }, typeof input>(
				"/ocr/extract-by-key",
				input,
			),
	});
}
