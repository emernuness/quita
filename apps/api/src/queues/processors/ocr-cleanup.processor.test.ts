import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { OcrCleanupProcessor } from "./ocr-cleanup.processor";

describe("OcrCleanupProcessor", () => {
	it("apaga imagens R2 e nula ocrImageUrl", async () => {
		const prisma = {
			settlementEvaluation: {
				findMany: vi.fn().mockResolvedValue([
					{ id: "s1", ocrImageUrl: "https://pub.r2.dev/ocr/u1/abc.png" },
					{ id: "s2", ocrImageUrl: "ocr/u2/def.png" },
				]),
				update: vi.fn().mockResolvedValue({}),
			},
		};
		const storage = { delete: vi.fn().mockResolvedValue(undefined) };
		const proc = new OcrCleanupProcessor(prisma as never, storage as never);
		const r = await proc.process({ name: "ocr-cleanup" } as Job);
		expect(storage.delete).toHaveBeenCalledTimes(2);
		expect(storage.delete).toHaveBeenCalledWith("ocr/u1/abc.png");
		expect(storage.delete).toHaveBeenCalledWith("ocr/u2/def.png");
		expect(prisma.settlementEvaluation.update).toHaveBeenCalledTimes(2);
		expect(r.deleted).toBe(2);
	});
});
