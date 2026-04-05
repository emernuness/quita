"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.createPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    paymentType: zod_1.z.enum([index_js_1.PaymentType.FULL, index_js_1.PaymentType.PARTIAL, index_js_1.PaymentType.RENEGOTIATED]),
    paidAt: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=payment.js.map