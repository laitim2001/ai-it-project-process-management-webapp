-- DropForeignKey
ALTER TABLE "ApprovalStep" DROP CONSTRAINT "ApprovalStep_approverRoleId_fkey";

-- AlterTable
ALTER TABLE "ApprovalStep" ADD COLUMN     "approverUserId" TEXT,
ALTER COLUMN "approverRoleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProposalApprovalProgress" ADD COLUMN     "approverUserId" TEXT,
ALTER COLUMN "approverRoleId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ApprovalStep_approverUserId_idx" ON "ApprovalStep"("approverUserId");

-- CreateIndex
CREATE INDEX "ProposalApprovalProgress_approverUserId_status_idx" ON "ProposalApprovalProgress"("approverUserId", "status");

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalApprovalProgress" ADD CONSTRAINT "ProposalApprovalProgress_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
