-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'UNDONE');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "putawayBatchId" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "undoneAt" TIMESTAMP(3),
ADD COLUMN     "undoneById" TEXT;

-- CreateTable
CREATE TABLE "PutawayBatch" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',

    CONSTRAINT "PutawayBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PutawayBatch_locationId_idx" ON "PutawayBatch"("locationId");

-- CreateIndex
CREATE INDEX "Transaction_putawayBatchId_idx" ON "Transaction"("putawayBatchId");

-- CreateIndex
CREATE INDEX "Transaction_undoneById_idx" ON "Transaction"("undoneById");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_putawayBatchId_fkey" FOREIGN KEY ("putawayBatchId") REFERENCES "PutawayBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_undoneById_fkey" FOREIGN KEY ("undoneById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutawayBatch" ADD CONSTRAINT "PutawayBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
