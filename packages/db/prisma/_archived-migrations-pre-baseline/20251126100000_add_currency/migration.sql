-- CreateTable: Currency (FEAT-001: 專案欄位擴展 - 貨幣支援)
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_code_idx" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_active_idx" ON "Currency"("active");

-- AlterTable: BudgetPool - Add currencyId (FEAT-002)
-- Note: Adding as nullable first to allow migration on existing data
-- In production, you may want to set a default currency and make it NOT NULL later
ALTER TABLE "BudgetPool" ADD COLUMN "currencyId" TEXT;

-- AlterTable: Project - Add currencyId (FEAT-001)
ALTER TABLE "Project" ADD COLUMN "currencyId" TEXT;

-- AlterTable: PurchaseOrder - Add currencyId (FEAT-002)
ALTER TABLE "PurchaseOrder" ADD COLUMN "currencyId" TEXT;

-- AlterTable: Expense - Add currencyId (FEAT-002)
ALTER TABLE "Expense" ADD COLUMN "currencyId" TEXT;

-- CreateIndex: BudgetPool
CREATE INDEX "BudgetPool_currencyId_idx" ON "BudgetPool"("currencyId");

-- CreateIndex: Project
CREATE INDEX "Project_currencyId_idx" ON "Project"("currencyId");

-- CreateIndex: PurchaseOrder
CREATE INDEX "PurchaseOrder_currencyId_idx" ON "PurchaseOrder"("currencyId");

-- CreateIndex: Expense
CREATE INDEX "Expense_currencyId_idx" ON "Expense"("currencyId");

-- AddForeignKey: BudgetPool -> Currency
ALTER TABLE "BudgetPool" ADD CONSTRAINT "BudgetPool_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Project -> Currency
ALTER TABLE "Project" ADD CONSTRAINT "Project_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PurchaseOrder -> Currency
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Expense -> Currency
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
