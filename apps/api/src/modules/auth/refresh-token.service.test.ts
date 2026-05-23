import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshTokenService } from "./refresh-token.service";

beforeEach(() => {
	process.env.REFRESH_TOKEN_HMAC_SECRET = "test-hmac-secret-32-chars-min-required-ok";
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("RefreshTokenService", () => {
	it("issue cria registro + retorna rawToken hex", async () => {
		const prisma = {
			refreshToken: {
				create: vi.fn().mockResolvedValue({ id: "rt1" }),
			},
		};
		const svc = new RefreshTokenService(prisma as never);
		const r = await svc.issue("u1");
		expect(r.rawToken).toMatch(/^[a-f0-9]{64}$/);
		expect(r.id).toBe("rt1");
		expect(r.expiresAt).toBeInstanceOf(Date);
	});

	it("rotate retorna null quando updateMany count=0 e record nao existe", async () => {
		const prisma = {
			refreshToken: {
				updateMany: vi.fn().mockResolvedValue({ count: 0 }),
				findUnique: vi.fn().mockResolvedValue(null),
			},
		};
		const svc = new RefreshTokenService(prisma as never);
		const r = await svc.rotate("raw");
		expect(r).toBeNull();
	});

	it("rotate detecta reuse e revoga todos do user", async () => {
		const revokeMany = vi.fn().mockResolvedValue({ count: 5 });
		const prisma = {
			refreshToken: {
				updateMany: vi
					.fn()
					.mockResolvedValueOnce({ count: 0 }) // primeira chamada (tentativa de revogar)
					.mockImplementation((args: { where?: { userId?: string } }) => {
						if (args?.where?.userId) return revokeMany(args);
						return { count: 0 };
					}),
				findUnique: vi.fn().mockResolvedValue({ id: "rt1", userId: "u1", revokedAt: new Date() }),
			},
		};
		const svc = new RefreshTokenService(prisma as never);
		const r = await svc.rotate("raw");
		expect(r).toEqual({ reuseDetectedFor: "u1" });
		expect(revokeMany).toHaveBeenCalled();
	});

	it("revokeAllForUser usa updateMany com revokedAt=null", async () => {
		const prisma = { refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) } };
		const svc = new RefreshTokenService(prisma as never);
		await svc.revokeAllForUser("u1");
		expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
			where: { userId: "u1", revokedAt: null },
			data: { revokedAt: expect.any(Date) },
		});
	});
});
