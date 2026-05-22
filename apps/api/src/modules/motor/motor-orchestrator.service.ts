import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
	type ClassifiedDebt,
	type DebtCategoryDefaults,
	type ExpenseCategory,
	type MonthlyPlanDraft,
	type MotorContext,
	type MotorResult,
	type TriggerEvent,
	classifyDebt,
	classifyExpense,
	generateMonthlyPlan,
} from "@quita/motor";
import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Spec: Fase 4 §3 + Fase 3 §14 — orquestrador NestJS.
 *
 * Carrega contexto do DB, chama generateMonthlyPlan (puro), persiste
 * MonthlyActionPlan + RecommendedAction[].
 *
 * Esta classe contem TODOS os side effects do motor. As funcoes puras
 * em @quita/motor permanecem deterministicas e testaveis isoladamente.
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
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new NotFoundException("User not found");

		const referenceMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const context: MotorContext = {
			userId,
			referenceMonth,
			triggerEvent,
			triggeredAt: now,
			now,
		};

		const [rawIncomes, rawExpenses, rawDebts, behaviorProfile, emergencyReserve, debtCategories] =
			await Promise.all([
				this.prisma.income.findMany({ where: { userId, isActive: true } }),
				this.prisma.expense.findMany({ where: { userId, isActive: true } }),
				this.prisma.debt.findMany({
					where: { userId, status: { not: "paid" } },
					include: { category: true },
				}),
				this.prisma.behaviorProfile.findUnique({ where: { userId } }),
				this.prisma.emergencyReserve.findUnique({ where: { userId } }),
				this.prisma.debtCategory.findMany(),
			]);

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

		const incomeNetMonthly = rawIncomes.reduce((acc, i) => acc + Number(i.amount), 0);

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
			.map((e) => ({
				amount: Number(e.amount),
				monthlyProvision: Number(e.monthlyProvision),
			}));
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
				incomeNetMonthly,
				essentials,
				seasonalExpenses,
				incomeProtective,
				legals,
				minimumVitalRegional: 1320, // placeholder até RegionalMinimumVital seed
				emergencyReserveMonthlyTarget: emergencyReserve?.monthlyTarget
					? Number(emergencyReserve.monthlyTarget)
					: 0,
			},
			debts: classifiedDebts,
			debtsTotalMonthlyAmount,
			hasCriticalRiskDebt,
			diagnosisLevel: user.diagnosisLevel,
			preferredStrategy: behaviorProfile?.preferredStrategy ?? null,
			smallDebtsCount,
			highInterestDebtsCount,
		});

		this.logger.log({
			msg: "motor.recalculated",
			userId,
			triggerEvent,
			state: result.data.financialState,
			mode: result.data.operationMode,
		});

		return result;
	}
}
