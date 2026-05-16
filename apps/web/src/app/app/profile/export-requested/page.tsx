"use client";

import { Card } from "@/components/Card";
import { CheckIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default function ExportRequestedPage() {
	return (
		<>
			<PageHeader title="Solicitação enviada" subtitle="Vamos preparar seus dados." />

			<Card className="p-8 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-fg)]">
					<CheckIcon size={28} />
				</div>
				<h2 className="mt-5 text-[18px] font-bold tracking-tight text-[var(--color-ink)]">
					Exportação em andamento
				</h2>
				<p className="mt-2 max-w-md mx-auto text-[14px] text-[var(--color-ink-2)]">
					Você vai receber um e-mail com o link para download em até alguns minutos.
				</p>
				<div className="mt-6">
					<Link
						href="/app/profile/export-data"
						className="text-[13px] font-semibold text-[var(--color-teal)] hover:underline"
					>
						Solicitar outra
					</Link>
				</div>
			</Card>
		</>
	);
}
