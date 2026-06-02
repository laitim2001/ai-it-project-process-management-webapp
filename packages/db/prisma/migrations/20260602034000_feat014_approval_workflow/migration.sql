-- AlterTable
ALTER TABLE "BudgetProposal" ADD COLUMN     "currentStepSequence" INTEGER,
ADD COLUMN     "workflowId" TEXT;

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "proposalTypeFilter" TEXT,
    "minAmount" DOUBLE PRECISION,
    "maxAmount" DOUBLE PRECISION,
    "matchPriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approverRoleId" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalApprovalProgress" (
    "id" TEXT NOT NULL,
    "budgetProposalId" TEXT NOT NULL,
    "stepId" TEXT,
    "sequence" INTEGER NOT NULL,
    "approverRoleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalApprovalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_isActive_idx" ON "ApprovalWorkflow"("isActive");

-- CreateIndex
CREATE INDEX "ApprovalStep_workflowId_idx" ON "ApprovalStep"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalStep_approverRoleId_idx" ON "ApprovalStep"("approverRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_workflowId_sequence_key" ON "ApprovalStep"("workflowId", "sequence");

-- CreateIndex
CREATE INDEX "ProposalApprovalProgress_budgetProposalId_idx" ON "ProposalApprovalProgress"("budgetProposalId");

-- CreateIndex
CREATE INDEX "ProposalApprovalProgress_approverRoleId_status_idx" ON "ProposalApprovalProgress"("approverRoleId", "status");

-- CreateIndex
CREATE INDEX "ProposalApprovalProgress_stepId_idx" ON "ProposalApprovalProgress"("stepId");

-- CreateIndex
CREATE INDEX "BudgetProposal_workflowId_idx" ON "BudgetProposal"("workflowId");

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalApprovalProgress" ADD CONSTRAINT "ProposalApprovalProgress_budgetProposalId_fkey" FOREIGN KEY ("budgetProposalId") REFERENCES "BudgetProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalApprovalProgress" ADD CONSTRAINT "ProposalApprovalProgress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ApprovalStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalApprovalProgress" ADD CONSTRAINT "ProposalApprovalProgress_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
