# React Components - UI 組件層

## 📋 目錄用途
此目錄包含所有可重用的 React 組件，分為設計系統組件（ui/）、業務組件（domain/）和佈局組件（layout/）。

## 🏗️ 組織結構

```
components/                  # 共 20 個組件目錄
├── ui/                      # 設計系統組件（35+ 個 shadcn/ui）
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── combobox.tsx
│   ├── accordion.tsx
│   ├── tabs.tsx
│   ├── pagination.tsx
│   └── ...（共 35+ 個）
├── layout/                  # 佈局組件
│   ├── dashboard-layout.tsx
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── LanguageSwitcher.tsx
├── providers/               # React Context Providers
│   └── SessionProvider.tsx
├── theme/                   # 主題相關
│   └── ThemeToggle.tsx
├── shared/                  # 共享業務組件
│   ├── CurrencyDisplay.tsx
│   └── CurrencySelect.tsx
├── [domain]/                # 業務領域組件
│   ├── budget-pool/         # 預算池
│   │   ├── BudgetPoolFilters.tsx
│   │   ├── BudgetPoolForm.tsx
│   │   └── CategoryFormRow.tsx
│   ├── charge-out/          # 費用轉嫁
│   │   ├── ChargeOutActions.tsx
│   │   └── ChargeOutForm.tsx
│   ├── dashboard/           # 儀表板
│   │   ├── BudgetPoolOverview.tsx
│   │   ├── StatCard.tsx
│   │   └── StatsCard.tsx
│   ├── expense/             # 費用
│   │   ├── ExpenseActions.tsx
│   │   └── ExpenseForm.tsx
│   ├── notification/        # 通知
│   │   ├── NotificationBell.tsx
│   │   └── NotificationDropdown.tsx
│   ├── om-expense/          # OM 費用 (FEAT-007 重構)
│   │   ├── OMExpenseForm.tsx
│   │   ├── OMExpenseItemForm.tsx      # 明細表單
│   │   ├── OMExpenseItemList.tsx      # 明細列表
│   │   ├── OMExpenseItemMonthlyGrid.tsx
│   │   └── OMExpenseMonthlyGrid.tsx
│   ├── om-expense-category/ # OM 費用類別 (FEAT-007)
│   │   └── OMExpenseCategoryForm.tsx
│   ├── om-summary/          # OM Summary (CHANGE-004)
│   │   └── OMSummaryTable.tsx
│   ├── operating-company/   # 營運公司
│   │   └── OperatingCompanyForm.tsx
│   ├── project/             # 專案
│   │   └── ProjectForm.tsx
│   ├── project-summary/     # 專案 Summary (FEAT-006)
│   │   └── ProjectSummaryTable.tsx
│   ├── proposal/            # 提案
│   │   ├── BudgetProposalForm.tsx
│   │   ├── CommentSection.tsx
│   │   ├── ProposalActions.tsx
│   │   ├── ProposalFileUpload.tsx
│   │   └── ProposalMeetingNotes.tsx
│   ├── purchase-order/      # 採購單
│   │   ├── PurchaseOrderActions.tsx
│   │   └── PurchaseOrderForm.tsx
│   ├── quote/               # 報價單
│   │   └── QuoteUploadForm.tsx
│   ├── user/                # 用戶
│   │   └── UserForm.tsx
│   └── vendor/              # 供應商
│       └── VendorForm.tsx
```

## 🎯 組件分類與用途

### 1. UI 組件 (`ui/`) - 設計系統層
**用途**: 原子級、可重用、無業務邏輯的 UI 元素

**特性**:
- 基於 shadcn/ui + Radix UI
- 完全無業務邏輯
- 高度可配置（props）
- 支援主題（Light/Dark）
- 無障礙設計（ARIA）

**範例**:
```typescript
// button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium',
        variants[variant],
        sizes[size]
      )}
      {...props}
    />
  );
}
```

### 2. 業務組件 (`[domain]/`) - 領域組件層
**用途**: 特定業務領域的組件，包含業務邏輯

**命名約定**:
- 目錄名：kebab-case（例: `budget-pool/`, `project/`）
- 組件名：PascalCase（例: `ProjectForm.tsx`, `BudgetPoolFilters.tsx`）

**常見組件類型**:
```
[domain]/
├── [Entity]Form.tsx           # 表單組件（建立/編輯）
├── [Entity]Actions.tsx        # 操作按鈕組（編輯、刪除、提交）
├── [Entity]Filters.tsx        # 過濾器組件
├── [Entity]Card.tsx           # 卡片顯示組件
└── index.ts                   # 統一導出
```

**範例**:
```typescript
// project/ProjectForm.tsx
/**
 * @fileoverview Project Form Component
 * @component ProjectForm
 * @features
 * - 建立/編輯模式切換
 * - 表單驗證
 * - tRPC mutation 整合
 */

'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialData?: Project;
}

export function ProjectForm({ mode, initialData }: ProjectFormProps) {
  const [formData, setFormData] = useState(initialData || {});

  const createProject = api.project.create.useMutation({
    onSuccess: () => router.push('/projects'),
  });

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. 佈局組件 (`layout/`) - 結構組件層
**用途**: 頁面佈局和導航結構

**核心組件**:
- `DashboardLayout` - 主佈局（Sidebar + TopBar + Content）
- `Sidebar` - 側邊欄導航
- `TopBar` - 頂部欄（用戶選單、通知）

**範例**:
```typescript
// layout/dashboard-layout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## 🎯 核心模式與約定

