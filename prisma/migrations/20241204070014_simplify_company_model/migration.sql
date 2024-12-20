/*
  Warnings:

  - You are about to drop the column `description` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Company` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Company_name_code_idx";

-- DropIndex
DROP INDEX "Company_name_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "description",
DROP COLUMN "name";

-- CreateIndex
CREATE INDEX "Company_code_idx" ON "Company"("code");
