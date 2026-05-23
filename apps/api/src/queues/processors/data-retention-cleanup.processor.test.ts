import type { Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";
import { DataRetentionCleanupProcessor } from "./data-retention-cleanup.processor";

describe("DataRetentionCleanupProcessor", () => {
	it("ignora job com nome diferente", async () => {
		const prisma = {} as never;
		const userDeletion = {} as never;
		const proc = new DataRetentionCleanupProcessor(prisma, userDeletion);
		const r = await proc.process({ name: "other" } as Job);
		expect(r).toEqual({ usersHardDeleted: 0, auditLogsDeleted: 0, snapshotsDeleted: 0 });
	});

	it("apaga audit logs e snapshots + hard delete usuarios expirados", async () => {
		const userDeletion = {
			findExpiredSoftDeletes: vi.fn().mockResolvedValue(["u1", "u2"]),
			hardDelete: vi.fn().mockResolvedValue(undefined),
		};
		const prisma = {
			authAuditLog: { deleteMany: vi.fn().mockResolvedValue({ count: 7 }) },
			financialStateSnapshot: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
		};
		const proc = new DataRetentionCleanupProcessor(prisma as never, userDeletion as never);
		const r = await proc.process({ name: "data-retention-cleanup" } as Job);
		expect(userDeletion.hardDelete).toHaveBeenCalledTimes(2);
		expect(r).toEqual({ usersHardDeleted: 2, auditLogsDeleted: 7, snapshotsDeleted: 3 });
	});
});
