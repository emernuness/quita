import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { TriggerEvent } from "@quita/motor";
import type { Job } from "bullmq";
import type { MotorOrchestratorService } from "../../modules/motor/motor-orchestrator.service";
import type { NotificationsService } from "../../modules/notifications/notifications.service";
import { MOTOR_RECALC_QUEUE } from "../queue.constants";

export interface RecalculateStateJobData {
	userId: string;
	triggerEvent: TriggerEvent;
}

/**
 * Spec Fase 4 §7.5 — RecalculateStateProcessor.
 *
 * Disparado por eventos CRUD (income/expense/debt added/updated/removed,
 * payment_recorded, etc.). Recalcula o plano mensal do usuario.
 * Concorrencia 1 por usuario via groupId={userId} ao enfileirar.
 *
 * Pos-recalculo: emite notificacao in-app quando o trigger e relevante
 * (manual_recalc, debt/income/expense alterado, payment). Eventos de
 * leitura/scheduled silenciosos (data_freshness_review etc.).
 */
@Processor(MOTOR_RECALC_QUEUE)
export class RecalculateStateProcessor extends WorkerHost {
	private readonly logger = new Logger(RecalculateStateProcessor.name);

	private static readonly NOTIFY_EVENTS = new Set<TriggerEvent>([
		"manual_recalc",
		"debt_added",
		"debt_removed",
		"income_added",
		"income_removed",
		"expense_added",
		"expense_removed",
		"payment_recorded",
		"settlement_evaluated",
		"month_rollover",
	]);

	constructor(
		private readonly motor: MotorOrchestratorService,
		private readonly notifications: NotificationsService,
	) {
		super();
	}

	async process(job: Job<RecalculateStateJobData>): Promise<{ ok: true }> {
		const { userId, triggerEvent } = job.data;
		this.logger.log({ msg: "recalculate_state.start", userId, triggerEvent });
		await this.motor.recalculateForUser(userId, triggerEvent);
		this.logger.log({ msg: "recalculate_state.done", userId });

		if (RecalculateStateProcessor.NOTIFY_EVENTS.has(triggerEvent)) {
			await this.notifications
				.create({
					userId,
					category: "motor_recalc",
					severity: "info",
					title: "Seu plano foi atualizado",
					body: this.bodyFor(triggerEvent),
					linkUrl: "/app/plan",
				})
				.catch((err) => {
					this.logger.warn({
						msg: "recalculate_state.notify_failed",
						err: err instanceof Error ? err.message : String(err),
					});
				});
		}
		return { ok: true };
	}

	private bodyFor(event: TriggerEvent): string {
		switch (event) {
			case "manual_recalc":
				return "Recalculei o plano com os dados mais recentes.";
			case "debt_added":
				return "Nova divida considerada no plano.";
			case "debt_removed":
				return "Divida removida — plano reajustado.";
			case "income_added":
			case "income_removed":
				return "Renda alterada — plano reajustado.";
			case "expense_added":
			case "expense_removed":
				return "Despesa alterada — plano reajustado.";
			case "payment_recorded":
				return "Pagamento registrado. Veja o impacto no plano.";
			case "settlement_evaluated":
				return "Avaliacao de acordo concluida.";
			case "month_rollover":
				return "Plano do novo mes gerado.";
			default:
				return "Plano recalculado.";
		}
	}
}
