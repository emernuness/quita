import { z } from "zod";
export declare const createExpenseSchema: z.ZodObject<{
    name: z.ZodString;
    amount: z.ZodNumber;
    type: z.ZodEnum<["fixed", "one_time", "recurring"]>;
    category: z.ZodEnum<["housing", "bills", "food", "transport", "telecom", "other"]>;
    dueDate: z.ZodOptional<z.ZodString>;
    installments: z.ZodOptional<z.ZodNumber>;
    installmentAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "fixed" | "one_time" | "recurring";
    amount: number;
    category: "housing" | "bills" | "food" | "transport" | "telecom" | "other";
    dueDate?: string | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
}, {
    name: string;
    type: "fixed" | "one_time" | "recurring";
    amount: number;
    category: "housing" | "bills" | "food" | "transport" | "telecom" | "other";
    dueDate?: string | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
}>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export declare const updateExpenseSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["fixed", "one_time", "recurring"]>>;
    category: z.ZodOptional<z.ZodEnum<["housing", "bills", "food", "transport", "telecom", "other"]>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    installments: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    installmentAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "fixed" | "one_time" | "recurring" | undefined;
    dueDate?: string | undefined;
    amount?: number | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    category?: "housing" | "bills" | "food" | "transport" | "telecom" | "other" | undefined;
}, {
    name?: string | undefined;
    type?: "fixed" | "one_time" | "recurring" | undefined;
    dueDate?: string | undefined;
    amount?: number | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    category?: "housing" | "bills" | "food" | "transport" | "telecom" | "other" | undefined;
}>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
//# sourceMappingURL=expense.d.ts.map