export declare const PlanType: {
    readonly FREE: "free";
    readonly PREMIUM: "premium";
};
export type PlanType = (typeof PlanType)[keyof typeof PlanType];
export declare const FinancialType: {
    readonly FIXED: "fixed";
    readonly ONE_TIME: "one_time";
    readonly RECURRING: "recurring";
};
export type FinancialType = (typeof FinancialType)[keyof typeof FinancialType];
export declare const ExpenseCategory: {
    readonly HOUSING: "housing";
    readonly BILLS: "bills";
    readonly FOOD: "food";
    readonly TRANSPORT: "transport";
    readonly TELECOM: "telecom";
    readonly OTHER: "other";
};
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];
export declare const IncomeSource: {
    readonly SALARY: "salary";
    readonly EXTRA: "extra";
    readonly HELP: "help";
    readonly OTHER: "other";
};
export type IncomeSource = (typeof IncomeSource)[keyof typeof IncomeSource];
export declare const DebtStatus: {
    readonly ON_TIME: "on_time";
    readonly OVERDUE: "overdue";
    readonly RENEGOTIATED: "renegotiated";
    readonly PAID: "paid";
};
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];
export declare const PaymentType: {
    readonly FULL: "full";
    readonly PARTIAL: "partial";
    readonly RENEGOTIATED: "renegotiated";
};
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
export declare const PlanStrategy: {
    readonly SMALLEST_FIRST: "smallest_first";
    readonly HIGHEST_INTEREST: "highest_interest";
    readonly CUSTOM: "custom";
};
export type PlanStrategy = (typeof PlanStrategy)[keyof typeof PlanStrategy];
export declare const InsightType: {
    readonly TIP: "tip";
    readonly ACTION: "action";
    readonly WARNING: "warning";
    readonly NEGOTIATION: "negotiation";
    readonly EXPENSE_CUT: "expense_cut";
};
export type InsightType = (typeof InsightType)[keyof typeof InsightType];
export declare const ExportFormat: {
    readonly PDF: "pdf";
    readonly CSV: "csv";
};
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
export declare const ExportStatus: {
    readonly PROCESSING: "processing";
    readonly READY: "ready";
    readonly EXPIRED: "expired";
};
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];
export declare const TimelineItemStatus: {
    readonly PENDING: "pending";
    readonly COMPLETED: "completed";
    readonly SKIPPED: "skipped";
};
export type TimelineItemStatus = (typeof TimelineItemStatus)[keyof typeof TimelineItemStatus];
//# sourceMappingURL=index.d.ts.map