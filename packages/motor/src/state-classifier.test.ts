import { describe, expect, it } from "vitest";
import { classifyState } from "./state-classifier";
import type { CapacityBreakdown } from "./types";

function makeCapacity(overrides: Partial<CapacityBreakdown> = {}): CapacityBreakdown {
	return {
		incomeNetMonthly: 5000,
		essentialsTotal: 1500,
		seasonalProvisionTotal: 100,
		incomeProtectiveTotal: 0,
		legalsTotal: 0,
		minimumVital: 1320,
		operationalReserve: 250,
		emergencyReserveContribution: 0,
		safeCapacity: 3150,
		...overrides,
	};
}

describe("classifyState", () => {
	describe("practical_insolvency", () => {
		it("classifica quando renda < minimo vital regional", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 1000, minimumVital: 1320 }),
				debtsTotalMonthlyAmount: 0,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("practical_insolvency");
			expect(result.mode).toBe("survival");
		});
	});

	describe("overindebtedness", () => {
		it("classifica quando dividas mensais > 70% da renda", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 3000 }),
				debtsTotalMonthlyAmount: 2200, // 73%
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("overindebtedness");
			expect(result.mode).toBe("protection");
		});

		it("nao classifica quando dividas <= 70%", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 3000, safeCapacity: 600 }),
				debtsTotalMonthlyAmount: 2000, // 66%
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).not.toBe("overindebtedness");
		});
	});

	describe("monthly_deficit", () => {
		it("classifica quando safeCapacity < 0", () => {
			const result = classifyState({
				capacity: makeCapacity({ safeCapacity: -200 }),
				debtsTotalMonthlyAmount: 0,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("monthly_deficit");
			expect(result.mode).toBe("crisis_mode");
		});
	});

	describe("tight_budget", () => {
		it("classifica quando safeCapacity < 10% da renda", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 5000, safeCapacity: 400 }), // 8%
				debtsTotalMonthlyAmount: 100,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("tight_budget");
			expect(result.mode).toBe("stabilization");
		});

		it("upgrade defensivo: divida critica forca tight_budget mesmo com folga", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 5000, safeCapacity: 2000 }), // 40%
				debtsTotalMonthlyAmount: 100,
				hasCriticalRiskDebt: true,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("tight_budget");
		});
	});

	describe("healthy_with_debt", () => {
		it("classifica quando capacidade >= 15% e sem risco critico", () => {
			const result = classifyState({
				capacity: makeCapacity({ incomeNetMonthly: 5000, safeCapacity: 1500 }), // 30%
				debtsTotalMonthlyAmount: 100,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.state).toBe("healthy_with_debt");
			expect(result.mode).toBe("payoff");
		});
	});

	describe("confidence", () => {
		it("detailed => high", () => {
			const result = classifyState({
				capacity: makeCapacity(),
				debtsTotalMonthlyAmount: 0,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "detailed",
			});
			expect(result.confidence).toBe("high");
		});

		it("basic => medium", () => {
			const result = classifyState({
				capacity: makeCapacity(),
				debtsTotalMonthlyAmount: 0,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic",
			});
			expect(result.confidence).toBe("medium");
		});

		it("minimal => low", () => {
			const result = classifyState({
				capacity: makeCapacity(),
				debtsTotalMonthlyAmount: 0,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "minimal",
			});
			expect(result.confidence).toBe("low");
		});
	});

	describe("determinismo", () => {
		it("mesmos inputs => mesma saida", () => {
			const input = {
				capacity: makeCapacity(),
				debtsTotalMonthlyAmount: 500,
				hasCriticalRiskDebt: false,
				diagnosisLevel: "basic" as const,
			};
			expect(classifyState(input)).toEqual(classifyState(input));
		});
	});
});
