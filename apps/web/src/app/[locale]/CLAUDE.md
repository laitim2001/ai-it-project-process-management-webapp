# Next.js App Router - 前端路由與頁面層

## 📋 目錄用途
此目錄包含所有用戶可訪問的頁面，使用 Next.js 14 App Router 架構，支援國際化路由。

## 🏗️ 路由結構（共 20 個路由模塊，56+ 個頁面）

```
[locale]/                    # 國際化路由組（en, zh-TW）
├── login/                   # 登入頁
├── register/                # 註冊頁
├── forgot-password/         # 忘記密碼
├── dashboard/               # 儀表板
│   ├── page.tsx             # 預設儀表板
│   ├── pm/                  # 專案經理儀表板
│   └── supervisor/          # 主管儀表板
├── projects/                # 專案管理（CRUD）
│   ├── page.tsx             # 列表頁
│   ├── new/                 # 建立頁
│   ├── [id]/                # 詳情頁
│   │   └── edit/            # 編輯頁
│   └── [id]/quotes/         # 子資源：報價單
├── proposals/               # 預算提案（CRUD + 審批）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── budget-pools/            # 預算池（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── expenses/                # 費用記錄（CRUD + 審批）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── charge-outs/             # 費用轉嫁（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── data-import/             # 數據導入 - FEAT-008
│   └── page.tsx             # Excel 數據導入頁面
├── om-expenses/             # OM 費用（CRUD）- FEAT-007 重構
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── om-expense-categories/   # OM 費用類別（CRUD）- FEAT-007
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── om-summary/              # OM Summary 報表 - CHANGE-004
│   └── page.tsx
├── operating-companies/     # 營運公司（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── purchase-orders/         # 採購單（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── quotes/                  # 報價單（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/edit/
├── vendors/                 # 供應商（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── users/                   # 用戶管理（CRUD）
│   ├── page.tsx
│   ├── new/
│   └── [id]/, [id]/edit/
├── notifications/           # 通知中心
│   └── page.tsx
├── settings/                # 用戶設定
│   ├── page.tsx             # 設定首頁
│   └── currencies/          # 幣別管理
│       └── page.tsx
└── page.tsx                 # 首頁（重定向）
```

## 🎯 核心模式與約定

### 1. 頁面檔案模板（CRUD 資源）

#### List Page (`page.tsx`)
```typescript
/**
 * @fileoverview [Entity] List Page
 * @page /[locale]/[entities]
 * @features
 * - 列表顯示（卡片/表格視圖）
 * - 搜尋（防抖 300ms）
 * - 過濾和排序
 * - 分頁
 * - CSV 導出
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useDebounce } from '@/hooks/useDebounce';

export default function [Entities]Page() {
  const t = useTranslations('[entities]');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = api.[entity].getAll.useQuery({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  return (
    <DashboardLayout>
      {/* 麵包屑導航 */}
      {/* 搜尋和過濾 */}
      {/* 資料顯示（卡片或表格） */}
      {/* 分頁控制 */}
    </DashboardLayout>
  );
}
```

#### Detail Page (`[id]/page.tsx`)
```typescript
/**
 * @fileoverview [Entity] Detail Page
 * @page /[locale]/[entities]/[id]
 */

'use client';

import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';

export default function [Entity]DetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = api.[entity].getById.useQuery({ id });

  return (
    <DashboardLayout>
      {/* 詳情顯示 */}
      {/* 操作按鈕（編輯、刪除） */}
      {/* 關聯資料 */}
    </DashboardLayout>
  );
}
```

#### Create Page (`new/page.tsx`)
```typescript
/**
 * @fileoverview Create [Entity] Page
 * @page /[locale]/[entities]/new
 */

'use client';

import { [Entity]Form } from '@/components/[entity]/[Entity]Form';

export default function Create[Entity]Page() {
  return (
    <DashboardLayout>
      <[Entity]Form mode="create" />
    </DashboardLayout>
  );
}
```

#### Edit Page (`[id]/edit/page.tsx`)
```typescript
/**
 * @fileoverview Edit [Entity] Page
 * @page /[locale]/[entities]/[id]/edit
 */

'use client';

import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import { [Entity]Form } from '@/components/[entity]/[Entity]Form';

export default function Edit[Entity]Page() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = api.[entity].getById.useQuery({ id });

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <NotFound />;

  return (
    <DashboardLayout>
      <[Entity]Form mode="edit" initialData={data} />
    </DashboardLayout>
  );
}
```

### 2. Server Component vs Client Component

#### Server Component（預設）
```typescript
// ✅ 用於：靜態內容、SEO、初始資料載入
import { auth } from '@itpm/auth';

export default async function Page() {
  const session = await auth();
  // 可以直接查詢資料庫（不推薦，應該用 tRPC）

  return <div>Server Component</div>;
}
```

