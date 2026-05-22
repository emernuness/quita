/**
 * Sentry init (Onda 5). No-op se SENTRY_DSN ausente.
 *
 * Quando configurado:
 * 1. Capture exceptions globais (NestJS interceptor cobre HTTP).
 * 2. Performance traces (sampleRate baixo em prod — ex 0.1).
 * 3. Scrub: never include cookies, password fields, ip raw (LGPD).
 *
 * Importar e chamar `initSentry()` em main.ts antes de NestFactory.create.
 */
export function initSentry(): void {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) {
		// biome-ignore lint/suspicious/noConsole: bootstrap notice
		console.log("[sentry] SENTRY_DSN ausente — Sentry desabilitado.");
		return;
	}
	// TODO Onda 5: import * as Sentry from "@sentry/node"; Sentry.init({ dsn, ... });
	// biome-ignore lint/suspicious/noConsole: bootstrap notice
	console.log("[sentry] DSN detectado mas SDK ainda nao inicializado (Onda 5 pendente).");
}
