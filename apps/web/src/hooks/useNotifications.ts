"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface NotificationItem {
	id: string;
	userId: string;
	category: string;
	severity: "info" | "success" | "warning" | "danger";
	title: string;
	body: string;
	linkUrl: string | null;
	readAt: string | null;
	createdAt: string;
}

export function useNotifications(opts: { unreadOnly?: boolean; limit?: number } = {}) {
	const params = new URLSearchParams();
	if (opts.unreadOnly) params.set("unreadOnly", "true");
	if (opts.limit) params.set("limit", String(opts.limit));
	const qs = params.toString();
	return useQuery({
		queryKey: ["notifications", opts.unreadOnly ?? false, opts.limit ?? 50],
		queryFn: () => apiGet<NotificationItem[]>(`/notifications${qs ? `?${qs}` : ""}`),
	});
}

export function useUnreadCount() {
	return useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: () => apiGet<{ count: number }>("/notifications/unread-count"),
		refetchInterval: 60_000,
	});
}

export function useMarkRead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiPost<{ updated: number }>(`/notifications/${id}/read`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}

export function useMarkAllRead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => apiPost<{ updated: number }>("/notifications/read-all"),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
