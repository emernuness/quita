import { z } from "zod";
export declare const createDebtSchema: z.ZodObject<{
    categoryId: z.ZodString;
    creditor: z.ZodString;
    totalAmount: z.ZodNumber;
    hasInterest: z.ZodOptional<z.ZodBoolean>;
    dueDate: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["on_time", "overdue", "renegotiated", "paid"]>>;
}, "strip", z.ZodTypeAny, {
    status: "on_time" | "overdue" | "renegotiated" | "paid";
    categoryId: string;
    creditor: string;
    totalAmount: number;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}, {
    categoryId: string;
    creditor: string;
    totalAmount: number;
    status?: "on_time" | "overdue" | "renegotiated" | "paid" | undefined;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export declare const updateDebtSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    creditor: z.ZodOptional<z.ZodString>;
    totalAmount: z.ZodOptional<z.ZodNumber>;
    hasInterest: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["on_time", "overdue", "renegotiated", "paid"]>>>;
}, "strip", z.ZodTypeAny, {
    status?: "on_time" | "overdue" | "renegotiated" | "paid" | undefined;
    categoryId?: string | undefined;
    creditor?: string | undefined;
    totalAmount?: number | undefined;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}, {
    status?: "on_time" | "overdue" | "renegotiated" | "paid" | undefined;
    categoryId?: string | undefined;
    creditor?: string | undefined;
    totalAmount?: number | undefined;
    hasInterest?: boolean | undefined;
    dueDate?: string | undefined;
}>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
//# sourceMappingURL=debt.d.ts.map