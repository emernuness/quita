import { Injectable, Logger } from "@nestjs/common";
import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Hard delete LGPD-compliant (DT-11 + Fase 6 §16).
 *
 * Quando usuario solicita exclusao da conta (art. 18, IV LGPD):
 * 1. AuthAuditLog.email é nulado (cascade SetNull mantem userId mas
 *    nao apaga email — fix manual aqui antes do delete).
 * 2. User é deletado (cascade apaga Income/Expense/Debt/Plans/...).
 *
 * Refresh tokens, audit logs e snapshots financeiros têm onDelete
 * Cascade ou SetNull conforme schema — esta funcao garante que o
 * email (PII direta) seja eliminado do audit log.
 */
@Injectable()
export class UserDeletionService {
	private readonly logger = new Logger(UserDeletionService.name);

	constructor(private readonly prisma: PrismaService) {}

	async hardDelete(userId: string): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			// 1. Anonimiza email nos audit logs ANTES do delete.
			//    Sem isso, cascade SetNull deixa email vazado.
			await tx.authAuditLog.updateMany({
				where: { userId },
				data: { email: null, ipAddress: null, userAgent: null },
			});

			// 2. Tambem nula campos identificaveis em ConsentLog
			//    (LGPD: opcionalmente preservamos a versao aceita).
			await tx.consentLog.updateMany({
				where: { userId },
				data: { ipAddress: null, userAgent: null },
			});

			// 3. Delete do user — cascade apaga relacionamentos diretos.
			await tx.user.delete({ where: { id: userId } });
		});

		this.logger.log({ msg: "user.hard_delete", userId });
	}
}
