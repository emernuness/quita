"use client";

import { Button } from "@/components/Button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useCreateDebt, useDebtCategories } from "@/hooks/useDebts";
import { cn } from "@/lib/cn";
import { unmaskBRL } from "@/lib/masks";
import { DebtNature, DebtStatus } from "@quita/shared";
import { useState } from "react";

export function NewDebtModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { data: categories } = useDebtCategories();
	const createDebt = useCreateDebt();

	const [categoryId, setCategoryId] = useState("");
	const [creditor, setCreditor] = useState("");
	const [nature, setNature] = useState<(typeof DebtNature)[keyof typeof DebtNature]>(
		DebtNature.ONE_TIME,
	);
	const [totalAmount, setTotalAmount] = useState("");
	const [monthly, setMonthly] = useState("");
	const [status, setStatus] = useState<(typeof DebtStatus)[keyof typeof DebtStatus]>(
		DebtStatus.ON_TIME,
	);
	const [hasInterest, setHasInterest] = useState<"" | "yes" | "no">("");
	const [error, setError] = useState<string | null>(null);

	function reset() {
		setCategoryId("");
		setCreditor("");
		setNature(DebtNature.ONE_TIME);
		setTotalAmount("");
		setMonthly("");
		setStatus(DebtStatus.ON_TIME);
		setHasInterest("");
		setError(null);
	}

	async function onSave() {
		setError(null);
		if (!categoryId) return setError("Selecione a categoria.");
		if (!creditor.trim()) return setError("Informe o credor.");
		const total = unmaskBRL(totalAmount);
		if (total <= 0) return setError("Informe o valor total.");
		try {
			await createDebt.mutateAsync({
				categoryId,
				creditor: creditor.trim(),
				nature,
				totalAmount: total,
				status,
				hasInterest: hasInterest === "yes" ? true : hasInterest === "no" ? false : null,
				...(unmaskBRL(monthly) > 0 ? { monthlyAmount: unmaskBRL(monthly) } : {}),
			});
			reset();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Nova dívida"
			subtitle="Cadastre o credor e o valor. Você pode ajustar depois."
			size="lg"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
					<Button loading={createDebt.isPending} onClick={onSave}>
						Salvar dívida
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Select
					label="CATEGORIA"
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
				>
					<option value="">Selecione…</option>
					{categories?.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</Select>
				<Input
					label="CREDOR"
					placeholder="Ex.: Nubank"
					value={creditor}
					onChange={(e) => setCreditor(e.target.value)}
				/>
			</div>

			<div className="mt-4">
				<div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
					Como é a cobrança?
				</div>
				<div className="grid grid-cols-3 gap-2">
					{[
						{ k: DebtNature.INSTALLMENT, l: "Parcelado" },
						{ k: DebtNature.RECURRING, l: "Conta fixa" },
						{ k: DebtNature.ONE_TIME, l: "Único" },
					].map((n) => (
						<button
							key={n.k}
							type="button"
							onClick={() => setNature(n.k)}
							className={cn(
								"h-10 rounded-[8px] border text-[13px] font-semibold",
								nature === n.k
									? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
									: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
							)}
						>
							{n.l}
						</button>
					))}
				</div>
			</div>

			<div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
				<CurrencyInput label="Valor total" value={totalAmount} onChange={setTotalAmount} />
				<CurrencyInput label="Parcela / mês (opcional)" value={monthly} onChange={setMonthly} />
			</div>

			<div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
				<Select
					label="STATUS"
					value={status}
					onChange={(e) => setStatus(e.target.value as typeof status)}
				>
					<option value={DebtStatus.ON_TIME}>Em dia</option>
					<option value={DebtStatus.OVERDUE}>Atrasada</option>
					<option value={DebtStatus.RENEGOTIATED}>Negociando</option>
				</Select>
				<Select
					label="TEM JUROS?"
					value={hasInterest}
					onChange={(e) => setHasInterest(e.target.value as typeof hasInterest)}
				>
					<option value="">Não sei</option>
					<option value="yes">Sim</option>
					<option value="no">Não</option>
				</Select>
			</div>

			{error ? (
				<div className="mt-5 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{error}
				</div>
			) : null}
		</Modal>
	);
}
