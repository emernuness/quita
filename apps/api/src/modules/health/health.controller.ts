import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
@SkipThrottle()
export class HealthController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async health() {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return {
				status: "ok",
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
			};
		} catch (err) {
			throw new ServiceUnavailableException({
				status: "degraded",
				reason: "database",
				message: (err as Error).message,
			});
		}
	}

	@Get("ready")
	ready() {
		return { ready: true };
	}
}
