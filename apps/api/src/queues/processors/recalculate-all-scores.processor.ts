import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { MotorOrchestratorService } from "../../modules/motor/motor-orchestrator.service";
import { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

/**
 * Spec Fase 4 §7.5 — RecalculateAllScoresProcessor.
 *
 * Trigger manual ou pos-mudanca em ScoringWeight (admin update).
 * Re-roda priority-engine para todos os usuarios nao deletados.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "recalculate-all-scores" })
export class RecalculateAllScoresProcessor extends WorkerHost {
	private readonly logger = new Logger(RecalculateAllScoresProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly motor: MotorOrchestratorService,
	) {
		super();
	}

	async process(job: Job): Promise<{ recalculated: number }> {
		if (job.name !== "recalculate-all-scores") return { recalculated: 0 };

		this.logger.log({ msg: "recalculate_all_scores.start" });
		const users = await this.prisma.user.findMany({
			where: { deletedAt: null },
			select: { id: true },
		});

		let recalculated = 0;
		for (const u of users) {
			try {
				await this.motor.recalculateForUser(u.id, "manual_recalc");
				recalculated += 1;
			} catch (err) {
				this.logger.warn({ msg: "recalculate_all_scores.failed", userId: u.id, err });
			}
		}

		this.logger.log({ msg: "recalculate_all_scores.done", recalculated, total: users.length });
		return { recalculated };
	}
}
