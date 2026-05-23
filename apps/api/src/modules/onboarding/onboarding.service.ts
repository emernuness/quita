import { Injectable } from "@nestjs/common";
import type {
	DebtNature as PrismaDebtNature,
	DebtStatus as PrismaDebtStatus,
	ExpenseCategory as PrismaExpenseCategory,
	IncomeSource as PrismaIncomeSource,
	MainConcern as PrismaMainConcern,
} from "@prisma/client";
import type {
	OnboardingConcernInput,
	OnboardingDebtCategoriesInput,
	OnboardingDebtInput,
	OnboardingExpensesInput,
	OnboardingIncomeInput,
	OnboardingLocationInput,
} from "@quita/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { MotorTriggerService } from "../../queues/motor-trigger.service";

@Injectable()
export class OnboardingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly motorTrigger: MotorTriggerService,
	) {}

	async saveIncome(userId: string, data: OnboardingIncomeInput) {
		// Spec Fase 1 §6.1.1 passo 2: renda + paymentDay + stabilityType + guaranteedAmount.
		// stabilityType/paymentDay aplicam apenas ao salario (principal). Extra/help
		// herdam stabilityType=stable por default Prisma.
		const incomes: {
			name: string;
			amount: number;
			sourceCategory: string;
			paymentDay?: number;
			stabilityType?: "stable" | "variable" | "seasonal";
			guaranteedAmount?: number;
		}[] = [];

		if (data.salary > 0) {
			incomes.push({
				name: "Salário",
				amount: data.salary,
				sourceCategory: "salary",
				paymentDay: data.paymentDay,
				stabilityType: data.stabilityType,
				guaranteedAmount: data.guaranteedAmount,
			});
		}
		if (data.extra && data.extra > 0) {
			incomes.push({
				name: "Renda Extra",
				amount: data.extra,
				sourceCategory: "extra",
			});
		}
		if (data.help && data.help > 0) {
			incomes.push({
				name: "Ajuda",
				amount: data.help,
				sourceCategory: "help",
			});
		}

		await this.prisma.$transaction([
			this.prisma.income.deleteMany({ where: { userId } }),
			...incomes.map((income) =>
				this.prisma.income.create({
					data: {
						userId,
						name: income.name,
						amount: income.amount,
						type: "fixed",
						sourceCategory: income.sourceCategory as PrismaIncomeSource,
						...(income.paymentDay !== undefined && { paymentDay: income.paymentDay }),
						...(income.stabilityType !== undefined && { stabilityType: income.stabilityType }),
						...(income.guaranteedAmount !== undefined && {
							guaranteedAmount: income.guaranteedAmount,
						}),
					},
				}),
			),
			this.prisma.user.update({
				where: { id: userId },
				data: { onboardingStep: 1 },
			}),
		]);

		return { step: 1 };
	}

	async saveCategories(userId: string, data: OnboardingDebtCategoriesInput) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { onboardingStep: 2 },
		});

		return { step: 2, categoryIds: data.categoryIds };
	}

	async saveDebts(userId: string, debts: OnboardingDebtInput[]) {
		await this.prisma.$transaction([
			this.prisma.debt.deleteMany({ where: { userId } }),
			...debts.map((debt) =>
				this.prisma.debt.create({
					data: {
						userId,
						categoryId: debt.categoryId,
						creditor: debt.creditor,
						nature: debt.nature as PrismaDebtNature,
						totalAmount: debt.totalAmount,
						monthlyAmount: debt.monthlyAmount ?? undefined,
						daysOverdue: (debt as { daysOverdue?: number }).daysOverdue ?? 0,
						totalInstallments: debt.totalInstallments ?? undefined,
						currentInstallment: debt.currentInstallment ?? undefined,
						hasInterest: debt.hasInterest,
						dueDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
						status: debt.status as PrismaDebtStatus,
					},
				}),
			),
			this.prisma.user.update({
				where: { id: userId },
				data: { onboardingStep: 3 },
			}),
		]);

		return { step: 3 };
	}

	async saveExpenses(userId: string, data: OnboardingExpensesInput) {
		const expenses: { name: string; amount: number; category: string }[] = [];

		const categoryMap: Record<string, string> = {
			housing: "Moradia",
			bills: "Contas",
			food: "Alimentação",
			transport: "Transporte",
			telecom: "Telecomunicações",
		};

		for (const [key, label] of Object.entries(categoryMap)) {
			const value = data[key as keyof OnboardingExpensesInput];
			if (value && value > 0) {
				expenses.push({ name: label, amount: value, category: key });
			}
		}

		await this.prisma.$transaction([
			this.prisma.expense.deleteMany({ where: { userId } }),
			...expenses.map((expense) =>
				this.prisma.expense.create({
					data: {
						userId,
						name: expense.name,
						amount: expense.amount,
						type: "fixed",
						category: expense.category as PrismaExpenseCategory,
					},
				}),
			),
			this.prisma.user.update({
				where: { id: userId },
				data: { onboardingStep: 4 },
			}),
		]);

		return { step: 4 };
	}

	async saveLocation(userId: string, data: OnboardingLocationInput) {
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				stateCode: data.stateCode,
				dependentsCount: data.dependentsCount ?? 0,
			},
		});
		return { saved: true };
	}

	async saveConcern(userId: string, data: OnboardingConcernInput) {
		// Cria/atualiza BehaviorProfile com mainConcern. Refinamento posterior
		// preenche preferredStrategy e promove diagnosisLevel para 'basic'.
		await this.prisma.behaviorProfile.upsert({
			where: { userId },
			create: {
				userId,
				mainConcern: data.mainConcern as PrismaMainConcern,
				preferredStrategy: "undecided",
			},
			update: { mainConcern: data.mainConcern as PrismaMainConcern },
		});
		return { saved: true };
	}

	async complete(userId: string) {
		// Fase 1 §7.1 — onboarding fracionado: completar minimo seta
		// diagnosisLevel='minimal'. Refinamento posterior em /refinar
		// promove para 'basic' ou 'detailed' conforme dados extras.
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				onboardingCompleted: true,
				diagnosisLevel: "minimal",
			} as never,
		});

		// Dispara primeiro recalculo do motor — Espelho pos-onboarding
		// precisa de plano gerado (spec Fase 1 §6.2).
		await this.motorTrigger.enqueue(userId, "manual_recalc");

		return { completed: true };
	}
}
