import { describe, expect, it } from "vitest";
import { calculateCapacity } from "./capacity-calculator";

describe("calculateCapacity", () => {
	it("subtrai essenciais, provisao sazonal, proteccao e legais", () => {
		const result = calculateCapacity({
			incomeNetMonthly: 5000,
			essentials: [{ amount: 1500 }, { amount: 500 }],
			seasonalExpenses: [{ amount: 0, monthlyProvision: 200 }],
			incomeProtective: [{ amount: 300 }],
			legals: [{ amount: 400 }],
			minimumVitalRegional: 1320,
			operationalReserveRatio: 0.05,
			emergencyReserveMonthlyTarget: 0,
		});

		// 5000 - 2000 (essenciais) - 200 (sazonal) - 300 (proteccao) - 400 (legais)
		//      - 250 (5% reserva operacional) - 0 (reserva emergencia)
		expect(result.safeCapacity).toBe(1850);
		expect(result.essentialsTotal).toBe(2000);
		expect(result.seasonalProvisionTotal).toBe(200);
		expect(result.incomeProtectiveTotal).toBe(300);
		expect(result.legalsTotal).toBe(400);
		expect(result.operationalReserve).toBe(250);
		expect(result.minimumVital).toBe(1320);
	});

	it("subtrai reserva de emergencia quando ativa", () => {
		const result = calculateCapacity({
			incomeNetMonthly: 4000,
			essentials: [{ amount: 1500 }],
			seasonalExpenses: [],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 1320,
			emergencyReserveMonthlyTarget: 500,
		});

		// 4000 - 1500 - 200 (5%) - 500 = 1800
		expect(result.safeCapacity).toBe(1800);
		expect(result.emergencyReserveContribution).toBe(500);
	});

	it("usa ratio padrao 5% quando nao informado", () => {
		const result = calculateCapacity({
			incomeNetMonthly: 3000,
			essentials: [],
			seasonalExpenses: [],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 1320,
		});

		expect(result.operationalReserve).toBeCloseTo(150);
		expect(result.safeCapacity).toBeCloseTo(2850);
	});

	it("permite safeCapacity negativo (deficit)", () => {
		const result = calculateCapacity({
			incomeNetMonthly: 2000,
			essentials: [{ amount: 2500 }],
			seasonalExpenses: [],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 1320,
		});

		expect(result.safeCapacity).toBeLessThan(0);
	});

	it("trata listas vazias como zero", () => {
		const result = calculateCapacity({
			incomeNetMonthly: 1000,
			essentials: [],
			seasonalExpenses: [],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 800,
		});
		// Spec Fase 1 §4.2: reserva operacional = max(5% renda, R$ 100).
		// 5% de 1000 = 50, mas floor R$ 100. Logo: 1000 - 100 = 900.
		expect(result.safeCapacity).toBe(900);
	});

	it("eh deterministico — mesmos inputs => mesmo resultado", () => {
		const input = {
			incomeNetMonthly: 5000,
			essentials: [{ amount: 1500 }],
			seasonalExpenses: [{ amount: 0, monthlyProvision: 200 }],
			incomeProtective: [],
			legals: [],
			minimumVitalRegional: 1320,
		};
		const a = calculateCapacity(input);
		const b = calculateCapacity(input);
		expect(a).toEqual(b);
	});
});
