import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { MonthlyRolloverProcessor } from "./monthly-rollover.processor";

describe("MonthlyRolloverProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const motor = {} as never;
		const proc = new MonthlyRolloverProcessor(prisma, motor);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ rolled: 0 });
	});

	it("desativa planos do mes anterior + recalcula todos users ativos", async () => {
		const prisma = {
			monthlyActionPlan: { updateMany: vi.fn().mockResolvedValue({ count: 5 }) },
			user: { findMany: vi.fn().mockResolvedValue([{ id: "u1" }, { id: "u2" }]) },
		};
		const motor = { recalculateForUser: vi.fn().mockResolvedValue({}) };
		const proc = new MonthlyRolloverProcessor(prisma as never, motor as never);
		const r = await proc.process({ name: "monthly-rollover" } as Job);
		expect(prisma.monthlyActionPlan.updateMany).toHaveBeenCalled();
		expect(motor.recalculateForUser).toHaveBeenCalledTimes(2);
		expect(r).toEqual({ rolled: 2 });
	});
});
