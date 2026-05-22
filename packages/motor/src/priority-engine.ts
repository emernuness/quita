import type { ActionType, FinancialState } from "./types";

/**
 * Spec: Fase 3 §8 (priority-engine) + Fase 2 §3.12 (ScoringWeight).
 *
 * Pesos vivem em tabela `ScoringWeight` (config como dado). Esta funcao
 * recebe os pesos ja consultados para manter pureza.
 */
export interface ScoringWeights {
	[factorKey: string]: { weight: number; isPositive: boolean };
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
	risco_moradia: { weight: 30, isPositive: true },
	risco_renda: { weight: 25, isPositive: true },
	risco_legal: { weight: 25, isPositive: true },
	risco_servico_essencial: { weight: 20, isPositive: true },
	juros_mensal_normalizado: { weight: 15, isPositive: true },
	dias_atraso_normalizado: { weight: 10, isPositive: true },
	parcelas_em_atraso_normalizado: { weight: 12, isPositive: true },
	desconto_disponivel_sustentavel: { weight: 10, isPositive: true },
	valor_pequeno_quitavel: { weight: 8, isPositive: true },
	parcela_insustentavel: { weight: 30, isPositive: false },
	acordo_sem_folga: { weight: 20, isPositive: false },
};

export interface ClassifiedDebt {
	id: string;
	totalAmount: number;
	amountPaid: number;
	monthlyAmount: number | null;
	hasInterest: boolean;
	interestRateMonthly: number | null;
	daysOverdue: number;
	installmentsOverdue: number | null;
	affectsSurvival: boolean;
	affectsIncome: boolean;
	hasLegalRisk: boolean;
	collateralType: "none" | "vehicle" | "property" | "salary" | "other" | null;
	settlementCashAmount: number | null;
	settlementInstallmentAmount: number | null;
}

export interface ScoringContext {
	safeCapacity: number;
	financialState: FinancialState;
}

export interface FactorContribution {
	factorKey: string;
	rawValue: number;
	weight: number;
	contribution: number;
}

export interface PriorityScoreOutput {
	debtId: string;
	score: number;
	reason: string;
	topFactors: FactorContribution[];
}

const CONTRIBUTION_THRESHOLD = 0.5;

export function calculatePriority(
	debt: ClassifiedDebt,
	context: ScoringContext,
	weights: ScoringWeights = DEFAULT_WEIGHTS,
): PriorityScoreOutput {
	const factors: Record<string, number> = {
		risco_moradia: calcRiscoMoradia(debt),
		risco_renda: debt.affectsIncome ? 1 : 0,
		risco_legal: debt.hasLegalRisk ? 1 : 0,
		risco_servico_essencial: debt.affectsSurvival && !debt.collateralType ? 0.6 : 0,
		juros_mensal_normalizado: calcJurosNormalizado(debt),
		dias_atraso_normalizado: Math.min(debt.daysOverdue / 90, 1),
		parcelas_em_atraso_normalizado: Math.min((debt.installmentsOverdue ?? 0) / 3, 1),
		desconto_disponivel_sustentavel: calcDescontoSustentavel(debt, context),
		valor_pequeno_quitavel: calcValorPequenoQuitavel(debt, context),
		parcela_insustentavel: calcParcelaInsustentavel(debt, context),
		acordo_sem_folga: calcAcordoSemFolga(debt, context),
	};

	let score = 0;
	const contributions: FactorContribution[] = [];

	for (const [key, rawValue] of Object.entries(factors)) {
		const w = weights[key];
		if (!w) continue;
		const contribution = rawValue * w.weight * (w.isPositive ? 1 : -1);
		score += contribution;
		if (Math.abs(contribution) > CONTRIBUTION_THRESHOLD) {
			contributions.push({ factorKey: key, rawValue, weight: w.weight, contribution });
		}
	}

	const top2 = contributions
		.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
		.slice(0, 2);

	return {
		debtId: debt.id,
		score,
		reason: formatReason(top2, debt),
		topFactors: top2,
	};
}

