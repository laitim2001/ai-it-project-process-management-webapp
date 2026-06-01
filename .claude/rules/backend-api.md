# Backend API Rules - tRPC 業務邏輯層

---
applies_to:
  - "packages/api/src/**"
  - "packages/api/src/routers/**"
  - "packages/api/src/lib/**"
---

## 概述
此規則適用於 tRPC API Router 和後端業務邏輯層。目前共 17 個 API Routers。

## Router 結構模板

```typescript
/**
 * @fileoverview [Entity] Router - [業務描述]
 * @module api/routers/[entity]
 * @features - 列出主要功能
 * @procedures - 列出所有 procedures
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

// ============================================================
// Zod 驗證 Schema 定義
// ============================================================
export const entityStatusEnum = z.enum(['Draft', 'Active', 'Completed']);

export const createEntitySchema = z.object({
  name: z.string().min(1, '名稱不可為空'),
  status: entityStatusEnum.default('Draft'),
  // ... 其他欄位
});

export const updateEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  status: entityStatusEnum.optional(),
});

// ============================================================
// Router 定義
// ============================================================
export const entityRouter = createTRPCRouter({
  // CRUD Procedures
  create: protectedProcedure
    .input(createEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.entity.create({ data: input });
    }),

  update: protectedProcedure
    .input(updateEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.entity.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.entity.delete({ where: { id: input.id } });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const entity = await ctx.prisma.entity.findUnique({
        where: { id: input.id },
        include: { relatedEntity: true },
      });
      if (!entity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entity not found' });
      }
      return entity;
    }),

  getAll: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.search
        ? { name: { contains: input.search, mode: 'insensitive' as const } }
        : {};

      const [items, total] = await Promise.all([
        ctx.prisma.entity.findMany({ skip, take: input.limit, where }),
        ctx.prisma.entity.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});
```

## 命名約定

| 類型 | 約定 | 範例 |
|------|------|------|
| 檔案名 | camelCase | `budgetPool.ts`, `budgetProposal.ts` |
| Router 導出 | `[entity]Router` | `projectRouter`, `expenseRouter` |
| Schema 導出 | `create/update[Entity]Schema` | `createProjectSchema` |
| Enum 導出 | `[entity]StatusEnum` | `projectStatusEnum` |

## Procedure 類型

```typescript
// 查詢資料（讀取）
.query(async ({ ctx, input }) => { ... })

// 變更資料（寫入）
.mutation(async ({ ctx, input }) => { ... })
```

## 權限控制模式

```typescript
// 一般認證用戶
protectedProcedure  // 需要登入

// 主管權限
supervisorProcedure // 需要 Supervisor 或 Admin 角色

// 管理員權限
adminProcedure      // 需要 Admin 角色
```

## 錯誤處理標準

```typescript
// 找不到資源
throw new TRPCError({
  code: 'NOT_FOUND',
  message: `Entity not found`,
});

// 權限不足
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission to perform this action',
});

// 業務邏輯錯誤
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: '[Specific business error message]',
});

// 驗證錯誤（Zod 自動處理）
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input data',
});
```

### 🚨 錯誤分類必須用 `code`，禁止讓前端用 message 字串比對分支

**規則**：當同一 procedure 可能拋出**多種前端需要區分的錯誤**時，**必須**用不同的 `code` 或在 `cause` 帶穩定識別碼。**禁止**讓前端用 `err.message.includes('...')` 來決定顯示哪個訊息。

**Why**：
- 後端訊息一旦改字（包括 i18n 化、typo 修正、語氣調整），前端的 `includes()` 會**靜默失效**
- 2026-04-21 Karpathy 審查發現 `PasswordChangeDialog.tsx:89-96` 就是此反模式（比對「目前密碼不正確」字串）

**How to apply**：
- 只有一種錯誤 → 用標準 `code` + 任意 message（OK）
- 多種錯誤需前端區分 → 以下**二選一**：

#### 方案 A（推薦）：用 `cause` 帶穩定識別碼

