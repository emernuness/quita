import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
	ExpenseCategory as PrismaExpenseCategory,
	FinancialType as PrismaFinancialType,
	IncomeSource as PrismaIncomeSource,
} from "@prisma/client";
import type {
	CreateExpenseInput,
	CreateIncomeInput,
	UpdateExpenseInput,
	UpdateIncomeInput,
} from "@quita/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FinancialService {
	constructor(private readonly prisma: PrismaService) {}

	async getSummary(userId: string) {
		const [incomes, expenses] = await Promise.all([
			this.prisma.income.findMany({
				where: { userId, isActive: true },
			}),
			this.prisma.expense.findMany({
				where: { userId, isActive: true },
			}),
		]);

		const totalIncome = incomes.reduce((sum, i) => sum + i.amount.toNumber(), 0);
		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
		const balance = totalIncome - totalExpenses;

		return { totalIncome, totalExpenses, balance };
	}

	// --- Incomes ---

	async listIncomes(userId: string) {
		const incomes = await this.prisma.income.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		return incomes.map((i) => ({
			...i,
			amount: i.amount.toNumber(),
			installmentAmount: i.installmentAmount?.toNumber() ?? null,
		}));
	}

	async createIncome(userId: string, data: CreateIncomeInput) {
		const income = await this.prisma.income.create({
			data: {
				userId,
				name: data.name,
				amount: data.amount,
				type: data.type as PrismaFinancialType,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				installments: data.installments,
				installmentAmount: data.installmentAmount,
				sourceCategory: data.sourceCategory as PrismaIncomeSource,
			},
		});

		return {
			...income,
			amount: income.amount.toNumber(),
			installmentAmount: income.installmentAmount?.toNumber() ?? null,
		};
	}

	async updateIncome(userId: string, id: string, data: UpdateIncomeInput) {
		const income = await this.prisma.income.findUnique({ where: { id } });

		if (!income) throw new NotFoundException("Income not found");
		if (income.userId !== userId) throw new ForbiddenException("Not your resource");

		const updated = await this.prisma.income.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.amount !== undefined && { amount: data.amount }),
				...(data.type !== undefined && { type: data.type as PrismaFinancialType }),
				...(data.dueDate !== undefined && {
					dueDate: data.dueDate ? new Date(data.dueDate) : null,
				}),
				...(data.installments !== undefined && {
					installments: data.installments,
				}),
				...(data.installmentAmount !== undefined && {
					installmentAmount: data.installmentAmount,
				}),
				...(data.sourceCategory !== undefined && {
					sourceCategory: data.sourceCategory as PrismaIncomeSource,
				}),
			},
		});

		return {
			...updated,
			amount: updated.amount.toNumber(),
			installmentAmount: updated.installmentAmount?.toNumber() ?? null,
		};
	}

	async deleteIncome(userId: string, id: string) {
		const income = await this.prisma.income.findUnique({ where: { id } });

		if (!income) throw new NotFoundException("Income not found");
		if (income.userId !== userId) throw new ForbiddenException("Not your resource");

		await this.prisma.income.delete({ where: { id } });

		return { deleted: true };
	}

	// --- Expenses ---

	async listExpenses(userId: string) {
		const expenses = await this.prisma.expense.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		return expenses.map((e) => ({
			...e,
			amount: e.amount.toNumber(),
			installmentAmount: e.installmentAmount?.toNumber() ?? null,
		}));
	}

	async createExpense(userId: string, data: CreateExpenseInput) {
		const expense = await this.prisma.expense.create({
			data: {
				userId,
				name: data.name,
				amount: data.amount,
				type: data.type as PrismaFinancialType,
				category: data.category as PrismaExpenseCategory,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				installments: data.installments,
				installmentAmount: data.installmentAmount,
			},
		});

		return {
			...expense,
			amount: expense.amount.toNumber(),
			installmentAmount: expense.installmentAmount?.toNumber() ?? null,
		};
	}

	async updateExpense(userId: string, id: string, data: UpdateExpenseInput) {
		const expense = await this.prisma.expense.findUnique({ where: { id } });

		if (!expense) throw new NotFoundException("Expense not found");
		if (expense.userId !== userId) throw new ForbiddenException("Not your resource");

		const updated = await this.prisma.expense.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.amount !== undefined && { amount: data.amount }),
				...(data.type !== undefined && { type: data.type as PrismaFinancialType }),
				...(data.category !== undefined && {
					category: data.category as PrismaExpenseCategory,
				}),
				...(data.dueDate !== undefined && {
					dueDate: data.dueDate ? new Date(data.dueDate) : null,
				}),
				...(data.installments !== undefined && {
					installments: data.installments,
				}),
				...(data.installmentAmount !== undefined && {
					installmentAmount: data.installmentAmount,
				}),
			},
		});

		return {
			...updated,
			amount: updated.amount.toNumber(),
			installmentAmount: updated.installmentAmount?.toNumber() ?? null,
		};
	}

	async deleteExpense(userId: string, id: string) {
		const expense = await this.prisma.expense.findUnique({ where: { id } });

		if (!expense) throw new NotFoundException("Expense not found");
		if (expense.userId !== userId) throw new ForbiddenException("Not your resource");

		await this.prisma.expense.delete({ where: { id } });

		return { deleted: true };
	}
}
