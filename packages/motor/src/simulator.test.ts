import { describe, expect, it } from "vitest";
import { type SimulatorDebt, runSimulation } from "./simulator";

const debt1: SimulatorDebt = {
	id: "d1",
	remainingAmount: 1000,
	interestRateMonthly: 0.02,
	monthlyMinimum: 50,
};

describe("runSimulation", () => {
	it("retorna 3 cenarios", () => {
		const r = runSimulation({
			debts: [debt1],
			safeCapacity: 500,
			strategy: "snowball",
		});
		expect(r.conservative.name).toBe("conservative");
		expect(r.optimized.name).toBe("optimized");
		expect(r.accelerated.name).toBe("accelerated");
	});

	it("accelerated paga em menos meses que conservative", () => {
		const r = runSimulation({
			debts: [debt1],
			safeCapacity: 500,
			strategy: "snowball",
		});
		expect(r.accelerated.estimatedMonths).toBeLessThanOrEqual(
			r.conservative.estimatedMonths ?? Number.POSITIVE_INFINITY,
		);
	});

	it("retorna null quando nao paga em 120 meses", () => {
		const r = runSimulation({
			debts: [{ id: "d1", remainingAmount: 100000, interestRateMonthly: 0.1, monthlyMinimum: 10 }],
			safeCapacity: 20,
			strategy: "snowball",
		});
		expect(r.conservative.estimatedMonths).toBeNull();
	});

	it("retorna 0 contribution quando safeCapacity <= 0", () => {
		const r = runSimulation({
			debts: [debt1],
			safeCapacity: 0,
			strategy: "snowball",
		});
		expect(r.conservative.monthlyContribution).toBe(0);
		expect(r.conservative.estimatedMonths).toBeNull();
	});

	it("estrategia avalanche prioriza juros altos", () => {
		const debts: SimulatorDebt[] = [
			{ id: "small", remainingAmount: 500, interestRateMonthly: 0.01, monthlyMinimum: 50 },
			{ id: "big_juros", remainingAmount: 1000, interestRateMonthly: 0.1, monthlyMinimum: 50 },
		];
		const rAvalanche = runSimulation({ debts, safeCapacity: 200, strategy: "avalanche" });
		const rSnowball = runSimulation({ debts, safeCapacity: 200, strategy: "snowball" });
		// Avalanche economiza mais em juros para essa carteira
		expect(rAvalanche.optimized.totalInterestPaid).toBeLessThan(
			rSnowball.optimized.totalInterestPaid,
		);
	});

	it("eh deterministico", () => {
		const input = { debts: [debt1], safeCapacity: 500, strategy: "snowball" as const };
		expect(runSimulation(input)).toEqual(runSimulation(input));
	});
});
