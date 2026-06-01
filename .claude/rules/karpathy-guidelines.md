# Karpathy Guidelines - AI 編碼行為準則（完整版）

---
applies_to:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.prisma"
---

## 概述

此規則是 [Andrej Karpathy 對 LLM 編碼陷阱的觀察](https://x.com/karpathy/status/2015883857489522876)的完整版。
**CLAUDE.md** 中已有精簡版 — 這裡是帶範例、反模式、和本專案情境化應用的**完整參考**。

**適用範圍**：所有代碼相關任務 — 寫新功能、審查 PR、修 bug、重構。
**取捨**：偏向「謹慎」而非「速度」。若任務確實瑣碎（如改 typo、加 log），可用判斷力放寬。

---

## 1. Think Before Coding — 先思考再動手

**核心**：不假設、不隱藏困惑、浮現 tradeoffs。

### ✅ 好的做法

**明確陳述假設**：
```
「我假設 OMExpense 的刪除應該 cascade 刪除所有 OMExpenseItem
（因為 schema.prisma 中 onDelete: Cascade）。若此假設錯誤請告知。」
```

**呈現多種解讀**：
```
「『加權限檢查』可能有三種意思：
 1. 在 tRPC procedure 層加 supervisorProcedure
 2. 在前端 Sidebar 過濾不顯示
 3. 在 Middleware 層擋路由
你指的是哪一種？或全部都要？」
```

**提出更簡單的替代方案**：
```
「你要求我為 Quote 模型加一個完整的 CRUD Router，
但看起來目前只有列表頁在用（detail/create/edit 都沒實作）。
要不要我先只加 getAll procedure，其他等真的需要時再加？」
```

**停下來發問**：
```
「我不確定 `expense.getStats` 應該用哪個 status 值。
 schema 裡看到 'PendingApproval'，但 codebase 分析報告說這是個已知 bug
（10-issues-and-debt/code-bugs.md）。你希望我：
 (a) 保持現況，還是 (b) 同時修這個 bug？」
```

### ❌ 反模式

- 看到模糊需求就自行腦補並埋頭寫
- 發現兩種合理做法，默默選一個不告知
- 明明有更簡單解法，為了「看起來更專業」堅持複雜方案
- 遇到不確定的技術細節（API 行為、資料結構）就猜一個

### 本專案情境

- **處理 tRPC procedure 前**：先問權限層級（`protectedProcedure` / `supervisorProcedure` / `adminProcedure`）
- **加新 Prisma 欄位前**：先問是否需要 migration 還是 `db push` 即可
- **改 i18n 前**：先問是否兩個 locale 都要改（依 `.claude/rules/i18n.md`，答案通常是「是」）

---

## 2. Simplicity First — 極簡優先

**核心**：最少代碼解決問題。不投機性擴展。

### ✅ 好的做法

**只做被要求的**：
```typescript
// 需求：「加一個『匯出 CSV』按鈕」

// ✅ 好：只做匯出 CSV
<Button onClick={exportCSV}>{t('actions.exportCsv')}</Button>

// ❌ 壞：順便加了匯出 PDF / Excel / JSON（沒人要求）
```

**一次性代碼不抽象**：
```typescript
// ❌ 壞：只用一次但硬要抽 hook
function useFormatBudget(amount: number) { ... }

// ✅ 好：inline
<span>{new Intl.NumberFormat('zh-TW').format(amount)}</span>
```

**不加沒被要求的 config**：
```typescript
// 需求：「加一個 Debounce」

// ❌ 壞：變成可配置的
function useDebounce<T>(value: T, delay: number = 500, options?: { leading?: boolean, trailing?: boolean }) { ... }

// ✅ 好：只做被要的
function useDebounce<T>(value: T, delay: number) { ... }
```

**不為不可能的情境加錯誤處理**：
```typescript
// 在 protectedProcedure 裡
const user = await ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } });

// ❌ 壞：session 存在就一定有 user，這個檢查是噪音
if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

// ✅ 好：相信上游（tRPC middleware 已驗證）
// 直接用 user
```

### 🔍 自檢問題

寫完一段代碼後自問：
- 「資深工程師看到會不會說『這太複雜了』？」
- 「這 200 行是不是其實 50 行就夠？」
- 「我加的這個參數/選項/抽象，使用者真的要了嗎？」

若任一答案是「是 / 否」，**重寫**。

### 本專案情境

- 不要在修一個 bug 時順便「升級」該檔案到 react-hook-form（CLAUDE.md 已明確指出「表單處理不一致」是**專案級技術債務**，應獨立處理）
- 不要為單次使用的業務邏輯建 helper（`packages/api/src/lib/` 只放真的跨 router 共用的東西）
- 不要預先加 i18n key 到多個 namespace「以防未來要用」

---

## 3. Surgical Changes — 外科手術式修改

**核心**：只動必須動的。只清理自己製造的殘局。

### ✅ 好的做法

**嚴格限定變更範圍**：
```typescript
// 需求：「修 projectRouter.getById 的 N+1 問題」

// ✅ 好：只加 include 解決 N+1
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    return ctx.prisma.project.findUnique({
      where: { id: input.id },
      include: { budgetPool: true, manager: true, supervisor: true }, // ← 只加這行
    });
  }),

// ❌ 壞：順便改了 .query → .mutation（違反語意），
// 順便把 z.object 換成 Zod Schema 常數，
// 順便加了 error handling
```

**配合既有風格**：
```typescript
// 看到檔案裡用 useState 做表單
const [name, setName] = useState('');

// ❌ 壞：「改進」成 react-hook-form（即使更好）
// ✅ 好：延續 useState 風格
```

**發現無關死碼 → 提出但不刪**：
```
「順帶一提：`apps/web/src/components/old/LegacyProjectCard.tsx` 看起來沒人 import。
 不在這次變更範圍內，但之後可能想清理。」
```

### ✅ 需要清理的情境

**只清理 YOUR 變更造成的孤兒**：
```typescript
// 你把 foo() 內部邏輯從 util 移到 inline
// 原本：
import { helperA } from './utils';
function foo() { return helperA() + 1; }

// 變更後：
function foo() { return (x * 2) + 1; }  // helperA 被展開
// ← 必須移除 import { helperA }（你的變更造成的孤兒）
```

### ❌ 反模式

- 修 bug 時順便調整變數命名（「反正都在看這個檔案」）
- 改 tRPC procedure 時順便重新格式化整個 router
- 看到舊的 `onDelete: NoAction` 就改成 `Cascade`（即使更一致，但不在需求範圍）
- 發現兩個檔案用不同引號風格，逼自己統一

### 測試標準

**每一行改動都應能直接追溯到使用者的請求。**

Git diff 時，若有一行你解釋不出「這跟需求的關係」，就是超出範圍。

### 本專案情境

- 修 `packages/api/src/routers/expense.ts` 的某個 bug → 不要順便改其他 procedure
- 更新一個翻譯 key → 不要順便重排 `zh-TW.json` 的結構
- 改 Prisma schema → 不要順便重新組織 model 順序

---

## 4. Goal-Driven Execution — 目標驅動執行

**核心**：定義可驗證的成功標準。循環直到驗證通過。

### ✅ 轉化為可驗證目標

| 模糊需求 | 可驗證目標 |
|---------|-----------|
| 「加驗證」 | 寫出對無效輸入的測試，讓它們通過 |
| 「修 bug」 | 寫出能重現的測試，讓它通過 |
| 「重構 X」 | 重構前後測試都通過 |
| 「讓它更快」 | 量測 baseline → 定義目標（e.g. p95 < 200ms）→ 量測 |
| 「改善 UX」 | 列出具體可見的變化（X 按鈕可見、Y 錯誤訊息顯示） |

### ✅ 多步驟任務先給計畫

```
1. 在 schema.prisma 加 OMExpense.notes 欄位 → 驗證：pnpm db:generate 無錯誤
2. 更新 omExpense.ts 的 create/update Zod Schema → 驗證：pnpm typecheck 通過
3. 在 OMExpenseForm.tsx 加 notes 欄位 → 驗證：瀏覽器手動測試填寫儲存
4. 更新 i18n 兩個 locale 的 notes key → 驗證：pnpm validate:i18n 通過
```

計畫的好處：**使用者可在任何步驟介入調整**，而不是等你全做完才發現方向錯。

### ✅ 強 vs. 弱 成功標準

**弱標準**（需要反覆澄清）：
- 「讓它 work」
- 「讓它看起來更好」
- 「修復問題」

**強標準**（可獨立 loop 到通過）：
- 「`pnpm typecheck` 和 `pnpm lint` 無錯誤」
- 「Playwright 測試 `projects.spec.ts:42` 通過」
- 「在瀏覽器 `/projects/new` 填表送出，資料庫新增一筆 Project record」
- 「`pnpm validate:i18n` 報告 zh-TW 和 en 的 key 數量相等」

### ❌ 反模式

- 只說「完成了」，沒有量化驗證
- 宣稱「測試通過」但實際沒跑
- 多步驟任務埋頭做到最後，中間不 report progress
- 用「應該能 work」替代「我驗證了」

### 本專案特有驗證命令

```bash
pnpm typecheck           # TypeScript 類型檢查
pnpm lint                # ESLint
pnpm validate:i18n       # i18n key 一致性
pnpm check:env           # 環境配置（15+ 檢查點）
pnpm index:health        # AI navigation index 健康度
pnpm db:generate         # Prisma Client 重新生成
pnpm test                # Playwright E2E
```

**改代碼後的基本循環**：
```
修改 → pnpm typecheck → pnpm lint → 手動/自動測試對應功能
```

---

## 🔗 與其他規則的關係

- **此規則是 meta-rule**：所有其他規則（`typescript.md`, `backend-api.md` 等）是「**怎麼做**」的細節，本規則是「**做的態度**」
- **衝突處理**：若本規則與其他規則衝突，優先遵守其他規則的技術規範，但保留本規則的**行為態度**（謹慎、聚焦、可驗證）

---

## ⚖️ 何時可以放寬

這些準則偏向「謹慎 > 速度」。以下情境可用判斷力放寬：

- 改 typo、加日誌、更新註解
- 純文字變更（i18n key value、docs 文字）
- 使用者明確要求「快速原型」、「實驗性代碼」
- 腳手架生成的樣板代碼（e.g. `shadcn-ui add`）

但即使放寬，**Surgical Changes** 原則通常仍應遵守 — 不是因為它最重要，而是因為「順便改」是破壞信任成本最低的錯誤。

---

## 相關規則
- `.claude/rules/typescript.md` - TypeScript 技術約定
- `.claude/rules/backend-api.md` - tRPC 業務邏輯規範
- `.claude/rules/components.md` - React 組件規範
- `CLAUDE.md` - 精簡版準則（4 條核心原則）
