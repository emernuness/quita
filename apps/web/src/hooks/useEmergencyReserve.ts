"use client";

import { apiGet } from "@/lib/api";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EmergencyReserve {
	id: string;
	currentAmount: string | number;
	targetAmount: string | number | null;
	monthlyTarget: string | number | null;
	isActive: boolean;
	startedAt: string | null;
}

export interface UpsertReservePayload {
	currentAmount?: number;
	targetAmount?: number | null;
	monthlyTarget?: number | null;
	isActive?: boolean;
}

export function useEmergencyReserve() {
	return useQuery({
		queryKey: ["emergency-reserve"],
		queryFn: () => apiGet<EmergencyReserve | null>("/emergency-reserve"),
	});
}

export function useUpsertEmergencyReserve() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: UpsertReservePayload) => {
			const res = await api.put<{ data: EmergencyReserve }>("/emergency-reserve", payload);
			return res.data.data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-reserve"] }),
	});
}
