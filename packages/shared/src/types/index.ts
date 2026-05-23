import type {
	DebtStatus,
	ExpenseCategory,
	ExportFormat,
	ExportStatus,
	FinancialType,
	IncomeSource,
	InsightType,
	PaymentType,
	PlanStrategy,
	PlanType,
	TimelineItemStatus,
} from "../enums/index.js";

// ── API Wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export interface PaginationMeta {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	meta: PaginationMeta;
}

// ── Entity Types (aligned 1:1 with Prisma schema) ────────────────

export interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	passwordHash: string;
	avatarInitials: string | null;
	googleId: string | null;
	biometricFingerprint: boolean | null;
	biometricFace: boolean | null;
	discreteMode: boolean | null;
	onboardingStep: number | null;
	onboardingCompleted: boolean | null;
	planType: PlanType;
	planExpiresAt: string | null;
	lastSyncAt: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface Income {
	id: string;
	userId: string;
	name: string;
	amount: number;
	type: FinancialType;
	dueDate: string | null;
	installments: number | null;
	installmentAmount: number | null;
	sourceCategory: IncomeSource | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Expense {
	id: string;
	userId: string;
	name: string;
	amount: number;
	type: FinancialType;
	category: ExpenseCategory;
	dueDate: string | null;
	installments: number | null;
	installmentAmount: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DebtCategory {
	id: string;
	slug: string;
	name: string;
	icon: string;
	createdAt: string;
}

export interface Debt {
	id: string;
	userId: string;
	categoryId: string;
	creditor: string;
	totalAmount: number;
	amountPaid: number;
	hasInterest: boolean | null;
	dueDate: string | null;
	status: DebtStatus;
	daysOverdue: number;
	totalInstallments: number | null;
	currentInstallment: number | null;
	priorityScore: number | null;
	priorityReason: string | null;
	paidAt: string | null;
	interestSaved: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface Payment {
	id: string;
	userId: string;
	debtId: string;
	amount: number;
	paymentType: PaymentType;
	receiptUrl: string | null;
	canUndoUntil: string | null;
	undone: boolean;
	paidAt: string;
	createdAt: string;
}

export interface PaymentPlan {
	id: string;
	userId: string;
	strategy: PlanStrategy;
	monthlyAvailable: number;
	totalDebtsCount: number;
	paidDebtsCount: number;
	progressPercent: number;
	isCritical: boolean;
	allPaid: boolean;
	isActive: boolean;
	generatedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface PlanTimelineItem {
	id: string;
	planId: string;
	debtId: string;
	order: number;
	suggestedAmount: number;
	suggestedDate: string;
	status: TimelineItemStatus;
	createdAt: string;
}

export interface AiInsight {
	id: string;
	userId: string;
	debtId: string | null;
	type: InsightType;
	title: string | null;
	content: string;
	actionLabel: string | null;
	actionUrl: string | null;
	impactLabel: string | null;
	savingsAmount: number | null;
	isRead: boolean;
	createdAt: string;
}

export interface NotificationPreference {
	id: string;
	userId: string;
	dueDates: boolean;
	weeklyProgress: boolean;
	paymentIncentive: boolean;
	riskAlert: boolean;
	newsAndTips: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DataExport {
	id: string;
	userId: string;
	format: ExportFormat;
	status: ExportStatus;
	fileUrl: string | null;
	requestedAt: string;
	readyAt: string | null;
	expiresAt: string | null;
}

export interface UserJourneyStats {
	id: string;
	userId: string;
	totalDebtsCleared: number;
	journeyMonths: number;
	totalInterestSaved: number;
	updatedAt: string;
}
