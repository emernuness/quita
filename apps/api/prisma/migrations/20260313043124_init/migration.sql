-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('fixed', 'one_time', 'recurring');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('housing', 'bills', 'food', 'transport', 'telecom', 'other');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('salary', 'extra', 'help', 'other');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('on_time', 'overdue', 'renegotiated', 'paid');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('full', 'partial', 'renegotiated');

-- CreateEnum
CREATE TYPE "PlanStrategy" AS ENUM ('smallest_first', 'highest_interest', 'custom');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('tip', 'action', 'warning', 'negotiation', 'expense_cut');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('pdf', 'csv');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('processing', 'ready', 'expired');

-- CreateEnum
CREATE TYPE "TimelineItemStatus" AS ENUM ('pending', 'completed', 'skipped');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_initials" VARCHAR(5),
    "google_id" VARCHAR(255),
    "biometric_fingerprint" BOOLEAN DEFAULT false,
    "biometric_face" BOOLEAN DEFAULT false,
    "discrete_mode" BOOLEAN DEFAULT false,
    "onboarding_step" SMALLINT DEFAULT 0,
    "onboarding_completed" BOOLEAN DEFAULT false,
    "plan_type" "PlanType" NOT NULL DEFAULT 'free',
    "plan_expires_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "due_date" DATE,
    "installments" SMALLINT,
    "installment_amount" DECIMAL(12,2),
    "source_category" "IncomeSource",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "due_date" DATE,
    "installments" SMALLINT,
    "installment_amount" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_categories" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "creditor" VARCHAR(255) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "has_interest" BOOLEAN DEFAULT false,
    "due_date" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'on_time',
    "overdue_months" SMALLINT,
    "total_installments" SMALLINT,
    "current_installment" SMALLINT,
    "priority_order" SMALLINT,
    "paid_at" TIMESTAMP(3),
    "interest_saved" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "receipt_url" VARCHAR(500),
    "can_undo_until" TIMESTAMP(3),
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "strategy" "PlanStrategy" NOT NULL DEFAULT 'smallest_first',
    "monthly_available" DECIMAL(12,2) NOT NULL,
    "total_debts_count" SMALLINT NOT NULL,
    "paid_debts_count" SMALLINT NOT NULL DEFAULT 0,
    "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "all_paid" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_timeline_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "order" SMALLINT NOT NULL,
    "suggested_amount" DECIMAL(12,2) NOT NULL,
    "suggested_date" DATE NOT NULL,
    "status" "TimelineItemStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_timeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "debt_id" TEXT,
    "type" "InsightType" NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "action_label" VARCHAR(100),
    "action_url" VARCHAR(500),
    "impact_label" VARCHAR(50),
    "savings_amount" DECIMAL(12,2),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "due_dates" BOOLEAN NOT NULL DEFAULT false,
    "weekly_progress" BOOLEAN NOT NULL DEFAULT true,
    "payment_incentive" BOOLEAN NOT NULL DEFAULT true,
    "risk_alert" BOOLEAN NOT NULL DEFAULT true,
    "news_and_tips" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_exports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'processing',
    "file_url" VARCHAR(500),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ready_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_journey_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_debts_cleared" SMALLINT NOT NULL DEFAULT 0,
    "journey_months" SMALLINT NOT NULL DEFAULT 0,
    "total_interest_saved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_journey_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "incomes_user_id_is_active_idx" ON "incomes"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "expenses_user_id_is_active_idx" ON "expenses"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "debt_categories_slug_key" ON "debt_categories"("slug");

-- CreateIndex
CREATE INDEX "debts_user_id_status_idx" ON "debts"("user_id", "status");

-- CreateIndex
CREATE INDEX "payments_debt_id_idx" ON "payments"("debt_id");

-- CreateIndex
CREATE INDEX "payment_plans_user_id_idx" ON "payment_plans"("user_id");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_is_read_idx" ON "ai_insights"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "data_exports_user_id_status_idx" ON "data_exports"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_journey_stats_user_id_key" ON "user_journey_stats"("user_id");

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "debt_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_timeline_items" ADD CONSTRAINT "plan_timeline_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "payment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_timeline_items" ADD CONSTRAINT "plan_timeline_items_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_journey_stats" ADD CONSTRAINT "user_journey_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
