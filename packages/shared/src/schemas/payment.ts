import { z } from "zod";
import { PaymentType } from "../enums/index.js";

export const createPaymentSchema = z.object({
	amount: z.number().positive(),
	paymentType: z.enum([PaymentType.FULL, PaymentType.PARTIAL, PaymentType.RENEGOTIATED]),
	paidAt: z.string().datetime().optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
