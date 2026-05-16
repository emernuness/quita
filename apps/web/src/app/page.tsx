"use client";

import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Root() {
	const router = useRouter();
	const { isAuthenticated, isLoading, user } = useAuthStore();

	useEffect(() => {
		if (isLoading) return;
		const target = resolveAuthRedirect({ isAuthenticated, user, currentArea: "public" });
		router.replace(target ?? "/login");
	}, [isAuthenticated, isLoading, user, router]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-[14px] text-[var(--color-ink-2)]">Carregando…</div>
		</div>
	);
}
