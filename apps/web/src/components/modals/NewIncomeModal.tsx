"use client";

import { Button } from "@/components/Button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useCreateIncome } from "@/hooks/useFinancial";
import { unmaskBRL } from "@/lib/masks";
import { type CreateIncomeInput, FinancialType, IncomeSource } from "@quita/shared";
import { useState } from "react";
import { toast } from "sonner";

export function NewIncomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const create = useCreateIncome();
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [type, setType] = useState<(typeof FinancialType)[keyof typeof FinancialType]>(
		FinancialType.FIXED,
	);
	const [source, setSource] = useState<(typeof IncomeSource)[keyof typeof IncomeSource]>(
		IncomeSource.SALARY,
	);
	const [dueDate, setDueDate] = useState("");
	const [error, setError] = useState<string | null>(null);

	async function onSave() {
		setError(null);
		if (!name.trim()) return setError("Informe um nome.");
		const value = unmaskBRL(amount);
		if (value <= 0) return setError("Informe o valor.");
		const payload: CreateIncomeInput = {
			name: name.trim(),
			amount: value,
			type,
			sourceCategory: source,
			...(dueDate ? { dueDate } : {}),
		};
		try {
			await create.mutateAsync(payload);
			toast.success("Receita adicionada");
			setName("");
			setAmount("");
			setDueDate("");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Nova entrada"
			size="md"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
					<Button loading={create.isPending} onClick={onSave}>
						Salvar
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-1 gap-5">
				<Input
					label="DESCRIÇÃO"
					placeholder="Ex.: Salário CLT"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<CurrencyInput label="VALOR" value={amount} onChange={setAmount} />
				<div className="grid grid-cols-2 gap-4">
					<Select
						label="FREQUÊNCIA"
						value={type}
						onChange={(e) => setType(e.target.value as typeof type)}
					>
						<option value={FinancialType.FIXED}>Fixa</option>
						<option value={FinancialType.RECURRING}>Recorrente</option>
						<option value={FinancialType.ONE_TIME}>Pontual</option>
					</Select>
					<Select
						label="ORIGEM"
						value={source}
						onChange={(e) => setSource(e.target.value as typeof source)}
					>
						<option value={IncomeSource.SALARY}>Salário</option>
						<option value={IncomeSource.EXTRA}>Extra / bico</option>
						<option value={IncomeSource.HELP}>Ajuda / pensão</option>
						<option value={IncomeSource.OTHER}>Outro</option>
					</Select>
				</div>
				<Input
					label="DATA (OPCIONAL)"
					type="date"
					value={dueDate}
					onChange={(e) => setDueDate(e.target.value)}
				/>
			</div>

			{error ? (
				<div className="mt-5 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{error}
				</div>
			) : null}
		</Modal>
	);
}
