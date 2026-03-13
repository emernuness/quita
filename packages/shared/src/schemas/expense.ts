import { z } from "zod";
import { ExpenseCategory, FinancialType } from "../enums/index.js";

export const createExpenseSchema = z.object({
	name: z.string().min(1),
	amount: z.number().positive(),
	type: z.enum([FinancialType.FIXED, FinancialType.ONE_TIME, FinancialType.RECURRING]),
	category: z.enum([
		ExpenseCategory.HOUSING,
		ExpenseCategory.BILLS,
		ExpenseCategory.FOOD,
		ExpenseCategory.TRANSPORT,
		ExpenseCategory.TELECOM,
		ExpenseCategory.OTHER,
	]),
	dueDate: z.string().date().optional(),
	installments: z.number().int().positive().optional(),
	installmentAmount: z.number().positive().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
