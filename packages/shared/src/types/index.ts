import type {
  PlanType,
  FinancialType,
  ExpenseCategory,
  IncomeSource,
  DebtStatus,
  PaymentType,
  PlanStrategy,
  InsightType,
  ExportFormat,
  ExportStatus,
  TimelineItemStatus,
} from '../enums/index.js';

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

// ── Entity Types (DB models) ──────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  plan: PlanType;
  onboardingCompleted: boolean;
  biometricFingerprint: boolean;
  biometricFace: boolean;
  discreteMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  userId: string;
  name: string;
  amount: number;
  type: FinancialType;
  sourceCategory: IncomeSource | null;
  dueDate: string | null;
  installments: number | null;
  installmentAmount: number | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface DebtCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export interface Debt {
  id: string;
  userId: string;
  categoryId: string;
  creditor: string;
  totalAmount: number;
  paidAmount: number;
  hasInterest: boolean;
  dueDate: string | null;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  paymentType: PaymentType;
  paidAt: string;
  undoneAt: string | null;
  createdAt: string;
}

export interface PaymentPlan {
  id: string;
  userId: string;
  strategy: PlanStrategy;
  generatedAt: string;
  generationsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: string;
  planId: string;
  debtId: string;
  month: string;
  suggestedAmount: number;
  status: TimelineItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  userId: string;
  format: ExportFormat;
  status: ExportStatus;
  fileUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  id: string;
  userId: string;
  dueDates: boolean;
  weeklyProgress: boolean;
  paymentIncentive: boolean;
  riskAlert: boolean;
  newsAndTips: boolean;
}
