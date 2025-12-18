# React Components - UI 組件層

> **Last Updated**: 2025-12-18
> **Total Components**: 89+ .tsx 檔案
> **Subdirectories**: 24 個業務領域目錄

## 📋 目錄用途

此目錄包含所有可重用的 React 組件，為 IT 專案流程管理平台提供統一的 UI/UX 體驗。組件分為三個層次：
1. **設計系統組件** (`ui/`) - 原子級、無業務邏輯的 shadcn/ui 組件
2. **業務組件** (`[domain]/`) - 特定業務領域的功能組件
3. **佈局組件** (`layout/`) - 頁面結構和導航組件

## 🏗️ 完整目錄結構

```
components/                       # 共 89+ 個 .tsx 檔案
├── ui/                           # 設計系統組件（41+ 個）
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── combobox.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── pagination.tsx
│   ├── toast.tsx / toaster.tsx / use-toast.tsx
│   ├── password-input.tsx           # CHANGE-032: 密碼輸入框
│   ├── password-strength-indicator.tsx  # CHANGE-032: 密碼強度
│   ├── loading/                      # FEAT-012: 載入特效系統
│   │   ├── Spinner.tsx              # 旋轉載入器
│   │   ├── LoadingButton.tsx        # 按鈕載入狀態
│   │   ├── LoadingOverlay.tsx       # 區域遮罩
│   │   └── GlobalProgress.tsx       # 頂部進度條
│   └── ...（共 41+ 個）
│
├── layout/                       # 佈局組件（5 個）
│   ├── dashboard-layout.tsx      # 主佈局容器
│   ├── Sidebar.tsx               # 側邊欄導航（FEAT-011 權限過濾）
│   ├── TopBar.tsx                # 頂部欄
│   ├── PermissionGate.tsx        # FEAT-011: 權限閘門組件
│   └── LanguageSwitcher.tsx      # 語言切換器
│
├── providers/                    # React Context Providers
│   └── SessionProvider.tsx       # NextAuth 會話 Provider
│
├── theme/                        # 主題相關
│   └── ThemeToggle.tsx           # Light/Dark/System 切換
│
├── shared/                       # 共享業務組件
│   ├── CurrencyDisplay.tsx       # 貨幣顯示格式化
│   └── CurrencySelect.tsx        # 貨幣選擇器
│
├── budget-pool/                  # 預算池（3 個）
│   ├── BudgetPoolFilters.tsx     # 過濾器
│   ├── BudgetPoolForm.tsx        # 表單
│   └── CategoryFormRow.tsx       # 類別表單列
│
├── charge-out/                   # 費用轉嫁（2 個）
│   ├── ChargeOutActions.tsx      # 操作按鈕
│   └── ChargeOutForm.tsx         # 表單
│
├── dashboard/                    # 儀表板（3 個）
│   ├── BudgetPoolOverview.tsx    # 預算池概覽
│   ├── StatCard.tsx              # 統計卡片
│   └── StatsCard.tsx             # 統計卡片（變體）
│
├── expense/                      # 費用（2 個）
│   ├── ExpenseActions.tsx        # 操作按鈕
│   └── ExpenseForm.tsx           # 表單
│
├── notification/                 # 通知（2 個）
│   ├── NotificationBell.tsx      # 通知鈴鐺
│   └── NotificationDropdown.tsx  # 通知下拉選單
│
├── om-expense/                   # OM 費用（5 個）- FEAT-007 重構
│   ├── OMExpenseForm.tsx         # 表頭表單
│   ├── OMExpenseItemForm.tsx     # 明細項目表單
│   ├── OMExpenseItemList.tsx     # 明細項目列表（支援拖曳排序）
│   ├── OMExpenseItemMonthlyGrid.tsx  # 明細月度網格
│   └── OMExpenseMonthlyGrid.tsx  # 月度數據網格
│
├── om-expense-category/          # OM 費用類別（2 個）
│   ├── OMExpenseCategoryActions.tsx  # 操作按鈕
│   └── OMExpenseCategoryForm.tsx # 表單
│
├── om-summary/                   # OM Summary（3 個）
│   ├── OMSummaryCategoryGrid.tsx # 類別網格
│   ├── OMSummaryFilters.tsx      # 過濾器
│   └── OMSummaryDetailGrid.tsx   # 詳情網格
│
├── operating-company/            # 營運公司（2 個）
│   ├── OperatingCompanyForm.tsx  # 表單
│   └── OperatingCompanyActions.tsx  # 操作按鈕
│
├── project/                      # 專案（1 個）
│   └── ProjectForm.tsx           # 專案表單（FEAT-010 佈局優化）
│
├── project-summary/              # 專案 Summary（2 個）- FEAT-006
│   ├── ProjectSummaryFilters.tsx # 過濾器
│   └── ProjectSummaryTable.tsx   # 表格
│
├── proposal/                     # 提案（5 個）
│   ├── BudgetProposalForm.tsx    # 提案表單
│   ├── CommentSection.tsx        # 評論區塊
│   ├── ProposalActions.tsx       # 操作按鈕
│   ├── ProposalFileUpload.tsx    # 檔案上傳
│   └── ProposalMeetingNotes.tsx  # 會議紀錄
│
├── purchase-order/               # 採購單（2 個）
│   ├── PurchaseOrderActions.tsx  # 操作按鈕
│   └── PurchaseOrderForm.tsx     # 表單
│
├── quote/                        # 報價單（1 個）
│   └── QuoteUploadForm.tsx       # 上傳表單
│
├── user/                         # 用戶（3 個）
│   ├── UserForm.tsx              # 用戶表單（CHANGE-032 密碼管理）
│   ├── OpCoPermissionSelector.tsx # OpCo 權限選擇器
│   └── UserPermissionsConfig.tsx # 權限配置
│
└── vendor/                       # 供應商（1 個）
    └── VendorForm.tsx            # 供應商表單
```

