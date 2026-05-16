import type { AuthUser } from "@/stores/auth";

/**
 * Decide para onde mandar o usuário com base em auth + onboarding.
 * Fluxo atual: register → /onboarding/income (step 0) → /onboarding/categories (step 1) → /app
 * Dívidas e despesas são cadastradas dentro do app, fora do wizard.
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
		return "/onboarding/income";
	}

	if (currentArea === "app") return null;
	return "/app";
}
