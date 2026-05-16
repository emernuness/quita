"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
	CreateExpenseInput,
	CreateIncomeInput,
	Expense,
	Income,
	UpdateExpenseInput,
	UpdateIncomeInput,
} from "@quita/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface FinancialSummary {
	totalIncome: number;
	totalExpenses: number;
	balance: number;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: ["incomes"] });
	qc.invalidateQueries({ queryKey: ["expenses"] });
	qc.invalidateQueries({ queryKey: ["financialSummary"] });
	qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useIncomes() {
	return useQuery({
		queryKey: ["incomes"],
		queryFn: () => apiGet<Income[]>("/financial/incomes"),
	});
}

export function useCreateIncome() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateIncomeInput) =>
			apiPost<Income, CreateIncomeInput>("/financial/incomes", input),
		onSuccess: () => invalidate(qc),
	});
}

export function useUpdateIncome() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...input }: UpdateIncomeInput & { id: string }) =>
			apiPatch<Income, UpdateIncomeInput>(`/financial/incomes/${id}`, input),
		onSuccess: () => invalidate(qc),
	});
}

export function useDeleteIncome() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiDelete(`/financial/incomes/${id}`),
		onSuccess: () => invalidate(qc),
	});
}

export function useExpenses() {
	return useQuery({
		queryKey: ["expenses"],
		queryFn: () => apiGet<Expense[]>("/financial/expenses"),
	});
}

export function useCreateExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateExpenseInput) =>
			apiPost<Expense, CreateExpenseInput>("/financial/expenses", input),
		onSuccess: () => invalidate(qc),
	});
}

export function useUpdateExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...input }: UpdateExpenseInput & { id: string }) =>
			apiPatch<Expense, UpdateExpenseInput>(`/financial/expenses/${id}`, input),
		onSuccess: () => invalidate(qc),
	});
}

export function useDeleteExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiDelete(`/financial/expenses/${id}`),
		onSuccess: () => invalidate(qc),
	});
}

export function useFinancialSummary() {
	return useQuery({
		queryKey: ["financialSummary"],
		queryFn: () => apiGet<FinancialSummary>("/financial/summary"),
	});
}
