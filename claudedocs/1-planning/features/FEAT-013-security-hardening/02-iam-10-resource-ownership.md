---
sub_feature: FEAT-013.2
check_id: IAM-10
nature: CHANGE（擴充既有 procedures）
status: 📋 Planned
estimated_days: 5
dependencies: FEAT-013.1（建議先完成 publicProcedure 審查）
---

# FEAT-013.2 — IAM-10 資源所有權驗證

> **Check ID**: IAM-10（跨租戶隔離 / 資源所有權）
> **企業級基準**: RLS / query filter 強制
> **目前評估**: L1 → 目標 L3
> **對應既有發現**: SEC-008（無資源所有權驗證）

---

## 1. 背景與目標

### 1.1 問題現況

即使使用 `protectedProcedure` 的端點，也沒有驗證「目前使用者是否有權操作該資源」。具體例子：

- `budgetProposal.delete` 雖檢查 `project.managerId === userId`，**但未驗證**該提案是否真為該 manager 建立
- `expense.update` / `expense.delete` 完全無 ownership 檢查
- `chargeOut.confirm`（supervisorProcedure）未檢查確認者是否為該專案的 supervisor

### 1.2 目標

- 建立統一 `assertOwnership()` middleware
- 所有 update/delete mutation 加 ownership 檢查
- OpCo 數據權限（FEAT-009）整合到同一 utility
- Playwright E2E 覆蓋跨用戶 / 跨 OpCo 操作場景

### 1.3 不在範圍

- Database 層 RLS（PostgreSQL Row-Level Security）— 屬 Phase 2 強化
- 重構整個 permission 系統（FEAT-011 已有基礎，本 sub-feature 不動）

---

## 2. 影響範圍

### 2.1 受影響檔案

| 檔案 | 變更類型 | 行數估 |
|------|---------|--------|
| `packages/api/src/lib/ownership.ts`（新建） | 新增 | ~150 |
| `packages/api/src/lib/permissions.ts`（如不存在則新建） | 新增/擴充 `getAuthorizedOpCoIds()` | ~80 |
| `packages/api/src/routers/budgetProposal.ts` | 補 ownership | ~10 處 |
| `packages/api/src/routers/expense.ts` | 補 ownership | ~15 處 |
| `packages/api/src/routers/chargeOut.ts` | 補 ownership | ~10 處 |
| `packages/api/src/routers/project.ts` | 補 ownership + OpCo filter | ~10 處 |
| `packages/api/src/routers/omExpense.ts` | 補 OpCo filter | ~5 處 |
| `packages/api/src/routers/quote.ts`、`purchaseOrder.ts`、`vendor.ts` | 視情況補 ownership | ~10 處 |
| `apps/web/e2e/security/ownership.spec.ts`（新建） | 新增 E2E | ~200 |

### 2.2 不需 Migration

無 schema 變更（用既有 `createdById`、`managerId`、`opCoId` 欄位）。

### 2.3 i18n 影響

無新 key（沿用「無權限」既有錯誤訊息）。

---

## 3. 技術設計

### 3.1 統一 Ownership Utility

```typescript
// packages/api/src/lib/ownership.ts

import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';

type OwnershipRule = {
  field: string;          // 例：'managerId' | 'createdById' | 'supervisorId'
  userId: string;
  allowAdmin?: boolean;   // 若 true，Admin 可繞過 ownership
};

export async function assertOwnership<T extends { findUnique: any }>(
  model: T,
  resourceId: string,
  rule: OwnershipRule,
  options?: { errorMessage?: string }
): Promise<void> {
  const resource = await model.findUnique({
    where: { id: resourceId },
    select: { [rule.field]: true },
  });

  if (!resource) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: options?.errorMessage ?? 'Resource not found',
    });
  }

  if (resource[rule.field] !== rule.userId && !rule.allowAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
      cause: { reason: 'OWNERSHIP_VIOLATION' },
    });
  }
}
```

### 3.2 OpCo 授權 Utility

```typescript
// packages/api/src/lib/permissions.ts

export async function getAuthorizedOpCoIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const userOpCos = await prisma.userOperatingCompany.findMany({
    where: { userId },
    select: { operatingCompanyId: true },
  });
  return userOpCos.map(uc => uc.operatingCompanyId);
}

export async function assertOpCoAccess(
  prisma: PrismaClient,
  userId: string,
  opCoId: string
): Promise<void> {
  const authorized = await getAuthorizedOpCoIds(prisma, userId);
  if (!authorized.includes(opCoId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No access to this Operating Company',
      cause: { reason: 'OPCO_ACCESS_DENIED' },
    });
  }
}
```

### 3.3 套用模式

#### 模式 A：簡單 ownership

```typescript
// Before
delete: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.expense.delete({ where: { id: input.id } });
  }),

// After
delete: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await assertOwnership(ctx.prisma.expense, input.id, {
      field: 'createdById',
      userId: ctx.session.user.id,
      allowAdmin: ctx.session.user.role.name === 'Admin',
    });
    return ctx.prisma.expense.delete({ where: { id: input.id } });
  }),
```

#### 模式 B：列表查詢加 OpCo filter

```typescript
// Before
getAll: protectedProcedure.query(async ({ ctx }) => {
  return ctx.prisma.project.findMany();
}),

// After
getAll: protectedProcedure.query(async ({ ctx }) => {
  const opCoIds = await getAuthorizedOpCoIds(ctx.prisma, ctx.session.user.id);
  return ctx.prisma.project.findMany({
    where: { opCoId: { in: opCoIds } },
  });
}),
```

#### 模式 C：跨角色（supervisor 操作其他人的提案）