#### Client Component（互動）
```typescript
// ✅ 用於：表單、互動、狀態管理、tRPC 查詢
'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';

export default function Page() {
  const [count, setCount] = useState(0);
  const { data } = api.project.getAll.useQuery({});

  return <div>Client Component</div>;
}
```

### 3. 國際化（i18n）模式

#### 使用翻譯
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('projects'); // namespace
  const tCommon = useTranslations('common');

  return (
    <div>
      <h1>{t('list.title')}</h1>
      <button>{tCommon('actions.create')}</button>
    </div>
  );
}
```

#### 翻譯鍵命名約定
```
namespace.category.subcategory.field.property

範例：
- projects.list.title
- projects.form.name.label
- projects.form.name.placeholder
- common.actions.create
- common.status.draft
```

### 4. 路由導航

#### Link 組件（推薦）
```typescript
import { Link } from '@/i18n/routing';

<Link href="/projects">專案列表</Link>
<Link href={`/projects/${id}`}>詳情</Link>
```

#### 程式化導航
```typescript
import { useRouter } from '@/i18n/routing';

const router = useRouter();
router.push('/projects');
router.push(`/projects/${id}`);
router.back();
```

### 5. 資料載入模式

#### 列表資料（分頁）
```typescript
const { data, isLoading, error } = api.project.getAll.useQuery({
  page,
  limit: 10,
  search: debouncedSearch,
  statusFilter,
});

// data 結構
{
  projects: [...],
  total: 100,
  page: 1,
  limit: 10,
  totalPages: 10
}
```

#### 單一資料（詳情）
```typescript
const { data, isLoading } = api.project.getById.useQuery(
  { id },
  {
    enabled: !!id, // 只在有 id 時執行
    refetchOnWindowFocus: false, // 避免重複請求
  }
);
```

#### Mutation（建立/更新/刪除）
```typescript
const createProject = api.project.create.useMutation({
  onSuccess: (data) => {
    toast({ title: t('createSuccess') });
    router.push(`/projects/${data.id}`);
  },
  onError: (error) => {
    toast({ title: t('createError'), description: error.message });
  },
});

const handleSubmit = (formData) => {
  createProject.mutate(formData);
};
```

### 6. 錯誤處理模式

#### 載入狀態
```typescript
if (isLoading) {
  return <LoadingSkeleton />;
}

if (error) {
  return <ErrorState message={error.message} />;
}

if (!data) {
  return <NotFound />;
}
```

#### Toast 通知
```typescript
import { useToast } from '@/components/ui';

const { toast } = useToast();

toast({
  title: t('success'),
  description: t('createSuccess'),
  variant: 'success', // success | destructive | default
});
```

### 7. 權限控制模式

#### Server Component（Layout）
```typescript
// layout.tsx
import { auth } from '@itpm/auth';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // 檢查角色權限
  if (session.user.roleId < 2) {
    redirect('/dashboard'); // 非主管無法訪問
  }

  return <div>{children}</div>;
}
```

#### Client Component
```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function Page() {
  const { data: session } = useSession();
  const canEdit = session?.user.roleId >= 2;

  return (
    <div>
      {canEdit && <EditButton />}
      {!canEdit && <p>您沒有編輯權限</p>}
    </div>
  );
}
```

## 📝 新增頁面檢查清單

- [ ] 創建目錄結構（list, new, [id], [id]/edit）
- [ ] 實現 4 個核心頁面（page.tsx）
- [ ] 添加 JSDoc 文檔（@fileoverview, @page, @features）
- [ ] 使用 `'use client'` directive（如需互動）
- [ ] 整合 tRPC 查詢（api.[entity].*.useQuery/useMutation）
- [ ] 添加國際化（useTranslations）
- [ ] 實現錯誤處理（isLoading, error, !data）
- [ ] 添加權限檢查（如需要）
- [ ] 使用 DashboardLayout 包裝
- [ ] 測試所有流程（建立、查看、編輯、刪除）

## ⚠️ 重要約定

1. **所有頁面必須使用 DashboardLayout**（除了 auth 頁面）
2. **tRPC 查詢只能在 Client Component 中**
3. **國際化必須使用 next-intl**（不要硬編碼文字）
4. **路由導航必須使用 `@/i18n/routing`**（支援 locale）
5. **表單組件應該分離到 `components/` 目錄**
6. **列表頁必須支援搜尋、過濾、分頁**
7. **詳情頁必須顯示關聯資料**
8. **編輯頁必須預載現有資料**

## 相關文件
- `apps/web/src/components/` - UI 組件
- `apps/web/src/lib/trpc.ts` - tRPC Client
- `apps/web/src/i18n/` - 國際化配置
- `apps/web/src/messages/` - 翻譯檔案
- `packages/api/src/routers/` - API Routers
