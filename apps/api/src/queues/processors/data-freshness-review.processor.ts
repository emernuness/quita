import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { MotorOrchestratorService } from "../../modules/motor/motor-orchestrator.service";
import { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

const FRESHNESS_THRESHOLD_DAYS = 90;

/**
 * Spec Fase 4 §7.5 — DataFreshnessReviewProcessor.
 *
 * Cron semanal (segunda 06:00 UTC). Identifica dividas com
 * dataConfidence != 'high' E lastVerifiedAt nulo ou > 90 dias.
 * Marca lastVerifiedAt e dispara recálculo para o usuário caso
 * alguma divida tenha confidence atualizada manualmente desde
 * último recalc.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "data-freshness-review" })
export class DataFreshnessReviewProcessor extends WorkerHost {
	private readonly logger = new Logger(DataFreshnessReviewProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly motor: MotorOrchestratorService,
	) {
		super();
	}

	async process(job: Job): Promise<{ usersReviewed: number; debtsFlagged: number }> {
		if (job.name !== "data-freshness-review") return { usersReviewed: 0, debtsFlagged: 0 };

		const threshold = new Date(Date.now() - FRESHNESS_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
		const staleDebts = await this.prisma.debt.findMany({
			where: {
				status: { not: "paid" },
				dataConfidence: { not: "high" },
				OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: threshold } }],
			},
			select: { id: true, userId: true },
		});

		const usersToRefresh = new Set(staleDebts.map((d) => d.userId));
		for (const userId of usersToRefresh) {
			try {
				await this.motor.recalculateForUser(userId, "data_freshness_review");
			} catch (err) {
				this.logger.warn({ msg: "data_freshness.recalc_failed", userId, err });
			}
		}

		this.logger.log({
			msg: "data_freshness.done",
			usersReviewed: usersToRefresh.size,
			debtsFlagged: staleDebts.length,
		});
		return { usersReviewed: usersToRefresh.size, debtsFlagged: staleDebts.length };
	}
}
