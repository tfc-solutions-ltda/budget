-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "complexityFactor" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "complexityFactor" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "complexityFactor" DOUBLE PRECISION NOT NULL DEFAULT 1;
