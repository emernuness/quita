"use client";

import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type {
	OnboardingConcernInput,
	OnboardingDebtCategoriesInput,
	OnboardingDebtInput,
	OnboardingExpensesInput,
	OnboardingIncomeInput,
	OnboardingLocationInput,
} from "@quita/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function patchUserStep(step: number) {
	const { user, setUser } = useAuthStore.getState();
	if (user) setUser({ ...user, onboardingStep: step });
}

export function useSaveIncome() {
	return useMutation({
		mutationFn: (input: OnboardingIncomeInput) =>
			apiPost<{ step: number }, OnboardingIncomeInput>("/onboarding/income", input),
		onSuccess: (r) => patchUserStep(r.step),
	});
}

export function useSaveCategories() {
	return useMutation({
		mutationFn: (input: OnboardingDebtCategoriesInput) =>
			apiPost<{ step: number }, OnboardingDebtCategoriesInput>("/onboarding/categories", input),
		onSuccess: (r) => patchUserStep(r.step),
	});
}

export function useSaveDebts() {
	return useMutation({
		mutationFn: (debts: OnboardingDebtInput[]) =>
			apiPost<{ step: number }, OnboardingDebtInput[]>("/onboarding/debts", debts),
		onSuccess: (r) => patchUserStep(r.step),
	});
}

export function useSaveExpenses() {
	return useMutation({
		mutationFn: (input: OnboardingExpensesInput) =>
			apiPost<{ step: number }, OnboardingExpensesInput>("/onboarding/expenses", input),
		onSuccess: (r) => patchUserStep(r.step),
	});
}

export function useSaveLocation() {
	return useMutation({
		mutationFn: (input: OnboardingLocationInput) =>
			apiPost<{ saved: boolean }, OnboardingLocationInput>("/onboarding/location", input),
	});
}

export function useSaveConcern() {
	return useMutation({
		mutationFn: (input: OnboardingConcernInput) =>
			apiPost<{ saved: boolean }, OnboardingConcernInput>("/onboarding/concern", input),
	});
}

export function useCompleteOnboarding() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiPost<{ completed: boolean }>("/onboarding/complete"),
		onSuccess: () => {
			const { user, setUser } = useAuthStore.getState();
			if (user) setUser({ ...user, onboardingCompleted: true });
			qc.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}
