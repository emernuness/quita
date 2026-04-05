"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.createExpenseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum([index_js_1.FinancialType.FIXED, index_js_1.FinancialType.ONE_TIME, index_js_1.FinancialType.RECURRING]),
    category: zod_1.z.enum([
        index_js_1.ExpenseCategory.HOUSING,
        index_js_1.ExpenseCategory.BILLS,
        index_js_1.ExpenseCategory.FOOD,
        index_js_1.ExpenseCategory.TRANSPORT,
        index_js_1.ExpenseCategory.TELECOM,
        index_js_1.ExpenseCategory.OTHER,
    ]),
    dueDate: zod_1.z.string().date().optional(),
    installments: zod_1.z.number().int().positive().optional(),
    installmentAmount: zod_1.z.number().positive().optional(),
});
exports.updateExpenseSchema = exports.createExpenseSchema.partial();
//# sourceMappingURL=expense.js.map