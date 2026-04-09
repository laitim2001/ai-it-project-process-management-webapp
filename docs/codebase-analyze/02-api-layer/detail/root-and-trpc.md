# root.ts 與 trpc.ts 詳細分析

---

## root.ts — Root AppRouter

> **檔案路徑**: `packages/api/src/root.ts`
> **行數**: 102 行

### 功能

整合所有子 Router 為單一的 `appRouter`，匯出 `AppRouter` 類型供前端 tRPC Client 使用。

### 註冊的 Routers（共 17 個）

| 命名空間 | Router | 來源檔案 | 備註 |
|----------|--------|----------|------|
| `health` | healthRouter | `routers/health` | 健康檢查 |
| `budgetPool` | budgetPoolRouter | `routers/budgetPool` | 預算池 |
| `project` | projectRouter | `routers/project` | 專案管理 |
| `user` | userRouter | `routers/user` | 用戶管理 |
| `budgetProposal` | budgetProposalRouter | `routers/budgetProposal` | 預算提案 |
| `vendor` | vendorRouter | `routers/vendor` | 供應商 |
| `quote` | quoteRouter | `routers/quote` | 報價單 |
| `purchaseOrder` | purchaseOrderRouter | `routers/purchaseOrder` | 採購單 |
| `expense` | expenseRouter | `routers/expense` | 費用記錄 |
| `dashboard` | dashboardRouter | `routers/dashboard` | 儀表板 |
| `notification` | notificationRouter | `routers/notification` | 通知系統 |
| `currency` | currencyRouter | `routers/currency` | 幣別 (FEAT-001) |
| `operatingCompany` | operatingCompanyRouter | `routers/operatingCompany` | 營運公司 |
| `omExpense` | omExpenseRouter | `routers/omExpense` | OM 費用 |
| `expenseCategory` | expenseCategoryRouter | `routers/expenseCategory` | 費用類別 (CHANGE-003) |
| `chargeOut` | chargeOutRouter | `routers/chargeOut` | 費用轉嫁 |
| `permission` | permissionRouter | `routers/permission` | 權限管理 (FEAT-011) |

### 匯出

```typescript
export const appRouter = createTRPCRouter({ ... });
export type AppRouter = typeof appRouter;
```

---

## trpc.ts — tRPC 初始化與中間件

> **檔案路徑**: `packages/api/src/trpc.ts`
> **行數**: 455 行

### 1. Context 定義

```typescript
interface CreateContextOptions {
  session: Session | null;  // NextAuth 會話
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,  // NextAuth session（含 user, role）
    prisma,                 // Prisma Client 實例（from @itpm/db）
  };
};
```

**ctx 中可用的資料**:
- `ctx.session` — NextAuth Session 或 null
- `ctx.session.user` — 當前用戶（id, name, email, role）
- `ctx.session.user.role` — 用戶角色（id, name）
- `ctx.prisma` — Prisma Client 實例

### 2. tRPC 初始化配置

- **Transformer**: `superjson`（支援 Date, BigInt, Map, Set 等）
- **Error Formatter**: Zod 錯誤格式化，提供 `zodError.fieldErrors` 給前端

### 3. Procedure 類型（共 4 個）

#### `publicProcedure` — 行 286
- **認證要求**: 無（不需要登入）
- **ctx.session**: 可能為 null
- **使用場景**: 公開查詢、登入/註冊

#### `protectedProcedure` — 行 323
- **認證要求**: 需要登入
- **中間件邏輯**: 檢查 `ctx.session` 和 `ctx.session.user` 是否存在
- **失敗回應**: `TRPCError({ code: 'UNAUTHORIZED' })`
- **ctx.session.user**: 保證非 null（TypeScript 型別縮小）

#### `supervisorProcedure` — 行 392
- **認證要求**: 需要 Supervisor 或 Admin 角色
- **繼承自**: protectedProcedure
- **中間件邏輯**: 檢查 `ctx.session.user.role.name` 是否為 `'Supervisor'` 或 `'Admin'`
- **失敗回應**: `TRPCError({ code: 'FORBIDDEN', message: '需要 Supervisor 或 Admin 權限' })`

#### `adminProcedure` — 行 442
- **認證要求**: 需要 Admin 角色
- **繼承自**: protectedProcedure
- **中間件邏輯**: 檢查 `ctx.session.user.role.name` 是否為 `'Admin'`
- **失敗回應**: `TRPCError({ code: 'FORBIDDEN', message: '需要 Admin 權限' })`

### 4. 匯出

```typescript
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const supervisorProcedure = protectedProcedure.use(supervisorMiddleware);
export const adminProcedure = protectedProcedure.use(adminMiddleware);
```

### 5. NextAuth v5 遷移說明

- 舊版 `createTRPCContext` / `createTRPCContextFetch` 已移除
- 現在使用 `createInnerTRPCContext()` 直接從 App Router route handler 接收 session
- Session 由 `apps/web/src/app/api/trpc/[trpc]/route.ts` 呼叫 `auth()` 後傳入

---

## 架構流程

```
前端 tRPC Client (apps/web/src/lib/trpc.ts)
    ↓ HTTP Request
App Router route handler (apps/web/src/app/api/trpc/[trpc]/route.ts)
    ↓ auth() 獲取 session
createInnerTRPCContext({ session })
    ↓ ctx = { session, prisma }
appRouter → 對應的 Router → Procedure
    ↓ 中間件檢查 (public/protected/supervisor/admin)
    ↓ Zod 輸入驗證
    ↓ 業務邏輯 (ctx.prisma 操作)
    ↓ superjson 序列化回應
前端收到型別安全的結果
```
