"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function AppError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[App error]", error);
	}, [error]);

	return (
		<Card className="max-w-[640px] p-8">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-5 h-5 mt-0.5 text-[var(--color-danger)]" />
				<div>
					<div className="text-[18px] font-semibold mb-1">Tivemos um problema</div>
					<p className="text-[14px] text-[var(--color-ink-2)] mb-4">
						Algo deu errado ao carregar esta tela. Tente novamente. Se persistir, recarregue a
						página ou volte ao painel.
					</p>
					{error.digest ? (
						<p className="text-[11px] text-[var(--color-ink-3)] mb-4 font-mono">
							ID: {error.digest}
						</p>
					) : null}
					<div className="flex gap-3">
						<Button onClick={reset}>Tentar novamente</Button>
						<Button variant="ghost" onClick={() => window.location.assign("/app")}>
							Voltar ao painel
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}
