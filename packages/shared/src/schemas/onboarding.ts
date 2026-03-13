import { z } from 'zod';
import { DebtStatus } from '../enums/index.js';

export const onboardingIncomeSchema = z.object({
  salary: z.number().nonnegative(),
  extra: z.number().nonnegative().optional(),
  help: z.number().nonnegative().optional(),
});
export type OnboardingIncomeInput = z.infer<typeof onboardingIncomeSchema>;

export const onboardingDebtCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1),
});
export type OnboardingDebtCategoriesInput = z.infer<
  typeof onboardingDebtCategoriesSchema
>;

export const onboardingDebtSchema = z.object({
  categoryId: z.string().uuid(),
  creditor: z.string().min(1),
  totalAmount: z.number().positive(),
  hasInterest: z.boolean().optional(),
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
