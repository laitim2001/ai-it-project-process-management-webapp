# Components Rules - React 組件規範

---
applies_to:
  - "apps/web/src/components/**"
---

## 概述
此規則適用於所有 React 組件開發。

## 組件分類

### 1. UI 組件 (`ui/`)
- **用途**: 原子級、可重用、無業務邏輯的 UI 元素
- **特性**: 基於 shadcn/ui + Radix UI
- **詳細規範**: 見 `ui-design-system.md`

### 2. 業務組件 (`[domain]/`)
- **用途**: 特定業務領域的組件，包含業務邏輯
- **命名約定**:
  - 目錄名：kebab-case（例: `budget-pool/`, `project/`）
  - 組件名：PascalCase（例: `ProjectForm.tsx`）

### 3. 佈局組件 (`layout/`)
- **用途**: 頁面佈局和導航結構
- **核心組件**: DashboardLayout, Sidebar, TopBar

## 組件檔案結構模板

```typescript
/**
 * @fileoverview [Component Name] - [簡短描述]
 * @component [ComponentName]
 * @features - 列出主要功能
 */

'use client'; // 如需互動

// Imports (順序：React → 外部庫 → 內部模組)
import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

// Types
interface ComponentProps {
  mode?: 'create' | 'edit';
  initialData?: EntityType;
  onSuccess?: () => void;
}

// Component
export function ComponentName({ mode = 'create', initialData, onSuccess }: ComponentProps) {
  // 1. Translations
  const t = useTranslations('namespace');

  // 2. State
  const [formData, setFormData] = useState(initialData || {});

  // 3. Queries/Mutations
  const { data } = api.entity.getAll.useQuery({});
  const mutation = api.entity.create.useMutation();

  // 4. Handlers
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  }, [formData, mutation]);

  // 5. Render
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Props 類型定義

```typescript
// ✅ 使用 interface（推薦）
interface ButtonProps {
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
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

## 狀態管理模式

### Local State
```typescript
const [isOpen, setIsOpen] = useState(false);
const [search, setSearch] = useState('');
```

### Form State
```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Server State (tRPC)
```typescript
const { data, isLoading, error } = api.project.getAll.useQuery({});
const mutation = api.project.create.useMutation({
  onSuccess: () => router.push('/projects'),
  onError: (error) => toast({ title: 'Error', description: error.message }),
});
```

## 樣式處理

### Tailwind CSS
```typescript
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <Button className="bg-blue-600 hover:bg-blue-700">Click</Button>
</div>
```

### cn 工具函數（條件樣式）
```typescript
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md',
    variant === 'primary' && 'bg-blue-600 text-white',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
/>
```

## 條件渲染模式

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

## Toast 錯誤處理

```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

const mutation = api.project.create.useMutation({
  onSuccess: () => {
    toast({ title: t('createSuccess'), variant: 'success' });
  },
  onError: (error) => {
    toast({ title: t('createError'), description: error.message, variant: 'destructive' });
  },
});
```

## 新增組件檢查清單

### UI 組件
- [ ] 放在 `ui/` 目錄
- [ ] 無業務邏輯
- [ ] 支援 Light/Dark 主題
- [ ] ARIA 屬性（無障礙）

### 業務組件
- [ ] 放在對應的 `[domain]/` 目錄
- [ ] 添加 JSDoc 文檔
- [ ] 使用 `'use client'`（如需互動）
- [ ] 整合 tRPC 和 i18n
- [ ] 錯誤處理

## 禁止事項

1. ❌ UI 組件不可包含業務邏輯
2. ❌ 禁止硬編碼文字（必須使用 i18n）
3. ❌ 表單組件必須處理載入和錯誤狀態
4. ❌ 避免內聯箭頭函數（性能考量）
5. ❌ 不可混用命名約定（保持一致）

## 相關規則
- `ui-design-system.md` - UI 設計系統
- `i18n.md` - 國際化規範
- `typescript.md` - TypeScript 約定
