# API Routers - tRPC 業務邏輯層

> **Last Updated**: 2025-12-18
> **Total Routers**: 17 個 .ts 檔案
> **技術基礎**: tRPC 10.x + Zod + Prisma
> **框架**: Type-safe API with end-to-end TypeScript

## 📋 目錄用途

此目錄包含所有 **tRPC API Routers**，是整個應用的**業務邏輯核心層**。每個 Router 對應一個業務領域，實現完整的 CRUD 操作和業務特定功能。

**核心職責**：
1. **所有業務邏輯必須在此層實現** - 不可在前端組件中
2. **資料驗證** - 使用 Zod Schema 驗證所有輸入
3. **權限控制** - 通過 procedure middleware 實現 RBAC
4. **資料庫操作** - 通過 Prisma Client 進行資料存取
5. **錯誤處理** - 統一的 TRPCError 錯誤回應格式

## 🏗️ 完整檔案結構

```
routers/                              # 共 17 個 API Routers
│
├── 核心業務模組
│   ├── project.ts                    # 專案管理（核心，831+ 行）
│   │                                 # FEAT-001: 欄位擴展、FEAT-006: Summary、FEAT-010: Import
│   ├── budgetPool.ts                 # 預算池管理
│   ├── budgetProposal.ts             # 預算提案與審批流程
│   └── dashboard.ts                  # 儀表板統計數據
│
├── 財務與採購模組
│   ├── expense.ts                    # 費用記錄與審批
│   ├── expenseCategory.ts            # 費用類別管理（FEAT-007）
│   ├── purchaseOrder.ts              # 採購單管理
│   ├── quote.ts                      # 報價單管理
│   └── chargeOut.ts                  # 費用轉嫁（FEAT-005）
│
├── O&M 費用模組（FEAT-007）
│   └── omExpense.ts                  # OM 費用管理（表頭-明細架構）
│                                     # 支援: createWithItems, addItem, updateItem,
│                                     #       removeItem, reorderItems, getSummary
│
├── 組織與用戶模組
│   ├── user.ts                       # 用戶管理（含 CHANGE-032 密碼設定）
│   ├── operatingCompany.ts           # 營運公司管理
│   ├── vendor.ts                     # 供應商管理
│   └── permission.ts                 # 權限管理（FEAT-011）
│
├── 輔助功能模組
│   ├── currency.ts                   # 幣別管理（FEAT-001）
│   ├── notification.ts               # 通知系統（Epic 8）
│   └── health.ts                     # 健康檢查 API + Schema 同步
│                                     # 支援: diagnose, schemaCompare, fixAllSchemaIssues
```

## 🎯 Router 功能詳解

### 1. 核心業務模組

| Router | 功能 | 關鍵 Procedures | 相關功能 |
|--------|------|-----------------|----------|
| `project.ts` | 專案完整生命週期管理 | create, update, delete, getAll, getById, getBudgetUsage, chargeOut, export | FEAT-001, FEAT-006, FEAT-010 |
| `budgetPool.ts` | 預算池 CRUD + 使用率追蹤 | create, update, delete, getAll, getById, getUsage | Epic 2 |
| `budgetProposal.ts` | 提案審批工作流 | create, submit, approve, reject, requestMoreInfo | Epic 3 |
| `dashboard.ts` | 儀表板統計數據 | getPMDashboard, getSupervisorDashboard, getStats | Epic 7 |

### 2. O&M 費用模組（FEAT-007 重構）

**omExpense.ts** - 表頭-明細架構

| Procedure | 用途 |
|-----------|------|
| `createWithItems` | 建立 OM 費用（表頭 + 明細項目 + 月度記錄） |
| `addItem` | 新增明細項目（自動建立 12 個月度記錄） |
| `updateItem` | 更新明細項目資訊 |
| `removeItem` | 刪除明細項目（級聯刪除月度記錄） |
| `reorderItems` | 調整明細項目排序（拖曳排序支援） |
| `updateItemMonthlyRecords` | 更新明細項目的月度記錄 |
| `getSummary` | 獲取 O&M Summary 數據 |
| `getMonthlyTotals` | 獲取指定年度的月度支出匯總 |
| `calculateYoYGrowth` | 計算年度增長率 |

### 3. 權限管理模組（FEAT-011）

**permission.ts** - 角色權限與用戶覆蓋

| Procedure | 用途 | 權限要求 |
|-----------|------|----------|
| `getAllPermissions` | 獲取所有權限定義 | protected |
| `getMyPermissions` | 獲取當前用戶有效權限（角色預設 + 用戶覆蓋） | protected |
| `getUserPermissions` | 獲取指定用戶的權限配置 | admin |
| `setUserPermission` | 設置單一用戶權限 | admin |
| `setUserPermissions` | 批量設置用戶權限 | admin |
| `getRolePermissions` | 獲取角色預設權限 | admin |

### 4. 健康檢查模組

**health.ts** - 系統診斷與 Schema 同步

