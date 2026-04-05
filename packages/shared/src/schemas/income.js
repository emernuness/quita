"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIncomeSchema = exports.createIncomeSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.createIncomeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum([index_js_1.FinancialType.FIXED, index_js_1.FinancialType.ONE_TIME, index_js_1.FinancialType.RECURRING]),
    dueDate: zod_1.z.string().date().optional(),
    installments: zod_1.z.number().int().positive().optional(),
    installmentAmount: zod_1.z.number().positive().optional(),
    sourceCategory: zod_1.z
        .enum([index_js_1.IncomeSource.SALARY, index_js_1.IncomeSource.EXTRA, index_js_1.IncomeSource.HELP, index_js_1.IncomeSource.OTHER])
        .optional(),
});
exports.updateIncomeSchema = exports.createIncomeSchema.partial();
//# sourceMappingURL=income.js.map