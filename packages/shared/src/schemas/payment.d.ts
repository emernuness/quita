import { z } from "zod";
export declare const createPaymentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    paymentType: z.ZodEnum<["full", "partial", "renegotiated"]>;
    paidAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    paymentType: "renegotiated" | "full" | "partial";
    paidAt?: string | undefined;
}, {
    amount: number;
    paymentType: "renegotiated" | "full" | "partial";
    paidAt?: string | undefined;
}>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
//# sourceMappingURL=payment.d.ts.map