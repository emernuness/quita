import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { evaluateSettlement } from "@quita/motor";
import type { Job } from "bullmq";
import type { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

/**
 * Spec Fase 4 §7.5 — SettlementRevalidationProcessor.
 *
 * Cron semanal (terca 07:00 UTC). Reavalia SettlementEvaluation com
 * proposalDeadline ativo (>= hoje) usando capacidade segura atual do
 * usuario. Se recomendacao mudou (ex: era accept e agora reject por
 * piora financeira), atualiza registro e loga alerta.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "settlement-revalidation" })
export class SettlementRevalidationProcessor extends WorkerHost {
	private readonly logger = new Logger(SettlementRevalidationProcessor.name);

	constructor(private readonly prisma: PrismaService) {
		super();
	}

	async process(job: Job): Promise<{ revalidated: number; changed: number }> {
		if (job.name !== "settlement-revalidation") return { revalidated: 0, changed: 0 };

		const now = new Date();
		const evaluations = await this.prisma.settlementEvaluation.findMany({
			where: { proposalDeadline: { gte: now } },
			include: { debt: true },
		});

		let revalidated = 0;
		let changed = 0;

		for (const ev of evaluations) {
			const plan = await this.prisma.monthlyActionPlan.findFirst({
				where: { userId: ev.userId, isActive: true },
				orderBy: { generatedAt: "desc" },
			});
			if (!plan) continue;

			const safeCapacity = Number(plan.safeCapacity);
			const remaining = Math.max(0, Number(ev.debt.totalAmount) - Number(ev.debt.amountPaid));
			const result = evaluateSettlement({
				debtId: ev.debtId,
				debtRemaining: remaining,
				proposalCashAmount: ev.proposalCashAmount ? Number(ev.proposalCashAmount) : null,
				proposalInstallments: ev.proposalInstallments,
				proposalInstallmentAmount: ev.proposalInstallmentAmount
					? Number(ev.proposalInstallmentAmount)
					: null,
				proposalDeadline: ev.proposalDeadline,
				safeCapacity,
				financialState: plan.financialState,
				now,
			});

			revalidated += 1;
			if (result.recommendation !== ev.recommendation) {
				changed += 1;
				await this.prisma.settlementEvaluation.update({
					where: { id: ev.id },
					data: {
						recommendation: result.recommendation,
						reasoning: result.reasoning,
						capacityAtEvaluation: safeCapacity,
					},
				});
				this.logger.warn({
					msg: "settlement.recommendation_changed",
					id: ev.id,
					from: ev.recommendation,
					to: result.recommendation,
				});
			}
		}

		this.logger.log({ msg: "settlement_revalidation.done", revalidated, changed });
		return { revalidated, changed };
	}
}
