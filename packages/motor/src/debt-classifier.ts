import type { ConfidenceLevel } from "./types";

/**
 * Spec: Fase 3 §6 — debt-classification-service.
 *
 * Funcao pura. Orquestrador busca o categoryDefaults + interestRateRef
 * antes de chamar.
 */

export type InterestClass = "high" | "medium" | "low" | "unknown";
export type RateSource = "user_provided" | "market_reference" | "unknown";

export interface DebtCategoryDefaults {
	slug: string;
	affectsSurvivalDefault: boolean;
	affectsIncomeDefault: boolean;
	hasLegalRiskDefault: boolean;
}

export interface InterestRateReference {
	monthlyRateMedian: number;
	source: string;
}

export interface RawDebt {
	categorySlug: string;
	affectsSurvival?: boolean | null;
	affectsIncome?: boolean | null;
	hasLegalRisk?: boolean | null;
	interestRateMonthly?: number | null;
	dataConfidence?: ConfidenceLevel | null;
}

export interface ClassifiedDebtMeta {
	affectsSurvival: boolean;
	affectsIncome: boolean;
	hasLegalRisk: boolean;
	interestClass: InterestClass;
	interestRateMonthly: number | null;
	interestRateSource: RateSource;
	dataConfidence: ConfidenceLevel;
}

const HIGH_INTEREST_THRESHOLD = 0.05; // > 5% a.m.
const MEDIUM_INTEREST_THRESHOLD = 0.02; // 2-5% a.m.

export function classifyDebt(
	debt: RawDebt,
	categoryDefaults: DebtCategoryDefaults,
	interestRef: InterestRateReference | null = null,
): ClassifiedDebtMeta {
	const affectsSurvival = debt.affectsSurvival ?? categoryDefaults.affectsSurvivalDefault;
	const affectsIncome = debt.affectsIncome ?? categoryDefaults.affectsIncomeDefault;
	const hasLegalRisk = debt.hasLegalRisk ?? categoryDefaults.hasLegalRiskDefault;

	let interestRateMonthly = debt.interestRateMonthly ?? null;
	let interestRateSource: RateSource;
	let dataConfidence: ConfidenceLevel;

	if (debt.interestRateMonthly !== null && debt.interestRateMonthly !== undefined) {
		interestRateSource = "user_provided";
		dataConfidence = debt.dataConfidence ?? "high";
	} else if (interestRef) {
		interestRateMonthly = interestRef.monthlyRateMedian;
		interestRateSource = "market_reference";
		dataConfidence = "low";
	} else {
		interestRateSource = "unknown";
		dataConfidence = debt.dataConfidence ?? "low";
	}

	const interestClass = classifyInterest(interestRateMonthly);

	return {
		affectsSurvival,
		affectsIncome,
		hasLegalRisk,
		interestClass,
		interestRateMonthly,
		interestRateSource,
		dataConfidence,
	};
}

function classifyInterest(rate: number | null): InterestClass {
	if (rate === null) return "unknown";
	if (rate > HIGH_INTEREST_THRESHOLD) return "high";
	if (rate >= MEDIUM_INTEREST_THRESHOLD) return "medium";
	return "low";
}
