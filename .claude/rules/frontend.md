# Frontend Rules - Next.js App Router

---
applies_to:
  - "apps/web/src/app/**"
  - "apps/web/src/middleware.ts"
---

## 概述
此規則適用於 Next.js App Router 頁面和路由層。

## 核心約定

### 1. 頁面結構模板
```typescript
/**
 * @fileoverview [Page Name] - [功能描述]
 * @route /[locale]/[path]
 * @features - 列出主要功能
 */

import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface PageProps {
  params: { locale: string; id?: string };
  searchParams: { [key: string]: string | undefined };
}

export default async function PageName({ params, searchParams }: PageProps) {
  const t = await getTranslations('namespace');

  return (
    <DashboardLayout>
      {/* 頁面內容 */}
    </DashboardLayout>
  );
}
```

### 2. 路由結構約定
```
app/[locale]/
├── page.tsx              # 首頁
├── layout.tsx            # 根佈局 (Providers)
├── loading.tsx           # 載入狀態
├── error.tsx             # 錯誤狀態
├── not-found.tsx         # 404 頁面
├── [feature]/
│   ├── page.tsx          # 列表頁
│   ├── new/page.tsx      # 建立頁
│   └── [id]/
│       ├── page.tsx      # 詳情頁
│       └── edit/page.tsx # 編輯頁
```

### 3. Metadata 約定
```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations('namespace');
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}
```

### 4. 伺服器組件 vs 客戶端組件
```typescript
// 伺服器組件 (預設) - 用於資料載入
export default async function ServerPage() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// 客戶端組件 - 用於互動
'use client';
export function ClientComponent({ data }: Props) {
  const [state, setState] = useState();
  return <div>...</div>;
}
```

### 5. 麵包屑導航
```typescript
// ✅ 使用模板字面量
<Link href={`/projects/${projectId}`}>{project.name}</Link>

// ❌ 錯誤：使用普通字串
<Link href="/projects/${projectId}">{project.name}</Link>
```

## 權限保護

### Middleware 路由保護
```typescript
// middleware.ts
const protectedRoutes = ['/dashboard', '/projects', '/proposals'];

export function middleware(request: NextRequest) {
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

## 禁止事項

1. ❌ 不可在頁面組件中直接進行資料庫操作
2. ❌ 不可硬編碼文字（必須使用 i18n）
3. ❌ 不可在伺服器組件中使用 React hooks
4. ❌ 不可忽略 locale 前綴
5. ❌ 不可使用普通字串作為動態 href

## 相關規則
- `components.md` - React 組件規範
- `i18n.md` - 國際化規範
