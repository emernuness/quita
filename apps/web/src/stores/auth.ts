"use client";

import { apiGet, apiPost } from "@/lib/api";
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

/**
 * Backend responde apenas { user } no body — token vai em httpOnly cookie
 * (ADR-0001). Logout chama /auth/logout para revogar refresh + limpar cookies.
 */
interface AuthResponse {
	user: AuthUser;
}

interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<AuthUser>;
	register: (name: string, email: string, phone: string, password: string) => Promise<AuthUser>;
	logout: () => Promise<void>;
	loadSession: () => Promise<void>;
	setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	isLoading: true,

	login: async (email, password) => {
		const { user } = await apiPost<AuthResponse>("/auth/login", { email, password });
		set({ user, isAuthenticated: true, isLoading: false });
		return user;
	},

	register: async (name, email, phone, password) => {
		const { user } = await apiPost<AuthResponse>("/auth/register", {
			name,
			email,
			phone,
			password,
		});
		set({ user, isAuthenticated: true, isLoading: false });
		return user;
	},

	logout: async () => {
		try {
			await apiPost("/auth/logout");
		} catch {
			// Ignora — servidor pode estar fora; cookies serao limpos no proximo login.
		}
		set({ user: null, isAuthenticated: false, isLoading: false });
	},

	loadSession: async () => {
		try {
			const user = await apiGet<AuthUser>("/auth/me");
			set({ user, isAuthenticated: true, isLoading: false });
		} catch {
			set({ user: null, isAuthenticated: false, isLoading: false });
		}
	},

	setUser: (user) => set({ user }),
}));
