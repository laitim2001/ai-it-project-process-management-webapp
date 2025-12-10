-- FEAT-008: OM Expense Data Import
-- 新增 lastFYActualExpense 欄位到 OMExpenseItem 表
-- 用於 Summary 年度比較功能
-- 使用冪等設計，可安全重複執行

-- ========================================
-- 1. 添加 lastFYActualExpense 欄位
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'OMExpenseItem' AND column_name = 'lastFYActualExpense'
    ) THEN
        ALTER TABLE "OMExpenseItem" ADD COLUMN "lastFYActualExpense" DOUBLE PRECISION;
        RAISE NOTICE 'Added lastFYActualExpense column to OMExpenseItem table';
    ELSE
        RAISE NOTICE 'lastFYActualExpense column already exists in OMExpenseItem table';
    END IF;
END $$;

-- ========================================
-- 2. 完成
-- ========================================
-- FEAT-008 Migration 完成
-- 本 Migration 為冪等設計，可安全重複執行