| Procedure | 用途 |
|-----------|------|
| `diagnose` | 系統健康診斷（資料庫連線、版本資訊） |
| `schemaCompare` | 比較 Prisma Schema 與資料庫實際結構 |
| `fixAllSchemaIssues` | 自動修復所有 Schema 不一致問題 |
| `getConfig` | 獲取系統配置資訊 |

## 📝 開發模式與約定

### 標準 Router 結構

```typescript
/**
 * @fileoverview [Entity] Router - [業務描述]
 * @module api/routers/[entity]
 * @features - 列出主要功能
 * @procedures - 列出所有 procedures
 * @dependencies - 依賴套件
 * @related - 相關檔案
 * @since [Epic/Feature 名稱]
 * @lastModified YYYY-MM-DD
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure, adminProcedure } from '../trpc';

// ============================================================
// Zod 驗證 Schema 定義
// ============================================================

export const entityStatusEnum = z.enum(['Draft', 'Active', 'Completed']);

export const createEntitySchema = z.object({
  name: z.string().min(1, '名稱不能為空').max(255),
  description: z.string().optional(),
  // ... 其他欄位
});

export const updateEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  // ... 可選更新欄位
});

// ============================================================
// Router 定義
// ============================================================

export const entityRouter = createTRPCRouter({
  // === 標準 CRUD ===
  create: protectedProcedure
    .input(createEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // 業務邏輯
    }),

  update: protectedProcedure
    .input(updateEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // 業務邏輯
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 業務邏輯
    }),

  getAll: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // 分頁查詢邏輯
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // 查詢邏輯
    }),

  // === 業務特定 Procedures ===
  customAction: supervisorProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      // 業務邏輯
    }),
});
```

### 權限控制 Procedures

```typescript
import { createTRPCRouter, protectedProcedure, supervisorProcedure, adminProcedure } from '../trpc';

// 一般認證用戶（需要登入）
protectedProcedure

// 主管權限（Supervisor 或 Admin 角色）
supervisorProcedure

// 管理員權限（僅 Admin 角色）
adminProcedure
```

### 錯誤處理標準

```typescript
import { TRPCError } from '@trpc/server';

// 找不到資源
throw new TRPCError({
  code: 'NOT_FOUND',
  message: `Project with ID ${input.id} not found`,
});

// 權限不足
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission to approve this proposal',
});

// 業務邏輯錯誤
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Cannot delete budget pool with active projects',
});

// 內部錯誤（避免洩漏系統資訊）
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'An unexpected error occurred',
  cause: error, // 開發環境才顯示
});
```

### 分頁查詢模式

```typescript
getAll: protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: entityStatusEnum.optional(),
    sortBy: z.enum(['createdAt', 'name', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }))
  .query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;

    // 構建過濾條件
    const where = {
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
      ...(input.status && { status: input.status }),
    };

    // 並行查詢資料和總數
    const [items, total] = await Promise.all([
      ctx.prisma.entity.findMany({
        skip,
        take: input.limit,
        where,
        orderBy: { [input.sortBy]: input.sortOrder },
        include: { /* relations */ },
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

### Transaction 處理模式

```typescript
const result = await ctx.prisma.$transaction(async (tx) => {
  // Step 1: 建立主要資料
  const entity = await tx.entity.create({
    data: { name: input.name, ... },
  });

  // Step 2: 建立關聯資料
  await tx.relatedEntity.createMany({
    data: input.items.map(item => ({
      entityId: entity.id,
      ...item,
    })),
  });

  // Step 3: 建立審計記錄
  await tx.history.create({
    data: {
      entityType: 'Entity',
      entityId: entity.id,
      action: 'CREATE',
      userId: ctx.session.user.id,
      details: JSON.stringify(input),
    },
  });

  return entity;
});
```

### 關聯資料載入

```typescript
// 使用 Prisma include
const project = await ctx.prisma.project.findUnique({
  where: { id: input.id },
  include: {
    // 1-to-1 或 Many-to-1 關聯
    budgetPool: true,
    manager: { select: { id: true, name: true, email: true } },
    supervisor: { select: { id: true, name: true, email: true } },

    // 1-to-Many 關聯（可限制數量）
    proposals: {
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { comments: true },
    },

    // 嵌套關聯
    expenses: {
      include: {
        purchaseOrder: {
          include: { vendor: true },
        },
      },
    },
  },
});
```

## ⚠️ 重要約定

### 必須遵守

1. **所有業務邏輯必須在此層實現**
   - 不可在前端組件中編寫業務邏輯
   - 前端只負責呼叫 API 和 UI 渲染

2. **必須使用 Zod Schema 驗證所有輸入**
   - 每個 procedure 必須有明確的 input schema
   - 使用 `.min()`, `.max()`, `.email()` 等驗證器

3. **查詢和變更必須有適當的權限檢查**
   - 敏感操作使用 `supervisorProcedure` 或 `adminProcedure`
   - 必要時在 procedure 內部進行額外檢查

4. **錯誤訊息必須清晰且用戶友好**
   - 避免洩漏系統資訊（SQL 錯誤、堆疊追蹤）
   - 使用 i18n 翻譯 key 而非硬編碼文字

5. **關鍵操作必須記錄 History**
   - 建立、更新、刪除操作需要審計追蹤
   - 狀態變更需要記錄變更前後的值

6. **大量資料查詢必須支援分頁**
   - 預設 limit 不超過 100
   - 返回 totalPages 供前端渲染分頁

7. **複雜交易必須使用 Prisma Transaction**
   - 多表操作需要確保原子性
   - 失敗時自動回滾

### 命名約定

| 類型 | 約定 | 範例 |
|------|------|------|
| 檔案名 | camelCase | `budgetPool.ts`, `omExpense.ts` |
| Router 導出 | `[entity]Router` | `projectRouter`, `expenseRouter` |
| Schema 導出 | `create[Entity]Schema`, `update[Entity]Schema` | `createProjectSchema` |
| Enum 導出 | `[entity]StatusEnum` | `projectStatusEnum` |
| Procedure 名稱 | camelCase 動詞開頭 | `getAll`, `create`, `updateStatus` |

### 禁止事項

- ❌ 在前端組件中直接呼叫 Prisma
- ❌ 返回未經過濾的資料庫錯誤
- ❌ 忽略權限檢查
- ❌ 使用 `any` 類型繞過 TypeScript
- ❌ 在 query 中執行副作用（應使用 mutation）
- ❌ 硬編碼中文錯誤訊息（應使用 i18n）

## 🔗 依賴關係

### 從此層調用

```typescript
// Prisma Client
ctx.prisma.project.findMany({ ... })

