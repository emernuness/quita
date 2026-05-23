import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RefreshTokenService } from "../auth/refresh-token.service";

const RETENTION_DAYS = 30;

/**
 * Deletion LGPD-compliant (Fase 1 §2 + Fase 3 §16).
 *
 * Fluxo padrao:
 * 1. requestDeletion() — soft delete (User.deletedAt = now()), revoga
 *    todos refresh tokens, marca conta como pendente de hard delete.
 *    Usuario pode logar novamente em 30 dias para cancelar via
 *    cancelDeletion().
 * 2. hardDelete() — chamado pelo DataRetentionCleanupProcessor 30+ dias
 *    apos o soft delete. Anonimiza email/ip/userAgent em audit logs +
 *    deleta o registro User (cascade apaga relacionamentos).
 */
@Injectable()
export class UserDeletionService {
	private readonly logger = new Logger(UserDeletionService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly refreshTokens: RefreshTokenService,
	) {}

	async requestDeletion(userId: string): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: { deletedAt: new Date() },
			});
		});
		await this.refreshTokens.revokeAllForUser(userId);
		this.logger.log({ msg: "user.soft_delete", userId, retentionDays: RETENTION_DAYS });
	}

	async cancelDeletion(userId: string): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: { deletedAt: null },
		});
		this.logger.log({ msg: "user.soft_delete_cancelled", userId });
	}

	async hardDelete(userId: string): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.authAuditLog.updateMany({
				where: { userId },
				data: { email: null, ipAddress: null, userAgent: null },
			});
			await tx.consentLog.updateMany({
				where: { userId },
				data: { ipAddress: null, userAgent: null },
			});
			await tx.user.delete({ where: { id: userId } });
		});
		this.logger.log({ msg: "user.hard_delete", userId });
	}

	/**
	 * Retorna usuarios soft-deleted ha mais de RETENTION_DAYS dias.
	 * Usado pelo DataRetentionCleanupProcessor.
	 */
	async findExpiredSoftDeletes(now: Date = new Date()): Promise<string[]> {
		const threshold = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
		const rows = await this.prisma.user.findMany({
			where: { deletedAt: { lte: threshold } },
			select: { id: true },
		});
		return rows.map((r) => r.id);
	}
}
