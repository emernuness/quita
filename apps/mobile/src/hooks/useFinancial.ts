import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { ApiResponse, Expense, Income } from "@quita/shared";
import type {
	CreateExpenseInput,
	CreateIncomeInput,
	UpdateExpenseInput,
	UpdateIncomeInput,
} from "@quita/shared";

interface FinancialSummary {
	totalIncome: number;
	totalExpenses: number;
	available: number;
}

// ── Incomes ──────────────────────────────────────────────────────────

export function useIncomes() {
	return useQuery({
		queryKey: ["incomes"],
		queryFn: async () => {
			const { data } =
				await api.get<ApiResponse<Income[]>>("/financial/incomes");
			return data.data;
		},
	});
}

export function useCreateIncome() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateIncomeInput) => {
			const { data } = await api.post<ApiResponse<Income>>(
				"/financial/incomes",
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incomes"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useUpdateIncome() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...input
		}: UpdateIncomeInput & { id: string }) => {
			const { data } = await api.patch<ApiResponse<Income>>(
				`/financial/incomes/${id}`,
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incomes"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useDeleteIncome() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/financial/incomes/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incomes"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

// ── Expenses ─────────────────────────────────────────────────────────

export function useExpenses() {
	return useQuery({
		queryKey: ["expenses"],
		queryFn: async () => {
			const { data } =
				await api.get<ApiResponse<Expense[]>>("/financial/expenses");
			return data.data;
		},
	});
}

export function useCreateExpense() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateExpenseInput) => {
			const { data } = await api.post<ApiResponse<Expense>>(
				"/financial/expenses",
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useUpdateExpense() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...input
		}: UpdateExpenseInput & { id: string }) => {
			const { data } = await api.patch<ApiResponse<Expense>>(
				`/financial/expenses/${id}`,
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useDeleteExpense() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/financial/expenses/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
			queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

// ── Summary ──────────────────────────────────────────────────────────

export function useFinancialSummary() {
	return useQuery({
		queryKey: ["financialSummary"],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<FinancialSummary>>(
				"/financial/summary",
			);
			return data.data;
		},
	});
}