// 當前用戶資訊
ctx.session.user.id
ctx.session.user.role.id

// 其他 Router 的 Schema（用於類型）
import { projectStatusEnum } from './project';
```

### 被以下層調用

```typescript
// 前端 tRPC Client (apps/web/src/lib/trpc.ts)
import { api } from '@/lib/trpc';

// React Query 整合
const { data } = api.project.getAll.useQuery({ page: 1, limit: 10 });
const mutation = api.project.create.useMutation();
```

## 📝 新增 Router 檢查清單

- [ ] 創建 `[entity].ts` 檔案
- [ ] 編寫完整的 JSDoc 文檔（@fileoverview, @features, @procedures）
- [ ] 定義 Zod Schema（create, update, status enum）
- [ ] 實現標準 CRUD procedures（create, update, delete, getAll, getById）
- [ ] 添加業務特定 procedures
- [ ] 在 `root.ts` 中註冊 Router
- [ ] 添加適當的錯誤處理（TRPCError）
- [ ] 實現權限檢查（選擇正確的 procedure 類型）
- [ ] 添加 History 記錄（關鍵操作）
- [ ] 測試所有 procedures

## 🔍 除錯技巧

```typescript
// 開發環境日誌
console.log('[DEBUG] Input:', JSON.stringify(input, null, 2));
console.log('[DEBUG] User:', ctx.session.user);

// 檢查生成的 SQL（在 Prisma 配置中啟用）
// packages/db/prisma/schema.prisma
// generator client {
//   provider = "prisma-client-js"
//   log      = ["query", "info", "warn", "error"]
// }

// 使用 tRPC 開發工具
// 訪問 http://localhost:3000/api/trpc/panel
```

## 🔗 相關資源

### 代碼規範
- `.claude/rules/backend-api.md` - tRPC 後端 API 規範
- `.claude/rules/database.md` - Prisma 資料庫規範
- `.claude/rules/typescript.md` - TypeScript 約定

### 相關檔案
- `packages/db/prisma/schema.prisma` - Prisma 資料模型定義
- `packages/api/src/root.ts` - Router 註冊入口
- `packages/api/src/trpc.ts` - tRPC 配置和 procedure 中間件
- `packages/api/src/lib/email.ts` - EmailService（通知發送）
- `apps/web/src/lib/trpc.ts` - 前端 tRPC Client

### 外部文檔
- [tRPC 官方文檔](https://trpc.io/docs)
- [Zod 官方文檔](https://zod.dev/)
- [Prisma 官方文檔](https://www.prisma.io/docs)

## 📊 功能版本追蹤

| 功能 | 相關 Router | 版本 | 說明 |
|------|-------------|------|------|
| Epic 2 | project.ts, budgetPool.ts | MVP | 專案和預算池管理 |
| Epic 3 | budgetProposal.ts | MVP | 提案審批工作流 |
| Epic 5 | vendor.ts, quote.ts, purchaseOrder.ts | MVP | 採購管理 |
| Epic 6 | expense.ts | MVP | 費用記錄與審批 |
| Epic 8 | notification.ts | MVP | 通知系統 |
| FEAT-001 | currency.ts, project.ts | Post-MVP | 多幣別支援 |
| FEAT-005 | chargeOut.ts | Post-MVP | 費用轉嫁 |
| FEAT-007 | omExpense.ts, expenseCategory.ts | Post-MVP | OM 費用重構 |
| FEAT-011 | permission.ts | Post-MVP | 權限管理系統 |
| CHANGE-032 | user.ts | Post-MVP | 密碼管理功能 |
