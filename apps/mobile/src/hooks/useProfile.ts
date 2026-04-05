import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { ApiResponse, NotificationPreference, User } from "@quita/shared";
import type {
	ChangePasswordInput,
	UpdateDiscreteModeInput,
	UpdateNotificationPrefsInput,
	UpdateProfileInput,
	UpdateSecurityInput,
} from "@quita/shared";
import { useAuthStore } from "../stores/auth";

export function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<User>>("/profile");
			return data.data;
		},
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateProfileInput) => {
			const { data } = await api.patch<ApiResponse<User>>(
				"/profile",
				input,
			);
			return data.data;
		},
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			// Keep auth store user in sync
			const { setUser, user } = useAuthStore.getState();
			if (user) {
				setUser({ ...user, ...updatedUser });
			}
		},
	});
}

export function useChangePassword() {
	return useMutation({
		mutationFn: async (input: ChangePasswordInput) => {
			const { data } = await api.patch<ApiResponse<{ message: string }>>(
				"/profile/password",
				input,
			);
			return data.data;
		},
	});
}

export function useUpdateSecurity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateSecurityInput) => {
			const { data } = await api.patch<ApiResponse<User>>(
				"/profile/security",
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
	});
}

export function useToggleDiscreteMode() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateDiscreteModeInput) => {
			const { data } = await api.patch<ApiResponse<User>>(
				"/profile/discrete-mode",
				input,
			);
			return data.data;
		},
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			const { setUser, user } = useAuthStore.getState();
			if (user) {
				setUser({ ...user, discreteMode: updatedUser.discreteMode });
			}
		},
	});
}

export function useNotificationPrefs() {
	return useQuery({
		queryKey: ["notificationPrefs"],
		queryFn: async () => {
			const { data } = await api.get<ApiResponse<NotificationPreference>>(
				"/profile/notifications",
			);
			return data.data;
		},
	});
}

export function useUpdateNotificationPrefs() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateNotificationPrefsInput) => {
			const { data } = await api.patch<ApiResponse<NotificationPreference>>(
				"/profile/notifications",
				input,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notificationPrefs"] });
		},
	});
}
