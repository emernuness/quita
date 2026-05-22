import { describe, expect, it } from "vitest";
import { evaluateGoal } from "./goal-tracker";

const now = new Date("2026-05-22T00:00:00Z");

describe("evaluateGoal", () => {
	it("retorna 50% quando current = metade do target", () => {
		const r = evaluateGoal({
			now,
			goal: {
				id: "g1",
				targetAmount: 1000,
				currentAmount: 500,
				targetDate: null,
				achievedAt: null,
			},
		});
		expect(r.progressPercent).toBe(50);
		expect(r.isAchieved).toBe(false);
	});

	it("100% e atingida quando current >= target", () => {
		const r = evaluateGoal({
			now,
			goal: {
				id: "g1",
				targetAmount: 1000,
				currentAmount: 1200,
				targetDate: null,
				achievedAt: null,
			},
		});
		expect(r.progressPercent).toBe(100);
		expect(r.isAchieved).toBe(true);
		expect(r.achievedAt).toEqual(now);
	});

	it("preserva achievedAt previo", () => {
		const previous = new Date("2026-04-01T00:00:00Z");
		const r = evaluateGoal({
			now,
			goal: {
				id: "g1",
				targetAmount: 1000,
				currentAmount: 1000,
				targetDate: null,
				achievedAt: previous,
			},
		});
		expect(r.achievedAt).toEqual(previous);
	});

	it("meta sem targetAmount retorna 0% se nao atingida", () => {
		const r = evaluateGoal({
			now,
			goal: { id: "g1", targetAmount: null, targetDate: null, achievedAt: null },
		});
		expect(r.progressPercent).toBe(0);
		expect(r.isAchieved).toBe(false);
	});

	it("calcula dias ate target", () => {
		const targetDate = new Date("2026-06-21T00:00:00Z");
		const r = evaluateGoal({
			now,
			goal: { id: "g1", targetAmount: 1000, targetDate, achievedAt: null },
		});
		expect(r.daysToTarget).toBe(30);
	});
});
