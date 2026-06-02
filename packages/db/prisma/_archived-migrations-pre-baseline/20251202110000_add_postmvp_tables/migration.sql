-- Post-MVP Tables Migration
-- 添加 ExpenseCategory, OperatingCompany, OMExpense, OMExpenseMonthly 等 Post-MVP 新增表
-- 使用 IF NOT EXISTS 確保冪等性，不會影響已有這些表的環境（如本地開發環境）

-- ========================================
-- 1. ExpenseCategory 表 (統一費用類別)
-- ========================================
CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- ExpenseCategory 唯一約束和索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseCategory_code_key') THEN
        ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_code_key" UNIQUE ("code");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ExpenseCategory_code_idx" ON "ExpenseCategory"("code");
CREATE INDEX IF NOT EXISTS "ExpenseCategory_isActive_idx" ON "ExpenseCategory"("isActive");

-- ========================================
-- 2. OperatingCompany 表 (營運公司)
-- ========================================
CREATE TABLE IF NOT EXISTS "OperatingCompany" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatingCompany_pkey" PRIMARY KEY ("id")
);

-- OperatingCompany 唯一約束和索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatingCompany_code_key') THEN
        ALTER TABLE "OperatingCompany" ADD CONSTRAINT "OperatingCompany_code_key" UNIQUE ("code");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OperatingCompany_isActive_idx" ON "OperatingCompany"("isActive");

-- ========================================
-- 3. BudgetCategory 表 (預算類別)
-- ========================================
CREATE TABLE IF NOT EXISTS "BudgetCategory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "budgetPoolId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryCode" TEXT,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- BudgetCategory 唯一約束和索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetCategory_budgetPoolId_categoryName_key') THEN
        ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetPoolId_categoryName_key" UNIQUE ("budgetPoolId", "categoryName");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BudgetCategory_budgetPoolId_idx" ON "BudgetCategory"("budgetPoolId");
CREATE INDEX IF NOT EXISTS "BudgetCategory_isActive_idx" ON "BudgetCategory"("isActive");

