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

type Stability = "stable" | "variable" | "seasonal";

export default function IncomeStep() {
	const router = useRouter();
	const save = useSaveIncome();
	const [values, setValues] = useState<Record<Key, string>>({ salary: "", extra: "", help: "" });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [paymentDay, setPaymentDay] = useState("");
	const [stabilityType, setStabilityType] = useState<Stability>("stable");
	const [guaranteedAmount, setGuaranteedAmount] = useState("");
	const [showAdvanced, setShowAdvanced] = useState(false);

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
		const guar = unmaskBRL(guaranteedAmount);
		const day = paymentDay ? Number(paymentDay) : undefined;
		const r = validateWithZod(onboardingIncomeSchema, {
			salary,
			extra: extra > 0 ? extra : undefined,
			help: help > 0 ? help : undefined,
			...(day ? { paymentDay: day } : {}),
			...(stabilityType !== "stable" ? { stabilityType } : {}),
			...(guar > 0 ? { guaranteedAmount: guar } : {}),
		});
		if (!r.success) {
			setErrors(r.errors);
			return;
		}
		try {
			await save.mutateAsync(r.data);
			router.push("/onboarding/location");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<>
			<OnboardingHeader
				step={1}
				total={4}
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

			<div className="mt-6">
				<button
					type="button"
					onClick={() => setShowAdvanced((v) => !v)}
					className="text-[13px] font-semibold text-[var(--color-teal)] hover:underline"
				>
					{showAdvanced ? "− Esconder detalhes" : "+ Adicionar detalhes (refinam o plano)"}
				</button>
			</div>

			{showAdvanced ? (
				<div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
					<div>
						<label
							htmlFor="payday"
							className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]"
						>
							DIA DO RECEBIMENTO
						</label>
						<input
							id="payday"
							type="number"
							min="1"
							max="31"
							placeholder="5"
							value={paymentDay}
							onChange={(e) => setPaymentDay(e.target.value)}
							className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-[15px]"
						/>
					</div>
					<div>
						<label
							htmlFor="stability"
							className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]"
						>
							ESTABILIDADE
						</label>
						<select
							id="stability"
							value={stabilityType}
							onChange={(e) => setStabilityType(e.target.value as Stability)}
							className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-[15px]"
						>
							<option value="stable">Estável (salário fixo)</option>
							<option value="variable">Variável (comissão, bicos)</option>
							<option value="seasonal">Sazonal (entra por temporada)</option>
						</select>
					</div>
					{stabilityType !== "stable" ? (
						<div className="md:col-span-2">
							<CurrencyInput
								name="guaranteed"
								label="QUANTO VOCÊ TEM CERTEZA DE RECEBER?"
								value={guaranteedAmount}
								onChange={setGuaranteedAmount}
							/>
							<p className="mt-1 text-[12px] text-[var(--color-ink-2)]">
								Mínimo garantido em meses ruins. Plano usa esse valor como base segura.
							</p>
						</div>
					) : null}
				</div>
			) : null}

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
