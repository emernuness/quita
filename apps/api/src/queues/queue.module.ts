import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
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
 * Configura a conexao Redis a partir de REDIS_URL e registra as duas
 * filas previstas pela Fase 4 §7. Workers/processors sao registrados
 * por cada modulo de motor (ex.: PriorityEngineModule registra o seu
 * processor) — esta etapa cobre apenas o setup base.
 */
@Module({
	imports: [
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
	exports: [BullModule],
})
export class QueueModule {}
