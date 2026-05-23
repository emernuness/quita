"use client";

import { Button } from "@/components/Button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useSaveIncome } from "@/hooks/useOnboarding";
import { unmaskBRL } from "@/lib/masks";
import { validateWithZod } from "@/lib/zod";
import { onboardingIncomeSchema } from "@quita/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELDS = [
	{ key: "salary", label: "Salário / renda fixa" },
	{ key: "extra", label: "Bicos / renda extra" },
	{ key: "help", label: "Ajuda de alguém" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

export default function IncomeStep() {
	const router = useRouter();
	const save = useSaveIncome();
	const [values, setValues] = useState<Record<Key, string>>({ salary: "", extra: "", help: "" });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	function handleChange(key: Key, masked: string) {
		setValues((prev) => ({ ...prev, [key]: masked }));
		setErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}

	async function onContinue() {
		setSubmitError(null);
		const salary = unmaskBRL(values.salary);
		const extra = unmaskBRL(values.extra);
		const help = unmaskBRL(values.help);
		const r = validateWithZod(onboardingIncomeSchema, {
			salary,
			extra: extra > 0 ? extra : undefined,
			help: help > 0 ? help : undefined,
		});
		if (!r.success) {
			setErrors(r.errors);
			return;
		}
		try {
			await save.mutateAsync(r.data);
			router.push("/onboarding/categories");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<>
			<OnboardingHeader
				step={1}
				total={2}
				eyebrow="Renda mensal"
				title="Quanto entra por mês?"
				description="Some salário, renda extra e ajuda. Uma estimativa já basta para montar um plano realista."
			/>

			<div className="flex flex-col gap-6">
				{FIELDS.map(({ key, label }) => (
					<CurrencyInput
						key={key}
						name={key}
						label={label}
						value={values[key]}
						onChange={(v) => handleChange(key, v)}
						error={errors[key]}
					/>
				))}
			</div>

			<p className="mt-6 text-[13px] text-[var(--color-ink-2)]">
				Se algum valor variar, use a média dos últimos 3 meses.
			</p>

			{submitError ? (
				<div className="mt-6 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{submitError}
				</div>
			) : null}

			<div className="mt-10 flex justify-end">
				<Button size="lg" loading={save.isPending} onClick={onContinue}>
					Continuar
				</Button>
			</div>
		</>
	);
}
