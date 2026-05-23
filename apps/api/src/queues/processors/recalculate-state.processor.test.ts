import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { RecalculateStateProcessor } from "./recalculate-state.processor";

describe("RecalculateStateProcessor", () => {
	it("invoca motor.recalculateForUser com userId+triggerEvent do job", async () => {
		const motor = { recalculateForUser: vi.fn().mockResolvedValue({ data: {} }) };
		const proc = new RecalculateStateProcessor(motor as never);
		const job = {
			data: { userId: "u1", triggerEvent: "income_added" },
		} as unknown as Job;
		const r = await proc.process(job);
		expect(motor.recalculateForUser).toHaveBeenCalledWith("u1", "income_added");
		expect(r).toEqual({ ok: true });
	});
});
