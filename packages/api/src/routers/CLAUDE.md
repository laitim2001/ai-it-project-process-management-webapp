# API Routers - tRPC 業務邏輯層

## 📋 目錄用途
此目錄包含所有 tRPC API Routers，是整個應用的業務邏輯核心層。每個 Router 對應一個業務領域。

## 🏗️ 檔案結構模式

```
routers/
├── budgetPool.ts          # 預算池管理
├── budgetProposal.ts      # 預算提案與審批
├── chargeOut.ts           # 費用轉嫁
├── currency.ts            # 幣別管理 (FEAT-001)
├── dashboard.ts           # 儀表板統計
├── expense.ts             # 費用記錄
├── health.ts              # 健康檢查
├── notification.ts        # 通知系統
├── omExpense.ts           # OM 費用
├── operatingCompany.ts    # 營運公司
├── project.ts             # 專案管理
├── purchaseOrder.ts       # 採購單
├── quote.ts               # 報價單
├── user.ts                # 用戶管理
└── vendor.ts              # 供應商管理
```

## 🎯 核心模式與約定

### 1. Router 結構模板
```typescript
/**
 * @fileoverview [Entity] Router - [業務描述]
 * @module api/routers/[entity]
 * @features - 列出主要功能
 * @procedures - 列出所有 procedures
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================
// Zod 驗證 Schema 定義
// ============================================================
export const [entity]StatusEnum = z.enum(['Draft', 'Active', ...]);
export const create[Entity]Schema = z.object({ ... });
export const update[Entity]Schema = z.object({ ... });

// ============================================================
// Router 定義
// ============================================================
export const [entity]Router = createTRPCRouter({
  // CRUD Procedures
  create: protectedProcedure.input(create[Entity]Schema).mutation(...),
  update: protectedProcedure.input(update[Entity]Schema).mutation(...),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(...),
  getAll: protectedProcedure.input(z.object({ page, limit, ... })).query(...),
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(...),

  // 業務特定 Procedures
  [customAction]: protectedProcedure.input(...).mutation(...),
});
```

### 2. 命名約定
- **檔案名**: camelCase（例: `budgetPool.ts`, `budgetProposal.ts`）
- **Router 導出**: `[entity]Router`（例: `projectRouter`, `expenseRouter`）
- **Schema 導出**: `create[Entity]Schema`, `update[Entity]Schema`
- **Enum 導出**: `[entity]StatusEnum`

### 3. Procedure 類型選擇
```typescript
// 查詢資料（讀取）
.query(async ({ ctx, input }) => { ... })

// 變更資料（寫入）
.mutation(async ({ ctx, input }) => { ... })
```

### 4. 權限控制模式
```typescript
// 一般認證用戶
protectedProcedure  // 需要登入

// 主管權限
supervisorProcedure // 需要 Supervisor 或 Admin 角色

// 管理員權限
adminProcedure      // 需要 Admin 角色
```

### 5. 錯誤處理標準
```typescript
// 找不到資源
throw new TRPCError({
  code: 'NOT_FOUND',
  message: `[Entity] not found`,
});

// 權限不足
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission to ...',
});

// 業務邏輯錯誤
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: '[Specific business error message]',
});
```

### 6. 分頁查詢模式
```typescript
getAll: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    // ... 其他過濾條件
  }))
  .query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
      ctx.prisma.[entity].findMany({
        skip,
        take: input.limit,
        where: { /* filters */ },
        include: { /* relations */ },
      }),
      ctx.prisma.[entity].count({ where: { /* same filters */ } }),
    ]);

    return {
      [entities]: items,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),
```

### 7. 關聯資料載入
```typescript
// 使用 Prisma include
await ctx.prisma.project.findUnique({
  where: { id: input.id },
  include: {
    budgetPool: true,           // 1-to-1 或 Many-to-1
    manager: true,
    proposals: {                // 1-to-Many
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

### 8. Transaction 處理模式
```typescript
// 使用 Prisma Transaction
const result = await ctx.prisma.$transaction(async (tx) => {
  // Step 1: Create entity
  const entity = await tx.[entity].create({ data: ... });

  // Step 2: Update related data
  await tx.[relatedEntity].update({ ... });

  // Step 3: Create audit log
  await tx.history.create({ ... });

  return entity;
});
```

## 🔗 依賴關係

### 從此層調用
- `ctx.prisma.*` - Prisma Client（資料庫操作）
- `ctx.session.user` - 當前用戶資訊
- 其他 Router 的 Schema（用於資料驗證）

### 被以下層調用
- `apps/web/src/lib/trpc.ts` - tRPC Client
- 前端組件的 `api.[router].[procedure].useQuery/useMutation()`

## ⚠️ 重要約定

1. **所有業務邏輯必須在此層實現**，不可在前端組件中
2. **必須使用 Zod Schema 驗證所有輸入**
3. **查詢和變更必須有適當的權限檢查**
4. **錯誤訊息必須清晰且用戶友好**（避免洩漏系統資訊）
5. **關鍵操作必須記錄 History**（審計追蹤）
6. **大量資料查詢必須支援分頁**
7. **複雜交易必須使用 Prisma Transaction**

## 📝 新增 Router 檢查清單

- [ ] 創建 `[entity].ts` 檔案
- [ ] 定義 Zod Schema（create, update, status enum）
- [ ] 實現標準 CRUD procedures（create, update, delete, getAll, getById）
- [ ] 添加業務特定 procedures
- [ ] 在 `root.ts` 中註冊 Router
- [ ] 編寫完整的 JSDoc 文檔
- [ ] 添加適當的錯誤處理
- [ ] 實現權限檢查
- [ ] 測試所有 procedures

## 🔍 除錯技巧

```typescript
// 開發環境日誌
console.log('[DEBUG] Input:', input);
console.log('[DEBUG] User:', ctx.session.user);

// 檢查 Prisma 生成的 SQL
const result = await ctx.prisma.project.findMany(...);
// 查看 .next/server 中的日誌
```

## 相關文件
- `packages/db/prisma/schema.prisma` - 資料模型定義
- `packages/api/src/root.ts` - Router 註冊
- `packages/api/src/trpc.ts` - tRPC 配置和中間件
- `apps/web/src/lib/trpc.ts` - 前端 tRPC Client
