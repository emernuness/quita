import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";
import type { User } from "@quita/shared";

export type AuthUser = Pick<
	User,
	| "id"
	| "name"
	| "email"
	| "phone"
	| "avatarInitials"
	| "onboardingCompleted"
	| "onboardingStep"
	| "planType"
	| "discreteMode"
>;

interface AuthState {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		name: string,
		email: string,
		phone: string,
		password: string,
	) => Promise<void>;
	logout: () => Promise<void>;
	loadToken: () => Promise<void>;
	setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: true,

	login: async (email, password) => {
		try {
			const { data } = await api.post<{
				success: boolean;
				data: { user: AuthUser; accessToken: string };
			}>("/auth/login", { email, password });

			const { user, accessToken } = data.data;
			await SecureStore.setItemAsync("accessToken", accessToken);
			set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	register: async (name, email, phone, password) => {
		try {
			const { data } = await api.post<{
				success: boolean;
				data: { user: AuthUser; accessToken: string };
			}>("/auth/register", { name, email, phone, password });

			const { user, accessToken } = data.data;
			await SecureStore.setItemAsync("accessToken", accessToken);
			set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	logout: async () => {
		await SecureStore.deleteItemAsync("accessToken");
		set({ user: null, token: null, isAuthenticated: false });
	},

	loadToken: async () => {
		try {
			const token = await SecureStore.getItemAsync("accessToken");
			if (token) {
				const { data } = await api.get<{
					success: boolean;
					data: AuthUser;
				}>("/auth/me");
				set({
					user: data.data,
					token,
					isAuthenticated: true,
					isLoading: false,
				});
			} else {
				set({ isLoading: false });
			}
		} catch {
			await SecureStore.deleteItemAsync("accessToken");
			set({
				user: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	},

	setUser: (user) => set({ user }),
}));
