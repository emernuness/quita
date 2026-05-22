"use client";

/**
 * PostHog client-side (Onda 5). Inicializa apenas se key presente.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

let initialized = false;

export function initPostHog(): void {
	if (initialized || typeof window === "undefined" || !KEY) return;
	initialized = true;
	// TODO Onda 5: import posthog from "posthog-js"; posthog.init(KEY, { api_host: HOST });
}

export function capture(eventName: string, properties?: Record<string, unknown>): void {
	if (!initialized) return;
	void eventName;
	void properties;
	// TODO Onda 5: posthog.capture(eventName, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
	if (!initialized) return;
	void userId;
	void traits;
	// TODO Onda 5: posthog.identify(userId, traits);
}

void HOST;
