# FIX-138: Project Update 切換 Budget Pool 時回 HTTP 400

> **建立日期**: 2026-05-04
> **完成日期**: 2026-05-04
> **狀態**: ✅ 已完成（已部署到 Azure dev）
> **優先級**: High
> **類型**: API 業務邏輯修復 + 前端表單同步

## 問題描述

在 Azure 部署環境（`app-itpm-company-dev-001`）上，編輯一個已有 `budgetCategoryId` 的 Project，把 Budget Pool 從 A 切換到 B 並提交時，前端報：

```
POST https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/project.update?batch=1 400 (Bad Request)
```

## 重現步驟

1. 在 Azure 上以 admin 登入
2. 開啟一個已指派 `budgetCategoryId` 的舊 Project 編輯頁
3. 將 Budget Pool 由 A 切換為 B（B 有不同的 categories）
4. 點「更新專案」
5. 觀察 → HTTP 400，更新失敗

## 根本原因

雙層 bug：

### Layer 1: 前端 ProjectForm 沒在切 pool 時清掉 categoryId

`apps/web/src/components/project/ProjectForm.tsx` 的 Budget Pool Combobox onChange handler 只更新 `formData.budgetPoolId`，舊的 `formData.budgetCategoryId` 仍隨 form state 一起送出：

```typescript
// 修改前（BUG）
onChange={(value) => setFormData({ ...formData, budgetPoolId: value })}
//                                                  ^^^ 沒清 budgetCategoryId
```

### Layer 2: 後端 update procedure 校驗失敗 → 拋 BAD_REQUEST

`packages/api/src/routers/project.ts:847-852` 校驗：

```typescript
if (budgetCategory.budgetPoolId !== targetBudgetPoolId) {
  throw new TRPCError({
    code: 'BAD_REQUEST',           // → HTTP 400
    message: '預算類別不屬於對應的預算池',
  });
}
```

### 觸發鏈

```
1. 用戶開啟 Project（budgetCategoryId="cat-A"，屬於 Pool P1）
2. 切換 Budget Pool 到 P2
3. 表單只改 budgetPoolId=P2，budgetCategoryId="cat-A" 仍留著
4. 提交 → server 驗證 cat-A.budgetPoolId(=P1) ≠ P2 → throw BAD_REQUEST
5. 前端收到 HTTP 400
```

### 為何本地沒人發現？

| 項目 | 本地 seed | Azure 部署 |
|------|----------|----------|
| Project 數量 | 2 | 多 |
| `Project.budgetCategoryId` | 皆 NULL | 部分有值 |
| `BudgetCategory` 數量 | 0 | >0 |
| 觸發條件 | ❌ 走不到校驗 | ✅ 觸發 400 |

本地兩個 seed 專案的 `budgetCategoryId` 都是 NULL，且 `BudgetCategory` 表是空的，所以前端切換 pool 後 server 端 `if (input.budgetCategoryId)` 為 false，校驗被跳過 — 因此本地「假性正常」。

## 解決方案（方案 A：前端清空 + schema 接受 null）

### 1. ProjectForm.tsx — Budget Pool onChange 改寫

切換 pool 時同時清空 `budgetCategoryId` 與 `categoryAmounts`：

```typescript
// 修改後
onChange={(value) => {
  // 切換 Budget Pool 時，必須同時清空 budgetCategoryId 與 categoryAmounts
  // Why: 後端 update procedure 會校驗 budgetCategory.budgetPoolId 是否屬於新 pool，
  //      若舊 categoryId 跨 pool，會 throw BAD_REQUEST (HTTP 400)
  if (value !== formData.budgetPoolId) {
    setFormData({ ...formData, budgetPoolId: value, budgetCategoryId: '' });
    setCategoryAmounts([]);
  } else {
    setFormData({ ...formData, budgetPoolId: value });
  }
}}
```

### 2. ProjectForm.tsx — submitData 送 null 而非 undefined

避免 Prisma 保留舊值造成跨 pool 不一致：

```typescript
// 修改前
budgetCategoryId: formData.budgetCategoryId.trim() === '' ? undefined : formData.budgetCategoryId,
// 修改後
budgetCategoryId: formData.budgetCategoryId.trim() === '' ? null : formData.budgetCategoryId,
```

### 3. updateProjectSchema 加 .nullable()

接受前端的清除信號：

```typescript
// 修改前
budgetCategoryId: z.string().uuid('Invalid budget category ID').optional(),
// 修改後
budgetCategoryId: z.string().uuid('Invalid budget category ID').nullable().optional(),
```

## 修改的檔案

1. **`apps/web/src/components/project/ProjectForm.tsx`**
   - Budget Pool Combobox onChange — 切 pool 清空 categoryId + categoryAmounts
   - submitData budgetCategoryId 空字串送 `null`（而非 `undefined`）

2. **`packages/api/src/routers/project.ts`**
   - `updateProjectSchema.budgetCategoryId` 加 `.nullable()`

3. **`apps/web/e2e/workflows/project-update-cross-pool.spec.ts`**（新增）
   - E2E 回歸測試覆蓋此 bug

4. **`scripts/seed-cross-pool-test-data.sql`**（新增，本地 fixture）
   - 建立 UUID 格式測試資料：2 Pool / 2 Category / 1 跨池 Project

## 測試驗證

### 本地手動驗證（Playwright MCP）

1. 跑 `scripts/seed-cross-pool-test-data.sql` 建測試資料
2. 開 `/zh-TW/projects/eeee9999-9999-9999-9999-999999999999/edit`
3. 切 Pool A → Pool B → 提交
4. **結果**:
   - `POST /api/trpc/project.update => 200 OK` ✅
   - DB `budgetPoolId` 切到 Pool B ✅
   - DB `budgetCategoryId` 被清為 NULL ✅（無跨 pool 不一致）

### Azure 驗證

部署 `v20260504-121006` 後 health endpoints 通過：
- `health.ping` → pong ✅
- `health.dbCheck` → healthy + connected ✅
- 主要頁面 200/302（無 500） ✅

## 部署資訊

| 欄位 | 值 |
|------|------|
| Commit | `294fa7e` |
| Image tag | `acritpmcompany.azurecr.io/itpm-web:v20260504-121006` |
| Rollback 備援 | `acritpmcompany.azurecr.io/itpm-web:v20260127-i18n-fix` |
| Schema migration | 無（純 Zod schema + 前端） |

## 學到的教訓

1. **本地 seed 數據不全可能掩蓋 production bug** — 本地沒 BudgetCategory，跨 pool 校驗永遠不觸發
2. **Prisma update 對 `undefined` 是 no-op** — 想清欄位要送 `null`，schema 也要 `.nullable()`
3. **前端 form state 要跟業務邏輯同步** — 切換父選項時必須清掉相依的子選項

## 相關檔案

- 修復 PR commit: `294fa7e fix(project): 修復切換 Budget Pool 時 update 回 HTTP 400 (FIX-138)`
- E2E 測試: `apps/web/e2e/workflows/project-update-cross-pool.spec.ts`
- 開發日誌: `docs/development-log/20260504.md`
