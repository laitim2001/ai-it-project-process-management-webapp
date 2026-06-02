-- FEAT-001: 添加缺失的 Project 欄位 (projectCode, globalFlag, priority)
-- 使用 IF NOT EXISTS 確保冪等性，不會影響已有這些欄位的環境（如本地開發環境）

-- 1. 添加欄位（先設為 nullable 以支援現有資料）
-- PostgreSQL 不支援 ADD COLUMN IF NOT EXISTS，使用 DO block 處理
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Project' AND column_name = 'projectCode') THEN
        ALTER TABLE "Project" ADD COLUMN "projectCode" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Project' AND column_name = 'globalFlag') THEN
        ALTER TABLE "Project" ADD COLUMN "globalFlag" TEXT DEFAULT 'Region';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Project' AND column_name = 'priority') THEN
        ALTER TABLE "Project" ADD COLUMN "priority" TEXT DEFAULT 'Medium';
    END IF;
END $$;

-- 2. 為現有記錄生成臨時 projectCode（使用 UUID 前 8 位）
UPDATE "Project" SET "projectCode" = 'PRJ-' || SUBSTRING(id::text, 1, 8) WHERE "projectCode" IS NULL;

-- 3. 設置預設值（如果欄位值為 NULL）
UPDATE "Project" SET "globalFlag" = 'Region' WHERE "globalFlag" IS NULL;
UPDATE "Project" SET "priority" = 'Medium' WHERE "priority" IS NULL;

-- 4. 設置 NOT NULL 約束（使用 DO block 檢查是否已設置）
DO $$
BEGIN
    -- 檢查 projectCode 是否已經是 NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'Project' AND column_name = 'projectCode' AND is_nullable = 'YES') THEN
        ALTER TABLE "Project" ALTER COLUMN "projectCode" SET NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'Project' AND column_name = 'globalFlag' AND is_nullable = 'YES') THEN
        ALTER TABLE "Project" ALTER COLUMN "globalFlag" SET NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'Project' AND column_name = 'priority' AND is_nullable = 'YES') THEN
        ALTER TABLE "Project" ALTER COLUMN "priority" SET NOT NULL;
    END IF;
END $$;

-- 5. 添加唯一約束和索引（使用 IF NOT EXISTS）
CREATE UNIQUE INDEX IF NOT EXISTS "Project_projectCode_key" ON "Project"("projectCode");
CREATE INDEX IF NOT EXISTS "Project_projectCode_idx" ON "Project"("projectCode");
CREATE INDEX IF NOT EXISTS "Project_globalFlag_idx" ON "Project"("globalFlag");
CREATE INDEX IF NOT EXISTS "Project_priority_idx" ON "Project"("priority");
