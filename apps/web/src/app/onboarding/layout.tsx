"use client";

import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { isLoading, isAuthenticated, user } = useAuthStore();

	useEffect(() => {
		if (isLoading) return;
		const target = resolveAuthRedirect({ isAuthenticated, user, currentArea: "onboarding" });
		if (target) router.replace(target);
	}, [isLoading, isAuthenticated, user, router]);

	return (
		<div className="min-h-screen bg-[var(--color-background)]">
			<div className="mx-auto w-full max-w-[720px] px-6 py-10 lg:px-8 lg:py-14">{children}</div>
		</div>
	);
}
