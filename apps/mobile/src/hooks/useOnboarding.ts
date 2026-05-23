import type { ApiResponse } from "@quita/shared";
import type {
	OnboardingDebtCategoriesInput,
	OnboardingDebtInput,
	OnboardingExpensesInput,
	OnboardingIncomeInput,
} from "@quita/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";

export function useSaveIncome() {
	return useMutation({
		mutationFn: async (input: OnboardingIncomeInput) => {
			const { data } = await api.post<ApiResponse<{ step: number }>>("/onboarding/income", input);
			return data.data;
		},
		onSuccess: (result) => {
			const { setUser, user } = useAuthStore.getState();
			if (user) setUser({ ...user, onboardingStep: result.step });
		},
	});
}

export function useSaveCategories() {
	return useMutation({
		mutationFn: async (input: OnboardingDebtCategoriesInput) => {
			const { data } = await api.post<ApiResponse<{ step: number }>>(
				"/onboarding/categories",
				input,
			);
			return data.data;
		},
		onSuccess: (result) => {
			const { setUser, user } = useAuthStore.getState();
			if (user) setUser({ ...user, onboardingStep: result.step });
		},
	});
}

export function useSaveDebts() {
	return useMutation({
		mutationFn: async (debts: OnboardingDebtInput[]) => {
			const { data } = await api.post<ApiResponse<{ step: number }>>("/onboarding/debts", debts);
			return data.data;
		},
		onSuccess: (result) => {
			const { setUser, user } = useAuthStore.getState();
			if (user) setUser({ ...user, onboardingStep: result.step });
		},
	});
}

export function useSaveExpenses() {
	return useMutation({
		mutationFn: async (input: OnboardingExpensesInput) => {
			const { data } = await api.post<ApiResponse<{ step: number }>>("/onboarding/expenses", input);
			return data.data;
		},
		onSuccess: (result) => {
			const { setUser, user } = useAuthStore.getState();
			if (user) setUser({ ...user, onboardingStep: result.step });
		},
	});
}

export function useCompleteOnboarding() {
	const queryClient = useQueryClient();

	return useMutation<{ completed: boolean }, Error, void>({
		mutationFn: async () => {
			const { data } = await api.post<ApiResponse<{ completed: boolean }>>("/onboarding/complete");
			return data.data;
		},
		onSuccess: () => {
			// Mark onboarding as completed in auth store
			const { setUser, user } = useAuthStore.getState();
			if (user) {
				setUser({ ...user, onboardingCompleted: true });
			}
			// Pre-fetch dashboard data for the main screen
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}
