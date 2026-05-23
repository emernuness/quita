import { describe, expect, it, vi } from "vitest";
import { DebtsService } from "./debts.service";

function mockPrisma() {
	const debt = {
		id: "d1",
		userId: "u1",
		creditor: "Cred",
		totalAmount: { toNumber: () => 1000 },
		amountPaid: { toNumber: () => 0 },
		monthlyAmount: null,
		interestSaved: null,
		status: "on_time" as const,
	};
	return {
		debt: {
			findMany: vi.fn().mockResolvedValue([debt]),
			findUnique: vi.fn().mockResolvedValue(debt),
			create: vi.fn().mockResolvedValue(debt),
			update: vi.fn().mockResolvedValue(debt),
			delete: vi.fn().mockResolvedValue(undefined),
		},
		payment: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		$transaction: vi.fn().mockResolvedValue([{ id: "p1", amount: { toNumber: () => 100 } }]),
		debtCategory: { findMany: vi.fn().mockResolvedValue([]) },
	};
}

function mockTrigger() {
	return { enqueue: vi.fn() };
}

describe("DebtsService", () => {
	it("listDebts ordena por priorityScore desc + createdAt asc", async () => {
		const prisma = mockPrisma();
		const svc = new DebtsService(prisma as never, mockTrigger() as never);
		await svc.listDebts("u1");
		const args = prisma.debt.findMany.mock.calls[0][0];
		expect(args.orderBy[0].priorityScore.sort).toBe("desc");
	});

	it("getDebt rejeita user diferente do owner", async () => {
		const prisma = mockPrisma();
		prisma.debt.findUnique.mockResolvedValueOnce({
			id: "d1",
			userId: "outro",
			totalAmount: { toNumber: () => 1 },
			amountPaid: { toNumber: () => 0 },
			monthlyAmount: null,
			interestSaved: null,
		});
		const svc = new DebtsService(prisma as never, mockTrigger() as never);
		await expect(svc.getDebt("u1", "d1")).rejects.toThrow();
	});

	it("createDebt enfileira motor com debt_added", async () => {
		const prisma = mockPrisma();
		const trigger = mockTrigger();
		const svc = new DebtsService(prisma as never, trigger as never);
		await svc.createDebt("u1", {
			categoryId: "c1",
			creditor: "X",
			nature: "one_time",
			totalAmount: 500,
			status: "on_time",
			hasInterest: false,
		} as never);
		expect(trigger.enqueue).toHaveBeenCalledWith("u1", "debt_added");
	});

	it("deleteDebt enfileira motor com debt_removed", async () => {
		const prisma = mockPrisma();
		const trigger = mockTrigger();
		const svc = new DebtsService(prisma as never, trigger as never);
		await svc.deleteDebt("u1", "d1");
		expect(trigger.enqueue).toHaveBeenCalledWith("u1", "debt_removed");
	});

	it("updateDebt rejeita resource de outro user", async () => {
		const prisma = mockPrisma();
		prisma.debt.findUnique.mockResolvedValueOnce({
			id: "d1",
			userId: "outro",
		});
		const svc = new DebtsService(prisma as never, mockTrigger() as never);
		await expect(svc.updateDebt("u1", "d1", { creditor: "X" } as never)).rejects.toThrow();
	});
});
