import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import type { UserDeletionService } from "../../modules/user/user-deletion.service";
import type { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

const AUDIT_LOG_RETENTION_DAYS = 365;

/**
 * Spec Fase 3 §16 — DataRetentionCleanupProcessor.
 *
 * Cron diario (04:00 UTC). Aplica politicas de retencao LGPD:
 * - Hard delete de Users soft-deleted ha mais de 30 dias.
 * - Apaga AuthAuditLog mais antigo que 12 meses.
 * - Apaga FinancialStateSnapshot mais antigo que 24 meses (rolling window).
 *
 * Scheduler: repeat: { pattern: '0 4 * * *' }.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "data-retention-cleanup" })
export class DataRetentionCleanupProcessor extends WorkerHost {
	private readonly logger = new Logger(DataRetentionCleanupProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly userDeletion: UserDeletionService,
	) {
		super();
	}

	async process(job: Job): Promise<{
		usersHardDeleted: number;
		auditLogsDeleted: number;
		snapshotsDeleted: number;
	}> {
		if (job.name !== "data-retention-cleanup") {
			return { usersHardDeleted: 0, auditLogsDeleted: 0, snapshotsDeleted: 0 };
		}

		const now = new Date();
		this.logger.log({ msg: "data_retention.start", now });

		// 1. Hard delete usuarios soft-deleted ha > 30 dias.
		const expired = await this.userDeletion.findExpiredSoftDeletes(now);
		let usersHardDeleted = 0;
		for (const userId of expired) {
			try {
				await this.userDeletion.hardDelete(userId);
				usersHardDeleted += 1;
			} catch (err) {
				this.logger.error({ msg: "data_retention.hard_delete_failed", userId, err });
			}
		}

		// 2. Apaga audit logs > 1 ano.
		const auditThreshold = new Date(now.getTime() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
		const auditDel = await this.prisma.authAuditLog.deleteMany({
			where: { createdAt: { lt: auditThreshold } },
		});

		// 3. Apaga snapshots financeiros > 24 meses.
		const snapshotThreshold = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
		const snapshotDel = await this.prisma.financialStateSnapshot.deleteMany({
			where: { capturedAt: { lt: snapshotThreshold } },
		});

		this.logger.log({
			msg: "data_retention.done",
			usersHardDeleted,
			auditLogsDeleted: auditDel.count,
			snapshotsDeleted: snapshotDel.count,
		});

		return {
			usersHardDeleted,
			auditLogsDeleted: auditDel.count,
			snapshotsDeleted: snapshotDel.count,
		};
	}
}
