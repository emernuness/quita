import { z } from "zod";
import { FinancialType } from "../enums/index.js";

/**
 * Expense schema v2 (Fase 2 §5.2).
 *
 * Categoria expandida (14 categorias). Classificacao explicita
 * (isEssential, isIncomeRelated, isLegalObligation, canReduce, canCancel,
 * consequenceIfUnpaid). Frequency sazonal + monthlyProvision para
 * provisao mensal de despesas nao-mensais.
 */
const EXPENSE_CATEGORIES = [
	"housing",
	"utilities",
	"bills", // legacy alias
	"telecom",
	"food",
	"transport",
	"health",
	"education",
	"childcare",
	"work_tools",
	"insurance",
	"legal",
	"subscription",
	"leisure",
	"other",
] as const;

const CONSEQUENCES = ["service_cut", "loss_of_asset", "legal_action", "fine", "none"] as const;
const FREQUENCIES = [
	"monthly",
	"bimonthly",
	"quarterly",
	"semiannual",
	"annual",
	"irregular",
] as const;
const CONFIDENCES = ["high", "medium", "low"] as const;

export const createExpenseSchema = z.object({
	name: z.string().min(1).max(255),
	amount: z.number().nonnegative(),
	type: z.enum([FinancialType.FIXED, FinancialType.ONE_TIME, FinancialType.RECURRING]),
	category: z.enum(EXPENSE_CATEGORIES),
	dueDate: z.string().date().optional(),
	installments: z.number().int().positive().optional(),
	installmentAmount: z.number().nonnegative().optional(),
	isEssential: z.boolean().optional(),
	isIncomeRelated: z.boolean().optional(),
	isLegalObligation: z.boolean().optional(),
	canReduce: z.boolean().optional(),
	canCancel: z.boolean().optional(),
	consequenceIfUnpaid: z.enum(CONSEQUENCES).optional(),
	frequency: z.enum(FREQUENCIES).optional(),
	monthlyProvision: z.number().nonnegative().optional(),
	nextOccurrence: z.string().date().optional(),
	dataConfidence: z.enum(CONFIDENCES).optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
