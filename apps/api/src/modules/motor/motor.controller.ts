import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MotorOrchestratorService } from "./motor-orchestrator.service";

@Controller("motor")
@UseGuards(JwtAuthGuard)
export class MotorController {
	constructor(
		private readonly motor: MotorOrchestratorService,
		private readonly prisma: PrismaService,
	) {}

	/**
	 * Retorna o plano mensal ativo do usuario, recalculando se nao existir
	 * ou estiver stale (mais de 24h sem atualizar).
	 */
	@Get("plan")
	async getPlan(@CurrentUser("id") userId: string) {
		const referenceMonth = startOfCurrentMonthUTC();
		const existing = await this.prisma.monthlyActionPlan.findUnique({
			where: { userId_referenceMonth: { userId, referenceMonth } },
			include: { actions: { orderBy: { order: "asc" } } },
		});

		if (existing && !isStale(existing.updatedAt)) {
			return serializePlan(existing);
		}

		const fresh = await this.motor.recalculateForUser(userId, "manual_recalc");
		const persisted = await this.prisma.monthlyActionPlan.findUnique({
			where: { userId_referenceMonth: { userId, referenceMonth } },
			include: { actions: { orderBy: { order: "asc" } } },
		});
		if (!persisted) {
			return {
				financialState: fresh.data.financialState,
				operationMode: fresh.data.operationMode,
				safeCapacity: fresh.data.capacity.safeCapacity,
				mainGoal: fresh.data.mainGoal,
				actions: fresh.data.actions,
				warnings: fresh.warnings,
			};
		}
		return serializePlan(persisted);
	}

	/**
	 * Forca um recalculo do motor (custoso — usar com parcimonia).
	 */
	@Post("recalculate")
	@Throttle({ default: { limit: 3, ttl: 60_000 } })
	async recalculate(@CurrentUser("id") userId: string) {
		const result = await this.motor.recalculateForUser(userId, "manual_recalc");
		return {
			financialState: result.data.financialState,
			operationMode: result.data.operationMode,
			strategy: result.data.strategy,
			safeCapacity: result.data.capacity.safeCapacity,
			mainGoal: result.data.mainGoal,
			actionsCount: result.data.actions.length,
			warnings: result.warnings,
		};
	}
}

function startOfCurrentMonthUTC(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
function isStale(updatedAt: Date): boolean {
	return Date.now() - updatedAt.getTime() > STALE_THRESHOLD_MS;
}

function serializePlan(plan: {
	id: string;
	financialState: string;
	operationMode: string;
	safeCapacity: { toNumber(): number };
	incomeNetMonthly: { toNumber(): number };
	essentialsTotal: { toNumber(): number };
	mainGoal: string;
	warnings: unknown;
	updatedAt: Date;
	actions: Array<{
		id: string;
		order: number;
		actionType: string;
		targetDebtId: string | null;
		targetLabel: string;
		amount: { toNumber(): number } | null;
		reason: string;
		status: string;
	}>;
}) {
	return {
		id: plan.id,
		financialState: plan.financialState,
		operationMode: plan.operationMode,
		safeCapacity: plan.safeCapacity.toNumber(),
		incomeNetMonthly: plan.incomeNetMonthly.toNumber(),
		essentialsTotal: plan.essentialsTotal.toNumber(),
		mainGoal: plan.mainGoal,
		warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
		updatedAt: plan.updatedAt.toISOString(),
		actions: plan.actions.map((a) => ({
			id: a.id,
			order: a.order,
			actionType: a.actionType,
			targetDebtId: a.targetDebtId,
			targetLabel: a.targetLabel,
			amount: a.amount ? a.amount.toNumber() : null,
			reason: a.reason,
			status: a.status,
		})),
	};
}
