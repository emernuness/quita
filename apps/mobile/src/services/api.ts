import axios, { type AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

// @ts-expect-error -- Expo injects process.env at build time
const API_URL: string = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
	timeout: 15000,
});

api.interceptors.request.use(async (config) => {
	const token = await SecureStore.getItemAsync("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

function friendlyByStatus(status?: number): string {
	switch (status) {
		case 400:
			return "Dados inválidos. Confira os campos e tente novamente.";
		case 401:
			return "E-mail ou senha incorretos.";
		case 403:
			return "Você não tem permissão para essa ação.";
		case 404:
			return "Recurso não encontrado.";
		case 409:
			return "Esse registro já existe.";
		case 422:
			return "Algum campo está inválido.";
		case 429:
			return "Muitas tentativas. Aguarde um momento e tente novamente.";
		case 500:
		case 502:
		case 503:
		case 504:
			return "O servidor está com problemas. Tente novamente em instantes.";
		default:
			return "Algo deu errado. Tente novamente.";
	}
}

function extractMessage(error: AxiosError): string {
	if (error.code === "ECONNABORTED") {
		return "A conexão demorou demais. Verifique sua internet e tente novamente.";
	}
	if (!error.response) {
		return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
	}
	const data = error.response.data as { message?: unknown } | undefined;
	const apiMessage = data?.message;
	if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
		return apiMessage;
	}
	if (Array.isArray(apiMessage) && apiMessage.length > 0) {
		const first = apiMessage[0];
		if (typeof first === "string") return first;
	}
	return friendlyByStatus(error.response.status);
}

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const status = error.response?.status;
		const url = error.config?.url ?? "";
		const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

		if (status === 401 && !isAuthEndpoint) {
			await SecureStore.deleteItemAsync("accessToken");
			const { useAuthStore } = require("../stores/auth");
			useAuthStore.getState().logout();
		}

		const friendly = extractMessage(error);
		const wrapped = new Error(friendly);
		(wrapped as Error & { status?: number; original?: AxiosError }).status = status;
		(wrapped as Error & { status?: number; original?: AxiosError }).original = error;
		return Promise.reject(wrapped);
	},
);
