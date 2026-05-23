import { z } from "zod";
import { DebtNature, DebtStatus } from "../enums/index.js";

/**
 * Debt schema v2 (Fase 2 §5.3 + v2.1 patch).
 *
 * Inclui risco (affectsSurvival/affectsIncome/hasLegalRisk),
 * collateralType, juros, settlement, dataConfidence, dias de atraso
 * granulares (daysOverdue) e parcelas pagas/atrasadas (v2.1).
 */
const COLLATERAL_TYPES = ["none", "vehicle", "property", "salary", "other"] as const;
const CONFIDENCES = ["high", "medium", "low"] as const;

export const createDebtSchema = z.object({
	categoryId: z.string().uuid(),
	creditor: z.string().min(1).max(255),
	nature: z
		.enum([DebtNature.INSTALLMENT, DebtNature.RECURRING, DebtNature.ONE_TIME])
		.default(DebtNature.ONE_TIME),
	totalAmount: z.number().nonnegative(),
	monthlyAmount: z.number().nonnegative().optional(),
	totalInstallments: z.number().int().min(1).max(600).optional(),
	currentInstallment: z.number().int().min(0).max(600).optional(),
	installmentsPaid: z.number().int().min(0).max(600).optional(),
	installmentsOverdue: z.number().int().min(0).max(120).optional(),
	hasInterest: z.boolean().nullable().optional(),
	dueDate: z.string().date().optional(),
	status: z
		.enum([DebtStatus.ON_TIME, DebtStatus.OVERDUE, DebtStatus.RENEGOTIATED, DebtStatus.PAID])
		.default(DebtStatus.ON_TIME),
	// NOVOS v2
	affectsSurvival: z.boolean().optional(),
	affectsIncome: z.boolean().optional(),
	hasLegalRisk: z.boolean().optional(),
	hasCollateral: z.boolean().optional(),
	collateralType: z.enum(COLLATERAL_TYPES).optional(),
	isNegotiable: z.boolean().optional(),
	interestRateMonthly: z.number().min(0).max(50).optional(),
	interestRateAnnual: z.number().min(0).max(1000).optional(),
	settlementCashAmount: z.number().nonnegative().optional(),
	settlementInstallments: z.number().int().min(1).max(60).optional(),
	settlementInstallmentAmount: z.number().nonnegative().optional(),
	settlementDeadline: z.string().date().optional(),
	stressLevel: z.number().int().min(1).max(3).optional(),
	daysOverdue: z.number().int().min(0).optional(),
	dataConfidence: z.enum(CONFIDENCES).optional(),
});
export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtSchema = createDebtSchema.partial();
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