-- BudgetCategory 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetCategory_budgetPoolId_fkey') THEN
        ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetPoolId_fkey"
        FOREIGN KEY ("budgetPoolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 4. PurchaseOrderItem 表 (採購單明細)
-- ========================================
CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "purchaseOrderId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- PurchaseOrderItem 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrderItem_purchaseOrderId_fkey') THEN
        ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey"
        FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 5. ExpenseItem 表 (費用明細)
-- ========================================
CREATE TABLE IF NOT EXISTS "ExpenseItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "expenseId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "categoryId" TEXT,
    "chargeOutOpCoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExpenseItem_expenseId_idx" ON "ExpenseItem"("expenseId");
CREATE INDEX IF NOT EXISTS "ExpenseItem_categoryId_idx" ON "ExpenseItem"("categoryId");
CREATE INDEX IF NOT EXISTS "ExpenseItem_chargeOutOpCoId_idx" ON "ExpenseItem"("chargeOutOpCoId");

-- ExpenseItem 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_expenseId_fkey') THEN
        ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey"
        FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_categoryId_fkey') THEN
        ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_chargeOutOpCoId_fkey') THEN
        ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_chargeOutOpCoId_fkey"
        FOREIGN KEY ("chargeOutOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 6. OMExpense 表 (操作與維護費用)
-- ========================================
CREATE TABLE IF NOT EXISTS "OMExpense" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "financialYear" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT,
    "opCoId" TEXT NOT NULL,
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yoyGrowthRate" DOUBLE PRECISION,
    "vendorId" TEXT,
    "sourceExpenseId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OMExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OMExpense_opCoId_idx" ON "OMExpense"("opCoId");
CREATE INDEX IF NOT EXISTS "OMExpense_vendorId_idx" ON "OMExpense"("vendorId");
CREATE INDEX IF NOT EXISTS "OMExpense_financialYear_idx" ON "OMExpense"("financialYear");
CREATE INDEX IF NOT EXISTS "OMExpense_category_idx" ON "OMExpense"("category");
CREATE INDEX IF NOT EXISTS "OMExpense_categoryId_idx" ON "OMExpense"("categoryId");
CREATE INDEX IF NOT EXISTS "OMExpense_sourceExpenseId_idx" ON "OMExpense"("sourceExpenseId");

-- OMExpense 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpense_opCoId_fkey') THEN
        ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_opCoId_fkey"
        FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpense_vendorId_fkey') THEN
        ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_vendorId_fkey"
        FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpense_categoryId_fkey') THEN
        ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpense_sourceExpenseId_fkey') THEN
        ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_sourceExpenseId_fkey"
        FOREIGN KEY ("sourceExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 7. OMExpenseMonthly 表 (OM費用月度記錄)
-- ========================================
CREATE TABLE IF NOT EXISTS "OMExpenseMonthly" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "omExpenseId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL,
    "opCoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OMExpenseMonthly_pkey" PRIMARY KEY ("id")
);

-- OMExpenseMonthly 唯一約束和索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseId_month_key') THEN
        ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseId_month_key" UNIQUE ("omExpenseId", "month");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OMExpenseMonthly_omExpenseId_idx" ON "OMExpenseMonthly"("omExpenseId");
CREATE INDEX IF NOT EXISTS "OMExpenseMonthly_opCoId_idx" ON "OMExpenseMonthly"("opCoId");
CREATE INDEX IF NOT EXISTS "OMExpenseMonthly_month_idx" ON "OMExpenseMonthly"("month");

-- OMExpenseMonthly 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseId_fkey') THEN
        ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseId_fkey"
        FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_opCoId_fkey') THEN
        ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_opCoId_fkey"
        FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 8. ChargeOut 表 (費用轉嫁表頭)
-- ========================================
CREATE TABLE IF NOT EXISTS "ChargeOut" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargeOut_pkey" PRIMARY KEY ("id")
);

-- ChargeOut 唯一約束和索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOut_debitNoteNumber_key') THEN
        ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_debitNoteNumber_key" UNIQUE ("debitNoteNumber");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ChargeOut_projectId_idx" ON "ChargeOut"("projectId");
CREATE INDEX IF NOT EXISTS "ChargeOut_opCoId_idx" ON "ChargeOut"("opCoId");
CREATE INDEX IF NOT EXISTS "ChargeOut_status_idx" ON "ChargeOut"("status");
CREATE INDEX IF NOT EXISTS "ChargeOut_confirmedBy_idx" ON "ChargeOut"("confirmedBy");

-- ChargeOut 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOut_projectId_fkey') THEN
        ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOut_opCoId_fkey') THEN
        ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_opCoId_fkey"
        FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOut_confirmedBy_fkey') THEN
        ALTER TABLE "ChargeOut" ADD CONSTRAINT "ChargeOut_confirmedBy_fkey"
        FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 9. ChargeOutItem 表 (費用轉嫁明細)
-- ========================================
CREATE TABLE IF NOT EXISTS "ChargeOutItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "chargeOutId" TEXT NOT NULL,
    "expenseItemId" TEXT,
    "expenseId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargeOutItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChargeOutItem_chargeOutId_idx" ON "ChargeOutItem"("chargeOutId");
CREATE INDEX IF NOT EXISTS "ChargeOutItem_expenseItemId_idx" ON "ChargeOutItem"("expenseItemId");
CREATE INDEX IF NOT EXISTS "ChargeOutItem_expenseId_idx" ON "ChargeOutItem"("expenseId");

-- ChargeOutItem 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOutItem_chargeOutId_fkey') THEN
        ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_chargeOutId_fkey"
        FOREIGN KEY ("chargeOutId") REFERENCES "ChargeOut"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOutItem_expenseItemId_fkey') THEN
        ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_expenseItemId_fkey"
        FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChargeOutItem_expenseId_fkey') THEN
        ALTER TABLE "ChargeOutItem" ADD CONSTRAINT "ChargeOutItem_expenseId_fkey"
        FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 10. 插入預設費用類別數據
-- ========================================
INSERT INTO "ExpenseCategory" ("id", "code", "name", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, code, name, description, "sortOrder", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('HW', '硬體', '硬體設備、伺服器、工作站等', 1),
    ('SW', '軟體', '軟體授權、應用程式購買', 2),
    ('SV', '服務', '顧問服務、技術支援、實施服務', 3),
    ('MAINT', '維護', '設備維護、系統維護、保固延長', 4),
    ('LICENSE', '授權', '軟體授權續約、訂閱費用', 5),
    ('CLOUD', '雲端', '雲端服務、IaaS/PaaS/SaaS 費用', 6),
    ('TELECOM', '電信', '網路費用、電話費、通訊服務', 7),
    ('OTHER', '其他', '其他未分類費用', 99)
) AS v(code, name, description, "sortOrder")
WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "ExpenseCategory"."code" = v.code);

