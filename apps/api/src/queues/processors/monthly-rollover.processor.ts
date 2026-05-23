import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import type { MotorOrchestratorService } from "../../modules/motor/motor-orchestrator.service";
import type { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

/**
 * Spec Fase 4 §7.5 — MonthlyRolloverProcessor.
 *
 * Cron mensal (1º dia, 03:00 UTC). Para cada usuario nao deletado:
 * - Desativa MonthlyActionPlan do mes anterior (isActive=false).
 * - Dispara recalculo do motor para o novo mes.
 *
 * Schedulers BullMQ devem usar repeat: { pattern: '0 3 1 * *' }.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "monthly-rollover" })
export class MonthlyRolloverProcessor extends WorkerHost {
	private readonly logger = new Logger(MonthlyRolloverProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly motor: MotorOrchestratorService,
	) {
		super();
	}

	async process(job: Job): Promise<{ rolled: number }> {
		if (job.name !== "monthly-rollover") return { rolled: 0 };

		this.logger.log({ msg: "monthly_rollover.start" });
		const now = new Date();
		const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

		await this.prisma.monthlyActionPlan.updateMany({
			where: { referenceMonth: previousMonth, isActive: true },
			data: { isActive: false },
		});

		const users = await this.prisma.user.findMany({
			where: { deletedAt: null },
			select: { id: true },
		});

		let rolled = 0;
		for (const u of users) {
			try {
				await this.motor.recalculateForUser(u.id, "month_rollover");
				rolled += 1;
			} catch (err) {
				this.logger.error({ msg: "monthly_rollover.user_failed", userId: u.id, err });
			}
		}

		this.logger.log({ msg: "monthly_rollover.done", rolled, total: users.length });
		return { rolled };
	}
}
