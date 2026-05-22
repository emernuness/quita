"use client";

import { Badge } from "@/components/Badge";
import type { FinancialState, OperationMode } from "@/hooks/useMotorPlan";

const STATE_LABELS: Record<FinancialState, string> = {
	healthy_with_debt: "Saudável com dívidas",
	tight_budget: "Orçamento apertado",
	monthly_deficit: "No vermelho",
	overindebtedness: "Superendividado",
	practical_insolvency: "Insolvência prática",
};

const STATE_TONE: Record<FinancialState, "neutral" | "info" | "warning" | "danger" | "success"> = {
	healthy_with_debt: "success",
	tight_budget: "info",
	monthly_deficit: "warning",
	overindebtedness: "danger",
	practical_insolvency: "danger",
};

const MODE_LABELS: Record<OperationMode, string> = {
	payoff: "Modo Quitação",
	stabilization: "Modo Estabilização",
	crisis_mode: "Modo Crise",
	protection: "Modo Proteção",
	survival: "Modo Sobrevivência",
};

export function MotorStateBadge({
	state,
	mode,
}: {
	state: FinancialState;
	mode: OperationMode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge tone={STATE_TONE[state]}>{STATE_LABELS[state]}</Badge>
			<Badge tone="neutral">{MODE_LABELS[mode]}</Badge>
		</div>
	);
}

export function getStateLabel(state: FinancialState): string {
	return STATE_LABELS[state];
}

export function getModeLabel(mode: OperationMode): string {
	return MODE_LABELS[mode];
}
