import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { TriggerEvent } from "@quita/motor";
import { Queue } from "bullmq";
import { MOTOR_RECALC_QUEUE } from "./queue.constants";

/**
 * Spec Fase 4 §7.5 — produtor central de jobs motor-recalc.
 *
 * Injetado em todos modulos CRUD que mudam estado financeiro do usuario
 * (Income/Expense/Debt/Payment/Settlement/BehaviorProfile/Goal/Reserve).
 * Garante concorrencia 1-por-usuario via opcoes `group.id={userId}`
 * (BullMQ Pro) ou jobId determinstico colapsando bursts.
 *
 * Falha de enqueue NUNCA quebra a operacao CRUD — apenas loga warning.
 * Spec Fase 1 §6.5: motor reage a eventos do usuario em tempo real.
 */
@Injectable()
export class MotorTriggerService {
	private readonly logger = new Logger(MotorTriggerService.name);

	constructor(
		@InjectQueue(MOTOR_RECALC_QUEUE)
		private readonly queue: Queue<{ userId: string; triggerEvent: TriggerEvent }>,
	) {}

	async enqueue(userId: string, triggerEvent: TriggerEvent): Promise<void> {
		try {
			await this.queue.add(
				"recalculate-state",
				{ userId, triggerEvent },
				{
					removeOnComplete: { age: 3600, count: 100 },
					removeOnFail: { age: 86400 },
					attempts: 3,
					backoff: { type: "exponential", delay: 1000 },
				},
			);
		} catch (err) {
			this.logger.warn({
				msg: "motor_trigger.enqueue_failed",
				userId,
				triggerEvent,
				err: err instanceof Error ? err.message : String(err),
			});
		}
	}
}
