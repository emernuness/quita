import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { DataFreshnessReviewProcessor } from "./data-freshness-review.processor";

describe("DataFreshnessReviewProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const motor = {} as never;
		const proc = new DataFreshnessReviewProcessor(prisma, motor);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ usersReviewed: 0, debtsFlagged: 0 });
	});

	it("recalcula users com debts stale", async () => {
		const prisma = {
			debt: {
				findMany: vi.fn().mockResolvedValue([
					{ id: "d1", userId: "u1" },
					{ id: "d2", userId: "u1" },
					{ id: "d3", userId: "u2" },
				]),
			},
		};
		const motor = { recalculateForUser: vi.fn().mockResolvedValue({}) };
		const proc = new DataFreshnessReviewProcessor(prisma as never, motor as never);
		const r = await proc.process({ name: "data-freshness-review" } as Job);
		expect(motor.recalculateForUser).toHaveBeenCalledTimes(2); // 2 users unicos
		expect(r).toEqual({ usersReviewed: 2, debtsFlagged: 3 });
	});
});
