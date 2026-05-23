import { Injectable } from "@nestjs/common";
import type { NotificationCategory, NotificationSeverity } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";

export interface CreateNotificationInput {
	userId: string;
	category: NotificationCategory;
	severity?: NotificationSeverity;
	title: string;
	body: string;
	linkUrl?: string;
}

/**
 * Spec Fase 5 §10 + Fase 1 §9.4 — notificacoes in-app.
 *
 * Regras de tom (aplicadas pelo chamador):
 * - Frequencia: max 2-3/semana por categoria
 * - Janela: 9-21h local do user (futuro: scheduler diff timezone)
 * - Sem gatilho de medo: tom sobrio, factual
 *
 * Categorias prioritarias:
 * - motor_recalc: plano recalculado
 * - due_date: dividas com vencimento proximo
 * - payment_recorded: confirmacao pos-pagamento
 * - goal_progress: marco de meta
 * - weekly_progress: resumo semanal
 * - risk_alert: vencimento juridico iminente
 * - settlement_evaluated: nova avaliacao OCR/manual
 */
@Injectable()
export class NotificationsService {
	constructor(private readonly prisma: PrismaService) {}

	list(userId: string, opts: { unreadOnly?: boolean; limit?: number } = {}) {
		return this.prisma.notification.findMany({
			where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
			orderBy: { createdAt: "desc" },
			take: Math.min(opts.limit ?? 50, 100),
		});
	}

	unreadCount(userId: string) {
		return this.prisma.notification.count({ where: { userId, readAt: null } });
	}

	create(input: CreateNotificationInput) {
		return this.prisma.notification.create({
			data: {
				userId: input.userId,
				category: input.category,
				severity: input.severity ?? "info",
				title: input.title,
				body: input.body,
				linkUrl: input.linkUrl ?? null,
			},
		});
	}

	async markRead(userId: string, id: string) {
		const result = await this.prisma.notification.updateMany({
			where: { id, userId, readAt: null },
			data: { readAt: new Date() },
		});
		return { updated: result.count };
	}

	async markAllRead(userId: string) {
		const result = await this.prisma.notification.updateMany({
			where: { userId, readAt: null },
			data: { readAt: new Date() },
		});
		return { updated: result.count };
	}
}
