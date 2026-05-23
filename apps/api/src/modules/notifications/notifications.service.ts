import { Injectable, Logger } from "@nestjs/common";
import type { NotificationCategory, NotificationSeverity } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";

export interface CreateNotificationInput {
	userId: string;
	category: NotificationCategory;
	severity?: NotificationSeverity;
	title: string;
	body: string;
	linkUrl?: string;
	/** Bypass rate-limit (eventos críticos como risk_alert). */
	force?: boolean;
}

// Spec Fase 1 §9.4 — regras de frequência por categoria (max por janela 7d).
const FREQUENCY_LIMITS: Partial<Record<NotificationCategory, number>> = {
	motor_recalc: 3,
	due_date: 5,
	payment_recorded: 10,
	goal_progress: 3,
	weekly_progress: 1,
	risk_alert: 7,
	settlement_evaluated: 5,
	account: 3,
};

// Janela diária 9h-21h SP. Hardcoded MVP (issue #3 notification-tz-per-user).
const QUIET_HOURS_START_SP = 21;
const QUIET_HOURS_END_SP = 9;
const SP_OFFSET_HOURS = -3;

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
	private readonly logger = new Logger(NotificationsService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Spec Fase 1 §9.4 — checa janela 9-21h SP + frequência por categoria.
	 * Retorna { allowed: false, reason } se notification deve ser throttled.
	 *
	 * MVP fixa timezone America/Sao_Paulo (issue #3 notification-tz-per-user).
	 */
	private async checkRules(
		userId: string,
		category: NotificationCategory,
	): Promise<{ allowed: boolean; reason?: string }> {
		// 1. Janela horária SP (9h-21h)
		const nowUtc = new Date();
		const spHour = (nowUtc.getUTCHours() + 24 + SP_OFFSET_HOURS) % 24;
		if (spHour >= QUIET_HOURS_START_SP || spHour < QUIET_HOURS_END_SP) {
			return { allowed: false, reason: "quiet_hours" };
		}

		// 2. Frequência por categoria nos últimos 7 dias
		const limit = FREQUENCY_LIMITS[category];
		if (limit === undefined) return { allowed: true };

		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const count = await this.prisma.notification.count({
			where: { userId, category, createdAt: { gte: sevenDaysAgo } },
		});
		if (count >= limit) {
			return { allowed: false, reason: `frequency_cap (${count}/${limit})` };
		}
		return { allowed: true };
	}

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

	async create(input: CreateNotificationInput) {
		if (!input.force) {
			const check = await this.checkRules(input.userId, input.category);
			if (!check.allowed) {
				this.logger.log({
					msg: "notification.throttled",
					userId: input.userId,
					category: input.category,
					reason: check.reason,
				});
				return null;
			}
		}
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
