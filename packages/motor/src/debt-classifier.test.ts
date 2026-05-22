import { describe, expect, it } from "vitest";
import {
	type DebtCategoryDefaults,
	type InterestRateReference,
	classifyDebt,
} from "./debt-classifier";

const creditCardCat: DebtCategoryDefaults = {
	slug: "credit_card",
	affectsSurvivalDefault: false,
	affectsIncomeDefault: false,
	hasLegalRiskDefault: false,
};

const mortgageCat: DebtCategoryDefaults = {
	slug: "mortgage",
	affectsSurvivalDefault: true,
	affectsIncomeDefault: false,
	hasLegalRiskDefault: true,
};

describe("classifyDebt", () => {
	it("aplica defaults da categoria", () => {
		const r = classifyDebt({ categorySlug: "mortgage" }, mortgageCat);
		expect(r.affectsSurvival).toBe(true);
		expect(r.hasLegalRisk).toBe(true);
	});

	it("declaracao do usuario tem precedencia", () => {
		const r = classifyDebt(
			{ categorySlug: "credit_card", affectsSurvival: true, dataConfidence: "high" },
			creditCardCat,
		);
		expect(r.affectsSurvival).toBe(true);
		expect(r.dataConfidence).toBe("high");
	});

	it("usa juros declarados pelo usuario quando presentes", () => {
		const r = classifyDebt(
			{ categorySlug: "credit_card", interestRateMonthly: 0.12 },
			creditCardCat,
		);
		expect(r.interestRateMonthly).toBe(0.12);
		expect(r.interestRateSource).toBe("user_provided");
		expect(r.interestClass).toBe("high");
	});

	it("usa InterestRateReference quando user nao declara", () => {
		const ref: InterestRateReference = { monthlyRateMedian: 0.08, source: "BCB" };
		const r = classifyDebt({ categorySlug: "credit_card" }, creditCardCat, ref);
		expect(r.interestRateMonthly).toBe(0.08);
		expect(r.interestRateSource).toBe("market_reference");
		expect(r.dataConfidence).toBe("low");
		expect(r.interestClass).toBe("high");
	});

	it("sem rate nem ref => unknown", () => {
		const r = classifyDebt({ categorySlug: "credit_card" }, creditCardCat);
		expect(r.interestRateMonthly).toBeNull();
		expect(r.interestRateSource).toBe("unknown");
		expect(r.interestClass).toBe("unknown");
	});

	it("classifica faixas de juros corretamente", () => {
		const low = classifyDebt({ categorySlug: "x", interestRateMonthly: 0.01 }, creditCardCat);
		const med = classifyDebt({ categorySlug: "x", interestRateMonthly: 0.03 }, creditCardCat);
		const high = classifyDebt({ categorySlug: "x", interestRateMonthly: 0.1 }, creditCardCat);
		expect(low.interestClass).toBe("low");
		expect(med.interestClass).toBe("medium");
		expect(high.interestClass).toBe("high");
	});
});
