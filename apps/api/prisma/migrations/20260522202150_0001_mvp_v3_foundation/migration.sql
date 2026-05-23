-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('fixed', 'one_time', 'recurring');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('housing', 'bills', 'utilities', 'telecom', 'food', 'transport', 'health', 'education', 'childcare', 'work_tools', 'insurance', 'legal', 'subscription', 'leisure', 'other');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('salary', 'extra', 'help', 'other');

-- CreateEnum
CREATE TYPE "DebtNature" AS ENUM ('installment', 'recurring', 'one_time');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('on_time', 'overdue', 'renegotiated', 'paid');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('full', 'partial', 'renegotiated');

-- CreateEnum
CREATE TYPE "PlanStrategy" AS ENUM ('smallest_first', 'highest_interest', 'custom', 'snowball', 'avalanche', 'hybrid', 'crisis');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('tip', 'action', 'warning', 'negotiation', 'expense_cut');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('pdf', 'csv');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('processing', 'ready', 'expired');

-- CreateEnum
CREATE TYPE "TimelineItemStatus" AS ENUM ('pending', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "FinancialState" AS ENUM ('healthy_with_debt', 'tight_budget', 'monthly_deficit', 'overindebtedness', 'practical_insolvency');

-- CreateEnum
CREATE TYPE "OperationMode" AS ENUM ('payoff', 'stabilization', 'crisis_mode', 'protection', 'survival');

-- CreateEnum
CREATE TYPE "ConsequenceType" AS ENUM ('service_cut', 'loss_of_asset', 'legal_action', 'fine', 'none');

-- CreateEnum
CREATE TYPE "CollateralType" AS ENUM ('none', 'vehicle', 'property', 'salary', 'other');

-- CreateEnum
CREATE TYPE "InterestClass" AS ENUM ('high', 'medium', 'low', 'unknown');

-- CreateEnum
CREATE TYPE "RiskClass" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('pay', 'negotiate', 'pause', 'cut', 'wait', 'review', 'refuse', 'monitor');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('debt', 'expense', 'income', 'general');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'completed', 'skipped', 'dismissed', 'expired');

-- CreateEnum
CREATE TYPE "SettlementRecommendation" AS ENUM ('accept', 'negotiate_lower', 'reject');

-- CreateEnum
CREATE TYPE "PreferredStrategy" AS ENUM ('snowball', 'avalanche', 'hybrid', 'undecided');

-- CreateEnum
CREATE TYPE "MainConcern" AS ENUM ('collection_pressure', 'service_cut_risk', 'disorganization', 'shame', 'where_to_start');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('capital', 'metro', 'interior');

-- CreateEnum
CREATE TYPE "SupportChannelType" AS ENUM ('procon', 'defensoria', 'federal_gov', 'bank_mediation', 'ngo', 'serasa', 'other');

-- CreateEnum
CREATE TYPE "SupportChannelScope" AS ENUM ('federal', 'state', 'municipal');

-- CreateEnum
CREATE TYPE "ExpenseFrequency" AS ENUM ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'irregular');

-- CreateEnum
CREATE TYPE "IncomeStability" AS ENUM ('stable', 'variable', 'seasonal');

-- CreateEnum
CREATE TYPE "DiagnosisLevel" AS ENUM ('minimal', 'basic', 'detailed');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('debt_freedom', 'house', 'education', 'family', 'travel', 'peace', 'security', 'retirement', 'other');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('user_provided', 'market_reference', 'unknown');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('terms_of_use', 'privacy_policy', 'data_processing', 'marketing_communications');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('recurring', 'installment', 'one_time', 'irregular');

