"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useSaveLocation } from "@/hooks/useOnboarding";
import { validateWithZod } from "@/lib/zod";
import { onboardingLocationSchema } from "@quita/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

const UFS = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
];

export default function LocationStep() {
	const router = useRouter();
	const save = useSaveLocation();
	const [stateCode, setStateCode] = useState("");
	const [dependents, setDependents] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	async function onContinue() {
		setSubmitError(null);
		const r = validateWithZod(onboardingLocationSchema, {
			stateCode: stateCode.toUpperCase(),
			dependentsCount: dependents ? Number(dependents) : undefined,
		});
		if (!r.success) {
			setErrors(r.errors);
			return;
		}
		try {
			await save.mutateAsync(r.data);
			router.push("/onboarding/concern");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<>
			<OnboardingHeader
				step={2}
				total={4}
				eyebrow="Sobre você"
				title="Onde você mora?"
				description="Usamos seu estado e número de dependentes para calcular o mínimo vital correto da sua região."
			/>

			<div className="flex flex-col gap-6">
				<div>
					<label
						htmlFor="state-code"
						className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]"
					>
						Estado (UF)
					</label>
					<select
						id="state-code"
						value={stateCode}
						onChange={(e) => setStateCode(e.target.value)}
						className="h-12 w-full rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-[15px]"
					>
						<option value="">Selecione…</option>
						{UFS.map((uf) => (
							<option key={uf} value={uf}>
								{uf}
							</option>
						))}
					</select>
					{errors.stateCode ? (
						<p className="mt-1 text-[12px] text-[var(--color-danger)]">{errors.stateCode}</p>
					) : null}
				</div>

				<div>
					<Input
						label="QUANTOS DEPENDENTES MORAM COM VOCÊ?"
						type="number"
						min="0"
						max="20"
						placeholder="0"
						value={dependents}
						onChange={(e) => setDependents(e.target.value)}
					/>
					<p className="mt-1 text-[12px] text-[var(--color-ink-2)]">
						Filhos, pais idosos, pessoas que dependem da sua renda. Se mora sozinho, deixe 0.
					</p>
				</div>
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
				<Button size="lg" loading={save.isPending} onClick={onContinue}>
					Continuar
				</Button>
			</div>
		</>
	);
}
