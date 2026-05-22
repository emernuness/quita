import { describe, expect, it } from "vitest";
import { type MonthlyPlanGeneratorInput, generateMonthlyPlan } from "./monthly-plan-generator";
import type { ClassifiedDebt } from "./priority-engine";

function makeDebt(overrides: Partial<ClassifiedDebt> = {}): ClassifiedDebt {
	return {
		id: "d1",
		totalAmount: 1000,
		amountPaid: 0,
		monthlyAmount: 100,
		hasInterest: false,
		interestRateMonthly: null,
		daysOverdue: 0,
		installmentsOverdue: 0,
		affectsSurvival: false,
		affectsIncome: false,
		hasLegalRisk: false,
		collateralType: null,
		settlementCashAmount: null,
		settlementInstallmentAmount: null,
		...overrides,
	};
}

function makeInput(overrides: Partial<MonthlyPlanGeneratorInput> = {}): MonthlyPlanGeneratorInput {
	return {
		context: {
			userId: "u1",
			referenceMonth: new Date("2026-05-01"),
			triggerEvent: "manual_recalc",
			triggeredAt: new Date("2026-05-22"),
			now: new Date("2026-05-22"),
		},
		capacity: {
			incomeNetMonthly: 5000,
			essentials: [{ amount: 1500 }],
			seasonalExpenses: [],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 1320,
		},
		debts: [makeDebt()],
		debtsTotalMonthlyAmount: 100,
		debtsTotalRemaining: 1000,
		hasCriticalRiskDebt: false,
		diagnosisLevel: "basic",
		preferredStrategy: null,
		smallDebtsCount: 0,
		highInterestDebtsCount: 0,
		...overrides,
	};
}

describe("generateMonthlyPlan", () => {
	it("gera plano completo para cenario saudavel", () => {
		const r = generateMonthlyPlan(makeInput());
		expect(r.data.financialState).toBe("healthy_with_debt");
		expect(r.data.operationMode).toBe("payoff");
		expect(r.data.capacity.safeCapacity).toBeGreaterThan(0);
		expect(r.data.actions.length).toBeGreaterThan(0);
		expect(r.data.simulation.optimized.estimatedMonths).not.toBeNull();
	});

	it("cenario monthly_deficit gera estrategia crisis", () => {
		const r = generateMonthlyPlan(
			makeInput({
				capacity: {
					incomeNetMonthly: 2000,
					essentials: [{ amount: 2500 }],
					seasonalExpenses: [],
					incomeProtective: [],
					legals: [],
					minimumVitalRegional: 1320,
				},
			}),
		);
		expect(r.data.financialState).toBe("monthly_deficit");
		expect(r.data.strategy).toBe("crisis");
		expect(r.warnings).toContain("Suas saídas obrigatórias estão maiores que sua renda este mês.");
	});

	it("cenario survival nao gera acoes pay/negotiate", () => {
		const r = generateMonthlyPlan(
			makeInput({
				capacity: {
					incomeNetMonthly: 800,
					essentials: [{ amount: 1500 }],
					seasonalExpenses: [],
					incomeProtective: [],
					legals: [],
					minimumVitalRegional: 1320, // renda < minimoVital -> insolvency
				},
			}),
		);
		expect(r.data.financialState).toBe("practical_insolvency");
		expect(r.data.operationMode).toBe("survival");
		for (const action of r.data.actions) {
			expect(["pay", "negotiate"]).not.toContain(action.actionType);
		}
	});

	it("emite warning de baixa confianca em minimal", () => {
		const r = generateMonthlyPlan(makeInput({ diagnosisLevel: "minimal" }));
		expect(r.warnings.some((w) => w.includes("refine"))).toBe(true);
	});

	it("priorities ordenadas por score decrescente", () => {
		const r = generateMonthlyPlan(
			makeInput({
				debts: [
					makeDebt({ id: "low" }),
					makeDebt({ id: "high", hasLegalRisk: true, affectsSurvival: true }),
				],
			}),
		);
		expect(r.data.priorities[0].debtId).toBe("high");
	});

	it("eh deterministico", () => {
		const input = makeInput();
		expect(generateMonthlyPlan(input)).toEqual(generateMonthlyPlan(input));
	});
});
