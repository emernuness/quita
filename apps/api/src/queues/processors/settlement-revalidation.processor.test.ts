import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { SettlementRevalidationProcessor } from "./settlement-revalidation.processor";

describe("SettlementRevalidationProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const proc = new SettlementRevalidationProcessor(prisma);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ revalidated: 0, changed: 0 });
	});

	it("processa settlements ativos (proposalDeadline futura)", async () => {
		const prisma = {
			settlementEvaluation: {
				findMany: vi.fn().mockResolvedValue([]),
			},
		};
		const proc = new SettlementRevalidationProcessor(prisma as never);
		const r = await proc.process({ name: "settlement-revalidation" } as Job);
		expect(prisma.settlementEvaluation.findMany).toHaveBeenCalled();
		expect(r).toEqual({ revalidated: 0, changed: 0 });
	});
});
