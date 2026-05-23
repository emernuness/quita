/**
 * Cenarios canonicos (Fase 3 §18.4 + Fase 1 §8.x):
 *
 * 8 personas que validam o motor ponta a ponta. Cada uma tem perfil
 * financeiro distinto e estado/modo esperado.
 *
 * Resolve DT-18.
 */

import { describe, expect, it } from "vitest";
import { type MonthlyPlanGeneratorInput, generateMonthlyPlan } from "./monthly-plan-generator";
import type { ClassifiedDebt } from "./priority-engine";

const refDate = new Date(Date.UTC(2026, 4, 1));

function ctx(): MonthlyPlanGeneratorInput["context"] {
	return {
		userId: "u",
		referenceMonth: refDate,
		triggerEvent: "manual_recalc",
		triggeredAt: refDate,
		now: refDate,
	};
}

function debt(over: Partial<ClassifiedDebt>): ClassifiedDebt {
	return {
		id: over.id ?? "d",
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
		...over,
	};
}

describe("cenario canonico — Maria (saudavel com dividas)", () => {
	it("classifica healthy_with_debt + modo payoff", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 8000,
				essentials: [{ amount: 2500 }],
				seasonalExpenses: [],
				incomeProtective: [{ amount: 500 }],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [
				debt({ id: "cartao", totalAmount: 3000, monthlyAmount: 300, interestRateMonthly: 0.13 }),
			],
			debtsTotalMonthlyAmount: 300,
			debtsTotalRemaining: 3000,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "detailed",
			preferredStrategy: "avalanche",
			smallDebtsCount: 0,
			highInterestDebtsCount: 1,
		});
		expect(r.data.financialState).toBe("healthy_with_debt");
		expect(r.data.operationMode).toBe("payoff");
		expect(r.data.strategy).toBe("avalanche");
	});
});

describe("cenario canonico — Joao (orcamento apertado)", () => {
	it("classifica tight_budget + stabilization", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 3500,
				essentials: [{ amount: 3150 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [debt({ id: "cartao", monthlyAmount: 200, interestRateMonthly: 0.13 })],
			debtsTotalMonthlyAmount: 200,
			debtsTotalRemaining: 1000,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "basic",
			preferredStrategy: null,
			smallDebtsCount: 1,
			highInterestDebtsCount: 1,
		});
		expect(r.data.financialState).toBe("tight_budget");
		expect(r.data.operationMode).toBe("stabilization");
	});
});

describe("cenario canonico — Pedro (deficit mensal)", () => {
	it("classifica monthly_deficit + crisis_mode + crisis strategy", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 2500,
				essentials: [{ amount: 2800 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [debt({ id: "cartao", monthlyAmount: 100 })],
			debtsTotalMonthlyAmount: 100,
			debtsTotalRemaining: 500,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "basic",
			preferredStrategy: "snowball",
			smallDebtsCount: 1,
			highInterestDebtsCount: 0,
		});
		expect(r.data.financialState).toBe("monthly_deficit");
		expect(r.data.operationMode).toBe("crisis_mode");
		expect(r.data.strategy).toBe("crisis");
	});
});

describe("cenario canonico — Ana (superendividada por parcelas > 70%)", () => {
	it("classifica overindebtedness + protection", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 3000,
				essentials: [{ amount: 1500 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [debt({ id: "cartao", monthlyAmount: 2200, interestRateMonthly: 0.13 })],
			debtsTotalMonthlyAmount: 2200, // 73% da renda
			debtsTotalRemaining: 20000,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "basic",
			preferredStrategy: null,
			smallDebtsCount: 0,
			highInterestDebtsCount: 1,
		});
		expect(r.data.financialState).toBe("overindebtedness");
		expect(r.data.operationMode).toBe("protection");
	});
});

describe("cenario canonico — Carlos (insolvencia pratica)", () => {
	it("classifica practical_insolvency + survival, sem pay/negotiate", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 800,
				essentials: [{ amount: 1200 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [debt({ id: "cartao", monthlyAmount: 100 })],
			debtsTotalMonthlyAmount: 100,
			debtsTotalRemaining: 5000,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "minimal",
			preferredStrategy: null,
			smallDebtsCount: 1,
			highInterestDebtsCount: 0,
		});
		expect(r.data.financialState).toBe("practical_insolvency");
		expect(r.data.operationMode).toBe("survival");
		for (const action of r.data.actions) {
			expect(["pay", "negotiate"]).not.toContain(action.actionType);
		}
	});
});

describe("cenario canonico — Lucia (sem renda — insolvencia automatica)", () => {
	it("renda 0 → practical_insolvency", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 0,
				essentials: [{ amount: 500 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [],
			debtsTotalMonthlyAmount: 0,
			debtsTotalRemaining: 0,
			hasCriticalRiskDebt: false,
			diagnosisLevel: "minimal",
			preferredStrategy: null,
			smallDebtsCount: 0,
			highInterestDebtsCount: 0,
		});
		expect(r.data.financialState).toBe("practical_insolvency");
	});
});

describe("cenario canonico — Roberto (saudavel com divida de moradia critica)", () => {
	it("upgrade defensivo para tight_budget mesmo com folga", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 10000,
				essentials: [{ amount: 3000 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [
				debt({
					id: "financiamento",
					totalAmount: 200000,
					monthlyAmount: 1500,
					affectsSurvival: true,
					collateralType: "property",
					interestRateMonthly: 0.01,
				}),
			],
			debtsTotalMonthlyAmount: 1500, // 15% — abaixo do criterio rapido
			debtsTotalRemaining: 200000,
			hasCriticalRiskDebt: true, // moradia
			diagnosisLevel: "detailed",
			preferredStrategy: null,
			smallDebtsCount: 0,
			highInterestDebtsCount: 0,
		});
		// Capacidade alta → seria healthy, mas critical_risk faz tight_budget defensivo
		expect(r.data.financialState).toBe("tight_budget");
	});
});

describe("cenario canonico — Beatriz (estrutural — 60 meses)", () => {
	it("dividas grandes que nao cabem em 60 meses → overindebtedness", () => {
		const r = generateMonthlyPlan({
			context: ctx(),
			capacity: {
				incomeNetMonthly: 4000,
				essentials: [{ amount: 1500 }],
				seasonalExpenses: [],
				incomeProtective: [],
				legals: [],
				minimumVitalRegional: 1320,
			},
			debts: [
				debt({ id: "cartao", monthlyAmount: 500, totalAmount: 200000, interestRateMonthly: 0.13 }),
			],
			debtsTotalMonthlyAmount: 500, // 12% — passa criterio rapido
			debtsTotalRemaining: 200000, // mas nao cabe em 60 meses na capacidade
			hasCriticalRiskDebt: false,
			diagnosisLevel: "detailed",
			preferredStrategy: null,
			smallDebtsCount: 0,
			highInterestDebtsCount: 1,
		});
		expect(r.data.financialState).toBe("overindebtedness");
	});
});
