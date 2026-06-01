-- 建立 UUID 格式的測試資料以複現 Project Update 跨 Budget Pool 切換的 bug
-- 兩個 pool，每個 pool 一個 category；一個 project 指派 Pool A 的 category
--
-- 配合測試：apps/web/e2e/workflows/project-update-cross-pool.spec.ts
-- 執行方式：
--   PowerShell:
--     Get-Content scripts/seed-cross-pool-test-data.sql | docker exec -i itpm-postgres-dev psql -U postgres -d itpm_dev
--   Bash:
--     docker exec -i itpm-postgres-dev psql -U postgres -d itpm_dev < scripts/seed-cross-pool-test-data.sql

INSERT INTO "BudgetPool" (id, name, description, "totalAmount", "financialYear", "createdAt", "updatedAt") VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Test Pool A (UUID)', 'For 400 bug repro', 500000, 2025, NOW(), NOW()),
  ('bbbb2222-2222-2222-2222-222222222222', 'Test Pool B (UUID)', 'For 400 bug repro', 600000, 2025, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "BudgetCategory" (id, "categoryName", "categoryCode", "totalAmount", "budgetPoolId", "isActive", "createdAt", "updatedAt") VALUES
  ('aaaacccc-cccc-cccc-cccc-cccccccccccc', 'Hardware-A', 'HW-A', 250000, 'aaaa1111-1111-1111-1111-111111111111', true, NOW(), NOW()),
  ('bbbbdddd-dddd-dddd-dddd-dddddddddddd', 'Hardware-B', 'HW-B', 300000, 'bbbb2222-2222-2222-2222-222222222222', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 找一個現有 user 當 manager/supervisor
DO $$
DECLARE
  admin_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM "User" WHERE email = 'admin@itpm.local' LIMIT 1;

  INSERT INTO "Project" (id, name, description, status, "projectCode", "managerId", "supervisorId", "budgetPoolId", "budgetCategoryId", "startDate", "createdAt", "updatedAt")
  VALUES (
    'eeee9999-9999-9999-9999-999999999999',
    'Test Project (Cross-Pool 400 Bug)',
    'Used to verify that switching budget pool no longer causes HTTP 400',
    'Draft',
    'TEST-CROSSPOOL-400',
    admin_id,
    admin_id,
    'aaaa1111-1111-1111-1111-111111111111',
    'aaaacccc-cccc-cccc-cccc-cccccccccccc',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET "budgetPoolId" = EXCLUDED."budgetPoolId",
        "budgetCategoryId" = EXCLUDED."budgetCategoryId";
END $$;

SELECT p.id, p.name, p."budgetPoolId", p."budgetCategoryId" FROM "Project" p WHERE p.id = 'eeee9999-9999-9999-9999-999999999999';
