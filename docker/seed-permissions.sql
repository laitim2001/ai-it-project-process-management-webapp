-- ============================================================================
-- 補齊 menu 權限資料（idempotent，只動 Permission + RolePermission）
-- ============================================================================
-- 用途：company/dev 升級後，補上線上 DB 缺失的 menu 權限記錄與角色授權，
--       使 Sidebar 能正確顯示 FEAT-014「審批流程」等入口。
-- 來源：邏輯對齊 packages/db/prisma/seed.ts 第 47-161 行。
-- 安全性：
--   - 只 INSERT/UPDATE "Permission" 與 "RolePermission" 兩張表，不碰任何業務/交易資料。
--   - 全程 idempotent：ON CONFLICT 確保已存在者不重複、缺失者補上。
--   - 用 Role.name 匹配（不依賴 role id 數值）。
--   - 補權限 transaction 前後各做一次「業務/交易資料表筆數快照」，
--     log 可直接比對 BEFORE/AFTER 證明 transaction data 一筆未動。
--   - 🔴 絕不可改用 `pnpm db:seed`（完整 seed.ts 會注入測試資料、弱密碼帳號，
--      且對預算池無條件 increment usedAmount，污染 production）。
-- 對應 runbook：docs/deployment/12-company-dev-upgrade-to-head-runbook-2026-06.md 附錄 A
-- ============================================================================

-- ============================================================================
-- BEFORE：業務/交易資料表筆數快照（補權限前；不在 transaction 內，反映現況）
-- 此段純讀，輸出純 ASCII（表名英文 + 數字）。
-- ============================================================================
\echo '=== BEFORE: table counts (business tables must be IDENTICAL after) ==='
SELECT 'User' AS tbl, COUNT(*) AS cnt FROM "User"
UNION ALL SELECT 'Role',           COUNT(*) FROM "Role"
UNION ALL SELECT 'BudgetPool',     COUNT(*) FROM "BudgetPool"
UNION ALL SELECT 'Project',        COUNT(*) FROM "Project"
UNION ALL SELECT 'BudgetProposal', COUNT(*) FROM "BudgetProposal"
UNION ALL SELECT 'Vendor',         COUNT(*) FROM "Vendor"
UNION ALL SELECT 'Quote',          COUNT(*) FROM "Quote"
UNION ALL SELECT 'PurchaseOrder',  COUNT(*) FROM "PurchaseOrder"
UNION ALL SELECT 'Expense',        COUNT(*) FROM "Expense"
UNION ALL SELECT 'OMExpense',      COUNT(*) FROM "OMExpense"
UNION ALL SELECT 'ChargeOut',      COUNT(*) FROM "ChargeOut"
UNION ALL SELECT 'Comment',        COUNT(*) FROM "Comment"
UNION ALL SELECT 'History',        COUNT(*) FROM "History"
UNION ALL SELECT 'Notification',   COUNT(*) FROM "Notification"
UNION ALL SELECT 'zz_Permission',     COUNT(*) FROM "Permission"
UNION ALL SELECT 'zz_RolePermission', COUNT(*) FROM "RolePermission"
UNION ALL SELECT 'zz_UserPermission', COUNT(*) FROM "UserPermission"
ORDER BY tbl;

-- ============================================================================
-- 補權限（原子 transaction；只動 Permission / RolePermission）
-- ============================================================================
BEGIN;

-- 1) 補齊 19 個 menu permission（idempotent）
INSERT INTO "Permission" (id, code, name, category, description, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'menu:dashboard',             '儀表板',     'menu', '訪問儀表板頁面',                         true, 100, now(), now()),
  (gen_random_uuid()::text, 'menu:budget-pools',          '預算池',     'menu', '訪問預算池管理頁面',                     true, 200, now(), now()),
  (gen_random_uuid()::text, 'menu:projects',              '專案',       'menu', '訪問專案管理頁面',                       true, 210, now(), now()),
  (gen_random_uuid()::text, 'menu:proposals',             '提案',       'menu', '訪問預算提案頁面',                       true, 220, now(), now()),
  (gen_random_uuid()::text, 'menu:vendors',               '供應商',     'menu', '訪問供應商管理頁面',                     true, 300, now(), now()),
  (gen_random_uuid()::text, 'menu:quotes',                '報價單',     'menu', '訪問報價單頁面',                         true, 310, now(), now()),
  (gen_random_uuid()::text, 'menu:purchase-orders',       '採購單',     'menu', '訪問採購單管理頁面',                     true, 320, now(), now()),
  (gen_random_uuid()::text, 'menu:expenses',              '費用',       'menu', '訪問費用管理頁面',                       true, 330, now(), now()),
  (gen_random_uuid()::text, 'menu:om-expenses',           'OM 費用',    'menu', '訪問 OM 費用管理頁面',                   true, 340, now(), now()),
  (gen_random_uuid()::text, 'menu:om-summary',            'OM 總覽',    'menu', '訪問 OM 總覽報表頁面',                   true, 350, now(), now()),
  (gen_random_uuid()::text, 'menu:charge-outs',           '費用轉嫁',   'menu', '訪問費用轉嫁管理頁面',                   true, 360, now(), now()),
  (gen_random_uuid()::text, 'menu:users',                 '用戶管理',   'menu', '訪問用戶管理頁面',                       true, 400, now(), now()),
  (gen_random_uuid()::text, 'menu:operating-companies',   '營運公司',   'menu', '訪問營運公司管理頁面',                   true, 410, now(), now()),
  (gen_random_uuid()::text, 'menu:om-expense-categories', 'OM 費用類別','menu', '訪問 OM 費用類別管理頁面',               true, 420, now(), now()),
  (gen_random_uuid()::text, 'menu:currencies',            '幣別',       'menu', '訪問幣別管理頁面',                       true, 430, now(), now()),
  (gen_random_uuid()::text, 'menu:approval-workflows',    '審批流程',   'menu', '訪問審批流程配置頁面（FEAT-014，僅 Admin）', true, 435, now(), now()),
  (gen_random_uuid()::text, 'menu:data-import',           'OM 數據導入','menu', '訪問 OM 數據導入頁面',                   true, 440, now(), now()),
  (gen_random_uuid()::text, 'menu:project-data-import',   '專案數據導入','menu','訪問專案數據導入頁面',                   true, 450, now(), now()),
  (gen_random_uuid()::text, 'menu:settings',              '設定',       'menu', '訪問個人設定頁面',                       true, 500, now(), now())
