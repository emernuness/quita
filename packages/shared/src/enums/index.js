"use strict";
// All enums use `as const` pattern for tree-shaking (no TS enums)
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineItemStatus = exports.ExportStatus = exports.ExportFormat = exports.InsightType = exports.PlanStrategy = exports.PaymentType = exports.DebtStatus = exports.IncomeSource = exports.ExpenseCategory = exports.FinancialType = exports.PlanType = void 0;
exports.PlanType = { FREE: "free", PREMIUM: "premium" };
exports.FinancialType = {
    FIXED: "fixed",
    ONE_TIME: "one_time",
    RECURRING: "recurring",
};
exports.ExpenseCategory = {
    HOUSING: "housing",
    BILLS: "bills",
    FOOD: "food",
    TRANSPORT: "transport",
    TELECOM: "telecom",
    OTHER: "other",
};
exports.IncomeSource = {
    SALARY: "salary",
    EXTRA: "extra",
    HELP: "help",
    OTHER: "other",
};
exports.DebtStatus = {
    ON_TIME: "on_time",
    OVERDUE: "overdue",
    RENEGOTIATED: "renegotiated",
    PAID: "paid",
};
exports.PaymentType = {
    FULL: "full",
    PARTIAL: "partial",
    RENEGOTIATED: "renegotiated",
};
exports.PlanStrategy = {
    SMALLEST_FIRST: "smallest_first",
    HIGHEST_INTEREST: "highest_interest",
    CUSTOM: "custom",
};
exports.InsightType = {
    TIP: "tip",
    ACTION: "action",
    WARNING: "warning",
    NEGOTIATION: "negotiation",
    EXPENSE_CUT: "expense_cut",
};
exports.ExportFormat = { PDF: "pdf", CSV: "csv" };
exports.ExportStatus = {
    PROCESSING: "processing",
    READY: "ready",
    EXPIRED: "expired",
};
exports.TimelineItemStatus = {
    PENDING: "pending",
    COMPLETED: "completed",
    SKIPPED: "skipped",
};
//# sourceMappingURL=index.js.map