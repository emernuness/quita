import { z } from "zod";
import { DebtNature, DebtStatus } from "../enums/index.js";

export const createDebtSchema = z.object({
	categoryId: z.string().uuid(),
	creditor: z.string().min(1),
	nature: z.enum([DebtNature.INSTALLMENT, DebtNature.RECURRING, DebtNature.ONE_TIME]).default(DebtNature.ONE_TIME),
	totalAmount: z.number().positive(),
	monthlyAmount: z.number().nonnegative().optional(),
	overdueMonths: z.number().int().min(1).max(120).optional(),
	totalInstallments: z.number().int().min(1).max(600).optional(),
	currentInstallment: z.number().int().min(1).max(600).optional(),
	hasInterest: z.boolean().nullable().optional(),
	dueDate: z.string().date().optional(),
	status: z
		.enum([DebtStatus.ON_TIME, DebtStatus.OVERDUE, DebtStatus.RENEGOTIATED, DebtStatus.PAID])
		.default(DebtStatus.ON_TIME),
});
export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtSchema = createDebtSchema.partial();
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
