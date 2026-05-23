"use client";

import { Button } from "@/components/Button";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TOS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";

export default function WelcomeStep() {
	const router = useRouter();
	const [tos, setTos] = useState(false);
	const [privacy, setPrivacy] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const ready = tos && privacy;

	async function onContinue() {
		if (!ready) return;
		setLoading(true);
		setError(null);
		try {
			await Promise.all([
				apiPost("/consent", {
					consentType: "terms_of_use",
					version: TOS_VERSION,
					accepted: true,
				}),
				apiPost("/consent", {
					consentType: "privacy_policy",
					version: PRIVACY_VERSION,
					accepted: true,
				}),
			]);
			router.push("/onboarding/income");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao registrar consentimento.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<OnboardingHeader
				step={0}
				total={4}
				eyebrow="Boas-vindas"
				title="Bem-vindo ao Quita"
				description="Em 3-5 minutos a gente monta seu primeiro plano. Sem julgamento, sem termos juridicos confusos, sem promessa magica."
			/>

			<div className="space-y-5 text-[14px] text-[var(--color-ink)]">
				<div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
					<div className="text-[15px] font-semibold mb-2">O que voce vai fazer</div>
					<ol className="list-decimal pl-5 space-y-1.5 text-[13px] text-[var(--color-ink-2)]">
						<li>Cadastrar renda principal (salario + extras)</li>
						<li>Informar onde mora + dependentes (calculo do minimo vital)</li>
						<li>Escolher sua maior preocupacao hoje (direciona tom do plano)</li>
						<li>Marcar quais tipos de divida voce tem</li>
					</ol>
				</div>

				<div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
					<div className="text-[15px] font-semibold mb-2">O que prometemos</div>
					<ul className="text-[13px] text-[var(--color-ink-2)] space-y-1.5">
						<li>• Seus dados ficam no Brasil (LGPD), criptografados</li>
						<li>• Voce pode exportar tudo ou apagar a conta a qualquer momento</li>
						<li>• Nao vendemos seus dados. Receita vem do Premium opcional.</li>
						<li>• Plano gerado por motor proprio — sem IA opaca decidindo por voce</li>
					</ul>
				</div>

				<label className="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={tos}
						onChange={(e) => setTos(e.target.checked)}
						className="mt-1"
					/>
					<span className="text-[13px]">
						Li e aceito os{" "}
						<a
							className="text-[var(--color-teal)] underline"
							href="/termos"
							target="_blank"
							rel="noreferrer"
						>
							Termos de Uso
						</a>{" "}
						(v{TOS_VERSION}).
					</span>
				</label>

				<label className="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={privacy}
						onChange={(e) => setPrivacy(e.target.checked)}
						className="mt-1"
					/>
					<span className="text-[13px]">
						Li e aceito a{" "}
						<a
							className="text-[var(--color-teal)] underline"
							href="/privacidade"
							target="_blank"
							rel="noreferrer"
						>
							Politica de Privacidade
						</a>{" "}
						(v{PRIVACY_VERSION}).
					</span>
				</label>

				{error ? (
					<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
						{error}
					</div>
				) : null}
			</div>

			<div className="mt-10 flex justify-end">
				<Button size="lg" disabled={!ready} loading={loading} onClick={onContinue}>
					Aceitar e começar
				</Button>
			</div>
		</>
	);
}
