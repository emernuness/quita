"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Sentry deve capturar automaticamente via instrumentation, mas log local ajuda dev
		console.error("[Global error]", error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6">
			<Card className="max-w-[480px] p-8 text-center">
				<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-bg)]">
					<AlertTriangle className="h-6 w-6 text-[var(--color-danger-fg)]" />
				</div>
				<h1 className="text-[20px] font-semibold mb-2">Algo deu errado</h1>
				<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
					Tivemos um problema inesperado. Tente novamente. Se persistir, recarregue a página.
				</p>
				{error.digest ? (
					<p className="text-[11px] text-[var(--color-ink-3)] mb-4 font-mono">ID: {error.digest}</p>
				) : null}
				<div className="flex justify-center gap-3">
					<Button onClick={reset}>Tentar novamente</Button>
					<Button variant="ghost" onClick={() => window.location.assign("/app")}>
						Voltar ao início
					</Button>
				</div>
			</Card>
		</div>
	);
}