-- CreateEnum
CREATE TYPE "AuthEventType" AS ENUM ('login_success', 'login_failure', 'logout', 'logout_all', 'refresh_success', 'refresh_reuse_detected', 'password_changed', 'password_reset_requested', 'password_reset_completed');

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
    "dependents_count" SMALLINT DEFAULT 0,
    "city" VARCHAR(100),
    "state_code" VARCHAR(2),
    "city_ibge_code" VARCHAR(7),
    "last_financial_state" "FinancialState",
    "last_operation_mode" "OperationMode",
    "last_decision_at" TIMESTAMP(3),
    "overall_income_stability" "IncomeStability",
    "diagnosis_level" "DiagnosisLevel" NOT NULL DEFAULT 'minimal',
    "onboarding_completed_steps" JSONB,
    "next_review_date" DATE,
    "accepted_terms_at" TIMESTAMP(3),
    "accepted_terms_version" VARCHAR(20),
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
    "frequency" "IncomeFrequency" DEFAULT 'recurring',
    "due_date" DATE,
    "installments" SMALLINT,
    "installment_amount" DECIMAL(12,2),
    "source_category" "IncomeSource",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_day" SMALLINT,
    "confidence_level" "ConfidenceLevel",
    "history_months" SMALLINT,
    "guaranteed_amount" DECIMAL(12,2),
    "upper_bound_amount" DECIMAL(12,2),
    "stability_type" "IncomeStability" NOT NULL DEFAULT 'stable',
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
    "is_essential" BOOLEAN NOT NULL DEFAULT false,
    "is_income_related" BOOLEAN NOT NULL DEFAULT false,
    "is_legal_obligation" BOOLEAN NOT NULL DEFAULT false,
    "can_reduce" BOOLEAN NOT NULL DEFAULT false,
    "can_cancel" BOOLEAN NOT NULL DEFAULT false,
    "consequence_if_unpaid" "ConsequenceType",
    "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'monthly',
    "monthly_provision" DECIMAL(12,2),
    "next_occurrence" DATE,
    "provision_started_at" DATE,
    "data_confidence" "ConfidenceLevel" NOT NULL DEFAULT 'medium',
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
    "default_risk_class" "RiskClass" NOT NULL DEFAULT 'medium',
    "affects_survival_default" BOOLEAN NOT NULL DEFAULT false,
    "affects_income_default" BOOLEAN NOT NULL DEFAULT false,
    "has_legal_risk_default" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(500),
    "display_order" SMALLINT NOT NULL DEFAULT 100,
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
    "nature" "DebtNature" NOT NULL DEFAULT 'one_time',
    "monthly_amount" DECIMAL(12,2),
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "has_interest" BOOLEAN DEFAULT false,
    "due_date" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'on_time',
    "overdue_months" SMALLINT,
    "days_overdue" INTEGER NOT NULL DEFAULT 0,
    "total_installments" SMALLINT,
    "current_installment" SMALLINT,
    "installments_paid" SMALLINT,
    "installments_overdue" SMALLINT DEFAULT 0,
    "priority_order" SMALLINT,
    "paid_at" TIMESTAMP(3),
    "interest_saved" DECIMAL(12,2),
    "affects_survival" BOOLEAN NOT NULL DEFAULT false,
    "affects_income" BOOLEAN NOT NULL DEFAULT false,
    "has_legal_risk" BOOLEAN NOT NULL DEFAULT false,
    "has_collateral" BOOLEAN NOT NULL DEFAULT false,
    "collateral_type" "CollateralType",
    "is_negotiable" BOOLEAN NOT NULL DEFAULT true,
    "interest_rate_monthly" DECIMAL(7,4),
    "interest_rate_annual" DECIMAL(7,4),
    "interest_class" "InterestClass" NOT NULL DEFAULT 'unknown',
    "settlement_cash_amount" DECIMAL(12,2),
    "settlement_installments" SMALLINT,
    "settlement_installment_amount" DECIMAL(12,2),
    "settlement_deadline" DATE,
    "stress_level" SMALLINT,
    "priority_score" DECIMAL(7,2),
    "priority_reason" VARCHAR(500),
    "interest_rate_source" "RateSource" NOT NULL DEFAULT 'unknown',
    "last_verified_at" TIMESTAMP(3),
    "data_confidence" "ConfidenceLevel" NOT NULL DEFAULT 'medium',
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
    "last_financial_state" "FinancialState",
    "safe_capacity" DECIMAL(12,2),
    "simulation_conservative" JSONB,
    "simulation_optimized" JSONB,
    "simulation_accelerated" JSONB,
    "estimated_payoff_months_min" SMALLINT,
    "estimated_payoff_months_max" SMALLINT,
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

