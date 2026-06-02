-- CreateTable
CREATE TABLE "ProjectBudgetCategory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "budgetCategoryId" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_projectId_idx" ON "ProjectBudgetCategory"("projectId");

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_budgetCategoryId_idx" ON "ProjectBudgetCategory"("budgetCategoryId");

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_isActive_idx" ON "ProjectBudgetCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBudgetCategory_projectId_budgetCategoryId_key" ON "ProjectBudgetCategory"("projectId", "budgetCategoryId");

-- AddForeignKey
ALTER TABLE "ProjectBudgetCategory" ADD CONSTRAINT "ProjectBudgetCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetCategory" ADD CONSTRAINT "ProjectBudgetCategory_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
