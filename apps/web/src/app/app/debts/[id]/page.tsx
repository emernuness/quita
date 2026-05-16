"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { CelebrationModal } from "@/components/modals/CelebrationModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { PayDebtModal } from "@/components/modals/PayDebtModal";
import { PaymentConfirmedModal } from "@/components/modals/PaymentConfirmedModal";
import { useDebt, useDeleteDebt } from "@/hooks/useDebts";
import { debtStatusLabel, debtStatusTone, paymentTypeLabel } from "@/lib/labels";
import { PaymentType, formatDateBR } from "@quita/shared";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function DebtDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params?.id ?? "";
	const { data, isLoading } = useDebt(id);
	const remove = useDeleteDebt();

	const [payOpen, setPayOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmed, setConfirmed] = useState<{ amount: number; fullyPaid: boolean } | null>(null);
	const [celebrateOpen, setCelebrateOpen] = useState(false);

	if (isLoading || !data) {
		return (
			<div className="py-20 text-center text-[14px] text-[var(--color-ink-2)]">Carregando…</div>
		);
	}

	const remaining = data.totalAmount - data.amountPaid;
	const progress = data.totalAmount > 0 ? (data.amountPaid / data.totalAmount) * 100 : 0;

	async function onConfirmDelete() {
		await remove.mutateAsync(id);
		setDeleteOpen(false);
		router.replace("/app/debts");
	}

	return (
		<>
			<div className="mb-4">
				<Link
					href="/app/debts"
					className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
				>
					<ArrowLeft size={14} strokeWidth={1.8} />
					Voltar para Dívidas
				</Link>
			</div>

			<PageHeader
				title={data.creditor}
				subtitle={data.category?.name ?? "Dívida"}
				actions={
					<>
						<Button variant="outline" onClick={() => setDeleteOpen(true)}>
							<Trash2 size={16} strokeWidth={1.8} />
							Excluir
						</Button>
						<Button onClick={() => setPayOpen(true)} disabled={data.status === "paid"}>
							<Plus size={16} strokeWidth={2.4} />
							Registrar pagamento
						</Button>
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card tone="teal" className="card-shadow flex flex-col p-7 lg:col-span-2">
					<div className="flex items-center gap-2">
						<Badge tone={debtStatusTone[data.status] ?? "neutral"}>
							{debtStatusLabel[data.status] ?? data.status}
						</Badge>
						{data.hasInterest ? <Badge tone="warning">Com juros</Badge> : null}
					</div>
					<div className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-white/70">
						Restante
					</div>
					<div className="tabular mt-1 text-[44px] font-bold leading-none">
						<Money value={remaining} />
					</div>
					<div className="mt-5">
						<ProgressBar value={progress} tone="white" />
						<div className="mt-2 text-[13px] text-white/75">
							<Money value={data.amountPaid} /> pagos de <Money value={data.totalAmount} />
						</div>
					</div>
				</Card>

				<div className="flex flex-col gap-4">
					<Card className="card-shadow p-6">
						<div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
							Total da dívida
						</div>
						<div className="tabular mt-2 text-[24px] font-bold text-[var(--color-ink)]">
							<Money value={data.totalAmount} />
						</div>
					</Card>
					{data.totalInstallments ? (
						<Card className="card-shadow p-6">
							<div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
								Parcelas
							</div>
							<div className="tabular mt-2 text-[24px] font-bold text-[var(--color-ink)]">
								{data.currentInstallment ?? 0} / {data.totalInstallments}
							</div>
						</Card>
					) : null}
				</div>
			</div>

			<div className="mt-10">
				<h2 className="text-[16px] font-bold tracking-tight text-[var(--color-ink)]">Pagamentos</h2>
				<Card className="card-shadow mt-3 overflow-hidden p-0">
					{data.payments.length === 0 ? (
						<div className="px-5 py-10 text-center text-[14px] text-[var(--color-ink-2)]">
							Nenhum pagamento registrado ainda.
						</div>
					) : (
						<table className="w-full">
							<thead>
								<tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
									<th className="px-5 py-3">Data</th>
									<th className="px-5 py-3">Tipo</th>
									<th className="px-5 py-3 text-right">Valor</th>
								</tr>
							</thead>
							<tbody>
								{data.payments.map((p) => (
									<tr key={p.id} className="border-b border-[var(--color-border)] last:border-b-0">
										<td className="px-5 py-3 text-[14px] text-[var(--color-ink)]">
											{formatDateBR(p.paidAt)}
										</td>
										<td className="px-5 py-3 text-[14px] text-[var(--color-ink-2)]">
											{paymentTypeLabel[p.paymentType] ?? p.paymentType}
										</td>
										<td className="tabular px-5 py-3 text-right text-[14px] font-semibold text-[var(--color-ink)]">
											<Money value={p.amount} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</Card>
			</div>

			<PayDebtModal
				open={payOpen}
				onClose={() => setPayOpen(false)}
				debtId={id}
				creditor={data.creditor}
				remaining={remaining}
				onPaid={(amount, type) => {
					const fullyPaid = type === PaymentType.FULL || amount >= remaining;
					setConfirmed({ amount, fullyPaid });
					if (fullyPaid) setCelebrateOpen(true);
				}}
			/>
			<PaymentConfirmedModal
				open={!!confirmed && !celebrateOpen}
				onClose={() => setConfirmed(null)}
				amount={confirmed?.amount ?? 0}
				creditor={data.creditor}
				fullyPaid={confirmed?.fullyPaid ?? false}
			/>
			<CelebrationModal
				open={celebrateOpen}
				onClose={() => {
					setCelebrateOpen(false);
					setConfirmed(null);
				}}
			/>
			<ConfirmModal
				open={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				onConfirm={onConfirmDelete}
				title="Excluir esta dívida?"
				description="Os pagamentos vinculados também serão removidos. Essa ação não pode ser desfeita."
				confirmLabel="Excluir"
				loading={remove.isPending}
			/>
		</>
	);
}
