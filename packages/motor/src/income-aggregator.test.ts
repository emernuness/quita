import { describe, expect, it } from "vitest";
import { aggregateMonthlyIncome } from "./income-aggregator";

const may2026 = new Date(Date.UTC(2026, 4, 1));

describe("aggregateMonthlyIncome", () => {
	it("recurring sempre conta", () => {
		const r = aggregateMonthlyIncome([{ id: "i1", amount: 5000, frequency: "recurring" }], {
			referenceMonth: may2026,
		});
		expect(r.total).toBe(5000);
		expect(r.contributions[0].reason).toBe("recurring");
	});

	it("one_time conta apenas no mes do dueDate", () => {
		const r1 = aggregateMonthlyIncome(
			[{ id: "i1", amount: 1500, frequency: "one_time", dueDate: may2026 }],
			{ referenceMonth: may2026 },
		);
		expect(r1.total).toBe(1500);
		expect(r1.contributions[0].reason).toBe("one_time_due");

		const r2 = aggregateMonthlyIncome(
			[{ id: "i1", amount: 1500, frequency: "one_time", dueDate: new Date(Date.UTC(2026, 3, 1)) }],
			{ referenceMonth: may2026 },
		);
		expect(r2.total).toBe(0);
		expect(r2.contributions[0].reason).toBe("skipped");
	});

	it("installment conta durante a janela de parcelas", () => {
		const inputs = [
			{
				id: "13o",
				amount: 5000,
				frequency: "installment" as const,
				dueDate: new Date(Date.UTC(2026, 10, 1)),
				installments: 2,
				installmentAmount: 2500,
			},
		];
		const novemberR = aggregateMonthlyIncome(inputs, {
			referenceMonth: new Date(Date.UTC(2026, 10, 1)),
		});
		const decemberR = aggregateMonthlyIncome(inputs, {
			referenceMonth: new Date(Date.UTC(2026, 11, 1)),
		});
		const januaryR = aggregateMonthlyIncome(inputs, {
			referenceMonth: new Date(Date.UTC(2027, 0, 1)),
		});

		expect(novemberR.total).toBe(2500);
		expect(decemberR.total).toBe(2500);
		expect(januaryR.total).toBe(0);
	});

	it("irregular usa guaranteedAmount * 0.7 (default)", () => {
		const r = aggregateMonthlyIncome(
			[{ id: "i1", amount: 3000, frequency: "irregular", guaranteedAmount: 2000 }],
			{ referenceMonth: may2026 },
		);
		expect(r.total).toBe(1400);
		expect(r.contributions[0].reason).toBe("irregular_prudential");
	});

	it("irregular sem guaranteedAmount cai no amount * 0.7", () => {
		const r = aggregateMonthlyIncome([{ id: "i1", amount: 3000, frequency: "irregular" }], {
			referenceMonth: may2026,
		});
		expect(r.total).toBe(2100);
	});

	it("agrega multiplas rendas heterogeneas", () => {
		const r = aggregateMonthlyIncome(
			[
				{ id: "salary", amount: 5000, frequency: "recurring" },
				{ id: "freela", amount: 1500, frequency: "irregular", guaranteedAmount: 1000 },
				{
					id: "13o",
					amount: 5000,
					frequency: "installment",
					dueDate: may2026,
					installments: 2,
					installmentAmount: 2500,
				},
			],
			{ referenceMonth: may2026 },
		);
		// 5000 + 700 + 2500 = 8200
		expect(r.total).toBe(8200);
	});
});
