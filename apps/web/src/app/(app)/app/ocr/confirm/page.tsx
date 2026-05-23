"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { type OcrExtractedSettlement, useOcrExtractByKey } from "@/hooks/useOcrQuota";
import { useEvaluateSettlement } from "@/hooks/useSettlements";
import { Check, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function OcrConfirmPage() {
	const router = useRouter();
	const params = useSearchParams();
	const debtId = params.get("debtId") ?? "";
	const key = params.get("key") ?? "";

	const extract = useOcrExtractByKey();
	const evaluate = useEvaluateSettlement();

	const [extracted, setExtracted] = useState<OcrExtractedSettlement | null>(null);
	const [cashAmount, setCashAmount] = useState("");
	const [installments, setInstallments] = useState("");
	const [installmentAmount, setInstallmentAmount] = useState("");
	const [deadline, setDeadline] = useState("");
	const [error, setError] = useState<string | null>(null);
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current || !key || !debtId) return;
		startedRef.current = true;
		extract
			.mutateAsync({ key, type: "settlement_proposal" })
			.then(({ extracted: e }) => {
				setExtracted(e);
				if (e.cashAmount) setCashAmount(String(e.cashAmount));
				if (e.installments) setInstallments(String(e.installments));
				if (e.installmentAmount) setInstallmentAmount(String(e.installmentAmount));
				if (e.deadline) setDeadline(e.deadline);
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Erro ao extrair OCR.");
			});
	}, [key, debtId, extract]);

	async function onEvaluate() {
		if (!debtId) return;
		setError(null);
		try {
			await evaluate.mutateAsync({
				debtId,
				proposalCashAmount: cashAmount ? Number(cashAmount) : undefined,
				proposalInstallments: installments ? Number(installments) : undefined,
				proposalInstallmentAmount: installmentAmount ? Number(installmentAmount) : undefined,
				proposalDeadline: deadline || undefined,
			});
			toast.success("Avaliação criada. Veja resultado em Avaliar acordo.");
			router.push("/app/avaliar-acordo");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao avaliar.");
		}
	}

	const extracting = extract.isPending && !extracted;

	return (
		<>
			<h1 className="text-[24px] font-bold mb-2">Revise os campos</h1>
			<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
				Confira o que o OCR extraiu da imagem. Edite o que estiver errado antes de validar com o
				motor.
			</p>

			{extracting ? (
				<Card className="p-6 mb-6 flex items-center gap-3 text-[14px]">
					<Loader2 className="w-4 h-4 animate-spin" /> Extraindo dados da imagem…
				</Card>
			) : extracted ? (
				<>
					<Card className="p-6 mb-6">
						<div className="mb-4 flex items-center justify-between">
							<div className="text-[12px] uppercase tracking-wider text-[var(--color-ink-3)]">
								Credor extraído
							</div>
							<div className="text-[11px] font-semibold">Confiança: {extracted.confidence}</div>
						</div>
						<div className="text-[16px] font-semibold mb-6">
							{extracted.creditor ?? "Não identificado"}
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Input
								label="VALOR À VISTA (R$)"
								type="number"
								step="0.01"
								value={cashAmount}
								onChange={(e) => setCashAmount(e.target.value)}
							/>
							<Input
								label="DATA LIMITE (YYYY-MM-DD)"
								type="date"
								value={deadline}
								onChange={(e) => setDeadline(e.target.value)}
							/>
							<Input
								label="Nº DE PARCELAS"
								type="number"
								value={installments}
								onChange={(e) => setInstallments(e.target.value)}
							/>
							<Input
								label="VALOR DA PARCELA (R$)"
								type="number"
								step="0.01"
								value={installmentAmount}
								onChange={(e) => setInstallmentAmount(e.target.value)}
							/>
						</div>
					</Card>
				</>
			) : null}

			{error ? (
				<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)] mb-4">
					{error}
				</div>
			) : null}

			<div className="flex justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					Voltar
				</Button>
				<Button size="lg" disabled={!extracted} loading={evaluate.isPending} onClick={onEvaluate}>
					<Check className="w-4 h-4 mr-1.5" /> Avaliar
				</Button>
			</div>
		</>
	);
}
