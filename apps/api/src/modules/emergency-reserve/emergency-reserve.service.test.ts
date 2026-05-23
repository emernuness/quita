import { describe, expect, it, vi } from "vitest";
import { EmergencyReserveService } from "./emergency-reserve.service";

describe("EmergencyReserveService", () => {
	it("get busca por userId", async () => {
		const prisma = { emergencyReserve: { findUnique: vi.fn().mockResolvedValue(null) } };
		const svc = new EmergencyReserveService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.get("u1");
		expect(prisma.emergencyReserve.findUnique).toHaveBeenCalledWith({ where: { userId: "u1" } });
	});

	it("upsert define startedAt quando ativando", async () => {
		const prisma = { emergencyReserve: { upsert: vi.fn().mockResolvedValue({}) } };
		const svc = new EmergencyReserveService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.upsert("u1", { isActive: true, currentAmount: 500 });
		const args = prisma.emergencyReserve.upsert.mock.calls[0][0];
		expect(args.create.isActive).toBe(true);
		expect(args.create.startedAt).toBeInstanceOf(Date);
	});

	it("upsert sem isActive nao define startedAt no update", async () => {
		const prisma = { emergencyReserve: { upsert: vi.fn().mockResolvedValue({}) } };
		const svc = new EmergencyReserveService(prisma as never, { enqueue: vi.fn() } as never);
		await svc.upsert("u1", { currentAmount: 200 });
		const args = prisma.emergencyReserve.upsert.mock.calls[0][0];
		expect(args.update).not.toHaveProperty("startedAt");
	});
});
