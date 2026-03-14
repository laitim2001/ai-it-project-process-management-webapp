---
description: "全新環境初始化：首次在新電腦上設置專案（Docker、依賴、資料庫、種子資料）"
---

# /itpm:init — 全新環境初始化

首次在新電腦上設置本專案時使用。包含完整的初始化流程。
參考文件：docs/deployment/05-local-initialization-checklist.md

## 步驟

### 1. 環境檢查
並行檢查：
- `node -v` — 需要 >= 20.0.0
- `pnpm -v` — 需要 >= 8.0.0
- `docker --version` — Docker 必須已安裝
- `docker info` — Docker daemon 必須運行中

如果任何工具缺失或版本不足，**停下來**提供安裝指引。

### 2. .env 檔案確認
```
ls -la .env
```
- 如果不存在，提示從 `.env.example` 複製：`cp .env.example .env`
- 如果存在，確認關鍵變數：DATABASE_URL、NEXTAUTH_SECRET、NEXTAUTH_URL

### 3. Docker 服務啟動
```
docker-compose up -d
```
等待所有容器啟動，驗證：
```
docker ps --format "table {{.Names}}\t{{.Status}}"
```
確認 PostgreSQL 是 healthy 狀態。

### 4. 安裝依賴
```
pnpm install
```

### 5. Prisma Client 生成
```
cd packages/db && npx prisma generate
```

### 6. 資料庫 Schema 同步
```
cd packages/db && npx prisma db push --accept-data-loss
```
然後驗證表數量：
```
grep "^model " packages/db/prisma/schema.prisma | wc -l
```

### 7. 種子資料（關鍵！）
```
pnpm --filter db db:seed
```
這一步建立：
- 3 個角色（Admin, ProjectManager, Supervisor）
- 18 個菜單權限
- 46 筆角色權限映射
- 3 個測試帳號
- 示範業務資料

### 8. Port 檢查與 .env 調整
```
netstat -ano | grep -E ":300[0-9]" | grep LISTENING
```
如果 Port 3000 被佔用，提醒更新 .env 中的 NEXTAUTH_URL。

### 9. 啟動並驗證
```
pnpm dev
```
確認啟動成功，報告：
- 實際 URL
- 測試帳號（admin@itpm.local / admin123）
- 提醒清除瀏覽器 cookies
