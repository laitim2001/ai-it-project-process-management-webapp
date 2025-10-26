# 設計系統遷移與一致性維護計劃

**創建日期：** 2025-10-03
**狀態：** 執行中
**目標：** 將新設計系統應用到整個項目，並確保未來開發的一致性

---

## 📋 目錄

1. [現狀分析](#1-現狀分析)
2. [遷移策略](#2-遷移策略)
3. [執行計劃](#3-執行計劃)
4. [一致性維護機制](#4-一致性維護機制)
5. [開發規範](#5-開發規範)
6. [質量保證](#6-質量保證)

---

## 1. 現狀分析

### 1.1 現有頁面清單

**已存在的頁面（需要遷移）：**

```
✅ 需要保留並遷移：
├── /dashboard                    - Dashboard 主頁
├── /login                        - 登入頁面
├── /projects                     - 專案列表
│   ├── /projects/new             - 新增專案
│   ├── /projects/[id]            - 專案詳情
│   └── /projects/[id]/edit       - 編輯專案
├── /proposals                    - 提案列表
│   ├── /proposals/new            - 新增提案
│   ├── /proposals/[id]           - 提案詳情
│   └── /proposals/[id]/edit      - 編輯提案
├── /budget-pools                 - 預算池列表
│   ├── /budget-pools/new         - 新增預算池
│   ├── /budget-pools/[id]        - 預算池詳情
│   └── /budget-pools/[id]/edit   - 編輯預算池
└── /users                        - 用戶列表
    ├── /users/new                - 新增用戶
    ├── /users/[id]               - 用戶詳情
    └── /users/[id]/edit          - 編輯用戶

🆕 新原型頁面：
└── /dashboard-prototype          - 新設計原型（作為參考）
```

**總計：** 19 個頁面需要遷移

### 1.2 現有元件清單

**舊設計系統元件（需要替換或更新）：**

```
❌ 需要替換的舊元件：
├── components/ui/
│   ├── Button.tsx                - 舊按鈕元件
│   ├── Input.tsx                 - 舊輸入框元件
│   ├── Select.tsx                - 舊選擇器元件
│   ├── Pagination.tsx            - 舊分頁元件
│   ├── LoadingSkeleton.tsx       - 舊骨架屏元件
│   └── Toast.tsx                 - 舊提示元件
│
├── components/layout/
│   ├── Sidebar.tsx               - 舊側邊欄
│   ├── TopBar.tsx                - 舊頂部欄
│   └── DashboardLayout.tsx       - 舊佈局容器
│
└── components/dashboard/
    └── StatsCard.tsx             - 舊統計卡片

✅ 已建立的新元件：
├── components/ui/
│   ├── button-new.tsx            - 新按鈕元件（CVA）
│   ├── card.tsx                  - 新卡片元件
│   └── badge.tsx                 - 新徽章元件
│
└── components/layout/
    ├── Sidebar-new.tsx           - 新側邊欄
    ├── TopBar-new.tsx            - 新頂部欄
    └── DashboardLayout-new.tsx   - 新佈局容器
```

### 1.3 需要新建的元件

```
🔨 尚未建立的核心元件：
├── components/ui/
│   ├── input.tsx                 - 輸入框（新設計）
│   ├── textarea.tsx              - 文字區域
│   ├── select.tsx                - 選擇器（新設計）
│   ├── label.tsx                 - 標籤
│   ├── table.tsx                 - 表格元件
│   ├── dialog.tsx                - 對話框
│   ├── dropdown-menu.tsx         - 下拉選單
│   ├── tabs.tsx                  - 標籤頁
│   ├── avatar.tsx                - 頭像
│   ├── progress.tsx              - 進度條
│   ├── skeleton.tsx              - 骨架屏（新設計）
│   ├── toast.tsx                 - Toast 通知（新設計）
│   ├── pagination.tsx            - 分頁（新設計）
│   └── breadcrumb.tsx            - 麵包屑
```

---

## 2. 遷移策略

### 2.1 漸進式遷移策略

採用 **漸進式遷移** 而非大爆炸式替換：

**階段 1：基礎設施（已完成）** ✅
- Tailwind 配置更新
- 全局樣式更新
- 工具函數建立
- 核心元件建立

**階段 2：元件庫完善（1-2 週）**
- 建立所有缺失的 UI 元件
- 替換舊元件為新元件
- 保持向後兼容（暫時保留舊元件）

**階段 3：頁面遷移（2-3 週）**
- 優先級 1：Dashboard、Login
- 優先級 2：Projects、Proposals
- 優先級 3：Budget Pools、Users

**階段 4：清理與優化（1 週）**
- 刪除舊元件
- 代碼重構
- 性能優化

### 2.2 命名規範統一

**遷移期間：**
- 新元件使用標準名稱（小寫，如 `button.tsx`）
- 舊元件保留原名（大寫，如 `Button.tsx`）
- 臨時新元件使用 `-new` 後綴

**遷移完成後：**
- 刪除所有舊元件
- 移除 `-new` 後綴
- 統一使用小寫命名

### 2.3 文檔策略

**需要更新的文檔：**

```
❌ 刪除或歸檔：
└── docs/front-end-spec.md        - 舊的前端規範（部分過時）

✅ 保留並更新：
├── docs/ui-ux-redesign.md        - 新設計系統文檔（主要參考）
├── docs/prototype-guide.md        - 原型使用指南
└── docs/design-system-migration-plan.md  - 本文檔

🆕 需要新建：
├── docs/design-system/
│   ├── README.md                 - 設計系統總覽
│   ├── colors.md                 - 顏色系統
│   ├── typography.md             - 字體系統
│   ├── components.md             - 元件使用指南
│   ├── layouts.md                - 佈局模式
│   └── best-practices.md         - 最佳實踐
│
└── docs/development-guidelines.md - 開發規範指南
```

---

## 3. 執行計劃

### 3.1 階段 1：元件庫完善（Week 1-2）

#### 任務清單

**Week 1: 表單元件**
- [ ] 建立 Input 元件
- [ ] 建立 Textarea 元件
- [ ] 建立 Select 元件
- [ ] 建立 Label 元件
- [ ] 建立 Checkbox 元件
- [ ] 建立 Radio 元件
- [ ] 建立 Switch 元件

**Week 2: 互動元件**
- [ ] 建立 Dialog 元件
- [ ] 建立 DropdownMenu 元件
- [ ] 建立 Tabs 元件
- [ ] 建立 Tooltip 元件
- [ ] 建立 Popover 元件

**Week 2: 數據展示元件**
- [ ] 建立 Table 元件
- [ ] 建立 Avatar 元件
- [ ] 建立 Progress 元件
- [ ] 建立 Skeleton 元件
- [ ] 建立 Pagination 元件
- [ ] 建立 Breadcrumb 元件

**Week 2: 回饋元件**
- [ ] 建立 Toast 元件
- [ ] 建立 Alert 元件
- [ ] 建立 Loading 元件

### 3.2 階段 2：頁面遷移（Week 3-5）

#### Week 3: 核心頁面

**Priority 1: Dashboard & Auth**
- [ ] 遷移 `/dashboard` 使用新佈局
- [ ] 遷移 `/login` 使用新設計
- [ ] 測試認證流程

**Priority 2: 專案管理**
- [ ] 遷移 `/projects` 列表頁
- [ ] 遷移 `/projects/[id]` 詳情頁
- [ ] 遷移 `/projects/new` 表單頁
- [ ] 遷移 `/projects/[id]/edit` 編輯頁
- [ ] 更新 ProjectForm 元件

#### Week 4: 提案管理

- [ ] 遷移 `/proposals` 列表頁
- [ ] 遷移 `/proposals/[id]` 詳情頁
- [ ] 遷移 `/proposals/new` 表單頁
- [ ] 遷移 `/proposals/[id]/edit` 編輯頁
- [ ] 更新 BudgetProposalForm 元件
- [ ] 更新 CommentSection 元件
- [ ] 更新 ProposalActions 元件

#### Week 5: 預算池 & 用戶管理

**Budget Pools:**
- [ ] 遷移 `/budget-pools` 列表頁
- [ ] 遷移 `/budget-pools/[id]` 詳情頁
- [ ] 遷移 `/budget-pools/new` 表單頁
- [ ] 遷移 `/budget-pools/[id]/edit` 編輯頁
- [ ] 更新 BudgetPoolForm 元件

**Users:**
- [ ] 遷移 `/users` 列表頁
- [ ] 遷移 `/users/[id]` 詳情頁
- [ ] 遷移 `/users/new` 表單頁
- [ ] 遷移 `/users/[id]/edit` 編輯頁
- [ ] 更新 UserForm 元件

### 3.3 階段 3：清理與優化（Week 6）

- [ ] 刪除所有舊元件
- [ ] 移除 `-new` 後綴
- [ ] 刪除 `/dashboard-prototype` 路由
- [ ] 統一元件匯出方式
- [ ] 代碼重構與優化
- [ ] 性能測試與優化
- [ ] 無障礙性測試
- [ ] 響應式測試
- [ ] 瀏覽器兼容性測試

---

## 4. 一致性維護機制

### 4.1 元件開發規範

**所有新元件必須遵循以下規範：**

#### 4.1.1 檔案結構

```typescript
// components/ui/example.tsx

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 1. 定義變體（如果需要）
const exampleVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. 定義 Props 介面
export interface ExampleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof exampleVariants> {
  // 額外的 props
}

// 3. 使用 forwardRef
const Example = React.forwardRef<HTMLDivElement, ExampleProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(exampleVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

// 4. 設定 displayName
Example.displayName = "Example"

// 5. 匯出
export { Example, exampleVariants }
```

#### 4.1.2 樣式規範

**使用 Tailwind Utility Classes：**
```typescript
// ✅ 正確：使用 Tailwind classes
className="rounded-lg border bg-card p-6"

// ❌ 錯誤：使用內聯樣式
style={{ borderRadius: '8px', padding: '24px' }}
```

**使用 CSS 變數：**
```typescript
// ✅ 正確：使用設計系統變數
className="bg-primary text-primary-foreground"

// ❌ 錯誤：硬編碼顏色
className="bg-blue-600 text-white"
```

**使用 cn() 合併類別：**
```typescript
// ✅ 正確：使用 cn() 處理條件類別
className={cn(
  "base-class",
  isActive && "active-class",
  className
)}

// ❌ 錯誤：字串拼接
className={`base-class ${isActive ? 'active-class' : ''} ${className}`}
```

#### 4.1.3 TypeScript 規範

**嚴格類型定義：**
```typescript
// ✅ 正確：完整的類型定義
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline"
  size?: "default" | "sm" | "lg"
  isLoading?: boolean
}

// ❌ 錯誤：使用 any
interface ButtonProps {
  variant?: any
  size?: any
}
```

**使用泛型：**
```typescript
// ✅ 正確：泛型元件
interface SelectProps<T> {
  value: T
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
}
```

### 4.2 頁面開發規範

#### 4.2.1 頁面結構範本

```typescript
// app/example/page.tsx

"use client" // 如果需要客戶端功能

import { DashboardLayout } from "@/components/layout/DashboardLayout-new"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button-new"
import { Badge } from "@/components/ui/badge"

export default function ExamplePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">頁面標題</h1>
          <p className="mt-1 text-gray-500">頁面描述</p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 內容卡片 */}
        </div>
      </div>
    </DashboardLayout>
  )
}
```

#### 4.2.2 佈局模式

**統計卡片網格：**
```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 4 個統計卡片 */}
</div>
```

**主內容 2:1 比例：**
```typescript
<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* 主要內容 (2/3) */}
  </div>
  <div>
    {/* 側邊內容 (1/3) */}
  </div>
</div>
```

**表單雙欄佈局：**
```typescript
<div className="grid gap-4 md:grid-cols-2">
  {/* 表單欄位 */}
</div>
```

### 4.3 設計 Token 使用規範

#### 4.3.1 顏色使用

**語義化顏色：**
```typescript
// ✅ 正確：使用語義化變數
bg-primary          // 主色
bg-secondary        // 次要色
bg-destructive      // 危險/刪除
bg-muted            // 靜音/禁用
bg-accent           // 強調

text-foreground     // 主要文字
text-muted-foreground // 次要文字

border              // 邊框
ring                // 聚焦環
```

**狀態顏色：**
```typescript
// Badge 變體
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">錯誤</Badge>
<Badge variant="info">資訊</Badge>
```

#### 4.3.2 間距使用

```typescript
// 元件內邊距
p-6          // 卡片內邊距 (24px)
p-4          // 小卡片內邊距 (16px)

// 元件間距
space-y-8    // 大區塊間距 (32px)
space-y-6    // 中區塊間距 (24px)
space-y-4    // 小區塊間距 (16px)
gap-6        // 網格間距 (24px)

// 頁面邊距
px-4 sm:px-6 lg:px-8  // 響應式頁面邊距
```

#### 4.3.3 字體使用

```typescript
// 標題
text-3xl font-bold    // 頁面主標題 (30px)
text-2xl font-semibold // 區塊標題 (24px)
text-xl font-semibold  // 卡片標題 (20px)
text-lg font-medium    // 次級標題 (18px)

// 正文
text-base              // 正文 (16px)
text-sm                // 小正文 (14px)
text-xs                // 標籤/註解 (12px)

// 顏色
text-gray-900          // 主要文字
text-gray-600          // 次要標題
text-gray-500          // 輔助文字
```

### 4.4 代碼審查清單

**每次 PR 必須檢查：**

**設計一致性：**
- [ ] 使用新設計系統的元件
- [ ] 使用 CSS 變數而非硬編碼顏色
- [ ] 遵循間距規範（4px 網格）
- [ ] 使用統一的圓角 (rounded-lg)
- [ ] 使用統一的陰影

**代碼品質：**
- [ ] TypeScript 無錯誤
- [ ] ESLint 無警告
- [ ] Prettier 格式化
- [ ] 無 console.log
- [ ] 無註解掉的代碼

**元件規範：**
- [ ] 使用 forwardRef
- [ ] 設定 displayName
- [ ] 使用 CVA 管理變體
- [ ] 使用 cn() 合併類別
- [ ] Props 有完整類型定義

**無障礙性：**
- [ ] 按鈕有正確的 aria-label
- [ ] 表單有 label
- [ ] 互動元素可鍵盤訪問
- [ ] 顏色對比度達標

**響應式：**
- [ ] 移動端測試通過
- [ ] 平板測試通過
- [ ] 桌面測試通過

---

## 5. 開發規範

### 5.1 Git 工作流程

**分支命名：**
```
feature/design-system-migration-dashboard
feature/design-system-migration-projects
fix/button-hover-state
refactor/update-old-components
```

**Commit 訊息：**
```
feat(ui): add new Input component with design system
fix(dashboard): fix stats card responsive layout
refactor(button): replace old Button with new design
docs(design-system): update component usage guide
```

### 5.2 Pull Request 流程

**PR 標題格式：**
```
[Design System] Migrate Dashboard page to new design
[Components] Add Table component
[Fix] Update Button hover state
```

**PR 描述範本：**
```markdown
## 變更摘要
簡述這次變更的內容

## 變更類型
- [ ] 新元件
- [ ] 頁面遷移
- [ ] Bug 修復
- [ ] 重構

## 設計系統檢查清單
- [ ] 使用新設計系統元件
- [ ] 遵循命名規範
- [ ] 遵循樣式規範
- [ ] 通過響應式測試
- [ ] 通過無障礙性測試

## 截圖
(如果是 UI 變更，請附上截圖)

## 測試
- [ ] 本地測試通過
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
```

### 5.3 元件開發流程

**標準流程：**

1. **設計確認**
   - 檢查 `docs/ui-ux-redesign.md` 中的設計規範
   - 確認元件變體和狀態

2. **建立元件**
   - 使用範本建立檔案
   - 實作基礎功能

3. **樣式實作**
   - 使用設計 token
   - 實作所有變體
   - 實作所有狀態（hover, focus, active, disabled）

4. **測試**
   - 視覺測試（各種變體）
   - 互動測試（hover, click, keyboard）
   - 響應式測試
   - 無障礙性測試

5. **文檔**
   - 更新元件使用文檔
   - 添加使用範例

### 5.4 頁面開發流程

**標準流程：**

1. **分析現有頁面**
   - 識別使用的舊元件
   - 規劃需要的新元件

2. **準備元件**
   - 確保所有需要的新元件已建立
   - 確認元件 API

3. **實作遷移**
   - 使用 DashboardLayout-new
   - 替換所有舊元件為新元件
   - 遵循佈局模式

4. **數據整合**
   - 連接 tRPC API
   - 處理載入狀態
   - 處理錯誤狀態

5. **測試**
   - 功能測試
   - 視覺測試
   - 響應式測試

---

## 6. 質量保證

### 6.1 自動化工具

#### 6.1.1 ESLint 配置

**新增設計系統規則：**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 禁止使用舊元件
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/components/ui/Button'],
          message: '請使用 @/components/ui/button-new 代替舊的 Button 元件'
        },
        {
          group: ['@/components/layout/DashboardLayout'],
          message: '請使用 @/components/layout/DashboardLayout-new'
        }
      ]
    }],

    // 禁止硬編碼顏色
    'no-restricted-syntax': ['error', {
      selector: 'Literal[value=/bg-blue-[0-9]/]',
      message: '請使用設計系統變數如 bg-primary 而非硬編碼顏色'
    }]
  }
}
```

#### 6.1.2 TypeScript 嚴格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 6.1.3 Prettier 配置

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 6.2 視覺回歸測試

**使用 Playwright 進行視覺測試：**

```typescript
// tests/visual/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('Dashboard matches design', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveScreenshot('dashboard.png')
})
```

### 6.3 元件文檔

**使用 Storybook（建議）：**

```bash
# 安裝 Storybook
pnpm dlx storybook@latest init

