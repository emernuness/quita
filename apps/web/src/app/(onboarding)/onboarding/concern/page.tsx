"use client";

import { Button } from "@/components/Button";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useSaveConcern } from "@/hooks/useOnboarding";
import { cn } from "@/lib/cn";
import type { MainConcernValue } from "@quita/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHOICES: { value: MainConcernValue; label: string; description: string }[] = [
	{
		value: "collection_pressure",
		label: "Cobrança está me afogando",
		description: "Ligações, mensagens, ameaça de protesto",
	},
	{
		value: "service_cut_risk",
		label: "Risco de cortar serviços",
		description: "Luz, água, internet podem ser desligadas",
	},
	{
		value: "disorganization",
		label: "Estou desorganizado",
		description: "Não sei quanto devo nem para quem",
	},
	{
		value: "shame",
		label: "Sinto vergonha de pedir ajuda",
		description: "Quero resolver sozinho mas não consigo enxergar saída",
	},
	{
		value: "where_to_start",
		label: "Não sei por onde começar",
		description: "Várias dívidas pequenas misturadas com grandes",
	},
];

export default function ConcernStep() {
	const router = useRouter();
	const save = useSaveConcern();
	const [selected, setSelected] = useState<MainConcernValue | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	async function onContinue() {
		if (!selected) return;
		setSubmitError(null);
		try {
			await save.mutateAsync({ mainConcern: selected });
			router.push("/onboarding/categories");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<>
			<OnboardingHeader
				step={3}
				total={4}
				eyebrow="Sobre você"
				title="Qual a sua maior preocupação hoje?"
				description="Sua resposta direciona o tom do plano e prioriza quais dívidas atacar primeiro. Não tem certa nem errada."
			/>

			<div className="flex flex-col gap-3">
				{CHOICES.map((c) => {
					const active = selected === c.value;
					return (
						<button
							key={c.value}
							type="button"
							onClick={() => setSelected(c.value)}
							aria-pressed={active}
							className={cn(
								"rounded-[12px] border px-5 py-4 text-left transition-colors",
								active
									? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
									: "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink-3)]",
							)}
						>
							<div className="text-[15px] font-semibold leading-tight">{c.label}</div>
							<div
								className={cn(
									"mt-1 text-[13px]",
									active ? "text-white/85" : "text-[var(--color-ink-2)]",
								)}
							>
								{c.description}
							</div>
						</button>
					);
				})}
			</div>

			{submitError ? (
				<div className="mt-6 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{submitError}
				</div>
			) : null}

			<div className="mt-10 flex justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					Voltar
				</Button>
				<Button size="lg" disabled={!selected} loading={save.isPending} onClick={onContinue}>
					Continuar
				</Button>
			</div>
		</>
	);
}