```typescript
// ✅ Backend — packages/api/src/routers/user.ts
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Current password is incorrect',  // 可自由修改
  cause: { reason: 'INVALID_CURRENT_PASSWORD' }, // ← 穩定識別碼
});

throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'New password must differ from current password',
  cause: { reason: 'PASSWORD_REUSE' },
});

// ✅ Frontend — 用 cause.reason 判斷，不用 message
onError: (err) => {
  const reason = (err.data?.cause as { reason?: string })?.reason;
  switch (reason) {
    case 'INVALID_CURRENT_PASSWORD':
      return toast({ title: t('errors.invalidCurrentPassword'), variant: 'destructive' });
    case 'PASSWORD_REUSE':
      return toast({ title: t('errors.passwordReuse'), variant: 'destructive' });
    default:
      return toast({ title: t('errors.unknown'), description: err.message, variant: 'destructive' });
  }
}
```

#### 方案 B：後端直接拋 i18n key

```typescript
// ✅ Backend
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'errors.invalidCurrentPassword', // ← 直接是 i18n key
});

// ✅ Frontend
onError: (err) => toast({ title: t(err.message), variant: 'destructive' }),
```

**❌ 禁止**：

```typescript
// ❌ 前端用 message 字串比對
onError: (err) => {
  if (err.message.includes('目前密碼不正確')) { ... }     // 後端改字就壞
  else if (err.message.includes('密碼不能與舊密碼相同')) { ... }
}
```

**Checklist**：
- [ ] Procedure 有多種錯誤情境？→ 決定用方案 A 或 B
- [ ] 前端分支是否讀 `err.data.cause.reason` 或 i18n key，不是 `err.message`？
- [ ] 新增錯誤類型時，同步更新前端 switch 的 case（含 default fallback）

## Transaction 處理模式

```typescript
const result = await ctx.prisma.$transaction(async (tx) => {
  // Step 1: Create entity
  const entity = await tx.entity.create({ data: input });

  // Step 2: Update related data
  await tx.relatedEntity.update({ ... });

  // Step 3: Create audit log
  await tx.history.create({
    data: {
      entityType: 'Entity',
      entityId: entity.id,
      action: 'CREATE',
      userId: ctx.session.user.id,
    },
  });

  return entity;
});
```

## 分頁查詢模式

```typescript
getAll: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: entityStatusEnum.optional(),
    sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }))
  .query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;
    const where: Prisma.EntityWhereInput = {};

    if (input.search) {
      where.name = { contains: input.search, mode: 'insensitive' };
    }
    if (input.status) {
      where.status = input.status;
    }

    const [items, total] = await Promise.all([
      ctx.prisma.entity.findMany({
        skip,
        take: input.limit,
        where,
        orderBy: { [input.sortBy]: input.sortOrder },
        include: { relatedEntity: true },
      }),
      ctx.prisma.entity.count({ where }),
    ]);

    return {
      items,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),
```

## 新增 Router 檢查清單

- [ ] 創建 `[entity].ts` 檔案
- [ ] 定義 Zod Schema（create, update, status enum）
- [ ] 實現標準 CRUD procedures
- [ ] 添加業務特定 procedures
- [ ] 在 `root.ts` 中註冊 Router
- [ ] 編寫完整的 JSDoc 文檔
- [ ] 添加適當的錯誤處理
- [ ] 實現權限檢查
- [ ] 測試所有 procedures

## 重要約定

1. ✅ **所有業務邏輯必須在此層實現**，不可在前端組件中
2. ✅ **必須使用 Zod Schema 驗證所有輸入**
3. ✅ **查詢和變更必須有適當的權限檢查**
4. ✅ **錯誤訊息必須清晰且用戶友好**
5. ✅ **關鍵操作必須記錄 History**（審計追蹤）
6. ✅ **大量資料查詢必須支援分頁**
7. ✅ **複雜交易必須使用 Prisma Transaction**

## 相關規則
- `database.md` - Prisma 資料模型規範
- `typescript.md` - TypeScript 約定
