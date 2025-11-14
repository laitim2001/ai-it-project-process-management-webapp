# React Context Providers - Context 層

## 📋 目錄用途
此目錄包含 React Context Providers，提供全域狀態管理。

## 🏗️ 核心 Providers

```
providers/
└── SessionProvider.tsx    # NextAuth Session Provider
```

## 🎯 Provider 職責

### SessionProvider
**用途**: 將 NextAuth Session 提供給所有 Client Components

```typescript
'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
```

**使用位置**:
```typescript
// apps/web/src/app/[locale]/layout.tsx
import { SessionProvider } from '@/components/providers/SessionProvider';

export default async function Layout({ children }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
```

**Consumer 使用**:
```typescript
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session, status } = useSession();

  return <div>{session?.user.name}</div>;
}
```

## ⚠️ 重要約定

1. **所有 Provider 必須在 Root Layout 註冊**
2. **Provider 順序很重要**（外層 → 內層）
3. **SessionProvider 必須包裝 tRPC Provider**
4. **Provider 組件必須是 Client Component**

## 相關文件
- `packages/auth/src/` - NextAuth 配置
- `apps/web/src/lib/trpc-provider.tsx` - tRPC Provider
