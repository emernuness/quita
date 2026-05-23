// Cliente Sentry inicializado em sentry.client.config.ts (Next.js
// auto-carrega na rota client). Este modulo eh apenas um marker importavel
// para garantir que o config seja included no bundle quando "use client".
// Import side-effect:
if (typeof window !== "undefined") {
	import("../../sentry.client.config").catch(() => {
		// no-op se sentry config nao existe (build sem DSN)
	});
}
