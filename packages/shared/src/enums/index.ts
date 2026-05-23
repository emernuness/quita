// All enums use `as const` pattern for tree-shaking (no TS enums)

export const PlanType = { FREE: "free", PREMIUM: "premium" } as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const FinancialType = {
	FIXED: "fixed",
	ONE_TIME: "one_time",
	RECURRING: "recurring",
} as const;
export type FinancialType = (typeof FinancialType)[keyof typeof FinancialType];

export const ExpenseCategory = {
	HOUSING: "housing",
	BILLS: "bills",
	FOOD: "food",
	TRANSPORT: "transport",
	TELECOM: "telecom",
	OTHER: "other",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const IncomeSource = {
	SALARY: "salary",
	EXTRA: "extra",
	HELP: "help",
	OTHER: "other",
} as const;
export type IncomeSource = (typeof IncomeSource)[keyof typeof IncomeSource];

export const DebtNature = {
	INSTALLMENT: "installment",
	RECURRING: "recurring",
	ONE_TIME: "one_time",
} as const;
export type DebtNature = (typeof DebtNature)[keyof typeof DebtNature];

export const DebtStatus = {
	ON_TIME: "on_time",
	OVERDUE: "overdue",
	RENEGOTIATED: "renegotiated",
	PAID: "paid",
} as const;
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

export const PaymentType = {
	FULL: "full",
	PARTIAL: "partial",
	RENEGOTIATED: "renegotiated",
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PlanStrategy = {
	SNOWBALL: "snowball",
	AVALANCHE: "avalanche",
	HYBRID: "hybrid",
	CRISIS: "crisis",
} as const;
export type PlanStrategy = (typeof PlanStrategy)[keyof typeof PlanStrategy];

export const InsightType = {
	TIP: "tip",
	ACTION: "action",
	WARNING: "warning",
	NEGOTIATION: "negotiation",
	EXPENSE_CUT: "expense_cut",
} as const;
export type InsightType = (typeof InsightType)[keyof typeof InsightType];

export const ExportFormat = { PDF: "pdf", CSV: "csv" } as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ExportStatus = {
	PROCESSING: "processing",
	READY: "ready",
	EXPIRED: "expired",
} as const;
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

export const TimelineItemStatus = {
	PENDING: "pending",
	COMPLETED: "completed",
	SKIPPED: "skipped",
} as const;
export type TimelineItemStatus = (typeof TimelineItemStatus)[keyof typeof TimelineItemStatus];
