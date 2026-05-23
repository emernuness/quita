import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MotorModule } from "../modules/motor/motor.module";
import { UserModule } from "../modules/user/user.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DataRetentionCleanupProcessor } from "./processors/data-retention-cleanup.processor";
import { MonthlyRolloverProcessor } from "./processors/monthly-rollover.processor";
import { RecalculateStateProcessor } from "./processors/recalculate-state.processor";
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
 * Modulo central de filas BullMQ.
 *
 * Configura conexao Redis a partir de REDIS_URL e registra:
 * - 2 filas: motor-recalc (groupId={userId}) + motor-scheduled.
 * - 3 processors criticos: RecalculateState, MonthlyRollover,
 *   DataRetentionCleanup (Fase 4 §7.5).
 *
 * Workers vivem no mesmo processo da API. Separar em deployment proprio
 * quando metricas exigirem.
 */
@Module({
	imports: [
		PrismaModule,
		MotorModule,
		UserModule,
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
	providers: [RecalculateStateProcessor, MonthlyRolloverProcessor, DataRetentionCleanupProcessor],
	exports: [BullModule],
})
export class QueueModule {}
