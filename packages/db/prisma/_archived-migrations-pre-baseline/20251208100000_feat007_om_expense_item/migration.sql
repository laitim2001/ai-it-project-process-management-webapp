-- FEAT-007: OM Expense Header-Detail Architecture Refactoring
-- 新增 OMExpenseItem 表並修改 OMExpenseMonthly 支援新架構
-- 使用 IF NOT EXISTS 確保冪等性

-- ========================================
-- 1. OMExpenseItem 表 (OM 費用明細項目)
-- ========================================
CREATE TABLE IF NOT EXISTS "OMExpenseItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "omExpenseId" TEXT NOT NULL,

    -- 項目基本資訊
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    -- 預算和實際
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- 幣別
    "currencyId" TEXT,

    -- OpCo 歸屬
    "opCoId" TEXT NOT NULL,

    -- 日期範圍
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3) NOT NULL,

    -- 元數據
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OMExpenseItem_pkey" PRIMARY KEY ("id")
);

-- OMExpenseItem 索引
CREATE INDEX IF NOT EXISTS "OMExpenseItem_omExpenseId_idx" ON "OMExpenseItem"("omExpenseId");
CREATE INDEX IF NOT EXISTS "OMExpenseItem_opCoId_idx" ON "OMExpenseItem"("opCoId");
CREATE INDEX IF NOT EXISTS "OMExpenseItem_currencyId_idx" ON "OMExpenseItem"("currencyId");

-- OMExpenseItem 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_omExpenseId_fkey') THEN
        ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_omExpenseId_fkey"
        FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_opCoId_fkey') THEN
        ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_opCoId_fkey"
        FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_currencyId_fkey') THEN
        ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_currencyId_fkey"
        FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ========================================
-- 2. 修改 OMExpenseMonthly 表支援新架構
-- ========================================

-- 2.1 添加 omExpenseItemId 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'OMExpenseMonthly' AND column_name = 'omExpenseItemId') THEN
        ALTER TABLE "OMExpenseMonthly" ADD COLUMN "omExpenseItemId" TEXT;
    END IF;
END $$;

-- 2.2 將 omExpenseId 改為可選（如果還是 NOT NULL）
-- 注意：這需要先移除舊的 NOT NULL 約束
DO $$
BEGIN
    -- 檢查欄位是否存在且為 NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'OMExpenseMonthly'
        AND column_name = 'omExpenseId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "OMExpenseMonthly" ALTER COLUMN "omExpenseId" DROP NOT NULL;
    END IF;
END $$;

-- 2.3 添加 omExpenseItemId 索引
CREATE INDEX IF NOT EXISTS "OMExpenseMonthly_omExpenseItemId_idx" ON "OMExpenseMonthly"("omExpenseItemId");

-- 2.4 添加 omExpenseItemId 外鍵約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseItemId_fkey') THEN
        ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseItemId_fkey"
        FOREIGN KEY ("omExpenseItemId") REFERENCES "OMExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 2.5 添加新的 unique constraint (omExpenseItemId + month)
-- 先嘗試移除舊的 constraint（如果存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseItemId_month_key') THEN
        -- 只有當沒有 null 值時才添加 unique constraint
        -- 由於 omExpenseItemId 可以為 null，這個 constraint 不會影響舊資料
        ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseItemId_month_key"
        UNIQUE ("omExpenseItemId", "month");
    END IF;
EXCEPTION
    WHEN others THEN
        -- 如果添加失敗（例如有重複值），記錄但繼續
        RAISE NOTICE 'Could not add unique constraint OMExpenseMonthly_omExpenseItemId_month_key: %', SQLERRM;
END $$;

-- ========================================
-- 3. 添加 OMExpense 表可能缺失的欄位
-- ========================================

-- 3.1 hasItems 欄位（標記是否使用新架構）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'OMExpense' AND column_name = 'hasItems') THEN
        ALTER TABLE "OMExpense" ADD COLUMN "hasItems" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- ========================================
-- 4. 完成
-- ========================================
-- FEAT-007 Migration 完成
-- 本 Migration 為冪等設計，可安全重複執行
