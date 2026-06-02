-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "financialYear" INTEGER NOT NULL,
    "totalBudgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpenseItem" (
    "id" TEXT NOT NULL,
    "projectExpenseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currencyId" TEXT,
    "categoryId" TEXT,
    "opCoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "totalBudgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpenseMonthly" (
    "id" TEXT NOT NULL,
    "projectExpenseItemId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpenseMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectExpense_projectId_idx" ON "ProjectExpense"("projectId");

-- CreateIndex
CREATE INDEX "ProjectExpense_financialYear_idx" ON "ProjectExpense"("financialYear");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_projectExpenseId_idx" ON "ProjectExpenseItem"("projectExpenseId");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_currencyId_idx" ON "ProjectExpenseItem"("currencyId");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_categoryId_idx" ON "ProjectExpenseItem"("categoryId");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_opCoId_idx" ON "ProjectExpenseItem"("opCoId");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_sortOrder_idx" ON "ProjectExpenseItem"("sortOrder");

-- CreateIndex
CREATE INDEX "ProjectExpenseMonthly_projectExpenseItemId_idx" ON "ProjectExpenseMonthly"("projectExpenseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectExpenseMonthly_projectExpenseItemId_month_key" ON "ProjectExpenseMonthly"("projectExpenseItemId", "month");

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseItem" ADD CONSTRAINT "ProjectExpenseItem_projectExpenseId_fkey" FOREIGN KEY ("projectExpenseId") REFERENCES "ProjectExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseItem" ADD CONSTRAINT "ProjectExpenseItem_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseItem" ADD CONSTRAINT "ProjectExpenseItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseItem" ADD CONSTRAINT "ProjectExpenseItem_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseMonthly" ADD CONSTRAINT "ProjectExpenseMonthly_projectExpenseItemId_fkey" FOREIGN KEY ("projectExpenseItemId") REFERENCES "ProjectExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

