import axios from "axios";
import * as SecureStore from "expo-secure-store";

// @ts-expect-error -- Expo injects process.env at build time
const API_URL: string = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
});

// Request interceptor - attach token from SecureStore (not Zustand to avoid circular deps)
api.interceptors.request.use(async (config) => {
	const token = await SecureStore.getItemAsync("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor - handle 401 by clearing stored token
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			await SecureStore.deleteItemAsync("accessToken");
			// Lazy require to avoid circular dependency (auth.ts imports api.ts)
			const { useAuthStore } = require("../stores/auth");
			useAuthStore.getState().logout();
		}
		return Promise.reject(error);
	},
);
