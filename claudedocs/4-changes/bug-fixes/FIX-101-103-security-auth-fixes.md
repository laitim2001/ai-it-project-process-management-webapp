# FIX-101 ~ FIX-103: 安全性認證修復

> **日期**: 2026-04-09
> **嚴重程度**: CRITICAL
> **狀態**: 已修復

---

## 概述

修復 3 個關鍵安全漏洞：User Router 使用 `publicProcedure` 暴露用戶管理 API、Health Router 的 schema 修改端點無需認證即可執行、以及檔案上傳 API Routes 缺少認證檢查。

---

## FIX-101: User Router 權限提升

### 問題描述
`packages/api/src/routers/user.ts` 中大量 procedures 使用 `publicProcedure`，導致未登入用戶可以：
- 列舉所有用戶及其角色資訊
- 查看用戶詳情（含管理的專案資訊）
- 建立、更新、刪除用戶
- 查詢用戶是否設定密碼

### 修復內容

| Procedure | 修復前 | 修復後 | 原因 |
|-----------|--------|--------|------|
| `getAll` | `publicProcedure` | `protectedProcedure` | 下拉選單需要，但僅限登入用戶 |
| `getById` | `publicProcedure` | `protectedProcedure` | 用戶詳情需登入才可查看 |
| `getByRole` | `publicProcedure` | `protectedProcedure` | 角色篩選需登入 |
| `getManagers` | `publicProcedure` | `protectedProcedure` | 專案經理列表需登入 |
| `getSupervisors` | `publicProcedure` | `protectedProcedure` | 主管列表需登入 |
| `create` | `publicProcedure` | `adminProcedure` | 僅管理員可建立用戶 |
| `update` | `publicProcedure` | `adminProcedure` | 僅管理員可更新用戶 |
| `delete` | `publicProcedure` | `adminProcedure` | 僅管理員可刪除用戶 |
| `getRoles` | `publicProcedure` | `protectedProcedure` | 角色列表需登入 |
| `hasPassword` | `publicProcedure` | `protectedProcedure` | 密碼狀態需登入查看 |

**未變更的 Procedures**（已正確設定）：
- `setPassword` - 已使用 `adminProcedure`
- `changeOwnPassword` - 已使用 `protectedProcedure`
- `getOwnAuthInfo` - 已使用 `protectedProcedure`

### 修改的檔案
- `packages/api/src/routers/user.ts` - 10 個 procedures 權限提升，移除未使用的 `publicProcedure` import

---

## FIX-102: Health Router Schema 修改端點保護

### 問題描述
`packages/api/src/routers/health.ts` 中所有 schema 修改的 mutation 使用 `publicProcedure`，導致未認證用戶可以：
- 建立/修改資料庫表結構（CREATE TABLE, ALTER TABLE）
- 操作 migration 記錄
- 執行完整 schema 同步
- 建立權限相關表

### 修復內容

變更為 `adminProcedure` 的 mutations（共 11 個）：

| Procedure | 功能 |
|-----------|------|
| `fixMigration` | 修復卡住的 migration + 建立 ExpenseCategory/ProjectBudgetCategory 表 |
| `fixOmExpenseSchema` | 新增 OMExpense 缺失欄位（ALTER TABLE） |
| `fixAllTables` | 建立所有缺失的 Post-MVP 表 |
| `fixExpenseItemSchema` | 修復 ExpenseItem schema |
| `fixAllSchemaIssues` | 自動修復所有 Schema 不一致 |
| `createOMExpenseItemTable` | 建立 OMExpenseItem 表 |
| `fixFeat006AndFeat007Columns` | 修復 FEAT-006/007 相關欄位 |
| `fixProjectSchema` | 修復 Project 表 schema |
| `fixAllSchemaComplete` | 完整 schema 修復 |
| `fixPermissionTables` | 建立權限管理表 |
| `fullSchemaSync` | 完整 schema 同步 |

**保持 `publicProcedure` 的端點**（唯讀診斷）：

| Procedure | 類型 | 原因 |
|-----------|------|------|
| `ping` | query | 基礎健康檢查，監控系統需要 |
| `dbCheck` | query | 資料庫連線檢查，容器探針需要 |
| `echo` | query | 測試端點，唯讀 |
| `schemaCheck` | query | 唯讀 schema 檢查 |
| `diagOmExpense` | query | 唯讀診斷 |
| `diagOpCo` | query | 唯讀診斷（含少量 seed data） |
| `diagProjectSummary` | query | 唯讀診斷 |
| `schemaCompare` | query | 唯讀比較 |
| `fullSchemaCompare` | query | 唯讀比較 |

### 修改的檔案
- `packages/api/src/routers/health.ts` - 11 個 mutations 權限提升，新增 `adminProcedure` import

---

## FIX-103: Upload API Routes 認證檢查

### 問題描述
3 個檔案上傳 API Routes 缺少認證檢查，未登入用戶可以：
- 上傳報價單到 Azure Blob Storage 並建立資料庫記錄
- 上傳發票到 Azure Blob Storage
- 上傳提案文件到 Azure Blob Storage

### 修復內容
在每個 POST handler 開頭新增 NextAuth v5 認證檢查：

```typescript
import { auth } from '@/auth';

// 在 POST handler 開頭
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: '未授權：請先登入' }, { status: 401 });
}
```

### 修改的檔案
- `apps/web/src/app/api/upload/quote/route.ts` - 新增 auth import 和認證檢查
- `apps/web/src/app/api/upload/invoice/route.ts` - 新增 auth import 和認證檢查
- `apps/web/src/app/api/upload/proposal/route.ts` - 新增 auth import 和認證檢查

---

## 影響範圍

### 可能受影響的前端頁面
- 用戶管理頁面（`/users`）- 所有 API 現在需要登入
- 健康檢查管理頁面 - schema 修復功能需要 Admin 權限
- 報價單上傳 - 需要登入
- 發票上傳 - 需要登入
- 提案文件上傳 - 需要登入

### 不受影響的功能
- 登入/登出流程（NextAuth 端點不受影響）
- 健康檢查的唯讀端點（ping, dbCheck 等仍為 public）
- 已正確設定權限的 procedures（setPassword, changeOwnPassword 等）

---

## 測試驗證

- [ ] 未登入狀態下，User API 返回 401 UNAUTHORIZED
- [ ] ProjectManager 角色無法建立/更新/刪除用戶（返回 403 FORBIDDEN）
- [ ] Admin 角色可正常執行所有用戶管理操作
- [ ] 未登入狀態下，Health Router 的 fix* 端點返回 401
- [ ] 非 Admin 角色無法執行 Health Router 的 fix* 端點
- [ ] Health Router 的 ping/dbCheck 仍可公開訪問
- [ ] 未登入狀態下，檔案上傳返回 401
- [ ] 已登入用戶可正常上傳檔案
