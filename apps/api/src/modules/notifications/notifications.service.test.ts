import { describe, expect, it, vi } from "vitest";
import { NotificationsService } from "./notifications.service";

function mockPrisma() {
	return {
		notification: {
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
			create: vi.fn().mockResolvedValue({ id: "n1" }),
			updateMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
	};
}

describe("NotificationsService", () => {
	it("list filtra por userId + take limit", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.list("u1", { limit: 10 });
		expect(prisma.notification.findMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			orderBy: { createdAt: "desc" },
			take: 10,
		});
	});

	it("list com unreadOnly adiciona readAt=null", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.list("u1", { unreadOnly: true });
		const args = prisma.notification.findMany.mock.calls[0][0];
		expect(args.where).toEqual({ userId: "u1", readAt: null });
	});

	it("limit capped em 100", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.list("u1", { limit: 500 });
		const args = prisma.notification.findMany.mock.calls[0][0];
		expect(args.take).toBe(100);
	});

	it("unreadCount usa where userId+readAt:null", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.unreadCount("u1");
		expect(prisma.notification.count).toHaveBeenCalledWith({
			where: { userId: "u1", readAt: null },
		});
	});

	it("create defaulta severity=info e linkUrl=null", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.create({ userId: "u1", category: "motor_recalc", title: "T", body: "B" });
		const args = prisma.notification.create.mock.calls[0][0];
		expect(args.data.severity).toBe("info");
		expect(args.data.linkUrl).toBeNull();
	});

	it("markRead so atualiza nao lidos do user", async () => {
		const prisma = mockPrisma();
		const svc = new NotificationsService(prisma as never);
		await svc.markRead("u1", "n1");
		expect(prisma.notification.updateMany).toHaveBeenCalledWith({
			where: { id: "n1", userId: "u1", readAt: null },
			data: { readAt: expect.any(Date) },
		});
	});

	it("markAllRead atualiza todos nao lidos", async () => {
		const prisma = mockPrisma();
		prisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });
		const svc = new NotificationsService(prisma as never);
		const r = await svc.markAllRead("u1");
		expect(r).toEqual({ updated: 5 });
	});
});
