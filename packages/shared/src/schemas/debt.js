"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDebtSchema = exports.createDebtSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.createDebtSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    creditor: zod_1.z.string().min(1),
    totalAmount: zod_1.z.number().positive(),
    hasInterest: zod_1.z.boolean().optional(),
    dueDate: zod_1.z.string().date().optional(),
    status: zod_1.z
        .enum([index_js_1.DebtStatus.ON_TIME, index_js_1.DebtStatus.OVERDUE, index_js_1.DebtStatus.RENEGOTIATED, index_js_1.DebtStatus.PAID])
        .default(index_js_1.DebtStatus.ON_TIME),
});
exports.updateDebtSchema = exports.createDebtSchema.partial();
//# sourceMappingURL=debt.js.map