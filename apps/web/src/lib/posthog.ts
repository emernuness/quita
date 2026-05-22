"use client";

import posthog from "posthog-js";

/**
 * PostHog client-side. Init apenas se NEXT_PUBLIC_POSTHOG_KEY presente.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

let initialized = false;

export function initPostHog(): void {
	if (initialized || typeof window === "undefined" || !KEY) return;
	initialized = true;
	posthog.init(KEY, {
		api_host: HOST,
		capture_pageview: true,
		persistence: "memory",
	});
}

export function capture(eventName: string, properties?: Record<string, unknown>): void {
	if (!initialized) return;
	posthog.capture(eventName, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
	if (!initialized) return;
	posthog.identify(userId, traits);
}

export function reset(): void {
	if (!initialized) return;
	posthog.reset();
}
