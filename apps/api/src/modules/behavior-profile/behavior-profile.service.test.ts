import { describe, expect, it, vi } from "vitest";
import { BehaviorProfileService } from "./behavior-profile.service";

function mockPrisma() {
	return {
		behaviorProfile: { upsert: vi.fn().mockResolvedValue({}) },
		user: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
	};
}

describe("BehaviorProfileService", () => {
	it("upsert default preferredStrategy=undecided na criacao", async () => {
		const prisma = mockPrisma();
		const svc = new BehaviorProfileService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.upsert("u1", {});
		const args = prisma.behaviorProfile.upsert.mock.calls[0][0];
		expect(args.create.preferredStrategy).toBe("undecided");
		// Sem preferredStrategy explicit, nao promove diagnosis level.
		expect(prisma.user.updateMany).not.toHaveBeenCalled();
	});

	it("upsert respeita override de preferredStrategy + promove diagnosis", async () => {
		const prisma = mockPrisma();
		const svc = new BehaviorProfileService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.upsert("u1", { preferredStrategy: "avalanche" });
		const args = prisma.behaviorProfile.upsert.mock.calls[0][0];
		expect(args.create.preferredStrategy).toBe("avalanche");
		expect(args.update.preferredStrategy).toBe("avalanche");
		// Promove minimal → basic.
		expect(prisma.user.updateMany).toHaveBeenCalledWith({
			where: { id: "u1", diagnosisLevel: "minimal" },
			data: { diagnosisLevel: "basic" },
		});
	});

	it("preferredStrategy=undecided nao promove diagnosis", async () => {
		const prisma = mockPrisma();
		const svc = new BehaviorProfileService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.upsert("u1", { preferredStrategy: "undecided" });
		expect(prisma.user.updateMany).not.toHaveBeenCalled();
	});
});