export function calculatePriorityBatch(
	debts: ClassifiedDebt[],
	context: ScoringContext,
	weights: ScoringWeights = DEFAULT_WEIGHTS,
): PriorityScoreOutput[] {
	return debts.map((d) => calculatePriority(d, context, weights)).sort((a, b) => b.score - a.score);
}

function calcRiscoMoradia(d: ClassifiedDebt): number {
	if (d.affectsSurvival && d.collateralType === "property") return 1;
	if (d.affectsSurvival) return 0.6;
	return 0;
}

function calcJurosNormalizado(d: ClassifiedDebt): number {
	if (!d.interestRateMonthly) return 0;
	return Math.min(d.interestRateMonthly / 0.15, 1); // 15% a.m. = teto
}

function calcParcelaInsustentavel(d: ClassifiedDebt, ctx: ScoringContext): number {
	const parcela = d.monthlyAmount ?? 0;
	if (parcela === 0 || ctx.safeCapacity <= 0) return 0;
	const ratio = parcela / ctx.safeCapacity;
	if (ratio > 0.5) return 1;
	if (ratio > 0.3) return 0.5;
	return 0;
}

function calcValorPequenoQuitavel(d: ClassifiedDebt, ctx: ScoringContext): number {
	const restante = d.totalAmount - d.amountPaid;
	if (ctx.safeCapacity <= 0) return 0;
	if (restante <= ctx.safeCapacity * 0.8) return 1; // quita este mes
	if (restante <= ctx.safeCapacity * 2) return 0.5; // 2 meses
	return 0;
}

function calcDescontoSustentavel(d: ClassifiedDebt, ctx: ScoringContext): number {
	const cash = d.settlementCashAmount;
	if (!cash) return 0;
	const restante = d.totalAmount - d.amountPaid;
	if (restante <= 0) return 0;
	const discount = 1 - cash / restante;
	if (discount < 0.2) return 0;
	if (cash > ctx.safeCapacity * 3) return 0; // nao cabe nem em 3 meses
	return Math.min(discount, 1);
}

function calcAcordoSemFolga(d: ClassifiedDebt, ctx: ScoringContext): number {
	const parcela = d.settlementInstallmentAmount;
	if (!parcela || ctx.safeCapacity <= 0) return 0;
	const ratio = parcela / ctx.safeCapacity;
	if (ratio > 0.7) return 1;
	if (ratio > 0.5) return 0.6;
	return 0;
}

const FACTOR_LABELS: Record<string, string> = {
	risco_moradia: "risco de perder a moradia",
	risco_renda: "risco de perder a fonte de renda",
	risco_legal: "risco de ação judicial",
	risco_servico_essencial: "risco de corte de serviço essencial",
	juros_mensal_normalizado: "juros altos",
	dias_atraso_normalizado: "atraso significativo",
	parcelas_em_atraso_normalizado: "parcelas atrasadas",
	desconto_disponivel_sustentavel: "acordo com desconto disponível",
	valor_pequeno_quitavel: "pode ser quitada rapidamente",
	parcela_insustentavel: "parcela compromete o orçamento",
	acordo_sem_folga: "acordo atual não cabe",
};

function formatReason(top: FactorContribution[], debt: ClassifiedDebt): string {
	if (top.length === 0) return "Prioridade padrão por categoria.";

	const labelFor = (key: string): string => {
		if (key === "juros_mensal_normalizado" && debt.interestRateMonthly) {
			return `juros altos (${(debt.interestRateMonthly * 100).toFixed(1)}% ao mês)`;
		}
		if (key === "dias_atraso_normalizado") {
			return `${debt.daysOverdue} dias em atraso`;
		}
		if (key === "parcelas_em_atraso_normalizado" && debt.installmentsOverdue) {
			return `${debt.installmentsOverdue} parcelas atrasadas`;
		}
		return FACTOR_LABELS[key] ?? key;
	};

	const main = labelFor(top[0].factorKey);
	if (top.length === 1) return `${capitalize(main)}.`;

	const secondary = labelFor(top[1].factorKey);
	return `${capitalize(main)} e ${secondary}.`;
}

function capitalize(s: string): string {
	return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
