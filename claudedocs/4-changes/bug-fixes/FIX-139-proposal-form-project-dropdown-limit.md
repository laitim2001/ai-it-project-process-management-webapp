# FIX-139: BudgetProposalForm 專案下拉選單只顯示 20 個

> **建立日期**: 2026-05-04
> **完成日期**: 2026-05-04
> **狀態**: ✅ 已完成（已部署到 Azure dev）
> **優先級**: High
> **類型**: 前端 API 呼叫缺漏參數

## 問題描述

在 Azure 部署環境上建立新的 Budget Proposal 時，「專案」下拉選單只顯示約 20 個專案，但 DB 內實際 project 數量遠超於此。

## 重現步驟

1. 在 Azure 上以 admin 登入
2. 開 `/zh-TW/proposals/new`
3. 點擊「選擇專案」下拉選單
4. 觀察 → 只看到約 20 個 projects（且明顯少於實際數量）

## 根本原因

`apps/web/src/components/proposal/BudgetProposalForm.tsx:97` 呼叫 `api.project.getAll.useQuery()` 時**沒帶任何參數**：

```typescript
const { data: projects } = api.project.getAll.useQuery();  // ← 沒傳 limit
```

但 `project.getAll` 的 Zod schema 對 `limit` 有預設值（`packages/api/src/routers/project.ts:236`）：

```typescript
limit: z.number().min(1).max(100).default(20),  // ← 預設只回 20 個
```

→ 即使 DB 有 100 個專案，只回傳 20 個。

## 解決方案

傳 `limit: 100`（schema 上限），加註解標明預設陷阱：

```typescript
// 修改前
const { data: projects } = api.project.getAll.useQuery();

// 修改後
// 取得所有專案（必須帶 limit；getAll 預設 limit=20，否則下拉選單顯示不全）
const { data: projects } = api.project.getAll.useQuery({ limit: 100 });
```

## 修改的檔案

1. **`apps/web/src/components/proposal/BudgetProposalForm.tsx`** (Line 96-97)
   - `api.project.getAll.useQuery()` → `api.project.getAll.useQuery({ limit: 100 })`
   - 加註解標明預設陷阱

## 測試驗證

### 本地驗證（Playwright MCP）

1. 透過 `scripts/seed-many-projects.sql` 批量建 30 個 Bulk Test Projects
2. 開 `/zh-TW/proposals/new`
3. 檢查下拉選單

**結果**:
- 修復前：只顯示 20 個 option
- 修復後：顯示 **34 個 option**（1 placeholder + 30 Bulk + 3 原始）✅
- 30 個 Bulk projects **全部顯示** ✅

### Azure 驗證

部署 `v20260504-123857` 後 health endpoints 通過，需人工開 `/zh-TW/proposals/new` 確認下拉完整。

## 已知限制

- `project.getAll` 的 `limit.max(100)` 是 schema 硬上限
- 若日後 Azure project 數 > 100，本修復**仍不夠**，需另做：
  - **方案 X**: 加 `project.listForSelect` 專屬 API（只回 `{id, name, code}`）
  - **方案 Y**: 提高 `getAll` 的 `limit.max()`
  - **方案 Z**: 前端做 paginate fetch all

## 部署資訊

| 欄位 | 值 |
|------|------|
| Commit | `67e2e21` |
| Image tag | `acritpmcompany.azurecr.io/itpm-web:v20260504-123857` |
| Rollback 備援 | `acritpmcompany.azurecr.io/itpm-web:v20260504-121006`（FIX-138） |
| Schema migration | 無 |

## 學到的教訓

1. **永遠檢查 useQuery 的預設值陷阱** — Zod `.default()` 會在前端不傳參數時靜默套用
2. **下拉選單類 API 應有專屬 endpoint 或明確 limit** — 業務 list API 預設 limit 是為了分頁分散，不適合下拉
3. **檢查相同模式是否散在他處** — 修完用 grep 搜 `api.project.getAll.useQuery()` 確認只此一處

## 相關檔案

- 修復 commit: `67e2e21 fix(proposal): 修復 BudgetProposalForm 專案下拉選單只顯示 20 個 (FIX-139)`
- 本地測試 fixture: `scripts/seed-many-projects.sql`
- 開發日誌: `docs/development-log/20260504.md`
