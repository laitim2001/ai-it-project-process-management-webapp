# Azure 部署故障排除指南

本文檔記錄在部署到公司 Azure 環境過程中遇到的問題、根本原因分析和解決方案。

> **最後更新**: 2025-11-26
> **適用版本**: v10+ (公司環境部署)

---

## 📋 目錄

1. [常見問題速查](#常見問題速查)
2. [問題 #1: 用戶註冊 500 錯誤 - Role 表不存在](#問題-1-用戶註冊-500-錯誤---role-表不存在)
3. [問題 #2: Currency 表不存在](#問題-2-currency-表不存在)
4. [部署前檢查清單](#部署前檢查清單)
5. [部署後驗證流程](#部署後驗證流程)

---

## 常見問題速查

| 錯誤訊息 | 可能原因 | 快速解決 |
|---------|----------|----------|
| `Role table does not exist` | Migration 未執行 | 檢查 `.dockerignore` 是否排除 migrations |
| `Currency table does not exist` | Migration SQL 缺失 | 確認 migrations 資料夾包含所有 model |
| `No migration found in prisma/migrations` | Docker image 缺少 migrations | 從 `.dockerignore` 移除 `**/migrations` |
| `Foreign key constraint failed` | Seed 未執行 | 執行 POST /api/admin/seed |

---

## 問題 #1: 用戶註冊 500 錯誤 - Role 表不存在

### 症狀
- 訪問 `/zh-TW/register` 頁面正常顯示
- 提交註冊表單後返回 500 Internal Server Error
- API 錯誤訊息: `Foreign key constraint failed on the field: User_roleId_fkey`
- 直接原因: Role 表為空或不存在

### 根本原因分析

經過深入調查，發現根本原因是 **Docker image 中缺少 Prisma migrations 檔案**：

```
原因鏈:
.dockerignore 包含 "**/migrations" 
    ↓
Docker build 時 migrations 資料夾被排除
    ↓
Container 中 /app/packages/db/prisma/migrations/ 目錄為空
    ↓
startup.sh 執行 "prisma migrate deploy" 報告 "No migration found"
    ↓
資料庫 Schema 未建立（Role、User 等表不存在）
    ↓
Seed 無法執行（依賴表結構）
    ↓
用戶註冊時 roleId 外鍵約束失敗
```

### 解決方案

#### 步驟 1: 修改 `.dockerignore`

**找到並註解/移除這行:**
```diff
# Prisma
- **/migrations
+ # **/migrations  <-- REMOVED: migrations are required for prisma migrate deploy
```

**完整修改後的 Prisma 區段:**
```ignore
# Prisma - Keep migrations for migrate deploy
# **/migrations  <-- Removed: migrations are needed for prisma migrate deploy
```

#### 步驟 2: 驗證 Docker Image 包含 Migrations

```bash
# 重建 Docker image
docker build -f docker/Dockerfile -t acritpmcompany.azurecr.io/itpm-web:latest .

# 驗證 migrations 存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/packages/db/prisma/migrations/

# 預期輸出應包含:
# 20251024082756_init/
# 20251111065801_new/
# 20251126100000_add_currency/
# migration_lock.toml
```

#### 步驟 3: 推送並重啟

```bash
# 推送到 ACR
docker push acritpmcompany.azurecr.io/itpm-web:latest

# 重啟 App Service
az webapp restart \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N

# 等待 2-3 分鐘讓 migration 執行
```

#### 步驟 4: 執行 Seed

```bash
# 使用 curl 或 PowerShell
curl -X POST "https://app-itpm-company-dev-001.azurewebsites.net/api/admin/seed" \
  -H "Authorization: Bearer <NEXTAUTH_SECRET>" \
  -H "Content-Type: application/json"

# 預期成功響應:
# {"success":true,"results":{"roles":{"processed":3},"currencies":{"processed":6}}}
```

### 驗證修復成功

```bash
# 測試用戶註冊
curl -X POST "https://app-itpm-company-dev-001.azurewebsites.net/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 預期成功響應:
# {"success":true,"message":"註冊成功","user":{...}}
```

---

## 問題 #2: Currency 表不存在

### 症狀
- Migration 報告成功執行
- 但 Seed 時報錯: `The table public.Currency does not exist`
- 日誌顯示 "2 migrations found" 但實際上需要 3 個

### 根本原因

Schema.prisma 中新增了 `Currency` model，但沒有對應的 migration SQL 檔案。

**缺失的關係:**
```
schema.prisma 定義了:
- model Currency { ... }
- BudgetPool.currencyId -> Currency
- Project.currencyId -> Currency
- PurchaseOrder.currencyId -> Currency
- Expense.currencyId -> Currency

但 migrations/ 中只有:
- 20251024082756_init (不含 Currency)
- 20251111065801_new (不含 Currency)
```

### 解決方案

#### 步驟 1: 創建新的 Migration

```bash
# 建立 migration 目錄
mkdir -p packages/db/prisma/migrations/20251126100000_add_currency
```

#### 步驟 2: 創建 Migration SQL

`packages/db/prisma/migrations/20251126100000_add_currency/migration.sql`:
```sql
-- CreateTable: Currency (FEAT-001: 專案欄位擴展 - 貨幣支援)
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");
CREATE INDEX "Currency_code_idx" ON "Currency"("code");
CREATE INDEX "Currency_active_idx" ON "Currency"("active");

-- AlterTable: Add currencyId to related tables
ALTER TABLE "BudgetPool" ADD COLUMN "currencyId" TEXT;
ALTER TABLE "Project" ADD COLUMN "currencyId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "currencyId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "currencyId" TEXT;

-- CreateIndex: Foreign key indexes
CREATE INDEX "BudgetPool_currencyId_idx" ON "BudgetPool"("currencyId");
CREATE INDEX "Project_currencyId_idx" ON "Project"("currencyId");
CREATE INDEX "PurchaseOrder_currencyId_idx" ON "PurchaseOrder"("currencyId");
CREATE INDEX "Expense_currencyId_idx" ON "Expense"("currencyId");

-- AddForeignKey
ALTER TABLE "BudgetPool" ADD CONSTRAINT "BudgetPool_currencyId_fkey" 
  FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_currencyId_fkey" 
  FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_currencyId_fkey" 
  FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_currencyId_fkey" 
  FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### 步驟 3: 確保 Schema 一致性

如果 `BudgetPool.currencyId` 在 schema.prisma 中是必填 (`String`)，需要改為可選 (`String?`) 以相容現有資料：

```prisma
model BudgetPool {
  // ...
  currencyId    String? // 改為 nullable
  currency      Currency? @relation(...)
}
```

#### 步驟 4: 重建並部署

按照問題 #1 的步驟 2-4 執行。

---

## 部署前檢查清單

### ✅ Docker 配置檢查

```bash
# 1. 確認 .dockerignore 不排除 migrations
grep -n "migrations" .dockerignore
# 確保 **/migrations 被註解或不存在

# 2. 確認 startup.sh 存在且可執行
cat docker/startup.sh
# 應包含 prisma migrate deploy 命令

# 3. 確認 Dockerfile 包含 startup.sh
grep -n "startup.sh" docker/Dockerfile
```

### ✅ Prisma 配置檢查

```bash
# 1. 確認所有 model 都有對應的 migration
ls packages/db/prisma/migrations/

# 2. 驗證 schema 和 migrations 同步
cd packages/db
npx prisma migrate status
```

### ✅ 環境變數檢查

確保 Azure App Service 設定了以下環境變數：
- `DATABASE_URL` - PostgreSQL 連接字串
- `NEXTAUTH_SECRET` - 用於 API 認證
- `NEXTAUTH_URL` - 應用 URL

---

## 部署後驗證流程

### 1. 檢查 Container 日誌

```bash
# 下載日誌
az webapp log download \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N \
  --log-file webapp-logs.zip

# 解壓並檢查
unzip webapp-logs.zip -d webapp-logs
grep -E "ITPM|Prisma|migration|migrate" webapp-logs/LogFiles/*docker*.log
```

**期望看到:**
```
🚀 ITPM 應用程式啟動
📦 執行 Prisma 資料庫遷移...
3 migrations found in prisma/migrations
Applying migration `20251024082756_init`
Applying migration `20251111065801_new`
Applying migration `20251126100000_add_currency`
All migrations have been successfully applied.
```

### 2. 執行 Seed

```bash
# PowerShell
$response = Invoke-WebRequest -Uri "https://app-itpm-company-dev-001.azurewebsites.net/api/admin/seed" `
  -Method POST `
  -Headers @{"Authorization"="Bearer <NEXTAUTH_SECRET>"; "Content-Type"="application/json"} `
  -UseBasicParsing

$response.Content
```

**期望響應:**
```json
{
  "success": true,
  "message": "Seed 成功完成",
  "results": {
    "roles": {"processed": 3, "total": 3, "errors": []},
    "currencies": {"processed": 6, "total": 6, "errors": []}
  },
  "verification": {
    "hasProjectManagerRole": true,
    "roleCount": 3,
    "currencyCount": 6
  }
}
```

### 3. 測試核心功能

```bash
# 測試首頁
curl -I "https://app-itpm-company-dev-001.azurewebsites.net/"
# 期望: 200 OK

# 測試註冊頁
curl -I "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/register"
# 期望: 200 OK

# 測試用戶註冊 API
curl -X POST "https://app-itpm-company-dev-001.azurewebsites.net/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-deploy@example.com","password":"Test123456!","name":"Deploy Test"}'
# 期望: {"success":true,...}
```

---

## 🔑 重要提示

### 為什麼 `.dockerignore` 會排除 migrations？

最初的設計考量是：
1. migrations 檔案可能很大
2. 希望減少 Docker image 大小
3. 認為 migrations 在 build 時不需要

**但這是錯誤的**，因為：
- `prisma migrate deploy` 在 runtime 需要 migrations 檔案
- 沒有 migrations，資料庫 schema 無法建立
- 這導致所有依賴資料庫的功能失敗

### 如何避免類似問題？

1. **部署後立即驗證 migrations**:
   ```bash
   docker run --rm <image> ls /app/packages/db/prisma/migrations/
   ```

2. **檢查 Container 啟動日誌**:
   - 確認看到 "X migrations found"
   - 確認看到 "All migrations have been successfully applied"

3. **執行 Seed 並驗證**:
   - POST /api/admin/seed 應返回 success
   - 確認 Role 和 Currency 數量正確

---

## 📞 獲取幫助

如果問題持續存在：

1. 檢查本文檔的所有步驟
2. 查看 `claudedocs/` 目錄中的相關修復記錄
3. 檢查 Container 日誌中的詳細錯誤訊息
4. 聯繫開發團隊

---

**文檔版本**: 1.0
**建立日期**: 2025-11-26
**維護者**: 開發團隊
