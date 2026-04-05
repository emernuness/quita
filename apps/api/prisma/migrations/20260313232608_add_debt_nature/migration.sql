-- CreateEnum
CREATE TYPE "DebtNature" AS ENUM ('installment', 'recurring', 'one_time');

-- AlterTable
ALTER TABLE "debts" ADD COLUMN     "nature" "DebtNature" NOT NULL DEFAULT 'one_time';
