"use client";

import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NotificationBell } from "./NotificationBell";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { isAuthenticated, isLoading, user } = useAuthStore();

	useEffect(() => {
		if (isLoading) return;
		const target = resolveAuthRedirect({ isAuthenticated, user, currentArea: "app" });
		if (target) router.replace(target);
	}, [isLoading, isAuthenticated, user, router]);

	const needsRedirect =
		!isLoading && resolveAuthRedirect({ isAuthenticated, user, currentArea: "app" }) !== null;

	if (isLoading || needsRedirect) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-[14px] text-[var(--color-ink-2)]">Carregando…</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen">
			<a href="#main" className="skip-link">
				Pular para o conteúdo
			</a>
			<Sidebar />
			<main id="main" className="min-w-0 flex-1">
				<div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-10 md:py-10">
					<div className="mb-4 flex justify-end">
						<NotificationBell />
					</div>
					{children}
				</div>
			</main>
		</div>
	);
}