## 🎯 組件分類詳解

### 1. UI 設計系統組件 (`ui/`)

**定位**: 原子級、完全無業務邏輯、高度可配置的 UI 元素

**技術基礎**:
- shadcn/ui + Radix UI 無障礙設計
- Tailwind CSS 樣式
- 支援 Light/Dark 主題

**核心組件類別**:
| 類別 | 組件 | 用途 |
|------|------|------|
| 表單控件 | Button, Input, Select, Checkbox, Switch | 用戶輸入 |
| 資料顯示 | Table, Card, Badge, Avatar, Progress | 資訊展示 |
| 導航 | Breadcrumb, Pagination, Tabs | 頁面導航 |
| 回饋 | Dialog, Toast, Alert, Tooltip | 用戶互動 |
| 載入 | Spinner, LoadingButton, LoadingOverlay | 載入狀態 |

**詳細規範**: 請參閱 `.claude/rules/ui-design-system.md`

### 2. 業務領域組件 (`[domain]/`)

**定位**: 特定業務功能的封裝，包含業務邏輯和 API 整合

**命名約定**:
- 目錄名：`kebab-case`（例: `budget-pool/`, `om-expense/`）
- 組件名：`PascalCase`（例: `ProjectForm.tsx`, `OMExpenseItemList.tsx`）

**常見組件類型**:
| 組件類型 | 命名模式 | 用途 |
|----------|----------|------|
| Form | `[Entity]Form.tsx` | 建立/編輯表單 |
| Actions | `[Entity]Actions.tsx` | 操作按鈕組 |
| Filters | `[Entity]Filters.tsx` | 過濾器組件 |
| List | `[Entity]List.tsx` | 列表顯示 |
| Grid | `[Entity]Grid.tsx` | 網格顯示 |

**詳細規範**: 請參閱 `.claude/rules/components.md`

### 3. 佈局組件 (`layout/`)

**定位**: 頁面結構、導航和權限控制

**核心組件**:

| 組件 | 功能 | 相關功能 |
|------|------|----------|
| `DashboardLayout` | 主佈局（Sidebar + TopBar + Content） | - |
| `Sidebar` | 側邊欄導航 | FEAT-011 權限過濾 |
| `TopBar` | 頂部欄（通知、主題、用戶選單） | - |
| `PermissionGate` | 客戶端路由權限保護 | FEAT-011 |
| `LanguageSwitcher` | 語言切換（en/zh-TW） | - |

## 📝 組件開發模式

### 標準組件結構

```typescript
/**
 * @fileoverview [Component Name] - [簡短描述]
 * @component [ComponentName]
 * @features - 列出主要功能
 * @dependencies - 列出主要依賴
 * @related - 相關檔案
 * @since [Epic/Feature Name]
 * @lastModified YYYY-MM-DD
 */

'use client'; // 如需互動

// === Imports ===
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

// === Types ===
interface ComponentProps {
  mode: 'create' | 'edit';
  initialData?: EntityData;
  onSuccess?: (data: EntityData) => void;
}

// === Component ===
export function ComponentName({ mode, initialData, onSuccess }: ComponentProps) {
  // Hooks
  const t = useTranslations('namespace');
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [formData, setFormData] = useState(initialData || defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries / Mutations
  const { data } = api.entity.getAll.useQuery({});
  const mutation = api.entity.create.useMutation({
    onSuccess: (data) => {
      toast({ title: t('success'), variant: 'success' });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast({ title: error.message, variant: 'destructive' });
    },
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(formData);
  };

  // Render
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 表單組件模式

```typescript
// 典型的表單組件模式（ProjectForm, UserForm, OMExpenseItemForm 等）

interface FormProps {
  mode: 'create' | 'edit';
  initialData?: EntityData;
}

