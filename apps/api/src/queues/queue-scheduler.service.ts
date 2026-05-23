import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";
import { MOTOR_SCHEDULED_QUEUE } from "./queue.constants";

/**
 * Registra schedulers BullMQ no boot.
 * Spec Fase 4 §7.6 — 6 crons cobrindo todos processors recorrentes.
 */
@Injectable()
export class QueueSchedulerService implements OnModuleInit {
	private readonly logger = new Logger(QueueSchedulerService.name);

	constructor(@InjectQueue(MOTOR_SCHEDULED_QUEUE) private readonly scheduled: Queue) {}

	async onModuleInit(): Promise<void> {
		await this.addRepeatable("monthly-rollover", "0 3 1 * *");
		await this.addRepeatable("data-retention-cleanup", "0 4 * * *");
		await this.addRepeatable("ocr-cleanup", "0 5 * * *");
		await this.addRepeatable("data-freshness-review", "0 6 * * 1");
		await this.addRepeatable("interest-rate-update", "0 2 5 * *");
		await this.addRepeatable("settlement-revalidation", "0 7 * * 2");
		this.logger.log({ msg: "queue_schedulers.registered", count: 6 });
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
