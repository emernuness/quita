"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { KpiCard } from "@/components/KpiCard";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { NewDebtModal } from "@/components/modals/NewDebtModal";
import { useDashboard } from "@/hooks/useDashboard";
import { useDebts } from "@/hooks/useDebts";
import { debtStatusLabel, debtStatusTone } from "@/lib/labels";
import type { Debt } from "@quita/shared";
import { ChevronRight, CreditCard, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DebtsPage() {
	const { data: debts } = useDebts();
	const { data: dashboard } = useDashboard();
	const [open, setOpen] = useState(false);

	const active = (debts ?? []).filter((d) => d.status !== "paid");
	const paid = (debts ?? []).filter((d) => d.status === "paid");

	return (
		<>
			<PageHeader
				title="Dívidas"
				subtitle="Acompanhe cada cobrança e como você está avançando."
				actions={
					<Button onClick={() => setOpen(true)}>
						<Plus size={16} strokeWidth={2.4} />
						Nova dívida
					</Button>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<KpiCard
					label="Total devido"
					value={<Money value={dashboard?.totalDebt ?? 0} />}
					hint={`${active.length} ${active.length === 1 ? "em aberto" : "em aberto"}`}
					accent="debt"
					icon={CreditCard}
				/>
				<KpiCard
					label="Já quitado"
					value={<Money value={paid.reduce((s, d) => s + d.totalAmount, 0)} />}
					hint={`${paid.length} ${paid.length === 1 ? "dívida" : "dívidas"}`}
					accent="income"
					icon={Sparkles}
				/>
				<KpiCard
					label="Progresso"
					value={`${dashboard?.progressPercent ?? 0}%`}
					accent="balance"
					icon={Sparkles}
				/>
			</div>

			<div className="mt-8">
				<h2 className="text-[16px] font-bold tracking-tight text-[var(--color-ink)]">Em aberto</h2>
				<div className="mt-3">
					{active.length === 0 ? (
						<Empty
							title="Sem dívidas em aberto"
							description="Quando você cadastrar uma dívida ela aparece aqui."
							action={
								<Button onClick={() => setOpen(true)}>
									<Plus size={16} strokeWidth={2.4} />
									Cadastrar dívida
								</Button>
							}
						/>
					) : (
						<DebtList items={active} />
					)}
				</div>
			</div>

			{paid.length > 0 ? (
				<div className="mt-8">
					<h2 className="text-[16px] font-bold tracking-tight text-[var(--color-ink)]">Quitadas</h2>
					<div className="mt-3">
						<DebtList items={paid} muted />
					</div>
				</div>
			) : null}

			<NewDebtModal open={open} onClose={() => setOpen(false)} />
		</>
	);
}

function DebtList({ items, muted = false }: { items: Debt[]; muted?: boolean }) {
	return (
		<Card className="card-shadow flex flex-col divide-y divide-[var(--color-border)] p-0">
			{items.map((d) => {
				const remaining = d.totalAmount - d.amountPaid;
				const progress = d.totalAmount > 0 ? (d.amountPaid / d.totalAmount) * 100 : 0;
				return (
					<Link
						key={d.id}
						href={`/app/debts/${d.id}`}
						className="flex items-center gap-5 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<div className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
									{d.creditor}
								</div>
								<Badge tone={debtStatusTone[d.status] ?? "neutral"}>
									{debtStatusLabel[d.status] ?? d.status}
								</Badge>
							</div>
							<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
								<div
									className="h-full bg-[var(--color-success)]"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<div className="tabular mt-2 text-[12px] text-[var(--color-ink-3)]">
								<Money value={d.amountPaid} /> de <Money value={d.totalAmount} />
							</div>
						</div>
						<div className="text-right">
							<div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
								{muted ? "Total" : "Restante"}
							</div>
							<div className="tabular text-[18px] font-bold text-[var(--color-ink)]">
								<Money value={muted ? d.totalAmount : remaining} />
							</div>
						</div>
						<ChevronRight size={16} strokeWidth={1.8} className="text-[var(--color-ink-3)]" />
					</Link>
				);
			})}
		</Card>
	);
}
