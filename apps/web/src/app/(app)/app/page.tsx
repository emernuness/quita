"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DonutChart, DonutLegend, type DonutSlice } from "@/components/DonutChart";
import { Empty } from "@/components/Empty";
import { KpiCard } from "@/components/KpiCard";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { NewDebtModal } from "@/components/modals/NewDebtModal";
import { useDashboard } from "@/hooks/useDashboard";
import { useDebts } from "@/hooks/useDebts";
import { useExpenses } from "@/hooks/useFinancial";
import { colorFor, debtCategoryColor, expenseCategoryColor } from "@/lib/category-colors";
import { debtStatusLabel, debtStatusTone, financialLabel } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth";
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
	const { data, isLoading } = useDashboard();
	const { data: debts } = useDebts();
	const { data: expenses } = useExpenses();
	const user = useAuthStore((s) => s.user);
	const firstName = user?.name?.split(" ")[0] ?? "Você";
	const [newDebtOpen, setNewDebtOpen] = useState(false);

	const expenseSlices = useMemo<DonutSlice[]>(() => {
		const grouped = (expenses ?? []).reduce<Record<string, number>>((acc, e) => {
			acc[e.category] = (acc[e.category] ?? 0) + e.amount;
			return acc;
		}, {});
		return Object.entries(grouped).map(([k, v]) => ({
			key: k,
			label: financialLabel(k),
			value: v,
			color: colorFor(expenseCategoryColor, k),
		}));
	}, [expenses]);

	const debtSlices = useMemo<DonutSlice[]>(() => {
		const grouped = (debts ?? [])
			.filter((d) => d.status !== "paid")
			.reduce<Record<string, { name: string; slug: string; amount: number }>>((acc, d) => {
				const slug = (d as { category?: { slug: string; name: string } }).category?.slug ?? "other";
				const name = (d as { category?: { slug: string; name: string } }).category?.name ?? "Outra";
				const remaining = d.totalAmount - d.amountPaid;
				if (!acc[slug]) acc[slug] = { slug, name, amount: 0 };
				acc[slug].amount += remaining;
				return acc;
			}, {});
		return Object.values(grouped).map((g) => ({
			key: g.slug,
			label: g.name,
			value: g.amount,
			color: colorFor(debtCategoryColor, g.slug),
		}));
	}, [debts]);

	if (isLoading || !data) {
		return (
			<div className="py-20 text-center text-[14px] text-[var(--color-ink-2)]">Carregando…</div>
		);
	}

	const overdueCount = data.debtsCount - data.paidDebtsCount;
	const nextDebt = data.debts.find((d) => d.status !== "paid");
	const expenseTotal = expenseSlices.reduce((s, x) => s + x.value, 0);
	const debtTotal = debtSlices.reduce((s, x) => s + x.value, 0);

	return (
		<>
			<PageHeader
				title={`Olá, ${firstName}.`}
				subtitle="Sua situação em uma olhada."
				actions={
					<Button onClick={() => setNewDebtOpen(true)}>
						<Plus size={16} strokeWidth={2.4} />
						Nova dívida
					</Button>
				}
			/>

			{/* KPIs */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KpiCard
					label="Saldo do mês"
					value={<Money value={data.monthlyBalance} />}
					accent="balance"
					icon={Wallet}
				/>
				<KpiCard
					label="Entradas"
					value={<Money value={data.totalIncome} />}
					accent="income"
					icon={ArrowUpRight}
				/>
				<KpiCard
					label="Despesas fixas"
					value={<Money value={data.totalExpenses} />}
					accent="expense"
					icon={ArrowDownRight}
				/>
				<KpiCard
					label="Total devido"
					value={<Money value={data.totalDebt} />}
					hint={`${overdueCount} ${overdueCount === 1 ? "conta em aberto" : "contas em aberto"}`}
					accent="debt"
					icon={Sparkles}
				/>
			</div>

			{/* Próxima ação + Progresso */}
			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
				{nextDebt ? (
					<Card tone="navy" className="card-shadow flex flex-col p-7 lg:col-span-2">
						<div className="flex items-center gap-2">
							<Badge tone="warning" dot>
								Próximo passo
							</Badge>
							<span className="text-[12px] font-medium text-white/60">
								Comece pela menor pra ganhar fôlego
							</span>
						</div>
						<h2 className="mt-4 text-[24px] font-bold leading-tight tracking-tight">
							Pagar <Money value={nextDebt.totalAmount - nextDebt.amountPaid} /> para{" "}
							{nextDebt.creditor}
						</h2>
						<p className="mt-2 text-[14px] text-white/70">
							{nextDebt.category?.name ?? "Dívida"} ·{" "}
							{debtStatusLabel[nextDebt.status] ?? nextDebt.status}
						</p>
						<div className="mt-auto pt-6">
							<Link
								href={`/app/debts/${nextDebt.id}`}
								className="inline-flex h-10 items-center justify-center rounded-[8px] bg-white px-5 text-[13px] font-semibold text-[var(--color-teal)] hover:bg-white/90"
							>
								Ver dívida
							</Link>
						</div>
					</Card>
				) : data.debtsCount === 0 ? (
					<div className="w-full min-w-0 lg:col-span-2">
						<Empty
							title="Você ainda não cadastrou dívidas"
							description="Adicione a primeira pro Quita começar a montar um plano de quitação."
							action={
								<Button onClick={() => setNewDebtOpen(true)}>
									<Plus size={16} strokeWidth={2.4} />
									Cadastrar primeira dívida
								</Button>
							}
						/>
					</div>
				) : null}

				<Card className="card-shadow flex flex-col p-6">
					<div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
						Progresso da quitação
					</div>
					<div className="tabular mt-3 text-[34px] font-bold leading-none tracking-tight text-[var(--color-ink)]">
						{data.progressPercent}%
					</div>
					<div className="mt-auto pt-5">
						<ProgressBar value={data.progressPercent} />
						<div className="mt-2.5 text-[12.5px] text-[var(--color-ink-2)]">
							{data.paidDebtsCount} de {data.debtsCount} dívidas quitadas
						</div>
					</div>
				</Card>
			</div>

			{/* Donuts */}
			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card className="card-shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
								Dívidas por tipo
							</div>
							<div className="tabular mt-1 text-[20px] font-bold text-[var(--color-ink)]">
								<Money value={debtTotal} />
							</div>
						</div>
						<Link
							href="/app/debts"
							className="text-[12px] font-semibold text-[var(--color-teal)] hover:underline"
						>
							Ver tudo
						</Link>
					</div>
					<div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-[200px_1fr]">
						<DonutChart
							slices={debtSlices}
							centerLabel="Total devido"
							centerValue={<Money value={debtTotal} compact />}
							emptyLabel="Nenhuma dívida ativa"
						/>
						{debtSlices.length > 0 ? (
							<DonutLegend slices={debtSlices} formatValue={(v) => <Money value={v} compact />} />
						) : (
							<div className="text-[13px] text-[var(--color-ink-3)]">
								Cadastre uma dívida pra ver a distribuição por tipo.
							</div>
						)}
					</div>
				</Card>

				<Card className="card-shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
								Despesas por categoria
							</div>
							<div className="tabular mt-1 text-[20px] font-bold text-[var(--color-ink)]">
								<Money value={expenseTotal} />
							</div>
						</div>
						<Link
							href="/app/transactions"
							className="text-[12px] font-semibold text-[var(--color-teal)] hover:underline"
						>
							Ver tudo
						</Link>
					</div>
					<div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-[200px_1fr]">
						<DonutChart
							slices={expenseSlices}
							centerLabel="Total mês"
							centerValue={<Money value={expenseTotal} compact />}
							emptyLabel="Sem despesas"
						/>
						{expenseSlices.length > 0 ? (
							<DonutLegend
								slices={expenseSlices}
								formatValue={(v) => <Money value={v} compact />}
							/>
						) : (
							<div className="text-[13px] text-[var(--color-ink-3)]">
								Cadastre suas despesas fixas em Transações.
							</div>
						)}
					</div>
				</Card>
			</div>

			<NewDebtModal open={newDebtOpen} onClose={() => setNewDebtOpen(false)} />
		</>
	);
}
