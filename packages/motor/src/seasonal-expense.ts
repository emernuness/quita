/**
 * Spec: Fase 3 §13 — seasonal-expense-service.
 *
 * Calcula `monthlyProvision` para despesas nao-mensais. A ideia eh
 * suavizar despesa esporadica (IPTU/IPVA anual, manutencao semestral)
 * em provisao mensal para nao quebrar o orcamento no mes do vencimento.
 */

export type ExpenseFrequency =
	| "monthly"
	| "bimonthly"
	| "quarterly"
	| "semiannual"
	| "annual"
	| "irregular";

export interface SeasonalExpenseInput {
	frequency: ExpenseFrequency;
	amount: number;
	provisionStartedAt?: Date | null;
	nextOccurrence?: Date | null;
	now: Date; // injetado para determinismo
}

export interface SeasonalProvisionResult {
	monthlyProvision: number;
	monthsRemaining: number | null; // null se nao ha proxima ocorrencia
}

const FREQUENCY_DIVISOR: Record<ExpenseFrequency, number> = {
	monthly: 1,
	bimonthly: 2,
	quarterly: 3,
	semiannual: 6,
	annual: 12,
	irregular: 12, // fallback conservador
};

export function calculateMonthlyProvision(input: SeasonalExpenseInput): SeasonalProvisionResult {
	const baseDivisor = FREQUENCY_DIVISOR[input.frequency];

	if (input.frequency === "monthly") {
		return { monthlyProvision: input.amount, monthsRemaining: null };
	}

	// Se ha proxima ocorrencia conhecida, ajustamos a divisao pelo numero
	// real de meses restantes ate o evento. Isso permite "catch-up": se a
	// pessoa comecou tarde, paga mais por mes ate o vencimento.
	if (input.nextOccurrence) {
		const months = monthsBetween(input.now, input.nextOccurrence);
		if (months > 0) {
			return {
				monthlyProvision: input.amount / months,
				monthsRemaining: months,
			};
		}
	}

	return {
		monthlyProvision: input.amount / baseDivisor,
		monthsRemaining: baseDivisor,
	};
}

function monthsBetween(from: Date, to: Date): number {
	const years = to.getFullYear() - from.getFullYear();
	const months = to.getMonth() - from.getMonth();
	const total = years * 12 + months;
	if (total <= 0) return 0;
	// Ajusta para considerar dia do mes (>= = ja passou)
	if (to.getDate() < from.getDate() && total > 0) return total - 1 + 1; // arredonda
	return total;
}
