-- ============================================================================
-- Pre-flight 唯讀檢查（company/dev 升級到 HEAD 前）
-- ============================================================================
-- 用途：在不改動任何資料的前提下，坐實根因 + 為 CHANGE-052 把關。
-- 安全性：全部為 SELECT，無任何寫入。可重複執行。
-- 執行：psql "$DATABASE_URL" -f /work/preflight-readonly.sql
-- 對應 runbook：docs/deployment/12-...md Phase 0
-- 注意：不設 ON_ERROR_STOP，使單一查詢失敗（如某表不存在）仍跑完其餘，
--       藉此一併探知「表是否存在」。
-- ============================================================================

-- 注意：所有 stdout 輸出（\echo / SELECT）一律純 ASCII，避免 Windows az container logs cp1252 crash。
-- 中文說明放在 SQL 註解（-- 開頭，不輸出到 stdout）。

-- 1. 線上 migration 套用歷史
\echo '=== 1. migration history (_prisma_migrations) ==='
SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at;

-- 2. 孤兒 projectId 提案（期望 0 筆；CHANGE-052 SET NOT NULL 護欄）
\echo ''
\echo '=== 2. orphan projectId proposals (expect 0 rows; CHANGE-052 guard) ==='
SELECT bp.id, bp."projectId"
FROM "BudgetProposal" bp
LEFT JOIN "Project" p ON bp."projectId" = p.id
WHERE bp."projectId" IS NOT NULL AND p.id IS NULL;

-- 2b. 提案總數 / projectId 為 NULL 的數量
\echo ''
\echo '=== 2b. proposal totals / null projectId count ==='
SELECT COUNT(*) AS total_proposals,
       COUNT(*) FILTER (WHERE "projectId" IS NULL) AS null_project_id
FROM "BudgetProposal";

-- 2c. BudgetProposal 是否已有 ownerId / omExpenseId 欄位（CHANGE-052 是否已套；期望尚無）
\echo ''
\echo '=== 2c. BudgetProposal ownerId/omExpenseId columns (expect none = change052 not applied) ==='
SELECT column_name FROM information_schema.columns
WHERE table_name = 'BudgetProposal' AND column_name IN ('ownerId','omExpenseId');

-- 3. menu:approval-workflows 權限是否存在（期望升級前不存在 → 坐實根因③）
\echo ''
\echo '=== 3. menu:approval-workflows permission exists? (expect: no row pre-upgrade) ==='
SELECT code, "isActive" FROM "Permission" WHERE code = 'menu:approval-workflows';

-- 4. 各角色目前 menu 權限數（role name 為 ASCII）
\echo ''
\echo '=== 4. menu permission count per role ==='
SELECT r.name, COUNT(*) AS menu_perms
FROM "Role" r
LEFT JOIN "RolePermission" rp ON rp."roleId" = r.id
LEFT JOIN "Permission" p ON rp."permissionId" = p.id AND p.category = 'menu'
GROUP BY r.name ORDER BY r.name;

-- 5. 現有 menu 權限清單（對照 seed.ts 18 項，看缺哪些）；只選 code（ASCII）
\echo ''
\echo '=== 5. existing menu permission codes (compare vs seed.ts 18) ==='
SELECT code FROM "Permission" WHERE category = 'menu' ORDER BY "sortOrder";

-- 6. active ApprovalWorkflow 數（期望 0 → 根因④；若報錯代表表不存在）
\echo ''
\echo '=== 6. active ApprovalWorkflow count (expect 0; error here = table missing) ==='
SELECT COUNT(*) AS active_workflows FROM "ApprovalWorkflow" WHERE "isActive" = true;

-- 7. 三張 approval 表是否存在
\echo ''
\echo '=== 7. approval tables existence ==='
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ApprovalWorkflow','ApprovalStep','ProposalApprovalProgress')
ORDER BY table_name;