### 1. 組件檔案結構
```typescript
/**
 * @fileoverview [Component Name] - [簡短描述]
 * @component [ComponentName]
 * @features - 列出主要功能
 * @dependencies - 列出主要依賴
 * @related - 相關檔案
 */

'use client'; // 如需互動

// Imports
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';

// Types
interface ComponentProps {
  // ...
}

// Component
export function ComponentName({ ...props }: ComponentProps) {
  // Hooks
  const t = useTranslations('namespace');
  const [state, setState] = useState();

  // Queries/Mutations
  const { data } = api.entity.getAll.useQuery({});

  // Handlers
  const handleClick = () => { ... };

  // Render
  return <div>...</div>;
}
```

### 2. Props 類型定義
```typescript
// ✅ 使用 interface（推薦）
interface ButtonProps {
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ✅ 使用 type（複雜情況）
type FormProps = {
  mode: 'create' | 'edit';
} & (
  | { mode: 'create' }
  | { mode: 'edit'; initialData: Entity }
);
```

### 3. 狀態管理模式

#### Local State
```typescript
// 簡單 UI 狀態
const [isOpen, setIsOpen] = useState(false);
const [search, setSearch] = useState('');
```

#### Form State
```typescript
// 表單狀態
const [formData, setFormData] = useState({
  name: '',
  email: '',
});

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

#### Server State (tRPC)
```typescript
// 伺服器資料
const { data, isLoading } = api.project.getAll.useQuery({});
const mutation = api.project.create.useMutation({});
```

### 4. 事件處理模式
```typescript
// ✅ 明確的處理函數
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearch(e.target.value);
};

// ❌ 避免內聯箭頭函數（性能）
<button onClick={() => console.log('click')}>Click</button>

// ✅ 使用 useCallback（如需傳參）
const handleClick = useCallback((id: string) => {
  // ...
}, [dependencies]);
```

### 5. 條件渲染模式
```typescript
// ✅ Early Return
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorState error={error} />;
if (!data) return <NotFound />;

return <DataDisplay data={data} />;

// ✅ 條件顯示
{canEdit && <EditButton />}
{items.length === 0 ? <EmptyState /> : <ItemList items={items} />}
```

### 6. 樣式處理

#### Tailwind CSS（推薦）
```typescript
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <Button className="bg-blue-600 hover:bg-blue-700">Click</Button>
</div>
```

#### cn 工具函數（條件樣式）
```typescript
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md',
    variant === 'primary' && 'bg-blue-600 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-900',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
/>
```

### 7. 國際化整合
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');

  return (
    <div>
      <h1>{t('form.title')}</h1>
      <Button>{tCommon('actions.save')}</Button>
    </div>
  );
}
```

### 8. 錯誤處理與 Toast
```typescript
import { useToast } from '@/components/ui';

const { toast } = useToast();

const mutation = api.project.create.useMutation({
  onSuccess: () => {
    toast({
      title: t('createSuccess'),
      variant: 'success',
    });
  },
  onError: (error) => {
    toast({
      title: t('createError'),
      description: error.message,
      variant: 'destructive',
    });
  },
});
```

## 📝 新增組件檢查清單

### UI 組件
- [ ] 放在 `ui/` 目錄
- [ ] 無業務邏輯
- [ ] 支援所有必要的 props
- [ ] 使用 Tailwind CSS
- [ ] 支援主題（如需要）
- [ ] ARIA 屬性（無障礙）

### 業務組件
- [ ] 放在對應的 `[domain]/` 目錄
- [ ] 添加 JSDoc 文檔
- [ ] 使用 `'use client'`（如需互動）
- [ ] 整合 tRPC（如需要）
- [ ] 整合國際化
- [ ] 錯誤處理
- [ ] 導出到 `index.ts`

## ⚠️ 重要約定

1. **UI 組件不可包含業務邏輯**
2. **業務組件必須有清晰的職責**（單一職責原則）
3. **所有組件必須有 TypeScript 類型定義**
4. **禁止硬編碼文字**（必須使用 i18n）
5. **表單組件必須處理載入和錯誤狀態**
6. **組件檔案名稱與組件名稱一致**（PascalCase）
7. **目錄使用 kebab-case**
8. **每個目錄有 `index.ts` 統一導出**

## 🔍 常見模式

### 表單組件模式
```typescript
export function EntityForm({ mode, initialData }: FormProps) {
  const t = useTranslations('entity');
  const router = useRouter();
  const [formData, setFormData] = useState(initialData || defaultValues);

  const createMutation = api.entity.create.useMutation({
    onSuccess: (data) => router.push(`/entities/${data.id}`),
  });

  const updateMutation = api.entity.update.useMutation({
    onSuccess: () => router.push(`/entities/${initialData.id}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mode === 'create'
      ? createMutation.mutate(formData)
      : updateMutation.mutate({ id: initialData.id, ...formData });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 列表過濾器模式
```typescript
export function EntityFilters({ onFilterChange }: FiltersProps) {
  const t = useTranslations('entity');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  return (
    <div className="flex gap-4">
      <Input onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      <Select onValueChange={(value) => setFilters({ ...filters, status: value })} />
    </div>
  );
}
```

## 相關文件
- `apps/web/src/app/[locale]/` - 使用這些組件的頁面
- `apps/web/src/lib/utils.ts` - cn 工具函數
- `apps/web/src/lib/trpc.ts` - tRPC Client
- `apps/web/src/messages/` - 翻譯檔案
