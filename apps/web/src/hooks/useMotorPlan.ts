"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type FinancialState =
	| "healthy_with_debt"
	| "tight_budget"
	| "monthly_deficit"
	| "overindebtedness"
	| "practical_insolvency";

export type OperationMode = "payoff" | "stabilization" | "crisis_mode" | "protection" | "survival";

export type ActionType =
	| "pay"
	| "negotiate"
	| "pause"
	| "cut"
	| "wait"
	| "review"
	| "refuse"
	| "monitor";

export interface MotorPlanAction {
	id: string;
	order: number;
	actionType: ActionType;
	targetDebtId: string | null;
	targetLabel: string;
	amount: number | null;
	reason: string;
	status: "pending" | "completed" | "skipped" | "dismissed" | "expired";
}

export interface MotorPlan {
	id: string;
	financialState: FinancialState;
	operationMode: OperationMode;
	safeCapacity: number;
	incomeNetMonthly: number;
	essentialsTotal: number;
	mainGoal: string;
	warnings: string[];
	updatedAt: string;
	actions: MotorPlanAction[];
}

export function useMotorPlan() {
	return useQuery<MotorPlan>({
		queryKey: ["motor", "plan"],
		queryFn: () => apiGet<MotorPlan>("/motor/plan"),
	});
}

export function useRecalculateMotor() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiPost("/motor/recalculate"),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["motor", "plan"] });
		},
	});
}
