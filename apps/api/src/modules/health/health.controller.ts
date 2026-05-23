import { InjectQueue } from "@nestjs/bullmq";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Queue } from "bullmq";
import type { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_RECALC_QUEUE } from "../../queues/queue.constants";

@ApiTags("health")
@Controller("health")
@SkipThrottle()
export class HealthController {
	constructor(
		private readonly prisma: PrismaService,
		@InjectQueue(MOTOR_RECALC_QUEUE) private readonly queue: Queue,
	) {}

	/**
	 * /health — check completo: DB + Redis. Falha = 503.
	 * Para load balancer usar /health/live (liveness simples).
	 */
	@Get()
	async health() {
		const checks: Record<string, { ok: boolean; error?: string }> = {};

		try {
			await this.prisma.$queryRaw`SELECT 1`;
			checks.db = { ok: true };
		} catch (err) {
			checks.db = { ok: false, error: (err as Error).message };
		}

		try {
			const client = (await this.queue.client) as unknown as { ping(): Promise<string> };
			await client.ping();
			checks.redis = { ok: true };
		} catch (err) {
			checks.redis = { ok: false, error: (err as Error).message };
		}

		const allOk = Object.values(checks).every((c) => c.ok);
		const body = {
			status: allOk ? "ok" : "degraded",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			checks,
		};
		if (!allOk) throw new ServiceUnavailableException(body);
		return body;
	}

	/**
	 * Liveness probe — só verifica se processo está vivo.
	 * Usar em k8s/Railway liveness check.
	 */
	@Get("live")
	live() {
		return { alive: true, timestamp: new Date().toISOString() };
	}

	/**
	 * Readiness probe — verifica se dependências críticas estão up.
	 * Usar em k8s/Railway readiness check (não envia tráfego se não pronto).
	 */
	@Get("ready")
	async ready() {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			const client = (await this.queue.client) as unknown as { ping(): Promise<string> };
			await client.ping();
			return { ready: true };
		} catch (err) {
			throw new ServiceUnavailableException({
				ready: false,
				reason: (err as Error).message,
			});
		}
	}
}
