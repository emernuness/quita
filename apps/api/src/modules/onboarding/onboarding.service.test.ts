import { describe, expect, it, vi } from "vitest";
import { OnboardingService } from "./onboarding.service";

function mockPrisma() {
	return {
		$transaction: vi.fn().mockResolvedValue([]),
		income: { deleteMany: vi.fn(), create: vi.fn() },
		expense: { deleteMany: vi.fn(), create: vi.fn() },
		debt: { deleteMany: vi.fn(), create: vi.fn() },
		user: { update: vi.fn().mockResolvedValue({}) },
		behaviorProfile: { upsert: vi.fn().mockResolvedValue({}) },
	};
}

function mockTrigger() {
	return { enqueue: vi.fn() };
}

describe("OnboardingService", () => {
	it("saveLocation atualiza User com stateCode+dependentsCount", async () => {
		const prisma = mockPrisma();
		const svc = new OnboardingService(prisma as never, mockTrigger() as never);
		await svc.saveLocation("u1", { stateCode: "SP", dependentsCount: 2 });
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { stateCode: "SP", dependentsCount: 2 },
		});
	});

	it("saveLocation default dependentsCount=0 quando omitido", async () => {
		const prisma = mockPrisma();
		const svc = new OnboardingService(prisma as never, mockTrigger() as never);
		await svc.saveLocation("u1", { stateCode: "RJ" });
		const args = prisma.user.update.mock.calls[0][0];
		expect(args.data.dependentsCount).toBe(0);
	});

	it("saveConcern upserta BehaviorProfile com mainConcern", async () => {
		const prisma = mockPrisma();
		const svc = new OnboardingService(prisma as never, mockTrigger() as never);
		await svc.saveConcern("u1", { mainConcern: "collection_pressure" });
		const args = prisma.behaviorProfile.upsert.mock.calls[0][0];
		expect(args.where).toEqual({ userId: "u1" });
		expect(args.create.mainConcern).toBe("collection_pressure");
		expect(args.update.mainConcern).toBe("collection_pressure");
	});

	it("complete seta diagnosisLevel=minimal e enfileira motor", async () => {
		const prisma = mockPrisma();
		const trigger = mockTrigger();
		const svc = new OnboardingService(prisma as never, trigger as never);
		const r = await svc.complete("u1");
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: { onboardingCompleted: true, diagnosisLevel: "minimal" },
		});
		expect(trigger.enqueue).toHaveBeenCalledWith("u1", "manual_recalc");
		expect(r).toEqual({ completed: true });
	});

	it("saveIncome enriquece salary com paymentDay/stability/guaranteed", async () => {
		const prisma = mockPrisma();
		const svc = new OnboardingService(prisma as never, mockTrigger() as never);
		await svc.saveIncome("u1", {
			salary: 3000,
			paymentDay: 5,
			stabilityType: "variable",
			guaranteedAmount: 2500,
		});
		expect(prisma.$transaction).toHaveBeenCalled();
		const txn = prisma.$transaction.mock.calls[0][0];
		// Espera deleteMany + 1 create (salary) + user update = 3 ops
		expect(txn.length).toBe(3);
	});
});
