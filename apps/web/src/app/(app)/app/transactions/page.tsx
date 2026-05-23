"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { KpiCard } from "@/components/KpiCard";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { NewExpenseModal } from "@/components/modals/NewExpenseModal";
import { NewIncomeModal } from "@/components/modals/NewIncomeModal";
import { useExpenses, useFinancialSummary, useIncomes } from "@/hooks/useFinancial";
import { cn } from "@/lib/cn";
import { financialLabel } from "@/lib/labels";
import { ArrowDownRight, ArrowUpRight, type LucideIcon, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type Filter = "all" | "income" | "expense";

interface Row {
	id: string;
	kind: "income" | "expense";
	name: string;
	hint: string;
	amount: number;
	createdAt: string;
}

export default function TransactionsPage() {
	const { data: summary } = useFinancialSummary();
	const { data: incomes } = useIncomes();
	const { data: expenses } = useExpenses();
	const [filter, setFilter] = useState<Filter>("all");
	const [openModal, setOpenModal] = useState<null | "income" | "expense">(null);

	const rows: Row[] = useMemo(() => {
		const i = (incomes ?? []).map<Row>((it) => ({
			id: `i-${it.id}`,
			kind: "income",
			name: it.name,
			hint: financialLabel(it.sourceCategory ?? "other"),
			amount: it.amount,
			createdAt: it.createdAt,
		}));
		const e = (expenses ?? []).map<Row>((it) => ({
			id: `e-${it.id}`,
			kind: "expense",
			name: it.name,
			hint: financialLabel(it.category),
			amount: it.amount,
			createdAt: it.createdAt,
		}));
		return [...i, ...e].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [incomes, expenses]);

	const filtered = useMemo(() => {
		if (filter === "all") return rows;
		return rows.filter((r) => r.kind === filter);
	}, [rows, filter]);

	return (
		<>
			<PageHeader
				title="Transações"
				subtitle="Tudo que entra e sai do seu mês — antes das dívidas."
				actions={
					<>
						<Button variant="secondary" onClick={() => setOpenModal("income")}>
							<Plus size={16} strokeWidth={2.4} />
							Entrada
						</Button>
						<Button onClick={() => setOpenModal("expense")}>
							<Plus size={16} strokeWidth={2.4} />
							Despesa
						</Button>
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<KpiCard
					label="Entra"
					value={<Money value={summary?.totalIncome ?? 0} />}
					accent="income"
					icon={ArrowUpRight}
				/>
				<KpiCard
					label="Sai"
					value={<Money value={summary?.totalExpenses ?? 0} />}
					accent="expense"
					icon={ArrowDownRight}
				/>
				<KpiCard
					label="Disponível"
					value={<Money value={summary?.balance ?? 0} />}
					accent="balance"
					icon={ArrowUpRight}
				/>
			</div>

			<Card className="card-shadow mt-6 overflow-hidden p-0">
				<div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
					<div className="flex gap-1.5">
						{(
							[
								{ k: "all", l: "Todas" },
								{ k: "income", l: "Entradas" },
								{ k: "expense", l: "Despesas" },
							] as { k: Filter; l: string }[]
						).map((t) => (
							<button
								key={t.k}
								type="button"
								onClick={() => setFilter(t.k)}
								className={cn(
									"rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
									filter === t.k
										? "bg-[var(--color-teal)] text-white"
										: "text-[var(--color-ink-2)] hover:bg-[var(--color-background)] hover:text-[var(--color-ink)]",
								)}
							>
								{t.l}
							</button>
						))}
					</div>
					<div className="text-[12px] text-[var(--color-ink-3)]">
						{filtered.length} {filtered.length === 1 ? "item" : "itens"}
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="px-5 py-12">
						<Empty
							title="Nenhuma transação aqui"
							description="Cadastre uma entrada ou despesa pra começar a acompanhar."
						/>
					</div>
				) : (
					<table className="w-full">
						<thead>
							<tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
								<th className="px-5 py-3">Tipo</th>
								<th className="px-5 py-3">Descrição</th>
								<th className="px-5 py-3">Categoria</th>
								<th className="px-5 py-3 text-right">Valor</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((r) => (
								<TransactionRow key={r.id} row={r} />
							))}
						</tbody>
					</table>
				)}
			</Card>

			<NewIncomeModal open={openModal === "income"} onClose={() => setOpenModal(null)} />
			<NewExpenseModal open={openModal === "expense"} onClose={() => setOpenModal(null)} />
		</>
	);
}

function TransactionRow({ row }: { row: Row }) {
	const isIncome = row.kind === "income";
	const Icon: LucideIcon = isIncome ? ArrowUpRight : ArrowDownRight;
	const bg = isIncome ? "bg-[var(--color-cat-income-soft)]" : "bg-[var(--color-cat-expense-soft)]";
	const fg = isIncome ? "text-[var(--color-cat-income)]" : "text-[var(--color-cat-expense)]";
	const valFg = isIncome ? "text-[var(--color-cat-income)]" : "text-[var(--color-cat-expense)]";

	return (
		<tr className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]">
			<td className="px-5 py-3">
				<span
					className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full", bg, fg)}
				>
					<Icon size={16} strokeWidth={2} aria-hidden="true" />
				</span>
			</td>
			<td className="px-5 py-3 text-[14px] font-semibold text-[var(--color-ink)]">{row.name}</td>
			<td className="px-5 py-3 text-[13px] text-[var(--color-ink-2)]">{row.hint}</td>
			<td className={cn("tabular px-5 py-3 text-right text-[15px] font-bold", valFg)}>
				{isIncome ? "+" : "−"} <Money value={row.amount} />
			</td>
		</tr>
	);
}
