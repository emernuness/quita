import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type {
	ApiResponse,
	Debt,
	DebtCategory,
	Payment,
} from "@quita/shared";
import type { CreateDebtInput, UpdateDebtInput, CreatePaymentInput } from "@quita/shared";

interface DebtDetail extends Debt {
	category: DebtCategory;
	payments: Payment[];
}

export function useDebts() {
	return useQuery({
		queryKey: ["debts"],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<Debt[]>>("/debts");
			return data.data;
		},
	});
}

export function useDebt(id: string) {
	return useQuery({
		queryKey: ["debts", id],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<DebtDetail>>(
				`/debts/${id}`,
			);
			return data.data;
		},
		enabled: !!id,
	});
}

export function useCreateDebt() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateDebtInput) => {
			const { data } = await api.post<ApiResponse<Debt>>("/debts", input);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["debts"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useUpdateDebt() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...input }: UpdateDebtInput & { id: string }) => {
			const { data } = await api.patch<ApiResponse<Debt>>(
				`/debts/${id}`,
				input,
			);
			return data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["debts"] });
			queryClient.invalidateQueries({ queryKey: ["debts", variables.id] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useDeleteDebt() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/debts/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["debts"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useCreatePayment(debtId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePaymentInput) => {
			const { data } = await api.post<ApiResponse<Payment>>(
				`/debts/${debtId}/payments`,
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["debts"] });
			queryClient.invalidateQueries({ queryKey: ["debts", debtId] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useUndoPayment(debtId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (paymentId: string) => {
			await api.delete(`/debts/${debtId}/payments/${paymentId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["debts"] });
			queryClient.invalidateQueries({ queryKey: ["debts", debtId] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

export function useDebtCategories() {
	return useQuery({
		queryKey: ["debtCategories"],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<DebtCategory[]>>(
				"/debts/categories",
			);
			return data.data;
		},
		staleTime: 5 * 60 * 1000, // categories rarely change
	});
}
