import type { ApiResponse } from "@quita/shared";
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "quita.accessToken";

export const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
	timeout: 15000,
});

export function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
	if (typeof window === "undefined") return;
	if (token) window.localStorage.setItem(TOKEN_KEY, token);
	else window.localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
	const token = getToken();
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
	(error: AxiosError) => {
		const status = error.response?.status;
		const url = error.config?.url ?? "";
		const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

		if (status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
			setToken(null);
			// hard redirect to login; lazy import store to avoid cycle
			import("@/stores/auth").then(({ useAuthStore }) => {
				useAuthStore.getState().logout();
			});
		}

		return Promise.reject(new ApiError(extractMessage(error), status));
	},
);

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
	const res = await api.get<ApiResponse<T>>(url, config);
	return res.data.data;
}

export async function apiPost<T, B = unknown>(
	url: string,
	body?: B,
	config?: AxiosRequestConfig,
): Promise<T> {
	const res = await api.post<ApiResponse<T>>(url, body, config);
	return res.data.data;
}

export async function apiPatch<T, B = unknown>(
	url: string,
	body?: B,
	config?: AxiosRequestConfig,
): Promise<T> {
	const res = await api.patch<ApiResponse<T>>(url, body, config);
	return res.data.data;
}

export async function apiDelete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
	const res = await api.delete<ApiResponse<T>>(url, config);
	return res.data.data;
}
