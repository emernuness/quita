"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { useDashboard } from "@/hooks/useDashboard";
import { useDebts } from "@/hooks/useDebts";
import { cn } from "@/lib/cn";
import { useMemo } from "react";

export default function PlanPage() {
	const { data: dashboard } = useDashboard();
	const { data: debts } = useDebts();

	const sorted = useMemo(() => {
		const active = (debts ?? []).filter((d) => d.status !== "paid");
		return [...active].sort((a, b) => a.totalAmount - b.totalAmount);
	}, [debts]);

	const monthlyAvailable = dashboard?.surplusForDebts ?? 0;
	const monthsToClear =
		monthlyAvailable > 0 ? Math.ceil((dashboard?.totalDebt ?? 0) / monthlyAvailable) : 0;

	return (
		<>
			<PageHeader title="Meu plano" subtitle="Gerado com base nas suas dívidas e na sua renda." />

			<Card tone="navy" className="card-shadow p-7">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<div className="text-[12px] font-semibold uppercase tracking-wider text-white/65">
							Livre das dívidas em
						</div>
						<div className="tabular mt-3 text-[40px] font-bold leading-none">
							{monthsToClear > 0
								? `${monthsToClear} ${monthsToClear === 1 ? "mês" : "meses"}`
								: "—"}
						</div>
						{monthlyAvailable <= 0 ? (
							<p className="mt-3 max-w-md text-[13px] text-white/75">
								Hoje, suas despesas estão acima do que entra. Vamos primeiro ajustar isso em
								Transações.
							</p>
						) : (
							<p className="mt-3 max-w-md text-[13px] text-white/75">
								Se você direcionar{" "}
								<span className="tabular font-semibold">
									<Money value={monthlyAvailable} />
								</span>
								/mês para dívidas.
							</p>
						)}
					</div>
					<div>
						<div className="text-[12px] font-semibold uppercase tracking-wider text-white/65">
							Progresso geral
						</div>
						<div className="tabular mt-3 text-[40px] font-bold leading-none">
							{dashboard?.progressPercent ?? 0}%
						</div>
						<div className="mt-4">
							<ProgressBar tone="white" value={dashboard?.progressPercent ?? 0} />
						</div>
					</div>
				</div>
				<div className="mt-6">
					<Badge tone="success" dot>
						Estratégia: começar pela menor dívida
					</Badge>
				</div>
			</Card>

			<div className="mt-10">
				<h2 className="text-[16px] font-bold tracking-tight text-[var(--color-ink)]">
					Linha do tempo
				</h2>
				<p className="mt-1 text-[13px] text-[var(--color-ink-2)]">
					Ordem sugerida para quitar suas dívidas — a menor primeiro para você sentir progresso
					rápido.
				</p>

				{sorted.length === 0 ? (
					<div className="mt-5">
						<Empty title="Nada para planejar" description="Você não tem dívidas ativas." />
					</div>
				) : (
					<ol className="mt-6 flex flex-col">
						{sorted.map((d, i) => {
							const remaining = d.totalAmount - d.amountPaid;
							const isCurrent = i === 0;
							return (
								<li key={d.id} className="flex gap-5">
									<div className="flex w-10 flex-col items-center">
										<div
											className={cn(
												"flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold",
												isCurrent
													? "bg-[var(--color-teal)] text-white"
													: "border border-[var(--color-border)] bg-white text-[var(--color-ink-2)]",
											)}
										>
											{i + 1}
										</div>
										{i < sorted.length - 1 ? (
											<div className="w-px flex-1 bg-[var(--color-border)]" />
										) : null}
									</div>
									<div className="mb-6 flex-1">
										<div className="flex items-center gap-2">
											<div className="text-[15px] font-bold text-[var(--color-ink)]">
												{d.creditor}
											</div>
											{isCurrent ? (
												<Badge tone="warning" dot>
													Próximo passo
												</Badge>
											) : null}
										</div>
										<div className="mt-1 text-[13px] text-[var(--color-ink-2)]">
											Pagar{" "}
											<span className="tabular font-semibold text-[var(--color-ink)]">
												<Money value={remaining} />
											</span>
										</div>
									</div>
								</li>
							);
						})}
					</ol>
				)}
			</div>

			<Card className="mt-10 p-6">
				<div className="text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
					Como o plano foi montado
				</div>
				<p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
					Consideramos renda líquida, despesas fixas e a menor dívida primeiro para acelerar a
					sensação de progresso. Quando você completa cada passo, o plano se ajusta automaticamente.
				</p>
			</Card>
		</>
	);
}
