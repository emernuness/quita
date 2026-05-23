"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import "@/lib/sentry-client";
import { capture, identify, initPostHog } from "@/lib/posthog";
import { useAuthStore } from "@/stores/auth";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function AuthBoot() {
	const loadSession = useAuthStore((s) => s.loadSession);
	const user = useAuthStore((s) => s.user);
	const pathname = usePathname();

	useEffect(() => {
		initPostHog();
	}, []);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
		if (isPublic) {
			useAuthStore.setState({ isLoading: false });
			return;
		}
		loadSession();
	}, [loadSession, pathname]);

	useEffect(() => {
		if (user) {
			identify(user.id, { email: user.email });
			capture("session_active");
		}
	}, [user]);

	return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
				},
			}),
	);

	return (
		<QueryClientProvider client={client}>
			<AuthBoot />
			{children}
			<Toaster position="top-right" richColors closeButton />
		</QueryClientProvider>
	);
}
