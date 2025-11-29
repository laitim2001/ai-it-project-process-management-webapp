# Next.js API Routes - API 路由層

## 📋 目錄用途
此目錄包含 Next.js API Routes，處理檔案上傳、tRPC HTTP handler 和 NextAuth 端點。

## 🏗️ 結構

```
api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts          # NextAuth.js API endpoint
├── trpc/
│   └── [trpc]/
│       └── route.ts          # tRPC HTTP handler
└── upload/
    ├── quote/route.ts        # 報價單上傳
    ├── invoice/route.ts      # 發票上傳
    └── proposal/route.ts     # 提案上傳
```

## 🎯 核心模式

### 1. tRPC Handler
```typescript
// trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@itpm/api';
import { auth } from '@itpm/auth';

const handler = async (req: Request) => {
  const session = await auth();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ session, prisma }),
  });
};

export { handler as GET, handler as POST };
```

### 2. File Upload Route
```typescript
// upload/quote/route.ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  // 驗證檔案
  if (!file || file.size > 10 * 1024 * 1024) {
    return new Response('Invalid file', { status: 400 });
  }

  // 上傳到 Azure Blob Storage
  const url = await uploadToBlob(file);

  return Response.json({ url });
}
```

## ⚠️ 重要約定

1. **所有 Route Handler 必須檢查 Session**
2. **檔案上傳必須限制大小**（10MB）
3. **使用 Response.json() 返回 JSON**
4. **錯誤必須返回適當的 HTTP 狀態碼**

## 相關文件
- `packages/api/src/root.ts` - tRPC AppRouter
- `packages/auth/src/` - NextAuth 配置
