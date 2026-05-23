"use client";

import { capture } from "@/lib/posthog";

export type AnalyticsEvent =
	| "page_view"
	| "signup_completed"
	| "onboarding_completed"
	| "debt_created"
	| "debt_deleted"
	| "payment_recorded"
	| "settlement_evaluated"
	| "ocr_used"
	| "modo_protecao_visualizado"
	| "modo_sobrevivencia_visualizado"
	| "modo_crise_visualizado"
	| "notification_clicked"
	| "theme_changed"
	| "premium_upgrade_clicked";

/**
 * Helper para captura tipada de eventos PostHog.
 * No-op se PostHog não foi inicializado (NEXT_PUBLIC_POSTHOG_KEY ausente).
 *
 * Spec Fase 5 §11 — analytics anônimas (sem PII além userId já identificado).
 */
export function useAnalytics() {
	return {
		track: (event: AnalyticsEvent, properties?: Record<string, unknown>) => {
			capture(event, properties);
		},
	};
}