export function EntityForm({ mode, initialData }: FormProps) {
  // 1. 翻譯和路由
  const t = useTranslations('entity');
  const router = useRouter();
  const { toast } = useToast();

  // 2. 表單狀態
  const [formData, setFormData] = useState(initialData || defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 3. API 查詢（下拉選單選項等）
  const { data: options } = api.reference.getAll.useQuery({});

  // 4. Mutations
  const createMutation = api.entity.create.useMutation({
    onSuccess: (data) => router.push(`/entities/${data.id}`),
    onError: (error) => toast({ title: error.message, variant: 'destructive' }),
  });

  const updateMutation = api.entity.update.useMutation({
    onSuccess: () => router.push(`/entities/${initialData?.id}`),
  });

  // 5. 驗證
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('validation.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 6. 提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mode === 'create'
      ? createMutation.mutate(formData)
      : updateMutation.mutate({ id: initialData!.id, ...formData });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 國際化整合

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  // 多個命名空間
  const t = useTranslations('entity');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  return (
    <div>
      <h1>{t('form.title')}</h1>
      <Button>{tCommon('actions.save')}</Button>
      {errors.name && <span>{tValidation('required')}</span>}
    </div>
  );
}
```

### 載入狀態處理（FEAT-012）

```typescript
import { Spinner, LoadingButton, LoadingOverlay } from '@/components/ui/loading';

// 按鈕載入狀態
<LoadingButton
  isLoading={mutation.isLoading}
  loadingText={t('saving')}
>
  {t('save')}
</LoadingButton>

// 區域載入遮罩
<LoadingOverlay isLoading={isLoading}>
  <Card>...</Card>
</LoadingOverlay>

// 獨立載入指示器
<Spinner size="lg" color="primary" />
```

### 權限控制（FEAT-011）

```typescript
import { PermissionGate } from '@/components/layout/PermissionGate';

// 單一權限檢查
<PermissionGate permission="menu:users">
  <UsersPage />
</PermissionGate>

// 任一權限檢查
<PermissionGate anyPermissions={['menu:projects', 'menu:proposals']}>
  <ProjectsContent />
</PermissionGate>

// 無權限時重定向
<PermissionGate permission="menu:admin" fallbackUrl="/dashboard">
  <AdminPage />
</PermissionGate>
```

## ⚠️ 重要約定

### 必須遵守
1. **UI 組件不可包含業務邏輯** - `ui/` 目錄組件必須是純展示
2. **所有組件必須有 TypeScript 類型定義** - Props 使用 interface
3. **禁止硬編碼文字** - 必須使用 `useTranslations()`
4. **表單必須處理載入和錯誤狀態** - 使用 `isLoading`、`errors`
5. **組件檔案名與組件名一致** - `UserForm.tsx` 導出 `UserForm`

### 推薦做法
- 使用 `cn()` 合併樣式類
- 使用 `useToast()` 顯示操作回饋
- 使用 `useDebounce()` 處理即時驗證
- 使用 `react-hook-form` + `zod` 處理複雜表單
- 使用 `@dnd-kit` 處理拖曳排序

### 禁止事項
- ❌ 在 `ui/` 組件中添加業務邏輯
- ❌ 硬編碼中文或英文文字
- ❌ 忽略 TypeScript 類型錯誤
- ❌ 在組件中直接呼叫 `fetch()`（應使用 tRPC）
- ❌ 刪除 ARIA 無障礙屬性

## 🔗 相關資源

### 代碼規範
- `.claude/rules/components.md` - React 組件規範
- `.claude/rules/ui-design-system.md` - shadcn/ui 設計系統規範
- `.claude/rules/i18n.md` - 國際化規範
- `.claude/rules/typescript.md` - TypeScript 約定

### 相關目錄
- `apps/web/src/app/[locale]/` - 使用這些組件的頁面
- `apps/web/src/lib/utils.ts` - cn() 工具函數
- `apps/web/src/lib/trpc.ts` - tRPC Client
- `apps/web/src/messages/` - 翻譯檔案
- `apps/web/src/hooks/` - 自訂 Hooks（useDebounce, usePermissions）

### 相關 API
- `packages/api/src/routers/` - tRPC Routers
- `packages/db/prisma/schema.prisma` - Prisma 數據模型

## 📊 功能版本追蹤

| 功能 | 相關組件 | 版本 |
|------|----------|------|
| FEAT-006 | ProjectSummaryTable, ProjectSummaryFilters | 2025-12 |
| FEAT-007 | OMExpenseItemForm, OMExpenseItemList, OMExpenseItemMonthlyGrid | 2025-12 |
| FEAT-011 | Sidebar, PermissionGate, usePermissions | 2025-12 |
| FEAT-012 | Spinner, LoadingButton, LoadingOverlay, GlobalProgress | 2025-12 |
| CHANGE-032 | UserForm, PasswordInput, PasswordStrengthIndicator | 2025-12 |
