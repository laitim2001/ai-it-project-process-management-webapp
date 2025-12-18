# Documentation Rules - 文檔規範

---
applies_to:
  - "claudedocs/**"
  - "docs/**"
  - "**/*.md"
---

## 概述
此規則適用於所有專案文檔，包括 AI 助手生成的文檔（claudedocs/）和技術文檔（docs/）。

## ClaudeDocs 目錄結構

```
claudedocs/
├── 1-planning/              # 規劃文檔
│   ├── architecture/        # 架構設計
│   ├── epics/               # Epic 規劃
│   ├── features/            # Feature 規劃 (FEAT-*)
│   └── roadmap/             # 產品路線圖
│
├── 2-sprints/               # Sprint 文檔
│   └── testing-validation/  # 測試驗證
│
├── 3-progress/              # 進度追蹤
│   ├── daily/               # 每日進度
│   └── weekly/              # 每週進度報告
│
├── 4-changes/               # 變更記錄
│   ├── bug-fixes/           # Bug 修復 (FIX-*)
│   ├── feature-changes/     # Feature 變更 (CHANGE-*)
│   └── i18n/                # 國際化變更
│
├── 5-analysis/              # 分析報告
│   └── code-review/         # 代碼審查
│
└── 6-ai-assistant/          # AI 助手相關
    ├── prompts/             # 提示詞範本
    └── workflows/           # 工作流程指南
```

## 文檔命名約定

### 規劃文檔
```
FEAT-{NNN}-{feature-name}.md           # 功能規劃
FEAT-{NNN}-{feature-name}-PLAN.md      # 實施計劃
FEAT-{NNN}-{feature-name}-PROGRESS.md  # 進度追蹤
```

### 變更記錄
```
FIX-{NNN}-{description}.md             # Bug 修復
CHANGE-{NNN}-{description}.md          # 功能變更
```

### 進度報告
```
{YYYY}-W{WW}.md                        # 週報 (例: 2025-W49.md)
{YYYY}-{MM}-{DD}.md                    # 日報
```

## 文檔格式範本

### Feature 規劃 (FEAT-*)
```markdown
# FEAT-{NNN}: {Feature Name}

## 概述
{功能描述}

## 需求
- [ ] 需求 1
- [ ] 需求 2

## 技術設計
{設計細節}

## 影響範圍
- **模型**: {models}
- **API**: {routers}
- **頁面**: {pages}
- **組件**: {components}

## 進度
- [ ] Phase 1: ...
- [ ] Phase 2: ...

## 相關文件
- {相關連結}
```

### Bug 修復 (FIX-*)
```markdown
# FIX-{NNN}: {Bug Description}

## 問題描述
{問題描述}

## 重現步驟
1. {步驟 1}
2. {步驟 2}

## 根本原因
{原因分析}

## 解決方案
{修復方式}

## 修改的檔案
- `path/to/file.ts` - {修改說明}

## 測試驗證
- [ ] 驗證項目 1
- [ ] 驗證項目 2
```

### 週報格式
```markdown
# {YYYY}-W{WW} 週報

## 本週完成
- {完成項目列表}

## 進行中
- {進行中項目}

## 下週計劃
- {計劃項目}

## 問題與阻礙
- {問題列表}

## 數據統計
| 指標 | 數值 |
|------|------|
| 完成任務 | N |
| 修復 Bug | N |
```

## Markdown 格式規範

### 標題層級
```markdown
# 一級標題（文檔標題）
## 二級標題（主要章節）
### 三級標題（子章節）
#### 四級標題（細項）
```

### 程式碼區塊
```markdown
<!-- 指定語言 -->
```typescript
const user: User = { id: '1', name: 'John' };
```

<!-- 終端命令 -->
```bash
pnpm install
pnpm dev
```

<!-- 檔案路徑 -->
```
apps/web/src/app/[locale]/page.tsx
```
```

### 表格格式
```markdown
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | string | UUID |
| name | string | 名稱 |
```

### 任務清單
```markdown
- [ ] 待完成項目
- [x] 已完成項目
```

### 強調與連結
```markdown
**粗體文字**
*斜體文字*
`行內程式碼`

[連結文字](URL)
[相對連結](./other-file.md)
```

## JSDoc 文檔標準

### 組件文檔
```typescript
/**
 * @fileoverview ProjectForm - 專案表單組件
 * @component ProjectForm
 * @features
 * - 建立/編輯模式切換
 * - 表單驗證
 * - tRPC mutation 整合
 * @dependencies
 * - @/components/ui/button
 * - @/lib/trpc
 * @related
 * - apps/web/src/app/[locale]/projects/new/page.tsx
 * - packages/api/src/routers/project.ts
 */
```

### 函數文檔
```typescript
/**
 * 計算預算使用率
 * @param budgetPool - 預算池物件
 * @returns 使用率百分比 (0-100)
 * @example
 * const rate = calculateBudgetUtilization(pool);
 * console.log(`${rate}%`);
 */
function calculateBudgetUtilization(budgetPool: BudgetPool): number {
  return (budgetPool.usedAmount / budgetPool.totalAmount) * 100;
}
```

### API 路由文檔
```typescript
/**
 * @fileoverview Project Router - 專案管理 API
 * @module api/routers/project
 * @features
 * - CRUD 操作
 * - 專案狀態管理
 * @procedures
 * - create: 建立專案
 * - update: 更新專案
 * - delete: 刪除專案
 * - getById: 取得單一專案
 * - getAll: 取得專案列表（分頁）
 */
```

## 語言規範

### 代碼語言
- **代碼**: 使用英文（變數名、函數名、類名）
- **註釋**: 業務邏輯用繁體中文，技術術語可用英文

### 文檔語言
- **用戶文檔**: 繁體中文
- **技術規格**: 繁體中文為主，英文術語保留
- **Commit 訊息**: 繁體中文 + conventional commit 格式

### 範例
```typescript
// ✅ 好的範例：英文代碼 + 中文註釋
function calculateBudgetUtilization(budgetPool: BudgetPool): number {
  // 計算預算池使用率：已使用金額 / 總金額
  return (budgetPool.usedAmount / budgetPool.totalAmount) * 100;
}

// ❌ 避免：中文變數名
function 計算預算使用率(預算池: BudgetPool): number { ... }
```

## 新增文檔檢查清單

- [ ] 確定文檔類型和目錄
- [ ] 使用正確的命名約定
- [ ] 遵循格式範本
- [ ] 添加必要的元數據（日期、作者）
- [ ] 更新相關索引文件
- [ ] 檢查連結有效性

## 禁止事項

1. ❌ **禁止在錯誤目錄創建文檔**
2. ❌ **禁止使用不一致的命名格式**
3. ❌ **禁止遺漏必要的文檔章節**
4. ❌ **禁止硬編碼日期**（使用 YYYY-MM-DD 格式）
5. ❌ **禁止留下過時的文檔**（及時更新或標記為過時）

## 相關規則
- `i18n.md` - 國際化語言規範
