"use client";

import { Button } from "@/components/Button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useCreateExpense } from "@/hooks/useFinancial";
import { unmaskBRL } from "@/lib/masks";
import { type CreateExpenseInput, ExpenseCategory, FinancialType } from "@quita/shared";
import { useState } from "react";

export function NewExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const create = useCreateExpense();
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [type, setType] = useState<(typeof FinancialType)[keyof typeof FinancialType]>(
		FinancialType.FIXED,
	);
	const [category, setCategory] = useState<(typeof ExpenseCategory)[keyof typeof ExpenseCategory]>(
		ExpenseCategory.HOUSING,
	);
	const [dueDate, setDueDate] = useState("");
	const [error, setError] = useState<string | null>(null);

	async function onSave() {
		setError(null);
		if (!name.trim()) return setError("Informe um nome.");
		const value = unmaskBRL(amount);
		if (value <= 0) return setError("Informe o valor.");
		const payload: CreateExpenseInput = {
			name: name.trim(),
			amount: value,
			type,
			category,
			...(dueDate ? { dueDate } : {}),
		};
		try {
			await create.mutateAsync(payload);
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
			title="Nova despesa"
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
					placeholder="Ex.: Aluguel"
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
						label="CATEGORIA"
						value={category}
						onChange={(e) => setCategory(e.target.value as typeof category)}
					>
						<option value={ExpenseCategory.HOUSING}>Moradia</option>
						<option value={ExpenseCategory.BILLS}>Contas</option>
						<option value={ExpenseCategory.FOOD}>Alimentação</option>
						<option value={ExpenseCategory.TRANSPORT}>Transporte</option>
						<option value={ExpenseCategory.TELECOM}>Internet / celular</option>
						<option value={ExpenseCategory.OTHER}>Outro</option>
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
