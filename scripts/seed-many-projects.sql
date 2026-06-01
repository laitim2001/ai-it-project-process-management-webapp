-- 批量建立 30 個測試 projects 以驗證 BudgetProposalForm 的 limit 修復
-- 使用 PostgreSQL gen_random_uuid() 產生 UUID
-- 配合測試：開 /zh-TW/proposals/new 看下拉選單是否顯示 30+ 個

DO $$
DECLARE
  admin_id TEXT;
  pool_id TEXT := 'aaaa1111-1111-1111-1111-111111111111';  -- Test Pool A
  i INTEGER;
BEGIN
  SELECT id INTO admin_id FROM "User" WHERE email = 'admin@itpm.local' LIMIT 1;

  FOR i IN 1..30 LOOP
    INSERT INTO "Project" (
      id, name, description, status, "projectCode",
      "managerId", "supervisorId", "budgetPoolId",
      "startDate", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      'Bulk Test Project ' || LPAD(i::TEXT, 3, '0'),
      'Auto-generated for testing project dropdown limit',
      'Draft',
      'BULK-' || LPAD(i::TEXT, 3, '0'),
      admin_id,
      admin_id,
      pool_id,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ("projectCode") DO NOTHING;
  END LOOP;
END $$;

SELECT COUNT(*) AS total_projects FROM "Project";
