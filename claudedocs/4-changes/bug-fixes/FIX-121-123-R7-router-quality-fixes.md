# FIX-121, FIX-122, FIX-123, R7-FIX: API Router 品質修復

> **日期**: 2026-04-09
> **類型**: Bug Fix / Code Quality
> **影響範圍**: 6 個 API Router + 1 個前端頁面

---

## FIX-121: 統一錯誤處理 — throw new Error → TRPCError

### 問題描述
多個 API Router 使用 `throw new Error(...)` 而非 `TRPCError`，導致：
- 前端無法正確解析 HTTP 狀態碼（所有錯誤都返回 500）
- 無法區分 NOT_FOUND / CONFLICT / BAD_REQUEST 等錯誤類型
- 不符合專案的 tRPC 錯誤處理標準

### 修復檔案與變更

#### `packages/api/src/routers/user.ts` (15 處)
- 新增 `import { TRPCError } from '@trpc/server'`
- `getById`: 找不到使用者 → `NOT_FOUND`
- `create`: Email 重複 → `CONFLICT`，角色 ID 無效 → `BAD_REQUEST`，密碼驗證失敗 → `BAD_REQUEST`
- `update`: Email 重複 → `CONFLICT`，角色 ID 無效 → `BAD_REQUEST`
- `delete`: 找不到使用者 → `NOT_FOUND`，有關聯專案 → `BAD_REQUEST`
- `setPassword`: 找不到使用者 → `NOT_FOUND`，密碼驗證失敗 → `BAD_REQUEST`
- `hasPassword`: 找不到使用者 → `NOT_FOUND`
- `changeOwnPassword`: 找不到使用者 → `NOT_FOUND`，舊密碼缺失/錯誤 → `BAD_REQUEST`，新密碼不一致 → `BAD_REQUEST`，密碼強度不足 → `BAD_REQUEST`
- `getOwnAuthInfo`: 找不到使用者 → `NOT_FOUND`

#### `packages/api/src/routers/notification.ts` (3 處)
- 新增 `import { TRPCError } from '@trpc/server'`
- `getById`: 通知不存在或無權訪問 → `NOT_FOUND`
- `markAsRead`: 通知不存在或無權訪問 → `NOT_FOUND`
- `delete`: 通知不存在或無權訪問 → `NOT_FOUND`

#### `packages/api/src/routers/project.ts` (5 處)
- `getById` (2 處): 找不到專案 → `NOT_FOUND`
- `chargeOut`: 找不到專案 → `NOT_FOUND`，專案已完成/歸檔 → `BAD_REQUEST`，無費用記錄 → `BAD_REQUEST`，有未支付費用 → `BAD_REQUEST`

#### `packages/api/src/routers/budgetPool.ts` (3 處)
- `delete`: 找不到預算池 → `NOT_FOUND`，有關聯專案 → `BAD_REQUEST`
- `getStats`: 找不到預算池 → `NOT_FOUND`

---

## FIX-122: expense.getStats PendingApproval 狀態名稱錯誤

### 問題描述
`expense.ts` 的 `getStats` procedure 中使用 `'PendingApproval'` 作為狀態名稱，但 Expense 模型的實際狀態枚舉為 `['Draft', 'Submitted', 'Approved', 'Paid']`，不存在 `'PendingApproval'`。

### 修復
- **檔案**: `packages/api/src/routers/expense.ts` (第 1370 行)
- **變更**: `'PendingApproval'` → `'Submitted'`
- 這修復了 `pendingApprovalAmount` 統計值永遠為 0 的問題

---

## FIX-123: 註冊 EXPENSE_REJECTED 通知類型

### 問題描述
`expense.ts` 的 `reject` procedure 在建立通知時使用 `type: 'EXPENSE_REJECTED'`，但 `notification.ts` 中的 `NotificationType` Zod enum 未包含此值。在 `notification.create` 被呼叫時會因 Zod 驗證失敗而報錯。

### 修復
- **檔案**: `packages/api/src/routers/notification.ts`
- **變更**: 在 `NotificationType` enum 中新增 `'EXPENSE_REJECTED'`

### 驗證
- `expense.ts` 的 `reject` procedure 確認已使用 `'EXPENSE_REJECTED'` 類型（第 1260 行）
- 通知是在 `$transaction` 內直接建立（`prisma.notification.create`），不經過 `notification.create` procedure，所以此修復主要確保 enum 的完整性和一致性

---

## R7-FIX: Budget Pools 年度過濾失效

### 問題描述
前端 Budget Pools 列表頁傳送 `year: yearFilter`，但 `budgetPool.getAll` 的 Zod schema 定義的參數名為 `financialYear`。參數名不匹配導致年度過濾功能完全失效。

### 修復
- **檔案**: `apps/web/src/app/[locale]/budget-pools/page.tsx` (第 101 行)
- **變更**: `year: yearFilter` → `financialYear: yearFilter`
- 選擇修改前端（而非 Router），因為 `financialYear` 是 Router schema 的標準命名，且與 Prisma model 欄位名一致

### 註記
`budgetPool.export` procedure 的 schema 中使用 `year`（非 `financialYear`），前端 export 呼叫使用 `year` 是正確的，無需修改。

---

## R7-FIX: Currency getAll 缺少 _count.projects

### 問題描述
Currencies 管理頁面 (`settings/currencies/page.tsx`) 在表格中顯示 `(currency as any)._count?.projects`，但 `currency.getAll` 的 Prisma 查詢未包含 `_count`，導致專案數量欄位永遠顯示 0。

### 修復
- **檔案**: `packages/api/src/routers/currency.ts` — `getAll` procedure
- **變更**: 在 `findMany` 查詢中加入 `include: { _count: { select: { projects: true } } }`
- Currency model 確認有 `projects` relation（`@relation("ProjectCurrency")`）

---

## 修改檔案總覽

| 檔案 | 修復項目 | 變更數 |
|------|----------|--------|
| `packages/api/src/routers/user.ts` | FIX-121 | 新增 import + 15 處 Error→TRPCError |
| `packages/api/src/routers/notification.ts` | FIX-121, FIX-123 | 新增 import + 3 處 Error→TRPCError + enum 新增 |
| `packages/api/src/routers/project.ts` | FIX-121 | 5 處 Error→TRPCError |
| `packages/api/src/routers/budgetPool.ts` | FIX-121 | 3 處 Error→TRPCError |
| `packages/api/src/routers/expense.ts` | FIX-122 | 1 處狀態名修正 |
| `packages/api/src/routers/currency.ts` | R7-FIX | 新增 _count include |
| `apps/web/src/app/[locale]/budget-pools/page.tsx` | R7-FIX | 1 處參數名修正 |

## 測試驗證

- [ ] Budget Pools 年度篩選功能正常運作
- [ ] Currencies 頁面顯示正確的專案使用數量
- [ ] Expense getStats 返回正確的 Submitted 金額統計
- [ ] User CRUD 操作的錯誤返回正確的 HTTP 狀態碼
- [ ] Notification CRUD 的錯誤返回正確的 HTTP 狀態碼
- [ ] Project chargeOut 的各種錯誤場景返回正確狀態碼
- [ ] Expense reject 通知正常建立（EXPENSE_REJECTED 類型）
