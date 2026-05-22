import { Injectable, Logger } from "@nestjs/common";
import type { AuthEventType, Prisma } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";

export interface AuthAuditEvent {
	eventType: AuthEventType;
	userId?: string | null;
	email?: string | null;
	ip?: string | null;
	userAgent?: string | null;
	metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuthAuditService {
	private readonly logger = new Logger(AuthAuditService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Persiste evento de auth para auditoria LGPD.
	 * Falha de log NAO derruba o fluxo principal (best-effort).
	 */
	async log(event: AuthAuditEvent): Promise<void> {
		try {
			await this.prisma.authAuditLog.create({
				data: {
					eventType: event.eventType,
					userId: event.userId ?? null,
					email: event.email ?? null,
					ipAddress: event.ip ?? null,
					userAgent: event.userAgent ?? null,
					...(event.metadata !== undefined && { metadata: event.metadata }),
				},
			});
		} catch (err) {
			this.logger.error("Falha ao registrar AuthAuditLog", err as Error);
		}
	}
}
