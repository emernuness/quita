import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { RecalculateAllScoresProcessor } from "./recalculate-all-scores.processor";

describe("RecalculateAllScoresProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const motor = {} as never;
		const proc = new RecalculateAllScoresProcessor(prisma, motor);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ recalculated: 0 });
	});

	it("invoca motor para todos users com debts ativas", async () => {
		const prisma = {
			user: {
				findMany: vi.fn().mockResolvedValue([{ id: "u1" }, { id: "u2" }]),
			},
		};
		const motor = { recalculateForUser: vi.fn().mockResolvedValue({}) };
		const proc = new RecalculateAllScoresProcessor(prisma as never, motor as never);
		const r = await proc.process({ name: "recalculate-all-scores" } as Job);
		expect(motor.recalculateForUser).toHaveBeenCalledTimes(2);
		expect(r).toEqual({ recalculated: 2 });
	});
});