ON CONFLICT (code) DO UPDATE SET
  name        = EXCLUDED.name,
  category    = EXCLUDED.category,
  description = EXCLUDED.description,
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive"  = true,
  "updatedAt" = now();

-- 2) Admin：全部 menu 權限
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'Admin' AND p.category = 'menu'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 3) Supervisor：除 menu:users 與 menu:approval-workflows
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'Supervisor' AND p.category = 'menu'
  AND p.code NOT IN ('menu:users', 'menu:approval-workflows')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4) ProjectManager：11 個核心
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'ProjectManager' AND p.code IN (
  'menu:dashboard','menu:budget-pools','menu:projects','menu:proposals',
  'menu:vendors','menu:quotes','menu:purchase-orders','menu:expenses',
  'menu:om-expenses','menu:om-summary','menu:settings'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;

-- ============================================================================
-- AFTER：業務/交易資料表筆數快照（補權限後）
-- 比對標準：除 zz_Permission / zz_RolePermission 外，所有業務表筆數必須與 BEFORE 完全相同。
--           zz_Permission 應 = 19；zz_RolePermission 應增加；zz_UserPermission 不變。
-- ============================================================================
\echo '=== AFTER: table counts (business tables IDENTICAL; zz_Permission/RolePermission changed) ==='
SELECT 'User' AS tbl, COUNT(*) AS cnt FROM "User"
UNION ALL SELECT 'Role',           COUNT(*) FROM "Role"
UNION ALL SELECT 'BudgetPool',     COUNT(*) FROM "BudgetPool"
UNION ALL SELECT 'Project',        COUNT(*) FROM "Project"
UNION ALL SELECT 'BudgetProposal', COUNT(*) FROM "BudgetProposal"
UNION ALL SELECT 'Vendor',         COUNT(*) FROM "Vendor"
UNION ALL SELECT 'Quote',          COUNT(*) FROM "Quote"
UNION ALL SELECT 'PurchaseOrder',  COUNT(*) FROM "PurchaseOrder"
UNION ALL SELECT 'Expense',        COUNT(*) FROM "Expense"
UNION ALL SELECT 'OMExpense',      COUNT(*) FROM "OMExpense"
UNION ALL SELECT 'ChargeOut',      COUNT(*) FROM "ChargeOut"
UNION ALL SELECT 'Comment',        COUNT(*) FROM "Comment"
UNION ALL SELECT 'History',        COUNT(*) FROM "History"
UNION ALL SELECT 'Notification',   COUNT(*) FROM "Notification"
UNION ALL SELECT 'zz_Permission',     COUNT(*) FROM "Permission"
UNION ALL SELECT 'zz_RolePermission', COUNT(*) FROM "RolePermission"
UNION ALL SELECT 'zz_UserPermission', COUNT(*) FROM "UserPermission"
ORDER BY tbl;

-- 補權限後的結果摘要（純 ASCII；不選中文 name 欄位）
\echo '=== after seed: menu:approval-workflows status ==='
SELECT code, "isActive" FROM "Permission" WHERE code = 'menu:approval-workflows';

\echo '=== after seed: menu permission count per role (expect Admin=19, Supervisor=17, ProjectManager=11) ==='
SELECT r.name, COUNT(*) AS menu_perms
FROM "Role" r
LEFT JOIN "RolePermission" rp ON rp."roleId" = r.id
LEFT JOIN "Permission" p ON rp."permissionId" = p.id AND p.category = 'menu'
GROUP BY r.name ORDER BY r.name;
