import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { TriggerEvent } from "@quita/motor";
import type { Job } from "bullmq";
import { MotorOrchestratorService } from "../../modules/motor/motor-orchestrator.service";
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
 */
@Processor(MOTOR_RECALC_QUEUE)
export class RecalculateStateProcessor extends WorkerHost {
	private readonly logger = new Logger(RecalculateStateProcessor.name);

	constructor(private readonly motor: MotorOrchestratorService) {
		super();
	}

	async process(job: Job<RecalculateStateJobData>): Promise<{ ok: true }> {
		const { userId, triggerEvent } = job.data;
		this.logger.log({ msg: "recalculate_state.start", userId, triggerEvent });
		await this.motor.recalculateForUser(userId, triggerEvent);
		this.logger.log({ msg: "recalculate_state.done", userId });
		return { ok: true };
	}
}
