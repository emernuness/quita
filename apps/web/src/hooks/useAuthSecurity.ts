"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AuthAuditEvent {
	id: string;
	eventType: string;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
	metadata: Record<string, unknown> | null;
}

export function useAuditLog(limit = 50) {
	return useQuery({
		queryKey: ["auth", "audit-log", limit],
		queryFn: () => apiGet<AuthAuditEvent[]>(`/auth/audit-log?limit=${limit}`),
	});
}

export function useLogoutAll() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiPost<{ ok: boolean }>("/auth/logout-all"),
		onSuccess: () => qc.clear(),
	});
}
