"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingExpensesSchema = exports.onboardingDebtSchema = exports.onboardingDebtCategoriesSchema = exports.onboardingIncomeSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.onboardingIncomeSchema = zod_1.z.object({
    salary: zod_1.z.number().positive("Informe sua renda principal"),
    extra: zod_1.z.number().nonnegative().optional(),
    help: zod_1.z.number().nonnegative().optional(),
});
exports.onboardingDebtCategoriesSchema = zod_1.z.object({
    categoryIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
exports.onboardingDebtSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
    creditor: zod_1.z.string().min(1),
    totalAmount: zod_1.z.number().positive(),
    hasInterest: zod_1.z.boolean().optional(),
    dueDate: zod_1.z.string().date().optional(),
    status: zod_1.z.enum([
        index_js_1.DebtStatus.ON_TIME,
        index_js_1.DebtStatus.OVERDUE,
        index_js_1.DebtStatus.RENEGOTIATED,
        index_js_1.DebtStatus.PAID,
    ]),
});
exports.onboardingExpensesSchema = zod_1.z.object({
    housing: zod_1.z.number().nonnegative().optional(),
    bills: zod_1.z.number().nonnegative().optional(),
    food: zod_1.z.number().nonnegative().optional(),
    transport: zod_1.z.number().nonnegative().optional(),
    telecom: zod_1.z.number().nonnegative().optional(),
});
//# sourceMappingURL=onboarding.js.map