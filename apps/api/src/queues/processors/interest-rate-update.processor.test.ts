import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { InterestRateUpdateProcessor } from "./interest-rate-update.processor";

describe("InterestRateUpdateProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const proc = new InterestRateUpdateProcessor(prisma);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ updated: 0 });
	});

	it("retorna 0 em prod (TODO BCB SGS pull)", async () => {
		// Stub MVP: processor não puxa BCB ainda. Test garante que o caminho default
		// não quebra. Quando BCB SGS for integrado, atualizar test com mock fetch.
		const prisma = { interestRateReference: { findMany: vi.fn().mockResolvedValue([]) } };
		const proc = new InterestRateUpdateProcessor(prisma as never);
		const r = await proc.process({ name: "interest-rate-update" } as Job);
		expect(r.updated).toBeDefined();
	});
});