-- CreateTable
CREATE TABLE "behavior_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_strategy" "PreferredStrategy" NOT NULL DEFAULT 'undecided',
    "main_concern" "MainConcern",
    "motivation_level" SMALLINT,
    "discipline_level" SMALLINT,
    "preferences_extra" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_action_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reference_month" DATE NOT NULL,
    "financial_state" "FinancialState" NOT NULL,
    "operation_mode" "OperationMode" NOT NULL,
    "income_net_monthly" DECIMAL(12,2) NOT NULL,
    "essentials_total" DECIMAL(12,2) NOT NULL,
    "seasonal_provision_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "income_protective_total" DECIMAL(12,2) NOT NULL,
    "legals_total" DECIMAL(12,2) NOT NULL,
    "minimum_vital" DECIMAL(12,2) NOT NULL,
    "emergency_reserve_contribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "safe_capacity" DECIMAL(12,2) NOT NULL,
    "main_goal" VARCHAR(500) NOT NULL,
    "warnings" JSONB,
    "next_review_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_actions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "order" SMALLINT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "target_type" "TargetType" NOT NULL,
    "target_debt_id" TEXT,
    "target_expense_id" TEXT,
    "target_label" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2),
    "max_affordable_installment" DECIMAL(12,2),
    "reason" VARCHAR(500) NOT NULL,
    "due_date" DATE,
    "data_confidence" "ConfidenceLevel" NOT NULL DEFAULT 'medium',
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "dismissed_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommended_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_evaluations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "proposal_cash_amount" DECIMAL(12,2),
    "proposal_installments" SMALLINT,
    "proposal_installment_amount" DECIMAL(12,2),
    "proposal_deadline" DATE,
    "recommendation" "SettlementRecommendation" NOT NULL,
    "max_safe_installment" DECIMAL(12,2),
    "discount_percent" DECIMAL(5,2),
    "would_cause_negative_cashflow" BOOLEAN NOT NULL DEFAULT false,
    "reasoning" VARCHAR(1000) NOT NULL,
    "capacity_at_evaluation" DECIMAL(12,2) NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_state_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" "FinancialState" NOT NULL,
    "mode" "OperationMode" NOT NULL,
    "income_net_monthly" DECIMAL(12,2) NOT NULL,
    "essentials_total" DECIMAL(12,2) NOT NULL,
    "debts_total" DECIMAL(12,2) NOT NULL,
    "safe_capacity" DECIMAL(12,2) NOT NULL,
    "trigger_event" VARCHAR(50),
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_state_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regional_minimum_vital" (
    "id" TEXT NOT NULL,
    "state_code" VARCHAR(2) NOT NULL,
    "region_type" "RegionType" NOT NULL,
    "base_amount_single" DECIMAL(12,2) NOT NULL,
    "base_per_dependent" DECIMAL(12,2) NOT NULL,
    "effective_date" DATE NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "source_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regional_minimum_vital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_rate_references" (
    "id" TEXT NOT NULL,
    "debt_category_slug" VARCHAR(50) NOT NULL,
    "monthly_rate_min" DECIMAL(7,4) NOT NULL,
    "monthly_rate_max" DECIMAL(7,4) NOT NULL,
    "monthly_rate_median" DECIMAL(7,4) NOT NULL,
    "effective_date" DATE NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "source_series_code" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interest_rate_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_channels" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "channel_type" "SupportChannelType" NOT NULL,
    "scope" "SupportChannelScope" NOT NULL,
    "state_code" VARCHAR(2),
    "city_ibge_code" VARCHAR(7),
    "phone" VARCHAR(30),
    "url" VARCHAR(500),
    "description" VARCHAR(1000),
    "works_for_states" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" SMALLINT NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_reserves" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_amount" DECIMAL(12,2),
    "monthly_target" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_reserves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_type" "GoalType" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "target_amount" DECIMAL(12,2),
    "target_date" DATE,
    "priority_order" SMALLINT NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_weights" (
    "id" TEXT NOT NULL,
    "factor_key" VARCHAR(50) NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,
    "is_positive" BOOLEAN NOT NULL DEFAULT true,
    "effective_date" DATE NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_id" TEXT,
    "created_ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" VARCHAR(255),
    "event_type" "AuthEventType" NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_next_review_date_idx" ON "users"("next_review_date");

-- CreateIndex
CREATE INDEX "incomes_user_id_is_active_idx" ON "incomes"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "expenses_user_id_is_active_idx" ON "expenses"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "expenses_user_id_is_essential_idx" ON "expenses"("user_id", "is_essential");

-- CreateIndex
CREATE INDEX "expenses_frequency_next_occurrence_idx" ON "expenses"("frequency", "next_occurrence");

-- CreateIndex
CREATE UNIQUE INDEX "debt_categories_slug_key" ON "debt_categories"("slug");

-- CreateIndex
CREATE INDEX "debts_user_id_status_idx" ON "debts"("user_id", "status");

-- CreateIndex
CREATE INDEX "debts_user_id_priority_score_idx" ON "debts"("user_id", "priority_score" DESC);

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

-- CreateIndex
CREATE UNIQUE INDEX "behavior_profiles_user_id_key" ON "behavior_profiles"("user_id");

-- CreateIndex
CREATE INDEX "monthly_action_plans_user_id_is_active_idx" ON "monthly_action_plans"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_action_plans_user_id_reference_month_key" ON "monthly_action_plans"("user_id", "reference_month");

-- CreateIndex
CREATE INDEX "recommended_actions_plan_id_status_idx" ON "recommended_actions"("plan_id", "status");

-- CreateIndex
CREATE INDEX "recommended_actions_target_debt_id_idx" ON "recommended_actions"("target_debt_id");

-- CreateIndex
CREATE INDEX "settlement_evaluations_user_id_evaluated_at_idx" ON "settlement_evaluations"("user_id", "evaluated_at");

-- CreateIndex
CREATE INDEX "settlement_evaluations_debt_id_idx" ON "settlement_evaluations"("debt_id");

-- CreateIndex
CREATE INDEX "financial_state_snapshots_user_id_captured_at_idx" ON "financial_state_snapshots"("user_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "regional_minimum_vital_state_code_region_type_effective_dat_key" ON "regional_minimum_vital"("state_code", "region_type", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "interest_rate_references_debt_category_slug_effective_date_key" ON "interest_rate_references"("debt_category_slug", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "support_channels_slug_key" ON "support_channels"("slug");

-- CreateIndex
CREATE INDEX "support_channels_scope_state_code_is_active_idx" ON "support_channels"("scope", "state_code", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_reserves_user_id_key" ON "emergency_reserves"("user_id");

-- CreateIndex
CREATE INDEX "user_goals_user_id_is_active_idx" ON "user_goals"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "consent_logs_user_id_consent_type_idx" ON "consent_logs"("user_id", "consent_type");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_weights_factor_key_key" ON "scoring_weights"("factor_key");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_created_at_idx" ON "auth_audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_email_created_at_idx" ON "auth_audit_logs"("email", "created_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_event_type_created_at_idx" ON "auth_audit_logs"("event_type", "created_at");

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

-- AddForeignKey
ALTER TABLE "behavior_profiles" ADD CONSTRAINT "behavior_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_action_plans" ADD CONSTRAINT "monthly_action_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_actions" ADD CONSTRAINT "recommended_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "monthly_action_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_actions" ADD CONSTRAINT "recommended_actions_target_debt_id_fkey" FOREIGN KEY ("target_debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_actions" ADD CONSTRAINT "recommended_actions_target_expense_id_fkey" FOREIGN KEY ("target_expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_evaluations" ADD CONSTRAINT "settlement_evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_evaluations" ADD CONSTRAINT "settlement_evaluations_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_state_snapshots" ADD CONSTRAINT "financial_state_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_reserves" ADD CONSTRAINT "emergency_reserves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