-- ========================================
-- 11. 插入預設營運公司數據
-- ========================================
INSERT INTO "OperatingCompany" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, code, name, description, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('RCL', 'Regional Control', 'Regional Control Layer - 總部'),
    ('OpCo-HK', 'Hong Kong Operations', '香港營運公司'),
    ('OpCo-SG', 'Singapore Operations', '新加坡營運公司'),
    ('OpCo-TW', 'Taiwan Operations', '台灣營運公司')
) AS v(code, name, description)
WHERE NOT EXISTS (SELECT 1 FROM "OperatingCompany" WHERE "OperatingCompany"."code" = v.code);

-- ========================================
-- 12. 添加 Expense 表缺失的欄位 (如果不存在)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'budgetCategoryId') THEN
        ALTER TABLE "Expense" ADD COLUMN "budgetCategoryId" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'vendorId') THEN
        ALTER TABLE "Expense" ADD COLUMN "vendorId" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'requiresChargeOut') THEN
        ALTER TABLE "Expense" ADD COLUMN "requiresChargeOut" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'isOperationMaint') THEN
        ALTER TABLE "Expense" ADD COLUMN "isOperationMaint" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'currencyId') THEN
        ALTER TABLE "Expense" ADD COLUMN "currencyId" TEXT;
    END IF;
END $$;

-- Expense 新欄位的索引
CREATE INDEX IF NOT EXISTS "Expense_budgetCategoryId_idx" ON "Expense"("budgetCategoryId");
CREATE INDEX IF NOT EXISTS "Expense_vendorId_idx" ON "Expense"("vendorId");
CREATE INDEX IF NOT EXISTS "Expense_currencyId_idx" ON "Expense"("currencyId");
CREATE INDEX IF NOT EXISTS "Expense_requiresChargeOut_idx" ON "Expense"("requiresChargeOut");
CREATE INDEX IF NOT EXISTS "Expense_isOperationMaint_idx" ON "Expense"("isOperationMaint");

-- ========================================
-- 13. 添加 BudgetPool 表缺失的欄位
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'BudgetPool' AND column_name = 'description') THEN
        ALTER TABLE "BudgetPool" ADD COLUMN "description" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'BudgetPool' AND column_name = 'currencyId') THEN
        ALTER TABLE "BudgetPool" ADD COLUMN "currencyId" TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BudgetPool_currencyId_idx" ON "BudgetPool"("currencyId");

-- ========================================
-- 14. 添加 PurchaseOrder 表缺失的欄位
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'PurchaseOrder' AND column_name = 'name') THEN
        ALTER TABLE "PurchaseOrder" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'PurchaseOrder' AND column_name = 'description') THEN
        ALTER TABLE "PurchaseOrder" ADD COLUMN "description" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'PurchaseOrder' AND column_name = 'status') THEN
        ALTER TABLE "PurchaseOrder" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Draft';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'PurchaseOrder' AND column_name = 'currencyId') THEN
        ALTER TABLE "PurchaseOrder" ADD COLUMN "currencyId" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'PurchaseOrder' AND column_name = 'approvedDate') THEN
        ALTER TABLE "PurchaseOrder" ADD COLUMN "approvedDate" TIMESTAMP(3);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PurchaseOrder_currencyId_idx" ON "PurchaseOrder"("currencyId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
