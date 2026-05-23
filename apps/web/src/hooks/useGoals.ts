"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type GoalType =
	| "debt_freedom"
	| "house"
	| "education"
	| "family"
	| "travel"
	| "peace"
	| "security"
	| "retirement"
	| "other";

export interface UserGoal {
	id: string;
	goalType: GoalType;
	description: string;
	targetAmount: string | number | null;
	targetDate: string | null;
	priorityOrder: number;
	isActive: boolean;
	achievedAt: string | null;
	createdAt: string;
}

export interface CreateGoalPayload {
	goalType: GoalType;
	description: string;
	targetAmount?: number | null;
	targetDate?: string | null;
	priorityOrder?: number;
}

export function useGoals() {
	return useQuery({ queryKey: ["goals"], queryFn: () => apiGet<UserGoal[]>("/goals") });
}

export function useCreateGoal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (p: CreateGoalPayload) => apiPost<UserGoal>("/goals", p),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
	});
}

export function useUpdateGoal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...rest
		}: Partial<CreateGoalPayload> & { id: string; achievedAt?: string | null }) =>
			apiPatch<UserGoal>(`/goals/${id}`, rest),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
	});
}

export function useDeleteGoal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiDelete(`/goals/${id}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
	});
}
