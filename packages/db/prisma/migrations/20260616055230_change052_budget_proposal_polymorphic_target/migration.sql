-- CHANGE-052: Budget Proposal 多態目標（綁定 Project 或 OMExpense，二擇一 XOR）
-- 手動調整：ownerId 為 NOT NULL，但既有提案資料需先回填（= 所屬專案的 managerId），
-- 故採「先可空 → 回填 → 設 NOT NULL」三步，確保含資料的環境（本機/生產）也能安全套用。

-- DropForeignKey: projectId 改為可選，需重建 FK（ON DELETE SET NULL）
ALTER TABLE "BudgetProposal" DROP CONSTRAINT "BudgetProposal_projectId_fkey";

-- AlterTable: 新增欄位（ownerId 先允許 NULL 以便回填）
ALTER TABLE "BudgetProposal" ADD COLUMN     "omExpenseId" TEXT,
ADD COLUMN     "ownerId" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- 回填 ownerId = 既有提案所屬專案的 managerId（維持現有授權行為完全不變）
UPDATE "BudgetProposal" bp
SET "ownerId" = p."managerId"
FROM "Project" p
WHERE bp."projectId" = p."id" AND bp."ownerId" IS NULL;

-- 回填完成後設為 NOT NULL（若仍有 NULL（例如孤兒 projectId）此步會失敗，屬預期的安全護欄）
ALTER TABLE "BudgetProposal" ALTER COLUMN "ownerId" SET NOT NULL;

-- AlterTable: OMExpense 核准回寫欄位（D1）
ALTER TABLE "OMExpense" ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvedBudget" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "BudgetProposal_omExpenseId_idx" ON "BudgetProposal"("omExpenseId");

-- CreateIndex
CREATE INDEX "BudgetProposal_ownerId_idx" ON "BudgetProposal"("ownerId");

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_omExpenseId_fkey" FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
