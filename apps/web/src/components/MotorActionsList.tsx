"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { Money } from "@/components/Money";
import type { ActionType, MotorPlanAction } from "@/hooks/useMotorPlan";

const ACTION_LABELS: Record<ActionType, string> = {
	pay: "Pagar",
	negotiate: "Negociar",
	pause: "Pausar",
	cut: "Cortar",
	wait: "Aguardar",
	review: "Revisar",
	refuse: "Recusar",
	monitor: "Monitorar",
};

const ACTION_TONE: Record<ActionType, "neutral" | "info" | "warning" | "success"> = {
	pay: "success",
	negotiate: "info",
	pause: "warning",
	cut: "warning",
	wait: "neutral",
	review: "info",
	refuse: "warning",
	monitor: "neutral",
};

export function MotorActionsList({ actions }: { actions: MotorPlanAction[] }) {
	if (actions.length === 0) {
		return (
			<Empty title="Sem ações por enquanto" description="Volte aqui após cadastrar mais dados." />
		);
	}

	return (
		<div className="space-y-3">
			{actions.map((a) => (
				<Card key={a.id} className="p-5">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
									#{a.order}
								</span>
								<Badge tone={ACTION_TONE[a.actionType]}>{ACTION_LABELS[a.actionType]}</Badge>
							</div>
							<div className="mt-1 text-[16px] font-semibold">{a.targetLabel}</div>
							<p className="mt-1 text-[13px] text-[var(--color-ink-3)]">{a.reason}</p>
						</div>
						{a.amount !== null && (
							<div className="text-right">
								<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
									Valor
								</div>
								<div className="text-[16px] font-semibold tabular">
									<Money value={a.amount} />
								</div>
							</div>
						)}
					</div>
				</Card>
			))}
		</div>
	);
}
