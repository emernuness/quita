import { z } from "zod";
export declare const onboardingIncomeSchema: z.ZodObject<{
    salary: z.ZodNumber;
    extra: z.ZodOptional<z.ZodNumber>;
    help: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    salary: number;
    extra?: number | undefined;
    help?: number | undefined;
}, {
    salary: number;
    extra?: number | undefined;
    help?: number | undefined;
}>;
export type OnboardingIncomeInput = z.infer<typeof onboardingIncomeSchema>;
export declare const onboardingDebtCategoriesSchema: z.ZodObject<{
    categoryIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    categoryIds: string[];
}, {
    categoryIds: string[];
}>;
export type OnboardingDebtCategoriesInput = z.infer<typeof onboardingDebtCategoriesSchema>;
export declare const onboardingDebtSchema: z.ZodObject<{
    categoryId: z.ZodString;
    creditor: z.ZodString;
    totalAmount: z.ZodNumber;
    hasInterest: z.ZodOptional<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["on_time", "overdue", "renegotiated", "paid"]>;
}, "strip", z.ZodTypeAny, {
    status: "on_time" | "overdue" | "renegotiated" | "paid";
    categoryId: string;
    creditor: string;
    totalAmount: number;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}, {
    status: "on_time" | "overdue" | "renegotiated" | "paid";
    categoryId: string;
    creditor: string;
    totalAmount: number;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}>;
export type OnboardingDebtInput = z.infer<typeof onboardingDebtSchema>;
export declare const onboardingExpensesSchema: z.ZodObject<{
    housing: z.ZodOptional<z.ZodNumber>;
    bills: z.ZodOptional<z.ZodNumber>;
    food: z.ZodOptional<z.ZodNumber>;
    transport: z.ZodOptional<z.ZodNumber>;
    telecom: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    housing?: number | undefined;
    bills?: number | undefined;
    food?: number | undefined;
    transport?: number | undefined;
    telecom?: number | undefined;
}, {
    housing?: number | undefined;
    bills?: number | undefined;
    food?: number | undefined;
    transport?: number | undefined;
    telecom?: number | undefined;
}>;
export type OnboardingExpensesInput = z.infer<typeof onboardingExpensesSchema>;
//# sourceMappingURL=onboarding.d.ts.map