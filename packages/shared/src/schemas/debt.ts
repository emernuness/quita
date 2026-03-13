import { z } from "zod";
import { DebtStatus } from "../enums/index.js";

export const createDebtSchema = z.object({
	categoryId: z.string().uuid(),
	creditor: z.string().min(1),
	totalAmount: z.number().positive(),
	hasInterest: z.boolean().optional(),
	dueDate: z.string().date().optional(),
	status: z
		.enum([DebtStatus.ON_TIME, DebtStatus.OVERDUE, DebtStatus.RENEGOTIATED, DebtStatus.PAID])
		.default(DebtStatus.ON_TIME),
});
export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtSchema = createDebtSchema.partial();
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
