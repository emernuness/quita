import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { ActionStatus, ActionType, Prisma, TargetType } from "@prisma/client";
import {
	type AggregateIncomeInput,
	type ClassifiedDebt,
	type DebtCategoryDefaults,
	type ExpenseCategory,
	type MonthlyPlanDraft,
	type MotorContext,
	type MotorResult,
	type ScoringWeights,
	type TriggerEvent,
	aggregateMonthlyIncome,
	calculatePriorityBatch,
	classifyDebt,
	classifyExpense,
	generateMonthlyPlan,
} from "@quita/motor";
import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Spec: Fase 4 §3 + Fase 3 §14 — orquestrador NestJS.
 *
 * Carrega contexto do DB, resolve dependencias (RegionalMinimumVital,
 * ScoringWeight, agregacao por frequency), chama generateMonthlyPlan
 * (puro), persiste MonthlyActionPlan + RecommendedAction[].
 *
 * Resolve DT-04, DT-05, DT-08, DT-09, DT-16.
 *
 * Funcoes puras em @quita/motor permanecem deterministicas e testaveis
 * isoladamente. TODOS os side effects vivem aqui.
 */
@Injectable()
export class MotorOrchestratorService {
	private readonly logger = new Logger(MotorOrchestratorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async recalculateForUser(
		userId: string,
		triggerEvent: TriggerEvent,
		now: Date = new Date(),
	): Promise<MotorResult<MonthlyPlanDraft>> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { emergencyReserve: true, behaviorProfile: true },
		});
		if (!user) throw new NotFoundException("User not found");

		const referenceMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
		const context: MotorContext = {
			userId,
			referenceMonth,
			triggerEvent,
			triggeredAt: now,
			now,
		};

		const [rawIncomes, rawExpenses, rawDebts, debtCategories, scoringWeightRows, regional] =
			await Promise.all([
				this.prisma.income.findMany({ where: { userId, isActive: true } }),
				this.prisma.expense.findMany({ where: { userId, isActive: true } }),
				this.prisma.debt.findMany({
					where: { userId, status: { not: "paid" } },
					include: { category: true },
				}),
				this.prisma.debtCategory.findMany(),
				this.prisma.scoringWeight.findMany(),
				this.findRegionalMinimumVital(user.stateCode),
			]);

		const minimumVitalRegional = computeMinimumVital(regional, user.dependentsCount ?? 0);

		const incomeAgg = aggregateMonthlyIncome(
			rawIncomes.map<AggregateIncomeInput>((i) => ({
				id: i.id,
				amount: Number(i.amount),
				frequency: (i.frequency ?? "recurring") as AggregateIncomeInput["frequency"],
				dueDate: i.dueDate,
				installments: i.installments,
				installmentAmount: i.installmentAmount ? Number(i.installmentAmount) : null,
				guaranteedAmount: i.guaranteedAmount ? Number(i.guaranteedAmount) : null,
				stabilityType: i.stabilityType,
			})),
			{ referenceMonth },
		);

		const weights: ScoringWeights = {};
		for (const w of scoringWeightRows) {
			weights[w.factorKey] = { weight: Number(w.weight), isPositive: w.isPositive };
		}

		const categoryBySlug = new Map<string, DebtCategoryDefaults>(
			debtCategories.map((c) => [
				c.slug,
				{
					slug: c.slug,
					affectsSurvivalDefault: c.affectsSurvivalDefault,
					affectsIncomeDefault: c.affectsIncomeDefault,
					hasLegalRiskDefault: c.hasLegalRiskDefault,
				},
			]),
		);

		const classifiedExpenses = rawExpenses.map((e) =>
			classifyExpense({
				category: e.category as ExpenseCategory,
				isEssential: e.isEssential,
				isIncomeRelated: e.isIncomeRelated,
				isLegalObligation: e.isLegalObligation,
				canReduce: e.canReduce,
				canCancel: e.canCancel,
				consequenceIfUnpaid: e.consequenceIfUnpaid,
				dataConfidence: e.dataConfidence,
			}),
		);

		const essentials = rawExpenses
			.filter((_, i) => classifiedExpenses[i].isEssential)
			.map((e) => ({ amount: Number(e.amount) }));
		const seasonalExpenses = rawExpenses
			.filter((e) => e.frequency !== "monthly" && e.monthlyProvision !== null)
			.map((e) => ({ amount: Number(e.amount), monthlyProvision: Number(e.monthlyProvision) }));
		const incomeProtective = rawExpenses
			.filter((_, i) => classifiedExpenses[i].isIncomeRelated)
			.map((e) => ({ amount: Number(e.amount) }));
		const legals = rawExpenses
			.filter((_, i) => classifiedExpenses[i].isLegalObligation)
			.map((e) => ({ amount: Number(e.amount) }));

		const classifiedDebts: ClassifiedDebt[] = rawDebts.map((d) => {
			const cat = categoryBySlug.get(d.category.slug) ?? {
				slug: d.category.slug,
				affectsSurvivalDefault: false,
				affectsIncomeDefault: false,
				hasLegalRiskDefault: false,
			};
			const meta = classifyDebt(
				{
					categorySlug: d.category.slug,
					affectsSurvival: d.affectsSurvival,
					affectsIncome: d.affectsIncome,
					hasLegalRisk: d.hasLegalRisk,
					interestRateMonthly: d.interestRateMonthly ? Number(d.interestRateMonthly) : null,
					dataConfidence: d.dataConfidence,
				},
				cat,
			);
			return {
				id: d.id,
				totalAmount: Number(d.totalAmount),
				amountPaid: Number(d.amountPaid),
				monthlyAmount: d.monthlyAmount ? Number(d.monthlyAmount) : null,
				hasInterest: !!d.hasInterest,
				interestRateMonthly: meta.interestRateMonthly,
				daysOverdue: d.daysOverdue,
				installmentsOverdue: d.installmentsOverdue,
				affectsSurvival: meta.affectsSurvival,
				affectsIncome: meta.affectsIncome,
				hasLegalRisk: meta.hasLegalRisk,
				collateralType: d.collateralType,
				settlementCashAmount: d.settlementCashAmount ? Number(d.settlementCashAmount) : null,
				settlementInstallmentAmount: d.settlementInstallmentAmount
					? Number(d.settlementInstallmentAmount)
					: null,
			};
		});

		const debtsTotalMonthlyAmount = classifiedDebts.reduce(
			(acc, d) => acc + (d.monthlyAmount ?? 0),
			0,
		);
		const debtsTotalRemaining = classifiedDebts.reduce(
			(acc, d) => acc + Math.max(0, d.totalAmount - d.amountPaid),
			0,
		);
		const hasCriticalRiskDebt = classifiedDebts.some(
			(d) => d.affectsSurvival || d.affectsIncome || d.hasLegalRisk,
		);
		const smallDebtsCount = classifiedDebts.filter(
			(d) => d.totalAmount - d.amountPaid < 1000,
		).length;
		const highInterestDebtsCount = classifiedDebts.filter(
			(d) => (d.interestRateMonthly ?? 0) > 0.05,
		).length;

		const result = generateMonthlyPlan({
			context,
			capacity: {
				incomeNetMonthly: incomeAgg.total,
				essentials,
				seasonalExpenses,
				incomeProtective,
				legals,
				minimumVitalRegional,
				emergencyReserveMonthlyTarget: user.emergencyReserve?.monthlyTarget
					? Number(user.emergencyReserve.monthlyTarget)
					: 0,
			},
			debts: classifiedDebts,
			debtsTotalMonthlyAmount,
			debtsTotalRemaining,
			hasCriticalRiskDebt,
			diagnosisLevel: user.diagnosisLevel,
			preferredStrategy: user.behaviorProfile?.preferredStrategy ?? null,
			smallDebtsCount,
			highInterestDebtsCount,
		});

		if (Object.keys(weights).length > 0) {
			// Re-score com pesos vivos do DB (DT-09).
			result.data.priorities = calculatePriorityBatch(
				classifiedDebts,
				{
					safeCapacity: result.data.capacity.safeCapacity,
					financialState: result.data.financialState,
				},
				weights,
			);
		}

		const persisted = await this.persistPlan(userId, referenceMonth, result.data, classifiedDebts);

		this.logger.log({
			msg: "motor.recalculated",
			userId,
			triggerEvent,
			state: result.data.financialState,
			mode: result.data.operationMode,
			planId: persisted.planId,
		});

		return result;
	}

	private async findRegionalMinimumVital(stateCode: string | null) {
		const lookup = await this.prisma.regionalMinimumVital.findFirst({
			where: { stateCode: stateCode ?? "BR" },
			orderBy: { effectiveDate: "desc" },
		});
		if (lookup) return lookup;
		return this.prisma.regionalMinimumVital.findFirst({
			where: { stateCode: "BR" },
			orderBy: { effectiveDate: "desc" },
		});
	}

	private async persistPlan(
		userId: string,
		referenceMonth: Date,
		draft: MonthlyPlanDraft,
		debts: ClassifiedDebt[],
	): Promise<{ planId: string }> {
		const fullDebts = await this.prisma.debt.findMany({
			where: { id: { in: debts.map((d) => d.id) } },
			select: { id: true, creditor: true },
		});
		const debtCreditorById = new Map(fullDebts.map((d) => [d.id, d.creditor]));

		const planData = {
			financialState: draft.financialState,
			operationMode: draft.operationMode,
			incomeNetMonthly: draft.capacity.incomeNetMonthly,
			essentialsTotal: draft.capacity.essentialsTotal,
			seasonalProvisionTotal: draft.capacity.seasonalProvisionTotal,
			incomeProtectiveTotal: draft.capacity.incomeProtectiveTotal,
			legalsTotal: draft.capacity.legalsTotal,
			minimumVital: draft.capacity.minimumVital,
			emergencyReserveContribution: draft.capacity.emergencyReserveContribution,
			safeCapacity: draft.capacity.safeCapacity,
			mainGoal: draft.mainGoal,
			warnings: draft.priorities.map((p) => p.reason) as Prisma.InputJsonValue,
			isActive: true,
			generatedAt: new Date(),
		};

		const plan = await this.prisma.monthlyActionPlan.upsert({
			where: { userId_referenceMonth: { userId, referenceMonth } },
			update: planData,
			create: { userId, referenceMonth, ...planData },
		});

		// DT-16: reconciliacao in-place — descarta acoes pendentes do mes
		// anterior e cria as novas. Acoes completed sao preservadas.
		await this.prisma.recommendedAction.deleteMany({
			where: { planId: plan.id, status: { not: "completed" } },
		});

		for (const action of draft.actions) {
			const targetLabel = action.targetDebtId
				? (debtCreditorById.get(action.targetDebtId) ?? action.targetLabel)
				: action.targetLabel;
			await this.prisma.recommendedAction.create({
				data: {
					planId: plan.id,
					order: action.order,
					actionType: action.actionType as ActionType,
					targetType: (action.targetDebtId ? "debt" : "general") as TargetType,
					targetDebtId: action.targetDebtId,
					targetLabel,
					amount: action.amount,
					reason: action.reason,
					dataConfidence: "medium",
					status: "pending" as ActionStatus,
				},
			});
		}

		// Cache priorityScore + priorityReason nas Debts (consulta hot path).
		for (const p of draft.priorities) {
			await this.prisma.debt.update({
				where: { id: p.debtId },
				data: { priorityScore: p.score, priorityReason: p.reason },
			});
		}

		return { planId: plan.id };
	}
}

function computeMinimumVital(
	regional: {
		baseAmountSingle: { toNumber(): number };
		basePerDependent: { toNumber(): number };
	} | null,
	dependents: number,
): number {
	if (!regional) return 1320; // fallback nacional defensivo
	return regional.baseAmountSingle.toNumber() + regional.basePerDependent.toNumber() * dependents;
}
