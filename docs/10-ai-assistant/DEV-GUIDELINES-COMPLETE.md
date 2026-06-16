# ITPM 專案開發指引 ── 完整速查手冊

> **狀態**：📘 衍生速查（derived quick-reference）── **非新增真相來源**
> **作用**：把分散在 `CLAUDE.md` / `.claude/rules/*` / `docs/10-ai-assistant/03-dev-workflow.md` / `codebase-analyze/` 的開發指引，攤開整合成單一速查。供「一次看完全貌」用。
> **權威性**：本文件**不取代**任何來源檔。當本文件與來源檔（尤其 `.claude/rules/*` 與實際程式碼）**不一致時，一律以來源檔為準**（見 §1 權威排序）。
> **語言**：繁體中文。
> **Last Updated**：2026-06-09
> **Maintained By**：開發團隊 + AI 助手
> **維護觸發**：當 `CLAUDE.md` 紅線、`.claude/rules/*`、`03-dev-workflow.md`、ITPM slash commands 任一變更時，同步更新對應段落（或直接重生本檔）。

---

## 目錄

1. [指引的分層架構與權威排序](#1-指引的分層架構與權威排序)
2. [AI 編碼行為準則（Karpathy）](#2-ai-編碼行為準則karpathy含正反範例)
3. [協作行為邊界](#3-協作行為邊界)
4. [技術紅線（硬規則）](#4-技術紅線硬規則)
5. [領域規範詳解](#5-領域規範詳解)
6. [開發工作流（五步 + 任務分類）](#6-開發工作流權威03-dev-workflowmd)
7. [Commit / 分支 / 推送](#7-commit--分支--推送)
8. [驗證與測試](#8-驗證與測試)
9. [指令與跨電腦 ITPM Slash Commands](#9-指令與跨電腦-itpm-slash-commands)
10. [暫緩條款](#10-暫緩條款)
11. [環境、測試帳號、常見陷阱](#11-環境測試帳號常見陷阱)
12. [文件導航](#12-文件導航)

---

## 1. 指引的分層架構與權威排序

開發指引**刻意分層**：`CLAUDE.md` 放高層導覽，細節下放 `.claude/rules/`，精確數字下放 `codebase-analyze/`，避免任一檔過大或互相漂移。

### Session 起手必讀順序

| 順序 | 文件 | 性質 |
|------|------|------|
| 1 | `CLAUDE.md`（根） | 高層導航、紅線、開發指令 ── **自動載入** |
| 2 | `.claude/rules/karpathy-guidelines.md` | 行為態度 ── **自動載入** |
| 3 | `docs/codebase-analyze/SUMMARY.md` | 最新精確統計 ── 按需 |
| 4 | `.claude/rules/{領域}.md` | 依任務路徑 ── **自動載入** |
| 5 | `docs/codebase-analyze/02..11/` | 精確介面/架構/已知問題 ── 按需深讀 |
| 6 | `docs/10-ai-assistant/03-dev-workflow.md` | FEAT/CHANGE/FIX 權威流程 ── 按需 |

> 在 Claude Code 中，第 1、2、4 項由 harness 在 session 啟動時**自動注入**；第 3、5、6 屬按需深讀。`01-session-start.md` 是給**非自動載入環境**（網頁版/新人 onboarding）的貼上式 prompt，Claude Code 通常不需要。

### 權威排序（衝突時誰為準）

```
docs/codebase-analyze/ (含 SUMMARY.md) + 實際程式碼
        >  .claude/rules/ 領域規則
        >  CLAUDE.md 的摘要數字
        >  本速查文件
```

- **統計數字**（頁面/組件/Router/Procedure/Model/i18n keys）一律以 `SUMMARY.md` 為準。`CLAUDE.md` 頂部數字僅摘要，可能落後。
- **介面/架構細節**以實際程式碼 + `codebase-analyze/` 對應 detail 檔為準。
- **行為態度 vs 技術規範衝突**：遵守領域規則的技術細節，但保留 Karpathy 的行為態度。

### codebase-analyze 是什麼

2026-04-09 完成的全面掃描：**77 份文件、790 個驗證點、94.3% 準確率**。被問到精確數字時優先查這裡。

| 查詢目的 | 文件 |
|---------|------|
| 整體統計、最嚴重發現 | `SUMMARY.md` |
| 17 Routers + 200 Procedures 詳解 | `02-api-layer/` |
| 23 路由模組、60 頁面 | `03-frontend-pages/` |
| 51 業務 + 43 UI 組件 | `04-components/` |
| 32 Models + 94 索引 + ER 圖 | `05-database/` |
| 2,706 翻譯 keys、29 namespaces | `08-i18n/` |
| 🔴 安全問題、技術債務、死碼 | `10-issues-and-debt/` |

---

## 2. AI 編碼行為準則（Karpathy）含正反範例

來源：Karpathy 對 LLM 編碼陷阱的觀察。**所有**編碼/審查/重構任務適用。取捨偏「謹慎 > 速度」。

### 2.1 Think Before Coding ── 先思考再動手

**不假設、不隱藏困惑、浮現 tradeoffs。**

✅ 好的做法：
- **明確陳述假設**：「我假設 OMExpense 刪除應 cascade 刪所有 OMExpenseItem（schema 是 `onDelete: Cascade`）。若錯請告知。」
- **呈現多種解讀**：「『加權限檢查』可能指 (1) procedure 層加 `supervisorProcedure` (2) 前端 Sidebar 過濾 (3) Middleware 擋路由。你指哪種？」
- **提出更簡單方案**：「你要我為 Quote 加完整 CRUD Router，但目前只有列表頁在用。要不要先只加 `getAll`？」
- **停下來發問**而非猜。

❌ 反模式：看到模糊需求就腦補埋頭寫；發現兩種做法默默選一個；明明有更簡單解法硬要複雜；不確定的技術細節就猜。

🎯 本專案情境：處理 tRPC procedure 前先問權限層級；加 Prisma 欄位前先問要 migration 還是 `db push`；改 i18n 前先確認兩個 locale 都要改（答案通常是「是」）。

### 2.2 Simplicity First ── 極簡優先

**最少代碼解決問題，不投機性擴展。**

```typescript
// 需求:「加一個匯出 CSV 按鈕」
// ✅ 只做匯出 CSV
<Button onClick={exportCSV}>{t('actions.exportCsv')}</Button>
// ❌ 順便加匯出 PDF / Excel / JSON(沒人要求)

// 一次性代碼不抽象
// ❌ 只用一次卻抽 hook:function useFormatBudget(amount) {...}
// ✅ inline:<span>{new Intl.NumberFormat('zh-TW').format(amount)}</span>

// 不為不可能情境加錯誤處理(protectedProcedure 內 session 必有 user)
// ❌ if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });  // 噪音
```

🔍 自檢：「資深工程師會說太複雜嗎？」「200 行是不是 50 行就夠？」「這參數/選項/抽象使用者真的要了嗎？」任一為真 → 重寫。

🎯 本專案情境：不要修 bug 時順便升級該檔到 react-hook-form（那是專案級技術債，獨立處理）；不要為單次使用的邏輯建 helper；不要預先加 i18n key「以防未來」。

### 2.3 Surgical Changes ── 外科手術式修改

**只動必須動的，只清自己製造的殘局。**

```typescript
// 需求:「修 projectRouter.getById 的 N+1」
// ✅ 只加 include 解決
getById: protectedProcedure.input(...).query(async ({ ctx, input }) =>
  ctx.prisma.project.findUnique({
    where: { id: input.id },
    include: { budgetPool: true, manager: true, supervisor: true },  // ← 只加這行
  })),
// ❌ 順便把 .query 改 .mutation、把 z.object 抽成常數、加 error handling
```

- **配合既有風格**：看到檔案用 `useState` 做表單，就延續，別「改進」成 react-hook-form。
- **發現無關死碼 → 提出但不刪**：「順帶一提：`LegacyProjectCard.tsx` 似乎沒人 import，不在本次範圍。」
- **只清自己造成的孤兒**：你把 `helperA()` 展開成 inline 後，移除 `import { helperA }`；但不碰預先存在的死碼。

**測試標準**：Git diff 時，每一行你都能解釋「這跟需求的關係」。解釋不出的就是超範圍。

### 2.4 Goal-Driven Execution ── 目標驅動執行

**定義可驗證的成功標準，循環到通過。**

| 模糊需求 | 可驗證目標 |
|---------|-----------|
| 加驗證 | 寫對無效輸入的測試，讓它過 |
| 修 bug | 寫能重現的測試，讓它過 |
| 重構 X | 重構前後測試都過 |
| 讓它更快 | 量 baseline → 定目標（p95 < 200ms）→ 量 |

多步驟先給計畫（使用者可中途介入）：

```
1. schema 加 OMExpense.notes → 驗證:pnpm db:generate 無錯
2. 更新 omExpense.ts Zod schema → 驗證:pnpm typecheck 過
3. OMExpenseForm 加 notes 欄位 → 驗證:瀏覽器填寫儲存
4. 更新兩 locale notes key → 驗證:pnpm validate:i18n 過
```

**強標準**（可獨立 loop）：`pnpm typecheck` 無錯、Playwright `projects.spec.ts:42` 過。
**弱標準**（需反覆澄清）：「讓它 work」「看起來更好」。

### 2.5 何時可放寬

typo、加 log、更新註解、純文字變更（i18n value/docs）、明確要求快速原型、腳手架樣板。**但即使放寬，Surgical Changes 通常仍應遵守**（「順便改」是破壞信任成本最低的錯誤）。

---

## 3. 協作行為邊界

### 3.1 破壞性操作才需確認

**必須先問**：
- `git push` / `reset --hard` / `push --force` / 刪分支
- 刪或大改 production 程式碼、Prisma migration、CI/CD workflow（`.github/`）
- 對外送出（PR comment、email、第三方上傳）
- `pnpm db:reset` 或直接操作正式 DB

**不需確認**（已對齊 scope 內）：`Read`/`Glob`/`Grep`/唯讀 Bash；計畫中已同意的 `Edit`/`Write`；本地檢查（`typecheck`/`lint`/`validate:i18n`/`db:generate`）。

### 3.2 策略模糊才需先問

**必須先問**：需求多種合理解讀、多個有效方案且取捨影響架構、意圖不明或與紅線衝突（Schema SSOT、業務邏輯只能在 `packages/api`）。
**不需先問**：tool 回傳後同一 scope 的下一步、已同意計畫的後續、可並行的 batch 唯讀查詢。

### 3.3 不可逾越（行為硬規則）

- ❌ 未授權不刪/不關/不跳測試（Playwright E2E 是目前唯一測試層）
- ❌ 未授權不刪 `docs/`、`claudedocs/` 文件
- ❌ 不順手「改善」與需求無關的代碼

---

## 4. 技術紅線（硬規則）

- **Schema 是 SSOT**：`packages/db/prisma/schema.prisma`；改後**必跑** `pnpm db:migrate` + `pnpm db:generate`
- **所有業務邏輯在 `packages/api`**，不可在前端組件
- **所有 tRPC procedure input 必須 Zod 驗證**
- **受保護路由用對 procedure**：`protectedProcedure` / `supervisorProcedure` / `adminProcedure`
- **i18n 雙語同步** + 改前/後 `pnpm validate:i18n`（JSON 重複 key 會靜默覆蓋）
- **錯誤分類用 `code` / `cause.reason` / i18n key**，禁止前端 `err.message.includes()`
- **mutation 按鈕用 `LoadingButton`**，禁止手刻 `{isLoading ? '...' : ...}`
- **Turborepo 指令從根目錄跑**；**永不手改 Prisma Client**；**migrations 不可變**
- **Next.js public 變數須 `NEXT_PUBLIC_` 前綴**

---

## 5. 領域規範詳解

> 依當前任務的檔案路徑，套用對應 `.claude/rules/*.md`。

### 5.1 Frontend（`apps/web/src/app/**`）

頁面模板：

```typescript
/** @fileoverview [Page] - [描述]　@route /[locale]/[path]　@features ... */
import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface PageProps { params: { locale: string; id?: string }; searchParams: Record<string, string | undefined>; }

export default async function PageName({ params }: PageProps) {
  const t = await getTranslations('namespace');
  return <DashboardLayout>{/* 內容 */}</DashboardLayout>;
}
```

路由結構約定：

```
app/[locale]/[feature]/
├── page.tsx          # 列表
├── new/page.tsx      # 建立
└── [id]/
    ├── page.tsx      # 詳情
    └── edit/page.tsx # 編輯
```

- **Server vs Client**：Server Component（預設）用於資料載入/SEO；`'use client'` 用於互動/狀態/tRPC useQuery。**伺服器組件不可用 hooks**。
- **動態 href 必用模板字面量**：`<Link href={\`/projects/${id}\`}>` ✅ ／ `href="/projects/${id}"` ❌
- **Middleware 路由保護**：17 個保護路徑；未登入 redirect `/login`；Layout 層以 `session.user.role.name` 判角色（session 無頂層 roleId）。

**禁止**：頁面組件直接 DB 操作、硬編碼文字、忽略 locale 前綴、伺服器組件用 hooks。

### 5.2 Components（`apps/web/src/components/**`）

分類：`ui/`（原子、無業務邏輯）、`[domain]/`（kebab-case 目錄、PascalCase 組件）、`layout/`。

組件結構模板（順序固定）：

```typescript
'use client';
export function ComponentName({ mode = 'create', initialData, onSuccess }: Props) {
  const t = useTranslations('namespace');          // 1. Translations
  const [formData, setFormData] = useState(...);   // 2. State
  const { data } = api.entity.getAll.useQuery({}); // 3. Queries/Mutations
  const mutation = api.entity.create.useMutation({
    onSuccess: () => toast({ title: t('createSuccess'), variant: 'success' }),
    onError: (e) => toast({ title: t('createError'), description: e.message, variant: 'destructive' }),
  });
  const handleSubmit = useCallback(...);           // 4. Handlers
  return <form onSubmit={handleSubmit}>...</form>; // 5. Render
}
```

條件渲染用 early return：

```typescript
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorState error={error} />;
if (!data) return <NotFound />;
return <DataDisplay data={data} />;
```

**🚨 LoadingButton 規則（FEAT-012）**：任何**觸發 mutation 的按鈕**，loading 狀態**必須**用 `@/components/ui/loading/LoadingButton`，禁止手刻 `{isLoading ? '...' : t('submit')}`。

```typescript
// ✅
<LoadingButton type="submit" isLoading={mutation.isLoading} loadingText={t('submitting')}>
  {t('submit')}
</LoadingButton>
// ❌ 手刻 '...'、❌ 手刻 Spinner+disabled、❌ 只 disabled 沒視覺回饋
```

純導航/開關 dialog 按鈕不受此限。

**禁止**：UI 組件含業務邏輯、硬編碼文字、表單不處理載入/錯誤、內聯箭頭函數（效能）、混用命名約定。

### 5.3 UI Design System（`apps/web/src/components/ui/**`）

基於 shadcn/ui + Radix，41+ 組件，支援 Light/Dark。

- **Button variants**：`default / destructive / outline / ghost / link`；sizes `sm / default / lg`
- **條件樣式用 `cn()`**：`cn('px-4', variant === 'primary' && 'bg-blue-600', disabled && 'opacity-50')`
- **主題用 CSS 變數**：`bg-background text-foreground`、`bg-card`、`border-border`
- **載入系統**：`Spinner`（獨立指示器）、`LoadingButton`（按鈕）、`LoadingOverlay`（區域遮罩）、`GlobalProgress`（頂部進度條）

**可做**：`className` 調樣式、`cn()` 合併、擴展 variants、包裝組合組件。
**不可做**：改 `ui/` 核心邏輯、刪 ARIA 屬性、移除主題支援。

### 5.4 Backend API（`packages/api/src/**`）── 17 Routers / 200 Procedures

Router 模板：

```typescript
/** @fileoverview [Entity] Router @module api/routers/[entity] @features ... @procedures ... */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure, adminProcedure } from '../trpc';

export const entityStatusEnum = z.enum(['Draft', 'Active', 'Completed']);
export const createEntitySchema = z.object({ name: z.string().min(1, '名稱不可為空') });

export const entityRouter = createTRPCRouter({
  create: protectedProcedure.input(createEntitySchema).mutation(async ({ ctx, input }) =>
    ctx.prisma.entity.create({ data: input })),
  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const e = await ctx.prisma.entity.findUnique({ where: { id: input.id }, include: {} });
    if (!e) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entity not found' });
    return e;
  }),
});
```

- **命名**：檔案 camelCase（`budgetPool.ts`）；導出 `[entity]Router`、`create/update[Entity]Schema`、`[entity]StatusEnum`。
- **Procedure 類型**：`protectedProcedure`（登入）、`supervisorProcedure`（Supervisor/Admin）、`adminProcedure`（Admin）。
- **錯誤處理**：用 `TRPCError` + `code`（`NOT_FOUND`/`FORBIDDEN`/`BAD_REQUEST`/`INTERNAL_SERVER_ERROR`），訊息清晰不洩漏系統資訊。

**🚨 錯誤分類規則**：同一 procedure 拋多種前端需區分的錯誤時，**必須**用不同 `code` 或 `cause` 帶穩定識別碼，**禁止**讓前端 `err.message.includes()` 比對（後端改字會靜默失效）。

```typescript
// 方案 A(推薦):cause 帶識別碼
throw new TRPCError({ code: 'BAD_REQUEST', message: 'Current password is incorrect',
  cause: { reason: 'INVALID_CURRENT_PASSWORD' } });
// 前端:const reason = (err.data?.cause as {reason?:string})?.reason; switch(reason){...}

// 方案 B:後端直接拋 i18n key
throw new TRPCError({ code: 'BAD_REQUEST', message: 'errors.invalidCurrentPassword' });
// 前端:toast({ title: t(err.message) })
```

- **Transaction**：多表操作用 `ctx.prisma.$transaction(async (tx) => {...})`，含 History 審計記錄。
- **分頁**：`page`/`limit`（max 100）/`search`/`sortBy`/`sortOrder`；`Promise.all([findMany, count])`；回 `{ items, total, page, limit, totalPages }`。

**新增 Router 檢查清單**：建檔 → Zod schema → 標準 CRUD → 業務 procedures → `root.ts` 註冊 → JSDoc → 錯誤處理 → 權限 → 關鍵操作記 History → 測試。

**禁止**：前端直接呼叫 Prisma、回未過濾 DB 錯誤、忽略權限、用 `any` 繞 TS、query 做副作用（應 mutation）、硬編碼中文錯誤訊息。

### 5.5 Database（`packages/db/prisma/**`）── 32 Models / 94 索引

- **ID/時間戳**：`id String @id @default(uuid())`、`createdAt DateTime @default(now())`、`updatedAt DateTime @updatedAt`
- **外鍵命名**：`[model]Id`；同 model 多關係用具名 `@relation("ProjectManager")`
- **級聯策略**：`Cascade`（刪父刪子）、`Restrict`（有關聯禁刪）、`SetNull`（外鍵須可選）、`NoAction`
- **索引**：外鍵必加 `@@index`；狀態/排序欄位加索引；唯一用 `@unique`
- **枚舉用 String + API 層 Zod enum**，不用 Prisma enum（遷移困難）
- **金額用 Float**（除非需高精度用 `Decimal @db.Decimal(15,2)`）；長文字 `@db.Text`；時區 UTC

**遷移流程**：改 schema → `pnpm db:migrate`（生成 SQL + 應用 + 生成 Client）→ 或 `pnpm db:push`（快速同步不建遷移，僅 dev）。生產：`pnpm prisma migrate deploy`。

> ⚠️ **Schema 漂移警示**：用 `db push` 改了 dev DB 卻沒進 schema/migration/commit，會造成「DB 與程式碼不一致」的漂移，進而出現 NOT NULL 欄位含 NULL、include 關聯回 null 等髒資料導致的 runtime 崩潰。**規則就是為了避免這個**：Schema 是 SSOT，任何結構改動都要走 `db:migrate` + commit；實驗性 `db push` 用完要嘛正式化、要嘛清乾淨。

**Status Flows**（常備記憶）：

- BudgetProposal：`Draft → PendingApproval → Approved/Rejected/MoreInfoRequired`
- Expense：`Draft → PendingApproval → Approved → Paid`

**禁止**：直接改 `migrations/`、手改 Prisma Client。

### 5.6 i18n（`apps/web/src/messages/**`）── en + zh-TW

- **Key 命名**：`namespace.category.subcategory.field.property`，如 `projects.form.name.label`、`common.actions.save`。

```typescript
// 客戶端:const t = useTranslations('projects'); t('form.title')
// 伺服器:const t = await getTranslations('projects');
// 參數:t('welcome', { name: 'John' })   ← "歡迎，{name}！"
// 複數:t('items', { count: 5 })          ← "{count, plural, =0 {沒有} =1 {1 個} other {# 個}}"
```

**🚨 四大陷阱**：

1. **重複 key**：JSON 後者覆蓋前者 → 同名物件必須合併
2. **兩檔不同步**：`en.json`/`zh-TW.json` 必須相同 key 結構 → `pnpm validate:i18n`
3. **硬編碼中文**：`<Button>儲存</Button>` ❌ → `{t('actions.save')}` ✅
4. **用不存在的 key**：會 IntlError → 用前先確認 key 存在

**AI 加新 key 流程**：① 同時更新兩檔 → ② `pnpm validate:i18n` → ③ 再用 `t('...')`。

> ⚠️ **重要 gotcha**：`validate:i18n` **只比對雙語結構，不檢查程式引用的 key 是否存在**；錯誤的 key 路徑只在運行期報 IntlError，需瀏覽器/E2E 驗證。

### 5.7 TypeScript（`**/*.ts(x)`）

- **interface 定物件結構**（推薦），**type 定聯合/條件類型**
- **命名**：Interface/Type/Enum/組件 PascalCase；常數 `UPPER_SNAKE_CASE`；變數/函數 camelCase
- **type-only import**：`import type { User } from '@/types'`
- **禁 `any`**：用具體類型或 `unknown` + type guard（`function isUser(v): v is User {...}`）
- **禁過度非空斷言 `!`**：用條件檢查或 `?.` / `??`
- **Zod 推導類型**：`export type CreateUserInput = z.infer<typeof createUserSchema>`
- **Prisma 類型**：`Prisma.UserGetPayload<{include:{projects:true}}>`、`Prisma.UserWhereInput`
- **工具類型**：`Partial` / `Pick` / `Omit` / `Record`

**禁止**：`any`、`@ts-ignore`、`as unknown as T` 強轉、`Function` 類型。

### 5.8 Scripts（`scripts/**`）── 40 個腳本

- **命名**：`[動詞]-[對象]-[修飾].js`（`check-` / `fix-` / `add-` / `generate-` / `validate-` / `test-` / `run-`）
- **輸出 emoji 狀態**：`✅` 成功 / `❌` 錯誤（用 `console.error`）/ `⚠️` 警告 / `📋` 資訊 / `🔍` 進行中
- **exit code**：0 成功 / 1 失敗；`async/await`；絕對路徑；支援 `--help`
- **禁止**：硬編碼絕對路徑、忽略錯誤、用 `console.log` 輸出重要錯誤、改生產資料（除非明示）

### 5.9 Documentation（`claudedocs/**`, `docs/**`, `*.md`）

- **claudedocs 結構**：`1-planning/`（architecture/epics/features/roadmap）、`2-sprints/`、`3-progress/`、`4-changes/`（bug-fixes/feature-changes/i18n）、`5-analysis/`、`6-ai-assistant/`
- **命名**：`FEAT-{NNN}-{name}.md` / `CHANGE-{NNN}-*.md` / `FIX-{NNN}-*.md`；週報 `{YYYY}-W{WW}.md`
- **模板**：FEAT（概述/需求/技術設計/影響範圍/進度）、FIX（問題描述/重現步驟/根本原因/解決方案/修改檔案/測試驗證）
- **JSDoc**：組件 `@fileoverview @component @features`；函數 `@param @returns @example`；Router `@module @features @procedures`
- **禁止**：錯誤目錄建檔、不一致命名、遺漏必要章節、硬編碼日期（用 YYYY-MM-DD）、留過時文檔

---

## 6. 開發工作流（權威：`03-dev-workflow.md`）

> ⚠️ 本專案**實際流程**與舊 `CONTRIBUTING.md` 的 GitFlow **不同**。以下是「實際在跑」的現行標準。

### 五步流程

```
① 分類並提案 → ② 寫規劃文件 → ③ 按 .claude/rules 實作 → ④ /itpm:pre-commit 驗證 → ⑤ /itpm:push 推送
```

- **① 分類並提案**：「我判斷這是 [Feature/Change/Bug-fix/Trivial]，建議走 X workflow，先準備 [規劃文件]。OK？」
- **② 寫規劃文件**：用 `documentation.md` 模板，放對位置（見下表）。
- **③ 實作**：遵循領域規則 + Karpathy + 紅線。
- **④ 驗證**：`/itpm:pre-commit`（敏感檔檢查 → validate:i18n → typecheck → lint → check:claude-sync）；涉核心流程另跑 E2E。
- **⑤ 推送**：逐檔 `git add` → Conventional Commits → 同步 LOG → `git push origin main`（需確認）。

### 任務分類與規劃文件位置

| 類型 | 觸發 | 位置 | 同步記錄 |
|------|------|------|---------|
| **FEAT-NNN** | 新功能/模組/Epic | `claudedocs/1-planning/features/FEAT-{NNN}-{name}/`（**資料夾**：01-requirements / 02-technical-design / 03-implementation-plan / 04-progress） | `DEVELOPMENT-LOG.md` |
| **CHANGE-NNN** | 改行為/加選項 | `claudedocs/4-changes/feature-changes/CHANGE-{NNN}-*.md`（單檔） | `DEVELOPMENT-LOG.md` |
| **FIX-NNN** | 壞了/fail/regression | `claudedocs/4-changes/bug-fixes/FIX-{NNN}-*.md`（單檔） | `FIXLOG.md` |
| **Trivial** | typo/rename/註解（<30min） | 無需文件 | — |

**目前編號**（接續用下一個，以 `FIXLOG.md`/對應目錄為權威）：**FIX ~139 ｜ CHANGE ~041（實際 ~044 進行中）｜ FEAT ~013/014**。配號前先查最大號避免撞號。

> 📌 已知不一致：FEAT-013 偏離標準放在 `4-changes/` 單檔；新 FEAT 建議回 `1-planning/features/` 資料夾。

---

## 7. Commit / 分支 / 推送

- **Commit**：`type(scope): 繁體中文描述` + 任務編號，如 `fix(proposal): 修復下拉只顯示 20 個 (FIX-139)`。type：`feat/fix/docs/refactor/chore/perf/test`。AI 產生附 co-author trailer。
- **分支（現行：直接 `main`）**：單人/AI 快速迭代直接在 main。**何時開 branch**：(a) 多人協作同塊；(b) 高風險大改（migration/認證/大重構）要可回滾；(c) 實驗 spike。開 branch 前先問。
- **暫存**：逐檔 `git add`，**不用 `git add .`**。

> 💡 多 session 並行時，**共用檔案**（如 `en.json`/`zh-TW.json`）可能同時含多個任務的改動。commit 時要用 hunk 級只挑自己的 hunk，避免把別人未完成的 WIP 一起掃進來。

---

## 8. 驗證與測試

| 項目 | 做法 | 指令 |
|------|------|------|
| TypeScript | 必跑 | `pnpm typecheck` |
| Lint | 必跑 | `pnpm lint`（`lint:fix` 修復） |
| i18n 一致性 | 改翻譯時必跑 | `pnpm validate:i18n` |
| CLAUDE.md ↔ 統計 | 警告級 | `pnpm check:claude-sync` |
| **E2E（唯一測試層）** | 涉核心流程跑 | `pnpm test`（Playwright，6 spec） |
| 單元/元件（Jest+RTL） | **尚未實作** | — |

一鍵：`/itpm:pre-commit`。

**⚠️ Baseline gotchas**：

- `pnpm lint` 全專案 baseline 本身即 exit 1 → 驗證單檔改動改用 `npx next lint --file <path>`（在 `apps/web` 下）
- `pnpm typecheck` 可能因**他人進行中的 WIP**（未閉合 JSX 等）而紅 → 確認錯誤是否指向你改的檔案；不指向＝你的改動乾淨
- next-auth augmentation 須為 module；`@auth/core` override；turbo 在 api 失敗時會跳過 web typecheck
- dev server 背景啟動用 `pnpm --filter web dev`（非 `turbo run dev`，後者留孤兒進程）

---

## 9. 指令與跨電腦 ITPM Slash Commands

**日常**：`pnpm dev` / `pnpm dev --filter=web` / `pnpm db:studio` / `pnpm db:migrate` / `pnpm db:generate` / `pnpm setup` / `pnpm check:env` / `pnpm index:health`

**跨電腦工作流**（支援兩台電腦切換）：

| 指令 | 時機 |
|------|------|
| `/itpm:sync` | 切到另一台：拉代碼、裝依賴、同步 DB、啟服務 |
| `/itpm:status` | 隨時查 Git/Docker/DB/Dev Server |
| `/itpm:pre-commit` | 提交前品質檢查 |
| `/itpm:push` | 離開前提交推送 |
| `/itpm:init` | 全新電腦首次設置 |
| `/itpm:refresh-stats` | 輕量更新 SUMMARY.md |
| `/itpm:refresh-codebase-analysis` | 完整重跑深度分析 |

**典型流程**：
```
電腦 A 開始 → /itpm:sync
開發中檢查 → /itpm:status
準備提交   → /itpm:pre-commit
離開前推送 → /itpm:push
電腦 B 開始 → /itpm:sync
```

---

## 10. 暫緩條款

以下條款**寫在文件中但現行不執行**，保留不刪，標註恢復條件：

| 暫緩條款 | 出處 | 現況 | 恢復條件 |
|---------|------|------|---------|
| Issue → branch → PR → Review → Squash | `CONTRIBUTING.md` | 直接推 main | 團隊 >1 人 |
| main 禁 push、2 人批准、GitFlow 多層 | Git workflow 文件 | 不適用（該文件是**設計系統遷移專案專用**） | 同規模大型遷移時 |
| 單元 80% + 元件 60%（Jest+RTL） | `CONTRIBUTING.md` | 只有 Playwright | 導入 Jest+RTL 後 |
| GitHub Actions CI 作 PR gate | `CONTRIBUTING.md` | 本地 pre-commit 取代 | 恢復 PR 流程時 |

**仍有效**的 `CONTRIBUTING.md`：Conventional Commits、TS/命名/Import 規範、Code Review 留言前綴（`[MUST]`/`[SHOULD]`/`[NITS]`）。

---

## 11. 環境、測試帳號、常見陷阱

**Docker 服務（非標準 port）**：PostgreSQL **5434**（非 5432）、Redis **6381**、Mailhog SMTP 1025 / UI 8025。

**初始化注意**：`db:seed` **必跑**（否則 Sidebar 空白）；`NEXTAUTH_URL` port 須與實際一致；跨電腦後清瀏覽器 cookies；勿用 shell 直接更新密碼（`$` 會被轉義）。

**測試帳號**（種子建立）：

| 角色 | Email | 密碼 | 權限 |
|------|-------|------|------|
| Admin | `admin@itpm.local` | `admin123` | 全部 18 項 |
| ProjectManager | `pm@itpm.local` | `pm123456` | 11 項核心 |
| Supervisor | `supervisor@itpm.local` | `supervisor123` | 17 項（除用戶管理） |

**常見 gotchas**：Turborepo 快取異常 `pnpm turbo clean`；改 schema 後 `db:generate`；改 API 後重啟 TS server；查 port 衝突 `netstat -ano | findstr :300`；dev 信件看 Mailhog UI（http://localhost:8025）。

---

## 12. 文件導航（中樞）

| 主題 | 文件 |
|------|------|
| 高層導航/紅線/指令 | `CLAUDE.md`（根） |
| AI 行為態度 | `.claude/rules/karpathy-guidelines.md` |
| 領域編碼規範 | `.claude/rules/{frontend,components,ui-design-system,backend-api,database,i18n,typescript,scripts,documentation}.md` |
| FEAT/CHANGE/FIX 模板與目錄 | `.claude/rules/documentation.md` + `claudedocs/CLAUDE.md` |
| Commit/命名/Review | `CONTRIBUTING.md`（部分暫緩，見 §10） |
| 精確統計與架構 | `docs/codebase-analyze/SUMMARY.md` + `02..11/` |
| 開發工作流（權威） | `docs/10-ai-assistant/03-dev-workflow.md` |
| Session 起手/結尾 | `docs/10-ai-assistant/01-session-start.md`、`02-compact-session.md` |
| 開發歷史 | `DEVELOPMENT-LOG.md`、`FIXLOG.md` |

---

**本檔定位**：單一速查（onboarding / 全貌快覽）。深入細節與最新數字，一律回到 §12 對應來源檔。
