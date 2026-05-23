import type { AuthUser } from "@/stores/auth";

/**
 * Decide para onde mandar o usuário com base em auth + onboarding.
 * Fluxo: register → /onboarding/bem-vindo (welcome+consent) → /income (step 0)
 *        → /location → /concern → /categories (step 1+) → /app
 */
export function resolveAuthRedirect(args: {
	isAuthenticated: boolean;
	user: AuthUser | null;
	currentArea: "public" | "onboarding" | "app";
}): string | null {
	const { isAuthenticated, user, currentArea } = args;

	if (!isAuthenticated) {
		return currentArea === "public" ? null : "/login";
	}

	if (user && !user.onboardingCompleted) {
		if (currentArea === "onboarding") return null;
		const step = user.onboardingStep ?? 0;
		if (step >= 1) return "/onboarding/categories";
		return "/onboarding/bem-vindo";
	}

	if (currentArea === "app") return null;
	return "/app";
}
