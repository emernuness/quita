import { z } from "zod";
import { FinancialType, IncomeSource } from "../enums/index.js";

/**
 * Income schema v2 (Fase 2 v2.1).
 *
 * Inclui IncomeFrequency (recurring|installment|one_time|irregular) e
 * campos de estabilidade (guaranteedAmount, upperBoundAmount, stabilityType,
 * paymentDay, confidenceLevel, historyMonths).
 */
export const createIncomeSchema = z
	.object({
		name: z.string().min(1).max(255),
		amount: z.number().nonnegative(),
		// Legacy compat — controller pode mapear para `frequency` se ausente.
		type: z.enum([FinancialType.FIXED, FinancialType.ONE_TIME, FinancialType.RECURRING]).optional(),
		// Spec Fase 2 v2.1: IncomeFrequency substitui IncomeType.
		frequency: z.enum(["recurring", "installment", "one_time", "irregular"]).optional(),
		dueDate: z.string().date().optional(),
		installments: z.number().int().min(1).max(60).optional(),
		installmentAmount: z.number().nonnegative().optional(),
		sourceCategory: z
			.enum([IncomeSource.SALARY, IncomeSource.EXTRA, IncomeSource.HELP, IncomeSource.OTHER])
			.optional(),
		paymentDay: z.number().int().min(1).max(31).optional(),
		confidenceLevel: z.enum(["high", "medium", "low"]).optional(),
		historyMonths: z.number().int().min(1).max(12).optional(),
		// NOVOS v2
		guaranteedAmount: z.number().nonnegative().optional(),
		upperBoundAmount: z.number().nonnegative().optional(),
		stabilityType: z.enum(["stable", "variable", "seasonal"]).optional(),
	})
	.refine((d) => d.frequency !== "installment" || (d.installments && d.installmentAmount), {
		message: "Para renda parcelada, informe quantas parcelas e o valor de cada uma.",
	})
	.refine(
		(d) => !d.upperBoundAmount || !d.guaranteedAmount || d.upperBoundAmount >= d.guaranteedAmount,
		{ message: "O teto deve ser maior ou igual ao piso garantido." },
	);
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export const updateIncomeSchema = z
	.object({
		name: z.string().min(1).max(255).optional(),
		amount: z.number().nonnegative().optional(),
		type: z.enum([FinancialType.FIXED, FinancialType.ONE_TIME, FinancialType.RECURRING]).optional(),
		frequency: z.enum(["recurring", "installment", "one_time", "irregular"]).optional(),
		dueDate: z.string().date().optional(),
		installments: z.number().int().min(1).max(60).optional(),
		installmentAmount: z.number().nonnegative().optional(),
		sourceCategory: z
			.enum([IncomeSource.SALARY, IncomeSource.EXTRA, IncomeSource.HELP, IncomeSource.OTHER])
			.optional(),
		paymentDay: z.number().int().min(1).max(31).optional(),
		confidenceLevel: z.enum(["high", "medium", "low"]).optional(),
		historyMonths: z.number().int().min(1).max(12).optional(),
		guaranteedAmount: z.number().nonnegative().optional(),
		upperBoundAmount: z.number().nonnegative().optional(),
		stabilityType: z.enum(["stable", "variable", "seasonal"]).optional(),
	})
	.refine(
		(d) => !d.upperBoundAmount || !d.guaranteedAmount || d.upperBoundAmount >= d.guaranteedAmount,
		{ message: "O teto deve ser maior ou igual ao piso garantido." },
	);
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