```typescript
// chargeOut.confirm 範例
confirm: supervisorProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const chargeOut = await ctx.prisma.chargeOut.findUnique({
      where: { id: input.id },
      include: { project: { select: { supervisorId: true } } },
    });

    if (!chargeOut) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    // 驗證確認者是該 project 的 supervisor
    if (chargeOut.project.supervisorId !== ctx.session.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the project supervisor can confirm this charge-out',
        cause: { reason: 'NOT_PROJECT_SUPERVISOR' },
      });
    }

    // ... 確認邏輯
  }),
```

### 3.4 受影響 Procedure 清單（盤點結果）

實作時依下表逐一補 ownership（精確清單於 Step 1 盤點階段確認）：

| Router | 預估 mutation 需補 ownership | 估時 |
|--------|------------------------------|------|
| budgetProposal | 4-5（update / delete / submit / approve / reject） | 0.5d |
| expense | 5-6（update / delete / submit / approve / reject / pay） | 0.5d |
| chargeOut | 4-5（confirm / cancel / update / delete） | 0.5d |
| project | 3（update / delete / archive） | 0.5d |
| quote | 3（create / update / delete） | 0.5d |
| purchaseOrder | 3 | 0.5d |
| vendor | 2 | 0.25d |
| omExpense | 3-4（含 OpCo filter） | 0.5d |
| **總計** | ~27-30 | **3.75d** |

剩餘 1.25d 用於 utility 開發 + E2E 撰寫。

---

## 4. 實作步驟

### Step 1: 盤點所有 mutation（0.5d）

```bash
grep -rn "\.mutation(" packages/api/src/routers/ > /tmp/all-mutations.txt
```

逐一審查：哪些是 update/delete/state-change？需要 ownership？

產出 `audit-mutations.md` 檢查清單。

### Step 2: 開發 utility（0.5d）

依 §3.1 / §3.2 建立：
- `packages/api/src/lib/ownership.ts`
- `packages/api/src/lib/permissions.ts`（如不存在）

撰寫 unit test：
- `packages/api/src/lib/__tests__/ownership.test.ts`
- `packages/api/src/lib/__tests__/permissions.test.ts`

### Step 3: 套用到 Routers（3d，依 §3.4 表格）

每個 router 套用後立即跑：
```bash
pnpm typecheck
pnpm test --filter=api -- <router-name>
```

並 commit 該 router 的變更（每個 router 一個 commit）。

### Step 4: 撰寫 E2E（1d）

`apps/web/e2e/security/ownership.spec.ts`：

```typescript
test('User A cannot delete User B\'s budget proposal', async ({ page }) => {
  // 1. Login as User A, create proposal
  // 2. Logout, login as User B (different manager)
  // 3. Try to delete User A's proposal via API
  // 4. Expect 403 FORBIDDEN
});

test('User cannot access OpCo not in their authorized list', async ({ page }) => {
  // 1. User authorized for OpCo A only
  // 2. Try to fetch OpCo B project list
  // 3. Expect empty result or 403
});
```

至少 5 個 E2E 場景：
1. 跨用戶刪除提案
2. 跨用戶修改費用
3. Supervisor 確認非自己負責的 ChargeOut
4. 跨 OpCo 列表查詢
5. Admin 可繞過 ownership（驗證 allowAdmin 旗標）

---

## 5. 驗收標準（DoD）

- [ ] `packages/api/src/lib/ownership.ts` 完成 + unit test 通過
- [ ] `packages/api/src/lib/permissions.ts` `getAuthorizedOpCoIds` / `assertOpCoAccess` 完成
- [ ] 至少 27 個 mutation 加 ownership 檢查（依 §3.4）
- [ ] 至少 5 個 E2E 場景通過
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` 全綠
- [ ] Code review by Security Lead 完成
- [ ] FEAT-013 主矩陣 IAM-10 等級從 L1 → L3

---

## 6. 驗證計畫

### 6.1 單元測試

```bash
pnpm test --filter=api packages/api/src/lib/__tests__/
```

### 6.2 整合測試（手動 + Playwright）

```bash
# 啟動本地環境
docker-compose up -d
pnpm dev

# 跑 ownership E2E
pnpm test --filter=web -- e2e/security/ownership.spec.ts
```

### 6.3 Negative testing 清單

- [ ] curl 用 User A token 修改 User B 的 expense → 403
- [ ] curl 用 PM 角色執行 `chargeOut.confirm` → 403（需 supervisor）
- [ ] curl 用未授權 OpCo 用戶查詢 OpCo 專案 → 空結果
- [ ] Admin 角色可繞過 ownership → 200 通過

---

## 7. 風險與取捨

| 風險 | 緩解 |
|------|------|
| ownership 改寫影響範圍大，產生 regression | 每個 router 改完即跑 E2E；分批 PR（一個 router 一個 PR） |
| `allowAdmin` 過度使用，導致 Admin 越權 | 文件化 allowAdmin 使用準則；CI 加 grep 規則統計使用次數 |
| OpCo filter 在某些 router 漏加 | 建立 utility 後加 ESLint 規則檢查 list query 必含 opCo where 條件（Phase 2） |
| 既有 Frontend 假設「自己看得到自己的資料」， OpCo filter 後可能列表變空 | 部署前在 staging 用實際多 OpCo 帳號測試 |

---

## 8. 後續延伸（不在本 sub-feature 範圍）

- PostgreSQL Row-Level Security（DB 層強制）→ Phase 2
- ownership 自動 lint 規則（檢查所有 update/delete 是否含 ownership 檢查）→ Phase 2

---

**Last Updated**: 2026-04-28
**Owner**: 待指派
**Reviewer**: Security Lead
