# 認證系統安裝指令

## 步驟 1: 安裝套件

請在**專案根目錄**執行以下命令:

```bash
pnpm install
```

這將會安裝所有新增的依賴項:
- @next-auth/prisma-adapter@^1.0.7
- bcryptjs@^2.4.3
- @types/bcryptjs@^2.4.6

## 步驟 2: 生成 Prisma Client

```bash
pnpm db:generate
```

或直接執行:

```bash
pnpm --filter db prisma generate
```

## 步驟 3: 創建資料庫遷移

```bash
pnpm db:migrate
```

或直接執行:

```bash
pnpm --filter db prisma migrate dev --name add-user-password
```

這將會:
1. 在 User 表中添加 `password` 欄位 (nullable String)
2. 創建遷移文件在 `packages/db/prisma/migrations/`
3. 更新 Prisma Client

## 步驟 4: 驗證安裝

執行以下命令確認一切正常:

```bash
pnpm typecheck
```

## 如果遇到問題

### 如果 pnpm 未安裝

請先安裝 pnpm:

```bash
npm install -g pnpm
```

### 如果需要清理並重新安裝

```bash
pnpm clean
pnpm install
pnpm db:generate
```

## 環境變數檢查

確保 `.env` 文件中有以下配置:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/itpm"
NEXTAUTH_SECRET="your-secret-key-here"  # 可用 openssl rand -base64 32 生成
NEXTAUTH_URL="http://localhost:3000"
```

## 完成後

執行這些命令後,我將繼續建立:
1. ✅ NextAuth API 路由處理器
2. ✅ 登入/註冊頁面
3. ✅ Session Provider
4. ✅ 認證中間件
5. ✅ tRPC protectedProcedure 整合
