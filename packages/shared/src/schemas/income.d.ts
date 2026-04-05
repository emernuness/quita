import { z } from "zod";
export declare const createIncomeSchema: z.ZodObject<{
    name: z.ZodString;
    amount: z.ZodNumber;
    type: z.ZodEnum<["fixed", "one_time", "recurring"]>;
    dueDate: z.ZodOptional<z.ZodString>;
    installments: z.ZodOptional<z.ZodNumber>;
    installmentAmount: z.ZodOptional<z.ZodNumber>;
    sourceCategory: z.ZodOptional<z.ZodEnum<["salary", "extra", "help", "other"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "fixed" | "one_time" | "recurring";
    amount: number;
    dueDate?: string | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    sourceCategory?: "other" | "salary" | "extra" | "help" | undefined;
}, {
    name: string;
    type: "fixed" | "one_time" | "recurring";
    amount: number;
    dueDate?: string | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    sourceCategory?: "other" | "salary" | "extra" | "help" | undefined;
}>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export declare const updateIncomeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["fixed", "one_time", "recurring"]>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    installments: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    installmentAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    sourceCategory: z.ZodOptional<z.ZodOptional<z.ZodEnum<["salary", "extra", "help", "other"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: "fixed" | "one_time" | "recurring" | undefined;
    dueDate?: string | undefined;
    amount?: number | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    sourceCategory?: "other" | "salary" | "extra" | "help" | undefined;
}, {
    name?: string | undefined;
    type?: "fixed" | "one_time" | "recurring" | undefined;
    dueDate?: string | undefined;
    amount?: number | undefined;
    installments?: number | undefined;
    installmentAmount?: number | undefined;
    sourceCategory?: "other" | "salary" | "extra" | "help" | undefined;
}>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
//# sourceMappingURL=income.d.ts.map