/**
 * Spec: Fase 3 §7.6 — computeNetMonthlyIncome.
 *
 * Resolve DT-08: orquestrador NestJS antes apenas somava `amount` de
 * todas as Income. Implementacao correta respeita `frequency` (v2.1):
 * - recurring   → conta sempre (salario, aposentadoria)
 * - installment → conta apenas se referenceMonth coincide com parcela esperada
 * - one_time    → conta apenas se dueDate cai dentro de referenceMonth
 * - irregular   → usa guaranteedAmount (piso) * 0.7 como prudencial
 *
 * Funcao pura — recebe `referenceMonth` e a lista ja carregada.
 */

export type IncomeFrequency = "recurring" | "installment" | "one_time" | "irregular";
export type IncomeStability = "stable" | "variable" | "seasonal";

export interface AggregateIncomeInput {
	id: string;
	amount: number;
	frequency: IncomeFrequency;
	dueDate?: Date | null; // base para one_time / primeira parcela
	installments?: number | null; // total de parcelas (installment)
	installmentAmount?: number | null;
	guaranteedAmount?: number | null;
	stabilityType?: IncomeStability;
}

export interface AggregateIncomeOptions {
	referenceMonth: Date; // primeiro dia do mes em UTC
	irregularPrudentialRatio?: number; // default 0.7
}

export interface IncomeContribution {
	id: string;
	amount: number;
	reason: "recurring" | "installment_due" | "one_time_due" | "irregular_prudential" | "skipped";
}

const DEFAULT_IRREGULAR_RATIO = 0.7;

export function aggregateMonthlyIncome(
	incomes: AggregateIncomeInput[],
	options: AggregateIncomeOptions,
): { total: number; contributions: IncomeContribution[] } {
	const contributions: IncomeContribution[] = [];

	for (const income of incomes) {
		const c = contributionFor(income, options);
		contributions.push(c);
	}

	const total = contributions.reduce((acc, c) => acc + c.amount, 0);
	return { total, contributions };
}

function contributionFor(
	income: AggregateIncomeInput,
	options: AggregateIncomeOptions,
): IncomeContribution {
	switch (income.frequency) {
		case "recurring":
			return { id: income.id, amount: income.amount, reason: "recurring" };

		case "installment":
			return installmentContribution(income, options);

		case "one_time":
			return oneTimeContribution(income, options);

		case "irregular":
			return irregularContribution(income, options);
	}
}

function installmentContribution(
	income: AggregateIncomeInput,
	options: AggregateIncomeOptions,
): IncomeContribution {
	const installments = income.installments ?? 0;
	if (installments <= 0 || !income.dueDate || !income.installmentAmount) {
		return { id: income.id, amount: 0, reason: "skipped" };
	}

	const startMonth = monthIndex(income.dueDate);
	const currentMonth = monthIndex(options.referenceMonth);
	const offset = currentMonth - startMonth;

	if (offset >= 0 && offset < installments) {
		return {
			id: income.id,
			amount: income.installmentAmount,
			reason: "installment_due",
		};
	}

	return { id: income.id, amount: 0, reason: "skipped" };
}

function oneTimeContribution(
	income: AggregateIncomeInput,
	options: AggregateIncomeOptions,
): IncomeContribution {
	if (!income.dueDate) {
		return { id: income.id, amount: 0, reason: "skipped" };
	}

	if (monthIndex(income.dueDate) === monthIndex(options.referenceMonth)) {
		return { id: income.id, amount: income.amount, reason: "one_time_due" };
	}

	return { id: income.id, amount: 0, reason: "skipped" };
}

function irregularContribution(
	income: AggregateIncomeInput,
	options: AggregateIncomeOptions,
): IncomeContribution {
	const ratio = options.irregularPrudentialRatio ?? DEFAULT_IRREGULAR_RATIO;
	const baseAmount = income.guaranteedAmount ?? income.amount;
	const prudential = baseAmount * ratio;

	return {
		id: income.id,
		amount: prudential,
		reason: "irregular_prudential",
	};
}

function monthIndex(date: Date): number {
	return date.getUTCFullYear() * 12 + date.getUTCMonth();
}
