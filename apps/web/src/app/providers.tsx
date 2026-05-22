"use client";

import { useAuthStore } from "@/stores/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function AuthBoot() {
	const loadSession = useAuthStore((s) => s.loadSession);
	const pathname = usePathname();
	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
		if (isPublic) {
			useAuthStore.setState({ isLoading: false });
			return;
		}
		loadSession();
	}, [loadSession, pathname]);
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
