import { PostHog } from "posthog-node";

/**
 * PostHog server-side. Eventos analiticos + feature flags.
 * No-op se POSTHOG_API_KEY ausente. Singleton modulo.
 */
let client: PostHog | null = null;

export function initPostHog(): void {
	const key = process.env.POSTHOG_API_KEY;
	if (!key) {
		console.log("[posthog] POSTHOG_API_KEY ausente — analytics desabilitado.");
		return;
	}
	const host = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
	client = new PostHog(key, { host, flushAt: 20, flushInterval: 10_000 });
	console.log("[posthog] inicializado.");
}

export function capture(event: {
	distinctId: string;
	event: string;
	properties?: Record<string, unknown>;
}): void {
	if (!client) return;
	client.capture(event);
}

export async function isFeatureEnabled(
	key: string,
	distinctId: string,
): Promise<boolean | undefined> {
	if (!client) return false;
	return client.isFeatureEnabled(key, distinctId);
}

export async function shutdownPostHog(): Promise<void> {
	if (!client) return;
	await client.shutdown();
}
