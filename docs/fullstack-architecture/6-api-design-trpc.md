# 6. API 設計 (tRPC)

在 T3 Stack 中，我們不使用傳統的 REST 或 GraphQL API，而是使用 tRPC。tRPC 讓我們可以在前端以完全類型安全的方式，像呼叫本地函數一樣呼叫後端程序。API 的「規格」就是我們的後端路由定義。

### 6.1. 路由結構 (Router Structure)

我們的 API 將在 `packages/api/src/routers/` 目錄中定義。我們將採用模組化的方法，為每個核心數據模型創建一個獨立的 router，最後將它們合併到一個主 `appRouter` 中。

```
/packages/api/src/routers/
├── _app.ts         # 主 appRouter，合併所有子路由
├── project.ts      # 處理與專案相關的所有操作
├── budgetPool.ts   # 處理資金池相關操作
├── proposal.ts     # 處理預算提案相關操作
└── ...             # 其他模型的路由
```

### 6.2. 主路由 (`_app.ts`)

`appRouter` 是所有 API 程序的入口點。

```typescript
// packages/api/src/routers/_app.ts
import { createTRPCRouter } from "../trpc";
import { projectRouter } from "./project";
import { budgetPoolRouter } from "./budgetPool";
// ... import other routers

export const appRouter = createTRPCRouter({
  project: projectRouter,
  budgetPool: budgetPoolRouter,
  // ... merge other routers
});

export type AppRouter = typeof appRouter;
```

### 6.3. 輸入驗證 (Input Validation with Zod)

所有 tRPC 程序的輸入都必須使用 `Zod` 進行嚴格的驗證。這確保了進入我們業務邏輯的數據是乾淨且類型正確的。

```typescript
// packages/api/src/routers/project.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  // 獲取單一專案
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.project.findUnique({
        where: { id: input.id },
      });
    }),

  // 創建新專案
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().optional(),
        budgetPoolId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.create({
        data: {
          ...input,
          managerId: ctx.session.user.id,
          supervisorId: "...", // TODO: Define logic to get supervisor
        },
      });
      return project;
    }),
  
  // ... other project-related procedures
});
```

### 6.4. 受保護的程序 (Protected Procedures)

我們將創建一個 `protectedProcedure`，它會自動校驗使用者的身份驗證狀態。任何需要使用者登入才能訪問的 API，都必須使用 `protectedProcedure`。這利用 tRPC 的中介軟體 (middleware) 功能，將認證邏輯與業務邏輯分離。

```typescript
// packages/api/src/trpc.ts
// ... imports

const t = initTRPC.context<typeof createTRPCContext>().create();

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // Infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```
