"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useOcrQuota } from "@/hooks/useOcrQuota";
import { Crown, FileImage } from "lucide-react";
import Link from "next/link";

export default function OcrQuotaPage() {
	const { data: quota, isLoading } = useOcrQuota();

	if (isLoading) {
		return (
			<Card className="p-10 text-center text-[var(--color-ink-3)] text-[14px]">Carregando…</Card>
		);
	}

	if (!quota) {
		return <Card className="p-10 text-center text-[14px]">Não foi possível carregar a quota.</Card>;
	}

	const remaining = Math.max(0, quota.limit - quota.used);
	const pct = quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 100;
	const isPremium = quota.planType === "premium";
	const resets = new Date(quota.resetsAt);

	return (
		<>
			<h1 className="text-[24px] font-bold mb-2">Uso do OCR</h1>
			<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
				OCR de propostas é recurso Premium. Cota mensal renova no primeiro dia do mês.
			</p>

			<Card className="p-6 mb-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<div className="text-[12px] uppercase tracking-wider text-[var(--color-ink-3)] mb-1">
							Plano atual
						</div>
						<div className="text-[18px] font-semibold flex items-center gap-2">
							{isPremium ? (
								<>
									<Crown className="w-4 h-4 text-[var(--color-warning)]" /> Premium
								</>
							) : (
								"Gratuito"
							)}
						</div>
					</div>
					<div className="text-right">
						<div className="text-[12px] uppercase tracking-wider text-[var(--color-ink-3)] mb-1">
							Renova em
						</div>
						<div className="text-[14px] font-semibold">{resets.toLocaleDateString("pt-BR")}</div>
					</div>
				</div>

				{isPremium ? (
					<>
						<div className="mb-2 flex items-end justify-between">
							<div className="text-[14px] font-semibold">
								{quota.used} de {quota.limit} usos
							</div>
							<div className="text-[13px] text-[var(--color-ink-2)]">{remaining} restantes</div>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-background)]">
							<div
								className="h-full bg-[var(--color-teal)] transition-all"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</>
				) : (
					<div className="rounded-[10px] border border-[var(--color-info-bg)] bg-[var(--color-info-bg)] p-4 text-[13px] text-[var(--color-info-fg)]">
						OCR não está incluído no plano Gratuito. Faça upgrade para Premium e leia propostas
						automaticamente.
					</div>
				)}
			</Card>

			{!isPremium ? (
				<div className="flex justify-center">
					<Link href="/app/profile">
						<Button size="lg">
							<Crown className="w-4 h-4 mr-1.5" /> Fazer upgrade Premium
						</Button>
					</Link>
				</div>
			) : (
				<div className="flex justify-center">
					<Link href="/app/ocr/consent">
						<Button size="lg">
							<FileImage className="w-4 h-4 mr-1.5" /> Ler nova proposta
						</Button>
					</Link>
				</div>
			)}
		</>
	);
}
