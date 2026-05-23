import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	async getDashboard(userId: string) {
		const [incomes, expenses, debts] = await Promise.all([
			this.prisma.income.findMany({
				where: { userId, isActive: true },
			}),
			this.prisma.expense.findMany({
				where: { userId, isActive: true },
			}),
			this.prisma.debt.findMany({
				where: { userId },
				include: { category: true },
				orderBy: { priorityOrder: "asc" },
			}),
		]);

		const totalIncome = incomes.reduce((sum, i) => sum + i.amount.toNumber(), 0);
		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
		const monthlyBalance = totalIncome - totalExpenses;
		const surplusForDebts = Math.max(0, monthlyBalance);

		const debtsCount = debts.length;
		const paidDebtsCount = debts.filter((d) => d.status === "paid").length;
		const progressPercent = debtsCount > 0 ? (paidDebtsCount / debtsCount) * 100 : 0;

		const totalDebt = debts
			.filter((d) => d.status !== "paid")
			.reduce((sum, d) => sum + (d.totalAmount.toNumber() - d.amountPaid.toNumber()), 0);

		const topDebts = debts.slice(0, 5).map((d) => ({
			...d,
			totalAmount: d.totalAmount.toNumber(),
			amountPaid: d.amountPaid.toNumber(),
			interestSaved: d.interestSaved?.toNumber() ?? null,
		}));

		return {
			totalDebt,
			totalIncome,
			totalExpenses,
			monthlyBalance,
			surplusForDebts,
			debtsCount,
			paidDebtsCount,
			progressPercent: Math.round(progressPercent * 100) / 100,
			debts: topDebts,
		};
	}
}
