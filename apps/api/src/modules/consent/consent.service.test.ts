import { describe, expect, it, vi } from "vitest";
import { ConsentService, PRIVACY_VERSION, TOS_VERSION } from "./consent.service";

function mockPrisma() {
	return {
		consentLog: {
			create: vi.fn().mockResolvedValue({ id: "c1" }),
			findMany: vi.fn().mockResolvedValue([]),
		},
	};
}

describe("ConsentService", () => {
	it("record persiste com defaults accepted=true", async () => {
		const prisma = mockPrisma();
		const svc = new ConsentService(prisma as never);
		await svc.record({ userId: "u1", consentType: "terms_of_use", version: "1.0.0" });
		const args = prisma.consentLog.create.mock.calls[0][0];
		expect(args.data.accepted).toBe(true);
		expect(args.data.ipAddress).toBeNull();
	});

	it("record com IP+UA persiste corretamente", async () => {
		const prisma = mockPrisma();
		const svc = new ConsentService(prisma as never);
		await svc.record({
			userId: "u1",
			consentType: "data_processing",
			version: "ocr-v1",
			accepted: true,
			ipAddress: "1.2.3.4",
			userAgent: "UA/1.0",
		});
		const args = prisma.consentLog.create.mock.calls[0][0];
		expect(args.data.ipAddress).toBe("1.2.3.4");
		expect(args.data.userAgent).toBe("UA/1.0");
	});

	it("latestByType reduz para versao mais recente por tipo", async () => {
		const prisma = mockPrisma();
		prisma.consentLog.findMany.mockResolvedValueOnce([
			{ consentType: "terms_of_use", version: "1.0.0", acceptedAt: new Date("2026-05-01") },
			{ consentType: "terms_of_use", version: "0.9.0", acceptedAt: new Date("2026-01-01") },
			{ consentType: "privacy_policy", version: "1.0.0", acceptedAt: new Date("2026-05-01") },
		]);
		const svc = new ConsentService(prisma as never);
		const r = await svc.latestByType("u1");
		expect(r.terms_of_use?.version).toBe("1.0.0");
		expect(r.privacy_policy?.version).toBe("1.0.0");
	});

	it("status retorna true quando versao atual aceita", async () => {
		const prisma = mockPrisma();
		prisma.consentLog.findMany.mockResolvedValueOnce([
			{ consentType: "terms_of_use", version: TOS_VERSION, acceptedAt: new Date() },
			{ consentType: "privacy_policy", version: PRIVACY_VERSION, acceptedAt: new Date() },
		]);
		const svc = new ConsentService(prisma as never);
		const r = await svc.status("u1");
		expect(r.tosAccepted).toBe(true);
		expect(r.privacyAccepted).toBe(true);
	});

	it("status retorna false quando versao desatualizada", async () => {
		const prisma = mockPrisma();
		prisma.consentLog.findMany.mockResolvedValueOnce([
			{ consentType: "terms_of_use", version: "0.5.0", acceptedAt: new Date() },
		]);
		const svc = new ConsentService(prisma as never);
		const r = await svc.status("u1");
		expect(r.tosAccepted).toBe(false);
		expect(r.privacyAccepted).toBe(false);
	});
});
