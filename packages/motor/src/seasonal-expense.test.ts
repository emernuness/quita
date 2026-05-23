import { describe, expect, it } from "vitest";
import { calculateMonthlyProvision } from "./seasonal-expense";

const now = new Date("2026-05-22T00:00:00Z");

describe("calculateMonthlyProvision", () => {
	it("monthly retorna amount integral, sem provisao", () => {
		const r = calculateMonthlyProvision({ frequency: "monthly", amount: 200, now });
		expect(r.monthlyProvision).toBe(200);
		expect(r.monthsRemaining).toBeNull();
	});

	it("annual sem nextOccurrence divide por 12", () => {
		const r = calculateMonthlyProvision({ frequency: "annual", amount: 1200, now });
		expect(r.monthlyProvision).toBe(100);
		expect(r.monthsRemaining).toBe(12);
	});

	it("semiannual sem nextOccurrence divide por 6", () => {
		const r = calculateMonthlyProvision({ frequency: "semiannual", amount: 600, now });
		expect(r.monthlyProvision).toBe(100);
	});

	it("annual com nextOccurrence em 6 meses faz catch-up (divide por 6)", () => {
		const nextOccurrence = new Date("2026-11-22T00:00:00Z");
		const r = calculateMonthlyProvision({
			frequency: "annual",
			amount: 1200,
			nextOccurrence,
			now,
		});
		// Catch-up: ainda 6 meses ate o evento, divide por 6
		expect(r.monthsRemaining).toBe(6);
		expect(r.monthlyProvision).toBe(200);
	});

	it("nextOccurrence ja passou cai no divisor padrao", () => {
		const nextOccurrence = new Date("2026-01-01T00:00:00Z"); // passou
		const r = calculateMonthlyProvision({
			frequency: "annual",
			amount: 1200,
			nextOccurrence,
			now,
		});
		expect(r.monthlyProvision).toBe(100); // divide por 12
	});
});
