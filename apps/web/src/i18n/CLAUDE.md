# Internationalization (i18n) - 國際化配置層

## 📋 目錄用途
此目錄包含 next-intl 國際化配置，支援繁體中文和英文雙語切換。

## 🏗️ 核心檔案

```
i18n/
├── routing.ts     # 路由國際化配置
└── request.ts     # 請求處理配置
```

## 🎯 核心模式

### 1. Routing 配置
```typescript
// routing.ts
import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'zh-TW'],
  defaultLocale: 'zh-TW',
});

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
```

### 2. Request 配置
```typescript
// request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 3. 使用模式

#### Link 組件（自動加入 locale）
```typescript
import { Link } from '@/i18n/routing';

<Link href="/projects">專案列表</Link>
// 渲染為: /zh-TW/projects 或 /en/projects
```

#### 程式化導航
```typescript
import { useRouter } from '@/i18n/routing';

const router = useRouter();
router.push('/projects'); // 自動加入當前 locale
```

#### 語言切換
```typescript
import { useRouter, usePathname } from '@/i18n/routing';

const router = useRouter();
const pathname = usePathname();

const switchLocale = (newLocale: 'en' | 'zh-TW') => {
  router.replace(pathname, { locale: newLocale });
};
```

## ⚠️ 重要約定

1. **所有導航必須使用 `@/i18n/routing` 的 Link/Router**
2. **禁止使用 next/link 或 next/navigation**（會失去 locale）
3. **Locale 參數自動處理**，不需手動拼接
4. **支援的 locale**: `en`, `zh-TW`
5. **預設 locale**: `zh-TW`

## 相關文件
- `apps/web/src/messages/` - 翻譯檔案
- `apps/web/src/middleware.ts` - Locale 偵測中間件
