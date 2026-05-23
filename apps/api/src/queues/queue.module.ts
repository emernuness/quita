import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MotorModule } from "../modules/motor/motor.module";
import { StorageModule } from "../modules/storage/storage.module";
import { UserModule } from "../modules/user/user.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DataFreshnessReviewProcessor } from "./processors/data-freshness-review.processor";
import { DataRetentionCleanupProcessor } from "./processors/data-retention-cleanup.processor";
import { InterestRateUpdateProcessor } from "./processors/interest-rate-update.processor";
import { MonthlyRolloverProcessor } from "./processors/monthly-rollover.processor";
import { OcrCleanupProcessor } from "./processors/ocr-cleanup.processor";
import { RecalculateAllScoresProcessor } from "./processors/recalculate-all-scores.processor";
import { RecalculateStateProcessor } from "./processors/recalculate-state.processor";
import { SettlementRevalidationProcessor } from "./processors/settlement-revalidation.processor";
import { QueueSchedulerService } from "./queue-scheduler.service";
import { MOTOR_RECALC_QUEUE, MOTOR_SCHEDULED_QUEUE } from "./queue.constants";

function parseRedisUrl(url: string) {
	const u = new URL(url);
	return {
		host: u.hostname,
		port: Number(u.port || 6379),
		password: u.password || undefined,
		username: u.username || undefined,
	};
}

/**
 * BullMQ — 2 filas + 8 processors + scheduler.
 * Spec Fase 4 §7.5/§7.6 todos cobertos.
 */
@Module({
	imports: [
		PrismaModule,
		MotorModule,
		UserModule,
		StorageModule,
		BullModule.forRootAsync({
			useFactory: () => {
				const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
				return {
					connection: parseRedisUrl(redisUrl),
				};
			},
		}),
		BullModule.registerQueue({ name: MOTOR_RECALC_QUEUE }, { name: MOTOR_SCHEDULED_QUEUE }),
	],
	providers: [
		RecalculateStateProcessor,
		MonthlyRolloverProcessor,
		DataRetentionCleanupProcessor,
		OcrCleanupProcessor,
		DataFreshnessReviewProcessor,
		InterestRateUpdateProcessor,
		SettlementRevalidationProcessor,
		RecalculateAllScoresProcessor,
		QueueSchedulerService,
	],
	exports: [BullModule],
})
export class QueueModule {}