# 運行 Storybook
pnpm storybook
```

**元件 Story 範例：**

```typescript
// components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: '按鈕',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '刪除',
  },
}
```

---

## 7. 遷移執行時間表

### 7.1 整體時間表

```
Week 1-2:  元件庫完善
Week 3:    核心頁面遷移 (Dashboard, Login, Projects)
Week 4:    提案管理遷移
Week 5:    預算池 & 用戶管理遷移
Week 6:    清理、優化、測試
```

### 7.2 里程碑

**Milestone 1 (Week 2 結束)：** 元件庫完成
- 所有 UI 元件建立完成
- 元件文檔完成
- 通過視覺測試

**Milestone 2 (Week 3 結束)：** 核心頁面完成
- Dashboard 遷移完成
- Projects 遷移完成
- 功能測試通過

**Milestone 3 (Week 5 結束)：** 全部頁面遷移完成
- 所有 19 個頁面遷移完成
- 整合測試通過

**Milestone 4 (Week 6 結束)：** 遷移完成
- 舊元件刪除
- 代碼優化完成
- 正式發布

---

## 8. 風險與應對

### 8.1 潛在風險

**技術風險：**
- 元件 API 不兼容導致功能失效
- 響應式佈局在某些設備上異常
- 性能下降

**應對策略：**
- 充分測試每個元件
- 使用漸進式遷移，保留回退選項
- 進行性能基準測試

**進度風險：**
- 元件開發時間超預期
- 頁面遷移遇到複雜問題

**應對策略：**
- 優先完成核心功能
- 必要時調整時間表
- 團隊定期同步進度

### 8.2 回退計劃

**如果遷移遇到嚴重問題：**

1. 保留舊元件作為備份
2. 使用 feature flag 控制新舊設計切換
3. 回滾到穩定版本

---

## 9. 成功標準

### 9.1 量化指標

- [ ] 100% 頁面使用新設計系統
- [ ] 0 個舊元件殘留
- [ ] 100% TypeScript 類型覆蓋
- [ ] 0 ESLint 錯誤
- [ ] 90+ Lighthouse 性能分數
- [ ] WCAG 2.1 AA 無障礙標準

### 9.2 質化指標

- [ ] 設計一致性達成
- [ ] 代碼可維護性提升
- [ ] 開發效率提高
- [ ] 用戶體驗改善

---

## 10. 下一步行動

### 立即執行（本週）：

1. **建立元件開發環境**
   ```bash
   # 安裝 Storybook（可選）
   pnpm dlx storybook@latest init
   ```

2. **開始元件開發**
   - 從 Input、Select、Label 開始
   - 每天完成 2-3 個元件

3. **設置代碼規範工具**
   - 配置 ESLint 規則
   - 配置 Prettier
   - 設置 pre-commit hooks

### 本週完成：

- [ ] 完成所有表單元件
- [ ] 建立元件使用文檔
- [ ] 設置 Storybook
- [ ] 配置 linting 規則

---

**文件維護者：** Development Team
**最後更新：** 2025-10-03
**下次審查：** 每週五

