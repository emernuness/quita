"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { Money } from "@/components/Money";
import { MotorActionsList } from "@/components/MotorActionsList";
import { MotorStateBadge, getStateLabel } from "@/components/MotorStateBadge";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import { useMotorPlan, useRecalculateMotor } from "@/hooks/useMotorPlan";
import { Banknote, RefreshCw, ShieldCheck, Wallet } from "lucide-react";

export default function PlanPage() {
	const { data, isLoading, isError, refetch } = useMotorPlan();
	const recalculate = useRecalculateMotor();

	if (isLoading) {
		return (
			<>
				<PageHeader title="Meu plano" subtitle="Buscando seu plano atual..." />
				<div className="space-y-4">
					<SkeletonCard lines={3} />
					<SkeletonList count={4} />
				</div>
			</>
		);
	}

	if (isError || !data) {
		return (
			<>
				<PageHeader title="Meu plano" subtitle="Não foi possível carregar seu plano." />
				<Card className="p-10 text-center">
					<p className="text-[var(--color-ink-3)] mb-4">Tente recalcular manualmente.</p>
					<Button onClick={() => refetch()}>Tentar novamente</Button>
				</Card>
			</>
		);
	}

	return (
		<>
			<PageHeader title="Meu plano" subtitle={`Estado: ${getStateLabel(data.financialState)}`} />

			<div className="flex justify-end mb-4">
				<Button
					variant="ghost"
					onClick={() => recalculate.mutate()}
					disabled={recalculate.isPending}
				>
					<RefreshCw className="h-4 w-4" />
					{recalculate.isPending ? "Recalculando…" : "Recalcular"}
				</Button>
			</div>

			<Card tone="navy" className="card-shadow p-7 mb-6">
				<MotorStateBadge state={data.financialState} mode={data.operationMode} />
				<h2 className="mt-4 text-[20px] font-semibold leading-tight">{data.mainGoal}</h2>
			</Card>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
				<KpiCard
					label="Renda líquida"
					value={<Money value={data.incomeNetMonthly} />}
					hint="Considerando frequência das fontes"
					accent="income"
					icon={Banknote}
				/>
				<KpiCard
					label="Essenciais"
					value={<Money value={data.essentialsTotal} />}
					hint="Moradia, alimentação, saúde, etc."
					accent="expense"
					icon={Wallet}
				/>
				<KpiCard
					label="Capacidade segura"
					value={<Money value={data.safeCapacity} />}
					hint="Quanto sobra para dívidas + metas"
					accent={data.safeCapacity < 0 ? "overdue" : "balance"}
					icon={ShieldCheck}
				/>
			</div>

			{data.warnings.length > 0 && (
				<Card className="p-5 mb-6 bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)] border-[var(--color-warning)]">
					<div className="text-[12px] uppercase tracking-wider font-semibold mb-2">Atenção</div>
					<ul className="list-disc list-inside text-[14px] space-y-1">
						{data.warnings.map((w, idx) => (
							<li key={`${w.slice(0, 30)}-${idx}`}>{w}</li>
						))}
					</ul>
				</Card>
			)}

			<h3 className="text-[16px] font-semibold mb-3 mt-2">Ações recomendadas</h3>
			<MotorActionsList actions={data.actions} />
		</>
	);
}
