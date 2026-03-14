---
description: "切換電腦時的例行同步：拉取最新代碼、安裝依賴、同步資料庫、啟動服務"
---

# /itpm:sync — 跨電腦開發同步

你正在協助使用者在兩台電腦間切換開發時，執行完整的同步流程。
請按順序執行以下步驟，每步都報告結果，遇到問題就停下來說明。

## 步驟

### 1. Git 同步
```
git fetch origin
git status
```
- 如果本地有未提交的變更，**停下來**詢問使用者要先 commit 還是 stash
- 如果落後 remote，執行 `git pull origin main`
- 報告同步結果（多少 commits、哪些檔案變更）

### 2. 依賴檢查
```
pnpm install
```
- 如果 lockfile 有變更，需要重新安裝
- 如果沒有變更，跳過此步

### 3. Prisma Client 重新生成
```
cd packages/db && npx prisma generate
```
- 如果 schema.prisma 有變更，必須重新生成

### 4. 資料庫 Schema 同步
```
cd packages/db && npx prisma migrate status
```
- 如果有未套用的遷移，執行 `npx prisma migrate deploy`
- 如果 Schema 不一致，提醒使用者可能需要 `npx prisma db push`

### 5. Docker 服務確認
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
- 確認 5 個容器都在運行：itpm-postgres-dev, itpm-redis-dev, itpm-mailhog, itpm-azurite-dev, itpm-pgadmin
- 如果有容器未運行，執行 `docker-compose up -d`

### 6. 環境變數確認
- 檢查 .env 中的 NEXTAUTH_URL Port 是否與可用 Port 一致
- 檢查 Port 3000 是否被佔用，如果是，提醒更新 NEXTAUTH_URL

### 7. 啟動開發服務器
```
pnpm dev
```
- 確認啟動成功並報告實際使用的 Port

### 8. 輸出同步摘要
用表格格式報告：
- Git 狀態（幾個新 commit）
- 依賴狀態（是否有更新）
- 資料庫狀態（Schema 是否同步）
- Docker 狀態（幾個容器運行）
- 應用狀態（實際 URL）
