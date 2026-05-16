"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
	CreateDebtInput,
	CreatePaymentInput,
	Debt,
	DebtCategory,
	Payment,
	UpdateDebtInput,
} from "@quita/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface DebtDetail extends Debt {
	category: DebtCategory;
	payments: Payment[];
}

export function useDebts() {
	return useQuery({
		queryKey: ["debts"],
		queryFn: () => apiGet<Debt[]>("/debts"),
	});
}

export function useDebt(id: string) {
	return useQuery({
		queryKey: ["debts", id],
		queryFn: () => apiGet<DebtDetail>(`/debts/${id}`),
		enabled: !!id,
	});
}

export function useDebtCategories() {
	return useQuery({
		queryKey: ["debtCategories"],
		queryFn: () => apiGet<DebtCategory[]>("/debts/categories"),
		staleTime: 5 * 60_000,
	});
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: ["debts"] });
	qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateDebt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateDebtInput) => apiPost<Debt, CreateDebtInput>("/debts", input),
		onSuccess: () => invalidateAll(qc),
	});
}

export function useUpdateDebt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...input }: UpdateDebtInput & { id: string }) =>
			apiPatch<Debt, UpdateDebtInput>(`/debts/${id}`, input),
		onSuccess: () => invalidateAll(qc),
	});
}

export function useDeleteDebt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiDelete(`/debts/${id}`),
		onSuccess: () => invalidateAll(qc),
	});
}

export function useCreatePayment(debtId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreatePaymentInput) =>
			apiPost<Payment, CreatePaymentInput>(`/debts/${debtId}/payments`, input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["debts"] });
			qc.invalidateQueries({ queryKey: ["debts", debtId] });
			qc.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}
