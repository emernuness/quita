"use client";

import { apiGet, apiPost, getToken, setToken } from "@/lib/api";
import type { User } from "@quita/shared";
import { create } from "zustand";

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

interface AuthResponse {
	user: AuthUser;
	accessToken: string;
}

interface AuthState {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<AuthUser>;
	register: (name: string, email: string, phone: string, password: string) => Promise<AuthUser>;
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
		const { user, accessToken } = await apiPost<AuthResponse>("/auth/login", { email, password });
		setToken(accessToken);
		set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
		return user;
	},

	register: async (name, email, phone, password) => {
		const { user, accessToken } = await apiPost<AuthResponse>("/auth/register", {
			name,
			email,
			phone,
			password,
		});
		setToken(accessToken);
		set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
		return user;
	},

	logout: async () => {
		setToken(null);
		set({ user: null, token: null, isAuthenticated: false, isLoading: false });
	},

	loadToken: async () => {
		try {
			const token = getToken();
			if (!token) {
				set({ isLoading: false });
				return;
			}
			const user = await apiGet<AuthUser>("/auth/me");
			set({ user, token, isAuthenticated: true, isLoading: false });
		} catch {
			setToken(null);
			set({ user: null, token: null, isAuthenticated: false, isLoading: false });
		}
	},

	setUser: (user) => set({ user }),
}));
