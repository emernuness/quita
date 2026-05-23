"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { Input } from "@/components/Input";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useDebts } from "@/hooks/useDebts";
import {
	type SettlementEvaluation,
	useEvaluateFromImage,
	useEvaluateSettlement,
} from "@/hooks/useSettlements";
import { Check, FileImage, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RECOMMENDATION_LABELS: Record<SettlementEvaluation["recommendation"], string> = {
	accept: "Aceitar acordo",
	negotiate_lower: "Negociar valor menor",
	reject: "Recusar acordo",
};

const RECOMMENDATION_TONE: Record<SettlementEvaluation["recommendation"], string> = {
	accept: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]",
	negotiate_lower: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
	reject: "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]",
};

export default function AvaliarAcordoPage() {
	const { data: debts } = useDebts();
	const [debtId, setDebtId] = useState("");
	const [cashAmount, setCashAmount] = useState("");
	const [installments, setInstallments] = useState("");
	const [installmentAmount, setInstallmentAmount] = useState("");
	const [result, setResult] = useState<SettlementEvaluation | null>(null);

	const evaluate = useEvaluateSettlement();
	const evaluateFromImage = useEvaluateFromImage();

	const activeDebts = (debts ?? []).filter((d) => d.status !== "paid");

	async function handleManual() {
		if (!debtId) {
			toast.error("Escolha uma dívida.");
			return;
		}
		try {
			const r = await evaluate.mutateAsync({
				debtId,
				proposalCashAmount: cashAmount ? Number(cashAmount) : undefined,
				proposalInstallments: installments ? Number(installments) : undefined,
				proposalInstallmentAmount: installmentAmount ? Number(installmentAmount) : undefined,
			});
			setResult(r);
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file || !debtId) {
			toast.error("Escolha uma dívida antes de enviar a imagem.");
			return;
		}
		const reader = new FileReader();
		reader.onload = async () => {
			const base64 = (reader.result as string).split(",")[1] ?? "";
			try {
				const r = await evaluateFromImage.mutateAsync({ debtId, imageBase64: base64 });
				setResult(r);
				toast.success("Acordo extraído via OCR.");
			} catch (err) {
				toast.error((err as Error).message);
			}
		};
		reader.readAsDataURL(file);
	}

	return (
		<>
			<PageHeader
				title="Avaliar acordo"
				subtitle="Veja se uma proposta de acordo cabe no seu orçamento sem te quebrar."
			/>

			{activeDebts.length === 0 ? (
				<Empty
					title="Sem dívidas ativas"
					description="Cadastre uma dívida primeiro para avaliar acordos."
				/>
			) : (
				<>
					<Card className="p-6 mb-6">
						<div className="grid gap-4">
							<Select label="Dívida" value={debtId} onChange={(e) => setDebtId(e.target.value)}>
								<option value="">Escolha…</option>
								{activeDebts.map((d) => (
									<option key={d.id} value={d.id}>
										{d.creditor} (R$ {(d.totalAmount - d.amountPaid).toFixed(2)} restante)
									</option>
								))}
							</Select>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<Input
									label="Valor à vista (R$)"
									type="number"
									value={cashAmount}
									onChange={(e) => setCashAmount(e.target.value)}
								/>
								<Input
									label="Nº parcelas"
									type="number"
									value={installments}
									onChange={(e) => setInstallments(e.target.value)}
								/>
								<Input
									label="Valor da parcela (R$)"
									type="number"
									value={installmentAmount}
									onChange={(e) => setInstallmentAmount(e.target.value)}
								/>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button onClick={handleManual} disabled={evaluate.isPending}>
									{evaluate.isPending ? "Avaliando…" : "Avaliar manualmente"}
								</Button>
								<label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-background)]">
									<FileImage className="w-4 h-4" />
									<span className="text-[14px]">Enviar imagem da proposta</span>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleImage}
										disabled={evaluateFromImage.isPending}
									/>
								</label>
							</div>
							{evaluateFromImage.isPending && (
								<p className="text-[13px] text-[var(--color-ink-3)]">Lendo imagem via OCR…</p>
							)}
						</div>
					</Card>

					{result && (
						<Card className="p-6">
							<div
								className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider ${RECOMMENDATION_TONE[result.recommendation]}`}
							>
								{result.recommendation === "accept" ? (
									<Check className="w-3.5 h-3.5" />
								) : (
									<X className="w-3.5 h-3.5" />
								)}
								{RECOMMENDATION_LABELS[result.recommendation]}
							</div>
							<p className="mt-4 text-[16px]">{result.reasoning}</p>
							<div className="grid grid-cols-2 gap-4 mt-6 text-[14px]">
								{result.maxSafeInstallment !== null && (
									<div>
										<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
											Parcela segura máxima
										</div>
										<div className="font-semibold">
											<Money value={result.maxSafeInstallment} />
										</div>
									</div>
								)}
								{result.discountPercent !== null && (
									<div>
										<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
											Desconto oferecido
										</div>
										<div className="font-semibold">
											{(result.discountPercent * 100).toFixed(0)}%
										</div>
									</div>
								)}
								<div>
									<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
										Capacidade no momento
									</div>
									<div className="font-semibold">
										<Money value={result.capacityAtEvaluation} />
									</div>
								</div>
								{result.usedOcr && (
									<div>
										<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
											Origem
										</div>
										<div className="font-semibold">OCR (imagem)</div>
									</div>
								)}
							</div>
						</Card>
					)}
				</>
			)}
		</>
	);
}
