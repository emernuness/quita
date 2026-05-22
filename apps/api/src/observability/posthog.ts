/**
 * PostHog init server-side (Onda 5). Eventos analiticos + feature flags.
 *
 * Pendente: POSTHOG_API_KEY no env + pnpm add posthog-node.
 */
export function initPostHog(): void {
	const key = process.env.POSTHOG_API_KEY;
	if (!key) {
		// biome-ignore lint/suspicious/noConsole: bootstrap notice
		console.log("[posthog] POSTHOG_API_KEY ausente — analytics desabilitado.");
		return;
	}
	// TODO Onda 5: import { PostHog } from "posthog-node" + init.
	// biome-ignore lint/suspicious/noConsole: bootstrap notice
	console.log("[posthog] key detectado mas SDK ainda nao inicializado (Onda 5 pendente).");
}
