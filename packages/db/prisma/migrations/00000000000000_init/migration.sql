-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "roleId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialYear" INTEGER NOT NULL,
    "description" TEXT,
    "currencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "managerId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "budgetPoolId" TEXT NOT NULL,
    "budgetCategoryId" TEXT,
    "requestedBudget" DOUBLE PRECISION,
    "approvedBudget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "chargeOutDate" TIMESTAMP(3),
    "projectCode" TEXT NOT NULL,
    "globalFlag" TEXT NOT NULL DEFAULT 'Region',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "currencyId" TEXT,
    "projectCategory" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'Project',
    "expenseType" TEXT NOT NULL DEFAULT 'Expense',
    "chargeBackToOpCo" BOOLEAN NOT NULL DEFAULT false,
    "chargeOutMethod" TEXT,
    "probability" TEXT NOT NULL DEFAULT 'Medium',
    "team" TEXT,
    "personInCharge" TEXT,
    "fiscalYear" INTEGER,
    "isCdoReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "isManagerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "payForWhat" TEXT,
    "payToWhom" TEXT,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "lastFYActualExpense" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetProposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "projectId" TEXT NOT NULL,
    "proposalFilePath" TEXT,
    "proposalFileName" TEXT,
    "proposalFileSize" INTEGER,
    "meetingDate" TIMESTAMP(3),
    "meetingNotes" TEXT,
    "presentedBy" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "proposalType" TEXT NOT NULL DEFAULT 'BudgetProposal',
    "vendorId" TEXT,
    "reviewNotes" TEXT,
    "documentLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currencyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "quoteId" TEXT,
    "approvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currencyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "invoiceFilePath" TEXT,
    "requiresChargeOut" BOOLEAN NOT NULL DEFAULT false,
    "isOperationMaint" BOOLEAN NOT NULL DEFAULT false,
    "purchaseOrderId" TEXT NOT NULL,
    "budgetCategoryId" TEXT,
    "vendorId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "budgetProposalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "budgetProposalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingCompany" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectChargeOutOpCo" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "opCoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectChargeOutOpCo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOperatingCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatingCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "UserOperatingCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetPoolId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryCode" TEXT,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "categoryId" TEXT,
    "chargeOutOpCoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OMExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "financialYear" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT,
    "totalBudgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultOpCoId" TEXT,
    "opCoId" TEXT,
    "budgetAmount" DOUBLE PRECISION,
    "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "yoyGrowthRate" DOUBLE PRECISION,
    "vendorId" TEXT,
    "sourceExpenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OMExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OMExpenseItem" (
    "id" TEXT NOT NULL,
    "omExpenseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastFYActualExpense" DOUBLE PRECISION,
    "currencyId" TEXT,
    "opCoId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OMExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OMExpenseMonthly" (
    "id" TEXT NOT NULL,
    "omExpenseItemId" TEXT,
    "omExpenseId" TEXT,
    "month" INTEGER NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL,
    "opCoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OMExpenseMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeOut" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "opCoId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "debitNoteNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargeOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeOutItem" (
    "id" TEXT NOT NULL,
    "chargeOutId" TEXT NOT NULL,
    "expenseItemId" TEXT,
    "expenseId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargeOutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_code_idx" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_isActive_idx" ON "Permission"("isActive");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "BudgetPool_financialYear_idx" ON "BudgetPool"("financialYear");

-- CreateIndex
CREATE INDEX "BudgetPool_currencyId_idx" ON "BudgetPool"("currencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_managerId_idx" ON "Project"("managerId");

-- CreateIndex
CREATE INDEX "Project_supervisorId_idx" ON "Project"("supervisorId");

-- CreateIndex
CREATE INDEX "Project_budgetPoolId_idx" ON "Project"("budgetPoolId");

-- CreateIndex
CREATE INDEX "Project_budgetCategoryId_idx" ON "Project"("budgetCategoryId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_projectCode_idx" ON "Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_globalFlag_idx" ON "Project"("globalFlag");

-- CreateIndex
CREATE INDEX "Project_priority_idx" ON "Project"("priority");

-- CreateIndex
CREATE INDEX "Project_currencyId_idx" ON "Project"("currencyId");

-- CreateIndex
CREATE INDEX "Project_projectCategory_idx" ON "Project"("projectCategory");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_expenseType_idx" ON "Project"("expenseType");

-- CreateIndex
CREATE INDEX "Project_chargeBackToOpCo_idx" ON "Project"("chargeBackToOpCo");

-- CreateIndex
CREATE INDEX "Project_probability_idx" ON "Project"("probability");

-- CreateIndex
CREATE INDEX "Project_team_idx" ON "Project"("team");

-- CreateIndex
CREATE INDEX "Project_fiscalYear_idx" ON "Project"("fiscalYear");

-- CreateIndex
CREATE INDEX "Project_isCdoReviewRequired_idx" ON "Project"("isCdoReviewRequired");

-- CreateIndex
CREATE INDEX "BudgetProposal_projectId_idx" ON "BudgetProposal"("projectId");

-- CreateIndex
CREATE INDEX "BudgetProposal_status_idx" ON "BudgetProposal"("status");

-- CreateIndex
CREATE INDEX "BudgetProposal_approvedBy_idx" ON "BudgetProposal"("approvedBy");

-- CreateIndex
CREATE INDEX "BudgetProposal_vendorId_idx" ON "BudgetProposal"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Quote_vendorId_idx" ON "Quote"("vendorId");

-- CreateIndex
CREATE INDEX "Quote_projectId_idx" ON "Quote"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_currencyId_idx" ON "PurchaseOrder"("currencyId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "Expense_purchaseOrderId_idx" ON "Expense"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Expense_budgetCategoryId_idx" ON "Expense"("budgetCategoryId");

-- CreateIndex
CREATE INDEX "Expense_vendorId_idx" ON "Expense"("vendorId");

-- CreateIndex
CREATE INDEX "Expense_currencyId_idx" ON "Expense"("currencyId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_requiresChargeOut_idx" ON "Expense"("requiresChargeOut");

-- CreateIndex
CREATE INDEX "Expense_isOperationMaint_idx" ON "Expense"("isOperationMaint");

-- CreateIndex
CREATE INDEX "Comment_budgetProposalId_idx" ON "Comment"("budgetProposalId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "History_budgetProposalId_idx" ON "History"("budgetProposalId");

-- CreateIndex
CREATE INDEX "History_userId_idx" ON "History"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingCompany_code_key" ON "OperatingCompany"("code");

-- CreateIndex
CREATE INDEX "OperatingCompany_isActive_idx" ON "OperatingCompany"("isActive");

-- CreateIndex
CREATE INDEX "ProjectChargeOutOpCo_projectId_idx" ON "ProjectChargeOutOpCo"("projectId");

-- CreateIndex
CREATE INDEX "ProjectChargeOutOpCo_opCoId_idx" ON "ProjectChargeOutOpCo"("opCoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectChargeOutOpCo_projectId_opCoId_key" ON "ProjectChargeOutOpCo"("projectId", "opCoId");

-- CreateIndex
CREATE INDEX "UserOperatingCompany_userId_idx" ON "UserOperatingCompany"("userId");

-- CreateIndex
CREATE INDEX "UserOperatingCompany_operatingCompanyId_idx" ON "UserOperatingCompany"("operatingCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOperatingCompany_userId_operatingCompanyId_key" ON "UserOperatingCompany"("userId", "operatingCompanyId");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetPoolId_idx" ON "BudgetCategory"("budgetPoolId");

-- CreateIndex
CREATE INDEX "BudgetCategory_isActive_idx" ON "BudgetCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetPoolId_categoryName_key" ON "BudgetCategory"("budgetPoolId", "categoryName");

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_projectId_idx" ON "ProjectBudgetCategory"("projectId");

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_budgetCategoryId_idx" ON "ProjectBudgetCategory"("budgetCategoryId");

-- CreateIndex
CREATE INDEX "ProjectBudgetCategory_isActive_idx" ON "ProjectBudgetCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBudgetCategory_projectId_budgetCategoryId_key" ON "ProjectBudgetCategory"("projectId", "budgetCategoryId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ExpenseItem_expenseId_idx" ON "ExpenseItem"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseItem_categoryId_idx" ON "ExpenseItem"("categoryId");

-- CreateIndex
CREATE INDEX "ExpenseItem_chargeOutOpCoId_idx" ON "ExpenseItem"("chargeOutOpCoId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_code_key" ON "ExpenseCategory"("code");

-- CreateIndex
CREATE INDEX "ExpenseCategory_code_idx" ON "ExpenseCategory"("code");

-- CreateIndex
CREATE INDEX "ExpenseCategory_isActive_idx" ON "ExpenseCategory"("isActive");

-- CreateIndex
CREATE INDEX "OMExpense_defaultOpCoId_idx" ON "OMExpense"("defaultOpCoId");

-- CreateIndex
CREATE INDEX "OMExpense_opCoId_idx" ON "OMExpense"("opCoId");

-- CreateIndex
CREATE INDEX "OMExpense_vendorId_idx" ON "OMExpense"("vendorId");

-- CreateIndex
CREATE INDEX "OMExpense_financialYear_idx" ON "OMExpense"("financialYear");

-- CreateIndex
CREATE INDEX "OMExpense_category_idx" ON "OMExpense"("category");

-- CreateIndex
CREATE INDEX "OMExpense_categoryId_idx" ON "OMExpense"("categoryId");

-- CreateIndex
CREATE INDEX "OMExpense_sourceExpenseId_idx" ON "OMExpense"("sourceExpenseId");

-- CreateIndex
CREATE INDEX "OMExpenseItem_omExpenseId_idx" ON "OMExpenseItem"("omExpenseId");

-- CreateIndex
CREATE INDEX "OMExpenseItem_opCoId_idx" ON "OMExpenseItem"("opCoId");

-- CreateIndex
CREATE INDEX "OMExpenseItem_currencyId_idx" ON "OMExpenseItem"("currencyId");

-- CreateIndex
CREATE INDEX "OMExpenseItem_sortOrder_idx" ON "OMExpenseItem"("sortOrder");

-- CreateIndex
CREATE INDEX "OMExpenseMonthly_omExpenseItemId_idx" ON "OMExpenseMonthly"("omExpenseItemId");

-- CreateIndex
CREATE INDEX "OMExpenseMonthly_omExpenseId_idx" ON "OMExpenseMonthly"("omExpenseId");

-- CreateIndex
CREATE INDEX "OMExpenseMonthly_opCoId_idx" ON "OMExpenseMonthly"("opCoId");

-- CreateIndex
CREATE INDEX "OMExpenseMonthly_month_idx" ON "OMExpenseMonthly"("month");

-- CreateIndex
CREATE UNIQUE INDEX "OMExpenseMonthly_omExpenseItemId_month_key" ON "OMExpenseMonthly"("omExpenseItemId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "OMExpenseMonthly_omExpenseId_month_key" ON "OMExpenseMonthly"("omExpenseId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeOut_debitNoteNumber_key" ON "ChargeOut"("debitNoteNumber");

-- CreateIndex
CREATE INDEX "ChargeOut_projectId_idx" ON "ChargeOut"("projectId");

-- CreateIndex
CREATE INDEX "ChargeOut_opCoId_idx" ON "ChargeOut"("opCoId");

-- CreateIndex
CREATE INDEX "ChargeOut_status_idx" ON "ChargeOut"("status");

-- CreateIndex
CREATE INDEX "ChargeOut_confirmedBy_idx" ON "ChargeOut"("confirmedBy");

-- CreateIndex
CREATE INDEX "ChargeOutItem_chargeOutId_idx" ON "ChargeOutItem"("chargeOutId");

-- CreateIndex
CREATE INDEX "ChargeOutItem_expenseItemId_idx" ON "ChargeOutItem"("expenseItemId");

-- CreateIndex
CREATE INDEX "ChargeOutItem_expenseId_idx" ON "ChargeOutItem"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_code_idx" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_active_idx" ON "Currency"("active");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPool" ADD CONSTRAINT "BudgetPool_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_budgetPoolId_fkey" FOREIGN KEY ("budgetPoolId") REFERENCES "BudgetPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_budgetProposalId_fkey" FOREIGN KEY ("budgetProposalId") REFERENCES "BudgetProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_budgetProposalId_fkey" FOREIGN KEY ("budgetProposalId") REFERENCES "BudgetProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChargeOutOpCo" ADD CONSTRAINT "ProjectChargeOutOpCo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChargeOutOpCo" ADD CONSTRAINT "ProjectChargeOutOpCo_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOperatingCompany" ADD CONSTRAINT "UserOperatingCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOperatingCompany" ADD CONSTRAINT "UserOperatingCompany_operatingCompanyId_fkey" FOREIGN KEY ("operatingCompanyId") REFERENCES "OperatingCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetPoolId_fkey" FOREIGN KEY ("budgetPoolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetCategory" ADD CONSTRAINT "ProjectBudgetCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetCategory" ADD CONSTRAINT "ProjectBudgetCategory_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_chargeOutOpCoId_fkey" FOREIGN KEY ("chargeOutOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_defaultOpCoId_fkey" FOREIGN KEY ("defaultOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_sourceExpenseId_fkey" FOREIGN KEY ("sourceExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_omExpenseId_fkey" FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseItemId_fkey" FOREIGN KEY ("omExpenseItemId") REFERENCES "OMExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseId_fkey" FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_opCoId_fkey" FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_chargeOutId_fkey" FOREIGN KEY ("chargeOutId") REFERENCES "ChargeOut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

