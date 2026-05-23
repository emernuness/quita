import { z } from "zod";
import { DebtNature, DebtStatus } from "../enums/index.js";

export const onboardingIncomeSchema = z.object({
	salary: z.number().positive("Informe sua renda principal"),
	extra: z.number().nonnegative().optional(),
	help: z.number().nonnegative().optional(),
});
export type OnboardingIncomeInput = z.infer<typeof onboardingIncomeSchema>;

export const onboardingDebtCategoriesSchema = z.object({
	categoryIds: z.array(z.string().uuid()).min(1),
});
export type OnboardingDebtCategoriesInput = z.infer<typeof onboardingDebtCategoriesSchema>;

export const onboardingDebtSchema = z.object({
	categoryId: z.string().uuid(),
	creditor: z.string().min(1),
	nature: z.enum([DebtNature.INSTALLMENT, DebtNature.RECURRING, DebtNature.ONE_TIME]),
	totalAmount: z.number().positive(),
	monthlyAmount: z.number().nonnegative().optional(),
	daysOverdue: z.number().int().min(0).max(3650).optional(),
	totalInstallments: z.number().int().min(1).max(600).optional(),
	currentInstallment: z.number().int().min(1).max(600).optional(),
	hasInterest: z.boolean().nullable().optional(),
	dueDate: z.string().date().optional(),
	status: z.enum([
		DebtStatus.ON_TIME,
		DebtStatus.OVERDUE,
		DebtStatus.RENEGOTIATED,
		DebtStatus.PAID,
	]),
});
export type OnboardingDebtInput = z.infer<typeof onboardingDebtSchema>;

export const onboardingExpensesSchema = z.object({
	housing: z.number().nonnegative().optional(),
	bills: z.number().nonnegative().optional(),
	food: z.number().nonnegative().optional(),
	transport: z.number().nonnegative().optional(),
	telecom: z.number().nonnegative().optional(),
});
export type OnboardingExpensesInput = z.infer<typeof onboardingExpensesSchema>;
