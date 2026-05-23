-- AlterTable
ALTER TABLE "debts" DROP COLUMN "overdue_months",
DROP COLUMN "priority_order";

-- AlterTable
ALTER TABLE "payment_plans" ALTER COLUMN "strategy" SET DEFAULT 'hybrid';

