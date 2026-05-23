"use client";

import { Card } from "@/components/Card";
import { Money } from "@/components/Money";
import { MotorStateBadge, getStateLabel } from "@/components/MotorStateBadge";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { useDashboard } from "@/hooks/useDashboard";
import { useDebts } from "@/hooks/useDebts";
import { useEmergencyReserve } from "@/hooks/useEmergencyReserve";
import { useGoals } from "@/hooks/useGoals";
import { useMotorPlan } from "@/hooks/useMotorPlan";
import {
	AlertCircle,
	CheckCircle2,
	CreditCard,
	HeartHandshake,
	PiggyBank,
	Target,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import Link from "next/link";

export default function EspelhoPage() {
	const { data: plan } = useMotorPlan();
	const { data: dashboard } = useDashboard();
	const { data: debts } = useDebts();
	const { data: goals } = useGoals();
	const { data: reserve } = useEmergencyReserve();

	const totalDebt =
		(debts ?? [])
			.filter((d) => d.status !== "paid")
			.reduce((acc, d) => acc + (d.totalAmount - d.amountPaid), 0) ?? 0;
	const debtsCount = (debts ?? []).filter((d) => d.status !== "paid").length;
	const paidDebtsCount = (debts ?? []).filter((d) => d.status === "paid").length;
	const totalPaid = (debts ?? []).reduce((acc, d) => acc + d.amountPaid, 0) ?? 0;
	const reserveCurrent = reserve ? Number(reserve.currentAmount) : 0;
	const reserveTarget = reserve?.targetAmount ? Number(reserve.targetAmount) : 0;

	const activeGoals = (goals ?? []).filter((g) => !g.achievedAt);
	const achievedGoals = (goals ?? []).filter((g) => g.achievedAt);

	return (
		<>
			<PageHeader title="Espelho" subtitle="Sua situação financeira em uma página." />

			{plan && (
				<Card tone="navy" className="card-shadow p-6 mb-6">
					<MotorStateBadge state={plan.financialState} mode={plan.operationMode} />
					<h2 className="mt-3 text-[20px] font-semibold leading-tight">{plan.mainGoal}</h2>
					<div className="grid grid-cols-3 gap-6 mt-5">
						<div>
							<div className="text-[11px] uppercase tracking-wider text-white/65">Renda líq.</div>
							<div className="text-[18px] font-semibold tabular mt-1">
								<Money value={plan.incomeNetMonthly} />
							</div>
						</div>
						<div>
							<div className="text-[11px] uppercase tracking-wider text-white/65">Essenciais</div>
							<div className="text-[18px] font-semibold tabular mt-1">
								<Money value={plan.essentialsTotal} />
							</div>
						</div>
						<div>
							<div className="text-[11px] uppercase tracking-wider text-white/65">Capacidade</div>
							<div className="text-[18px] font-semibold tabular mt-1">
								<Money value={plan.safeCapacity} />
							</div>
						</div>
					</div>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
				<Link href="/app/debts">
					<Card className="p-5 hover:border-[var(--color-teal)] h-full">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-[var(--color-background)] p-2">
								<CreditCard className="w-5 h-5 text-[var(--color-cat-debt)]" />
							</div>
							<div className="flex-1">
								<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
									Dívidas
								</div>
								<div className="text-[24px] font-semibold tabular mt-0.5">
									<Money value={totalDebt} />
								</div>
								<div className="text-[13px] text-[var(--color-ink-3)] mt-1">
									{debtsCount} em aberto · {paidDebtsCount} quitadas · <Money value={totalPaid} />{" "}
									pago
								</div>
							</div>
						</div>
					</Card>
				</Link>

				<Link href="/app/transactions">
					<Card className="p-5 hover:border-[var(--color-teal)] h-full">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-[var(--color-background)] p-2">
								<Wallet className="w-5 h-5 text-[var(--color-cat-expense)]" />
							</div>
							<div className="flex-1">
								<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
									Fluxo mensal
								</div>
								<div className="text-[24px] font-semibold tabular mt-0.5">
									<Money value={dashboard?.surplusForDebts ?? 0} />
								</div>
								<div className="text-[13px] text-[var(--color-ink-3)] mt-1">
									{dashboard && dashboard.surplusForDebts > 0 ? (
										<>
											<TrendingUp className="inline w-3 h-3" /> sobra após essenciais
										</>
									) : (
										<>
											<TrendingDown className="inline w-3 h-3" /> entradas {"<"} despesas
										</>
									)}
								</div>
							</div>
						</div>
					</Card>
				</Link>

				<Link href="/app/reserva">
					<Card className="p-5 hover:border-[var(--color-teal)] h-full">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-[var(--color-background)] p-2">
								<PiggyBank className="w-5 h-5 text-[var(--color-teal)]" />
							</div>
							<div className="flex-1">
								<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
									Reserva
								</div>
								<div className="text-[24px] font-semibold tabular mt-0.5">
									<Money value={reserveCurrent} />
								</div>
								{reserveTarget > 0 && (
									<div className="mt-2">
										<ProgressBar value={Math.min(100, (reserveCurrent / reserveTarget) * 100)} />
									</div>
								)}
							</div>
						</div>
					</Card>
				</Link>

				<Link href="/app/objetivos">
					<Card className="p-5 hover:border-[var(--color-teal)] h-full">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-[var(--color-background)] p-2">
								<Target className="w-5 h-5 text-[var(--color-cat-balance)]" />
							</div>
							<div className="flex-1">
								<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
									Metas
								</div>
								<div className="text-[24px] font-semibold tabular mt-0.5">{activeGoals.length}</div>
								<div className="text-[13px] text-[var(--color-ink-3)] mt-1">
									{achievedGoals.length > 0 ? (
										<>
											<CheckCircle2 className="inline w-3 h-3" /> {achievedGoals.length} já
											conquistadas
										</>
									) : (
										"ativas"
									)}
								</div>
							</div>
						</div>
					</Card>
				</Link>
			</div>

			{plan && plan.warnings.length > 0 && (
				<Card className="p-5 bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)] border-[var(--color-warning)] mb-6">
					<div className="flex items-start gap-3">
						<AlertCircle className="w-5 h-5 mt-0.5" />
						<div>
							<div className="text-[12px] uppercase tracking-wider font-semibold">Atenção</div>
							<ul className="list-disc list-inside text-[14px] mt-2 space-y-1">
								{plan.warnings.slice(0, 3).map((w, i) => (
									<li key={`${w.slice(0, 30)}-${i}`}>{w}</li>
								))}
							</ul>
						</div>
					</div>
				</Card>
			)}

			<Card className="p-5">
				<div className="flex items-start gap-3">
					<HeartHandshake className="w-5 h-5 text-[var(--color-teal)] mt-0.5" />
					<div>
						<div className="text-[14px] font-semibold">
							Estado atual: {plan ? getStateLabel(plan.financialState) : "—"}
						</div>
						<p className="text-[13px] text-[var(--color-ink-2)] mt-1">
							O Quita atualiza este espelho automaticamente conforme você cadastra dados. Quanto
							mais o motor sabe sobre você, mais precisas ficam as recomendações.
						</p>
						<Link
							href="/app/refinar"
							className="inline-block mt-3 text-[13px] text-[var(--color-teal)] hover:underline"
						>
							Refinar perfil →
						</Link>
					</div>
				</div>
			</Card>
		</>
	);
}
