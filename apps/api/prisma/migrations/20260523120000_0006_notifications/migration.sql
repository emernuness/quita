-- Notifications in-app (Spec Fase 5 §10 + Fase 1 §9.4).

CREATE TYPE "NotificationCategory" AS ENUM (
  'motor_recalc',
  'due_date',
  'payment_recorded',
  'goal_progress',
  'weekly_progress',
  'risk_alert',
  'settlement_evaluated',
  'account'
);

CREATE TYPE "NotificationSeverity" AS ENUM ('info', 'success', 'warning', 'danger');

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "severity" "NotificationSeverity" NOT NULL DEFAULT 'info',
  "title" VARCHAR(140) NOT NULL,
  "body" VARCHAR(500) NOT NULL,
  "link_url" VARCHAR(500),
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_read_at_created_at_idx"
  ON "notifications"("user_id", "read_at", "created_at");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
