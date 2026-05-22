import * as Sentry from "@sentry/node";

/**
 * Sentry init. No-op se SENTRY_DSN ausente.
 *
 * - Inicializa com sampleRate baixo em prod (0.1) para reduzir custo.
 * - Filtra dados sensiveis (cookies, headers de auth, senhas) via beforeSend.
 */
export function initSentry(): void {
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) {
		console.log("[sentry] SENTRY_DSN ausente — Sentry desabilitado.");
		return;
	}

	const isProd = process.env.NODE_ENV === "production";

	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV ?? "development",
		tracesSampleRate: isProd ? 0.1 : 1.0,
		release: process.env.RELEASE_SHA,
		beforeSend(event) {
			if (event.request) {
				if (event.request.cookies) event.request.cookies = undefined;
				if (event.request.headers) {
					const h = event.request.headers as Record<string, string | undefined>;
					h.authorization = undefined;
					h.cookie = undefined;
					h["x-api-key"] = undefined;
				}
				if (event.request.data && typeof event.request.data === "object") {
					const d = event.request.data as Record<string, unknown>;
					if (d.password) d.password = "[REDACTED]";
					if (d.newPassword) d.newPassword = "[REDACTED]";
					if (d.currentPassword) d.currentPassword = "[REDACTED]";
				}
			}
			if (event.user) {
				event.user.ip_address = undefined;
			}
			return event;
		},
	});

	console.log("[sentry] inicializado.");
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
	if (!process.env.SENTRY_DSN) return;
	Sentry.captureException(error, { extra });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
	if (!process.env.SENTRY_DSN) return;
	Sentry.captureMessage(message, level);
}
