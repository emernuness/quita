import { describe, expect, it, vi } from "vitest";
import { GoalsService } from "./goals.service";

function mockPrisma(overrides: Record<string, unknown> = {}) {
	const user = "u1";
	const goal = { id: "g1", userId: user, ...overrides };
	return {
		userGoal: {
			findMany: vi.fn().mockResolvedValue([goal]),
			findUnique: vi.fn().mockResolvedValue(goal),
			create: vi.fn().mockResolvedValue(goal),
			update: vi.fn().mockResolvedValue(goal),
		},
	};
}

describe("GoalsService", () => {
	it("list filtra por userId+isActive ordenado", async () => {
		const prisma = mockPrisma();
		const svc = new GoalsService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.list("u1");
		expect(prisma.userGoal.findMany).toHaveBeenCalledWith({
			where: { userId: "u1", isActive: true },
			orderBy: [{ priorityOrder: "asc" }, { createdAt: "desc" }],
		});
	});

	it("create persiste com defaults", async () => {
		const prisma = mockPrisma();
		const svc = new GoalsService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.create("u1", { goalType: "house", description: "Casa" });
		expect(prisma.userGoal.create).toHaveBeenCalledWith({
			data: {
				userId: "u1",
				goalType: "house",
				description: "Casa",
				targetAmount: null,
				targetDate: null,
				priorityOrder: 100,
			},
		});
	});

	it("update rejeita resource de outro user", async () => {
		const prisma = mockPrisma({ userId: "outro" });
		const svc = new GoalsService(prisma as never, { enqueue: vi.fn() } as never);
		await expect(svc.update("u1", "g1", { description: "x" })).rejects.toThrow();
	});

	it("remove faz soft-delete (isActive=false)", async () => {
		const prisma = mockPrisma();
		const svc = new GoalsService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.remove("u1", "g1");
		expect(prisma.userGoal.update).toHaveBeenCalledWith({
			where: { id: "g1" },
			data: { isActive: false },
		});
	});
});
