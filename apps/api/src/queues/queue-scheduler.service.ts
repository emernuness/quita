import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";
import { MOTOR_SCHEDULED_QUEUE } from "./queue.constants";

/**
 * Registra os schedulers BullMQ (jobs recorrentes) no boot da aplicacao.
 *
 * Spec Fase 4 §7.6 — schedulers:
 * - monthly-rollover: cron 0 3 1 * *  (todo dia 1, 03:00 UTC)
 * - data-retention-cleanup: cron 0 4 * * *  (todo dia, 04:00 UTC)
 */
@Injectable()
export class QueueSchedulerService implements OnModuleInit {
	private readonly logger = new Logger(QueueSchedulerService.name);

	constructor(@InjectQueue(MOTOR_SCHEDULED_QUEUE) private readonly scheduled: Queue) {}

	async onModuleInit(): Promise<void> {
		await this.addRepeatable("monthly-rollover", "0 3 1 * *");
		await this.addRepeatable("data-retention-cleanup", "0 4 * * *");
		this.logger.log({ msg: "queue_schedulers.registered" });
	}

	private async addRepeatable(name: string, pattern: string): Promise<void> {
		await this.scheduled.add(
			name,
			{ scheduled: true },
			{
				repeat: { pattern, tz: "UTC" },
				removeOnComplete: 10,
				removeOnFail: 50,
				jobId: `scheduled:${name}`,
			},
		);
	}
}
