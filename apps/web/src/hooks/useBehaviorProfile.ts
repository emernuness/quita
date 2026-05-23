"use client";

import { api, apiGet } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PreferredStrategy = "snowball" | "avalanche" | "hybrid" | "undecided";
export type MainConcern =
	| "collection_pressure"
	| "service_cut_risk"
	| "disorganization"
	| "shame"
	| "where_to_start";

export interface BehaviorProfile {
	id: string;
	preferredStrategy: PreferredStrategy;
	mainConcern: MainConcern | null;
	motivationLevel: number | null;
	disciplineLevel: number | null;
}

export interface UpsertBehaviorPayload {
	preferredStrategy?: PreferredStrategy;
	mainConcern?: MainConcern;
	motivationLevel?: number;
	disciplineLevel?: number;
}

export function useBehaviorProfile() {
	return useQuery({
		queryKey: ["behavior-profile"],
		queryFn: () => apiGet<BehaviorProfile | null>("/behavior-profile"),
	});
}

export function useUpsertBehaviorProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: UpsertBehaviorPayload) => {
			const res = await api.put<{ data: BehaviorProfile }>("/behavior-profile", payload);
			return res.data.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["behavior-profile"] }),
	});
}
