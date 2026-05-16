"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type {
	ChangePasswordInput,
	NotificationPreference,
	UpdateDiscreteModeInput,
	UpdateNotificationPrefsInput,
	UpdateProfileInput,
	UpdateSecurityInput,
	User,
} from "@quita/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: () => apiGet<User>("/profile"),
	});
}

export function useUpdateProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateProfileInput) =>
			apiPatch<User, UpdateProfileInput>("/profile", input),
		onSuccess: (u) => {
			qc.invalidateQueries({ queryKey: ["profile"] });
			const { user, setUser } = useAuthStore.getState();
			if (user) setUser({ ...user, ...u });
		},
	});
}

export function useChangePassword() {
	return useMutation({
		mutationFn: (input: ChangePasswordInput) =>
			apiPatch<{ updated: boolean }, ChangePasswordInput>("/profile/password", input),
	});
}

export function useUpdateSecurity() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateSecurityInput) =>
			apiPatch<User, UpdateSecurityInput>("/profile/security", input),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
	});
}

export function useToggleDiscreteMode() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateDiscreteModeInput) =>
			apiPatch<User, UpdateDiscreteModeInput>("/profile/discrete-mode", input),
		onSuccess: (u) => {
			qc.invalidateQueries({ queryKey: ["profile"] });
			const { user, setUser } = useAuthStore.getState();
			if (user) setUser({ ...user, discreteMode: u.discreteMode });
		},
	});
}

export function useNotificationPrefs() {
	return useQuery({
		queryKey: ["notificationPrefs"],
		queryFn: () => apiGet<NotificationPreference>("/profile/notifications"),
	});
}

export function useUpdateNotificationPrefs() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateNotificationPrefsInput) =>
			apiPatch<NotificationPreference, UpdateNotificationPrefsInput>(
				"/profile/notifications",
				input,
			),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationPrefs"] }),
	});
}
