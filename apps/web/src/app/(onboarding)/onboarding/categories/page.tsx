"use client";

import { Button } from "@/components/Button";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useDebtCategories } from "@/hooks/useDebts";
import { useCompleteOnboarding, useSaveCategories } from "@/hooks/useOnboarding";
import { cn } from "@/lib/cn";
import { getDebtCategoryIcon } from "@/lib/debt-icons";
import { validateWithZod } from "@/lib/zod";
import { onboardingDebtCategoriesSchema } from "@quita/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CategoriesStep() {
	const router = useRouter();
	const { data: categories, isLoading } = useDebtCategories();
	const save = useSaveCategories();
	const complete = useCompleteOnboarding();
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	function toggle(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
		setError(null);
	}

	async function onContinue() {
		setSubmitError(null);
		const r = validateWithZod(onboardingDebtCategoriesSchema, {
			categoryIds: Array.from(selected),
		});
		if (!r.success) {
			setError("Selecione pelo menos uma categoria.");
			return;
		}
		try {
			await save.mutateAsync(r.data);
			await complete.mutateAsync();
			router.replace("/app");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	const pending = save.isPending || complete.isPending;

	return (
		<>
			<OnboardingHeader
				step={2}
				total={2}
				eyebrow="Mapeamento de dívidas"
				title="Pra quem você deve hoje?"
				description="Selecione os tipos que representam suas dívidas atuais. Você cadastra cada dívida detalhada já dentro do app."
			/>

			<div className="mb-6 rounded-[12px] border border-[var(--color-info-bg)] bg-[var(--color-info-bg)] p-4 text-[13px] text-[var(--color-info-fg)]">
				<div className="font-semibold">Por que separar por tipo?</div>
				<p className="mt-1">
					Cada tipo de dívida tem estratégia diferente. Cartão cobra juros altos, empréstimo pode
					ser renegociado, e dívida com pessoa conhecida pede conversa. Separar ajuda a priorizar.
				</p>
			</div>

			{isLoading ? (
				<div className="py-8 text-center text-[14px] text-[var(--color-ink-2)]">
					Carregando categorias…
				</div>
			) : !categories?.length ? (
				<div className="py-8 text-center text-[14px] text-[var(--color-ink-2)]">
					Não foi possível carregar as categorias.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{categories.map((c) => {
						const active = selected.has(c.id);
						const Icon = getDebtCategoryIcon(c.icon);
						return (
							<button
								key={c.id}
								type="button"
								onClick={() => toggle(c.id)}
								aria-pressed={active}
								className={cn(
									"flex min-h-[56px] items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[14px] font-semibold leading-tight transition-colors",
									active
										? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
										: "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink-3)]",
								)}
							>
								<span
									className={cn(
										"flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
										active
											? "bg-white/15 text-white"
											: "bg-[var(--color-background)] text-[var(--color-teal)]",
									)}
								>
									<Icon size={18} strokeWidth={1.8} aria-hidden="true" />
								</span>
								<span className="block flex-1">{c.name}</span>
							</button>
						);
					})}
				</div>
			)}

			{error ? <p className="mt-4 text-[13px] text-[var(--color-danger)]">{error}</p> : null}

			{submitError ? (
				<div className="mt-4 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{submitError}
				</div>
			) : null}

			<div className="mt-10 flex justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					Voltar
				</Button>
				<Button size="lg" loading={pending} onClick={onContinue}>
					Concluir cadastro
				</Button>
			</div>
		</>
	);
}
