import { z } from "zod";
import { DebtNature, DebtStatus } from "../enums/index.js";

// IncomeStability mirror — packages/shared não importa @prisma/client.
export const IncomeStabilityEnum = z.enum(["stable", "variable", "seasonal"]);
export type IncomeStability = z.infer<typeof IncomeStabilityEnum>;

export const onboardingIncomeSchema = z.object({
	salary: z.number().positive("Informe sua renda principal"),
	extra: z.number().nonnegative().optional(),
	help: z.number().nonnegative().optional(),
	paymentDay: z.number().int().min(1).max(31).optional(),
	stabilityType: IncomeStabilityEnum.optional(),
	guaranteedAmount: z.number().nonnegative().optional(),
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

// Fase 1 §6.1.1 — passo 4 (Cidade + dependentes).
// stateCode UF brasileiro (2 letras maiusculas). dependentsCount opcional default 0.
const UF_REGEX = /^[A-Z]{2}$/;
export const onboardingLocationSchema = z.object({
	stateCode: z.string().length(2).regex(UF_REGEX, "UF deve ter 2 letras maiusculas (ex: SP, RJ)"),
	dependentsCount: z.number().int().min(0).max(20).optional(),
});
export type OnboardingLocationInput = z.infer<typeof onboardingLocationSchema>;

// Fase 1 §6.1.1 — passo 3 (Maior preocupacao).
export const MainConcernEnum = z.enum([
	"collection_pressure",
	"service_cut_risk",
	"disorganization",
	"shame",
	"where_to_start",
]);
export type MainConcernValue = z.infer<typeof MainConcernEnum>;

export const onboardingConcernSchema = z.object({
	mainConcern: MainConcernEnum,
});
export type OnboardingConcernInput = z.infer<typeof onboardingConcernSchema>;
