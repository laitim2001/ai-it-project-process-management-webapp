# 4. 統一的專案結構 (Unified Project Structure)

我們將採用由 Turborepo 管理的 Monorepo 結構。

```
/
├── apps/
│   ├── web/              # Next.js 前端應用
│   │   ├── src/
│   │   │   ├── app/      # App Router 核心目錄
│   │   │   ├── components/
│   │   │   └── ...
│   │   └── package.json
│   └── ...               # 未來可能的其他應用 (e.g., mobile)
│
├── packages/
│   ├── api/              # tRPC 後端路由與邏輯
│   │   ├── src/
│   │   │   ├── routers/  # tRPC 路由定義
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── db/               # Prisma 資料庫模型與客戶端
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── auth/             # 認證相關的邏輯與配置
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── eslint-config/    # 共用的 ESLint 設定
│   └── tsconfig/         # 共用的 TypeScript 設定
│
├── .gitignore
├── package.json          # 根目錄 package.json
├── tsconfig.json
└── turbo.json            # Turborepo 設定檔
```

**結構說明:**
*   `apps/web`: 這是使用者直接互動的 Next.js 應用。它將會導入 `packages/api` 來呼叫後端，並使用 `packages/auth` 來處理使用者會話。
*   `packages/api`: 這是我們應用的「大腦」，所有的 tRPC 路由和核心業務邏輯都在這裡定義。
*   `packages/db`: 這是我們唯一的「事實來源」，包含了 Prisma schema 文件，定義了我們的資料庫模型。
*   `packages/auth`: 處理與 **Azure AD B2C** 相關的設定和邏輯，提供統一的使用者身份驗證方法。
