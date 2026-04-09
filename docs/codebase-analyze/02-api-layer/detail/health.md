# health.ts - 健康檢查與 Schema 同步 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/health.ts` |
| 行數 | 2,421 行 |
| Procedure 總數 | 21 個 |
| 匯入的 middleware | `publicProcedure`, `adminProcedure` _(FIX-102)_ |
| 自 | Epic 1 - Platform Foundation |
| 特殊匯入 | `FULL_SCHEMA_DEFINITION`, `COLUMN_TYPE_MAP` from `../lib/schemaDefinition` |

---

## Procedures 清單

### 核心健康檢查（3 個）

#### 1. `ping` (query) — 第 44~46 行
- **權限**: `publicProcedure`
- **Input**: 無
- **回傳**: `{ message: 'pong', timestamp }`

#### 2. `dbCheck` (query) — 第 51~67 行
- **權限**: `publicProcedure`
- **Input**: 無
- **回傳**: `{ status: 'healthy'/'unhealthy', database: 'connected'/'disconnected', timestamp }`
- **業務邏輯**: 執行 `SELECT 1` 測試連線

#### 3. `echo` (query) — 第 72~76 行
- **權限**: `publicProcedure`
- **Input**: `{ message: string }`
- **回傳**: `{ echo: string, timestamp }`

### Schema 診斷（4 個）

#### 4. `schemaCheck` (query) — 第 229~282 行
- **權限**: `publicProcedure`
- **回傳**: `{ status: 'complete'/'incomplete', tables, migrations }`
- **業務邏輯**: 檢查 9 個 Post-MVP 表格是否存在（ExpenseCategory, OperatingCompany, BudgetCategory, OMExpense 等），查詢最近 10 條 migration

#### 5. `diagOmExpense` (query) — 第 288~374 行
- **權限**: `publicProcedure`
- **業務邏輯**: 6 步驟診斷 OMExpense 查詢問題（表結構、Prisma 查詢、include 測試）

#### 6. `diagOpCo` (query) — 第 380~432 行
- **權限**: `publicProcedure`
- **業務邏輯**: 診斷 OperatingCompany，必要時插入預設數據（HK, SG, TW）

#### 7. `diagProjectSummary` (query) — 第 1306~1412 行
- **權限**: `publicProcedure`
- **業務邏輯**: 4 步驟診斷 project.getProjectSummary 查詢問題

### Schema 比較（2 個）

#### 8. `schemaCompare` (query) — 第 712~800 行
- **權限**: `publicProcedure`
- **回傳**: `{ status: 'synced'/'out_of_sync', summary, comparison }`
- **業務邏輯**: 硬編碼 6 個表格的期望欄位 vs 實際欄位比較

#### 9. `fullSchemaCompare` (query) — 第 1865~1957 行
- **權限**: `publicProcedure`
- **回傳**: `{ status, summary, comparison, fixSqlPreview }`
- **業務邏輯**: 使用 `FULL_SCHEMA_DEFINITION` 對比所有 27 個 Prisma 模型，生成修復 SQL 預覽

### Schema 修復（11 個 mutation — 全部 adminProcedure, FIX-102）

#### 10. `fixMigration` (mutation) — 第 82~223 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 9 步驟修復：建立 ExpenseCategory 表、插入預設數據、標記 migration 完成、建立 ProjectBudgetCategory 表

#### 11. `fixOmExpenseSchema` (mutation) — 第 438~507 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 添加 OMExpense 缺失的 categoryId, sourceExpenseId 欄位

#### 12. `fixAllTables` (mutation) — 第 513~706 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 建立所有 8 個 Post-MVP 表格（OperatingCompany, BudgetCategory, OMExpense, OMExpenseMonthly, ChargeOut, ChargeOutItem, PurchaseOrderItem, ExpenseItem）

#### 13. `fixExpenseItemSchema` (mutation) — 第 805~896 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 添加 ExpenseItem 缺失的 chargeOutOpCoId, categoryId 欄位和外鍵

#### 14. `fixAllSchemaIssues` (mutation) — 第 902~1002 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 一鍵修復 ExpenseItem, OMExpense, Expense, OMExpenseItem, PurchaseOrder, BudgetPool 的缺失欄位

#### 15. `createOMExpenseItemTable` (mutation) — 第 1008~1147 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: FEAT-007 建立 OMExpenseItem 表（含索引、外鍵、修改 OMExpenseMonthly）

#### 16. `fixFeat006AndFeat007Columns` (mutation) — 第 1154~1301 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 修復 Project 表 8 個 FEAT-006 欄位、OMExpense 3 個 FEAT-007 欄位、建立 ProjectChargeOutOpCo 表

#### 17. `fixProjectSchema` (mutation) — 第 1418~1502 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 修復 Project 表所有 FEAT-001/006/010 欄位（共 19 個欄位）

#### 18. `fixAllSchemaComplete` (mutation) — 第 1508~1651 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 完整 Schema 修復（10 個表格，含 UserOperatingCompany, ProjectChargeOutOpCo）

#### 19. `fixPermissionTables` (mutation) — 第 1657~1846 行
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: FEAT-011 建立 Permission, RolePermission, UserPermission 表，植入 18 個預設菜單權限，分配角色預設權限

#### 20. `fullSchemaSync` (mutation) — 第 1974 行起
- **權限**: `adminProcedure` _(FIX-102: 原 publicProcedure)_
- **業務邏輯**: 使用 `FULL_SCHEMA_DEFINITION` 和 `COLUMN_TYPE_MAP` 自動修復所有缺失表格和欄位

### 除錯工具（1 個）

#### 21. `debugUserPermissions` (query) — 第 2315 行起
- **權限**: `publicProcedure`
- **業務邏輯**: 除錯用戶權限配置

---

## 匯出的 Zod Schemas

此 Router 無匯出的 Zod Schemas。

---

## 使用的 Prisma Models

此 Router 主要使用 **原生 SQL**（`$queryRaw`, `$executeRaw`）操作資料庫結構，而非 Prisma model 操作。涉及的表格包含全部 27+ 個 Prisma models。

少量使用 Prisma Client：
- `ctx.prisma.oMExpense.findMany` (diagOmExpense)
- `ctx.prisma.operatingCompany.findMany` (diagOpCo)
- `ctx.prisma.project.findMany` (diagProjectSummary)

---

## 跨 Router 依賴

- 匯入 `FULL_SCHEMA_DEFINITION` 和 `COLUMN_TYPE_MAP`（from `../lib/schemaDefinition`）
- 無直接調用其他 Router

---

## 特殊模式

- **✅ FIX-102 權限修復**: 查詢端點 (ping, dbCheck, echo, schemaCheck, diag*, schemaCompare, fullSchemaCompare, debugUserPermissions) 保持 publicProcedure；所有 mutation（11 個 fix/sync 端點）改為 adminProcedure
- **Schema 同步機制**: 多層次修復策略（單表 -> 多表 -> 完整同步）
- **原生 SQL**: 大量使用 `$executeRaw` 直接修改資料庫結構
- **冪等操作**: 所有修復使用 `IF NOT EXISTS` 確保可重複執行
- **診斷工具**: 多個 diag* 端點用於定位部署問題
- **Migration 管理**: 手動標記 migration 為完成（解決部署卡住問題）
- **安全考量**: ~~所有端點為 public~~ FIX-102 後 mutation 已受 admin 保護；查詢仍為 public 以支援監控
- **唯一真相來源**: fullSchemaCompare/fullSchemaSync 使用外部定義檔作為參考
