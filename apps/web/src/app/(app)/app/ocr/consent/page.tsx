"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { apiPost } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const OCR_CONSENT_VERSION = "ocr-v1";

export default function OcrConsentPage() {
	const router = useRouter();
	const params = useSearchParams();
	const debtId = params.get("debtId") ?? "";
	const [accepted, setAccepted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onAccept() {
		setLoading(true);
		setError(null);
		try {
			await apiPost("/consent", {
				consentType: "data_processing",
				version: OCR_CONSENT_VERSION,
				accepted: true,
			});
			const qs = debtId ? `?debtId=${debtId}` : "";
			router.push(`/app/ocr/capture${qs}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao registrar consentimento.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<h1 className="text-[24px] font-bold mb-2">Antes de enviar a imagem</h1>
			<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
				OCR Premium usa inteligência artificial para extrair dados de propostas de acordo. Veja as
				condições antes de prosseguir.
			</p>

			<Card className="p-6 mb-6">
				<div className="flex items-start gap-3">
					<ShieldCheck className="w-5 h-5 mt-0.5 text-[var(--color-teal)] shrink-0" />
					<div className="text-[14px] space-y-3">
						<div>
							<strong>Retenção 30 dias.</strong> A imagem fica em storage criptografado (Cloudflare
							R2) e é apagada automaticamente após 30 dias.
						</div>
						<div>
							<strong>OpenAI não treina com sua imagem.</strong> Usamos a API gpt-4o-mini com
							política de não-retenção (zero data retention enterprise).
						</div>
						<div>
							<strong>Revisão manual obrigatória.</strong> Os campos extraídos serão exibidos para
							você confirmar/editar antes de validar com o motor.
						</div>
						<div>
							<strong>Você pode revogar a qualquer momento.</strong> Em Perfil → Privacidade, basta
							revogar o consentimento data_processing.
						</div>
					</div>
				</div>
			</Card>

			<label className="flex items-start gap-3 mb-6 cursor-pointer">
				<input
					type="checkbox"
					checked={accepted}
					onChange={(e) => setAccepted(e.target.checked)}
					className="mt-1"
				/>
				<span className="text-[14px]">
					Li, entendi e concordo com as condições acima (v{OCR_CONSENT_VERSION}).
				</span>
			</label>

			{error ? (
				<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)] mb-4">
					{error}
				</div>
			) : null}

			<div className="flex justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					Cancelar
				</Button>
				<Button size="lg" disabled={!accepted} loading={loading} onClick={onAccept}>
					Aceitar e continuar
				</Button>
			</div>
		</>
	);
}
