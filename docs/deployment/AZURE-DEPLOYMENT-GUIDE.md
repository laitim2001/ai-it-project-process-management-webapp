# Azure 部署完整操作手冊

**專案**: IT Project Process Management Platform
**版本**: 2.1
**最後更新**: 2025-11-25
**適用環境**: Azure App Service (Docker Container)
**目標讀者**: DevOps Engineer, Developer

> **v2.1 更新**:
> - 所有部署腳本已移除 `jq` 依賴，改用 Azure CLI 原生查詢
> - 新增公司環境部署的 Prisma lazy loading 解決方案
> - 個人環境 v9-fresh-build 驗證通過

---

## 📋 目錄

1. [部署前準備](#1-部署前準備)
2. [完整部署流程](#2-完整部署流程)
3. [常見問題與解決方案](#3-常見問題與解決方案)
4. [環境變數管理](#4-環境變數管理)
5. [監控與日誌](#5-監控與日誌)
6. [回滾策略](#6-回滾策略)
7. [安全檢查清單](#7-安全檢查清單)

---

## 1. 部署前準備

### 1.1 必要工具安裝

```bash
# 1. Azure CLI (最新版本)
az --version

# 2. Docker Desktop (運行中)
docker --version
docker ps

# 3. Git (用於版本控制)
git --version

# 4. Node.js 20.x (與生產環境一致)
node --version  # 應該是 v20.11.0

# 5. pnpm 8.15.3
pnpm --version
```

### 1.2 Azure 登入與訂閱設定

```bash
# 登入 Azure
az login

# 檢查當前訂閱
az account show

# 設定正確的訂閱（如果有多個）
az account set --subscription "Your-Subscription-Name-or-ID"

# 驗證 ACR 登入
az acr login --name acritpmdev
```

### 1.3 環境變數檢查

**本地開發環境 (`.env` 檔案)**:
```bash
# 檢查所有必要的環境變數
cat .env | grep -E "(DATABASE_URL|NEXTAUTH|AZURE_AD|SENDGRID)"

# 必要變數清單:
# - DATABASE_URL (本地: PostgreSQL 5434, Azure: 5432)
# - NEXTAUTH_SECRET (至少 32 字元)
# - NEXTAUTH_URL (本地: http://localhost:3000, Azure: https://app-itpm-dev-001.azurewebsites.net)
# - AZURE_AD_TENANT_ID
# - AZURE_AD_CLIENT_ID
# - AZURE_AD_CLIENT_SECRET
# - AZURE_STORAGE_ACCOUNT_NAME
# - AZURE_STORAGE_ACCOUNT_KEY
# - SENDGRID_API_KEY
# - SENDGRID_FROM_EMAIL
```

**Azure 環境變數 (Key Vault)**:
```bash
# 檢查 Key Vault 中的 secrets
az keyvault secret list \
  --vault-name kv-itpm-dev \
  --query "[].name" \
  --output table

# 必要的 secrets:
# - ITPM-DEV-DATABASE-URL
# - ITPM-DEV-NEXTAUTH-SECRET
# - ITPM-DEV-NEXTAUTH-URL
# - ITPM-DEV-AZUREAD-TENANT-ID
# - ITPM-DEV-AZUREAD-CLIENT-ID
# - ITPM-DEV-AZUREAD-CLIENT-SECRET
# - ITPM-DEV-STORAGE-ACCOUNT-NAME
# - ITPM-DEV-STORAGE-ACCOUNT-KEY
# - ITPM-DEV-SENDGRID-API-KEY
# - ITPM-DEV-SENDGRID-FROM-EMAIL
# - ITPM-DEV-ACR-USERNAME
# - ITPM-DEV-ACR-PASSWORD
```

### 1.4 程式碼品質檢查

```bash
# 1. 確保在最新的 main/master 分支
git status
git branch
git pull origin main

# 2. 安裝依賴
pnpm install

# 3. 類型檢查
pnpm typecheck
# 確保沒有 TypeScript 錯誤

# 4. Lint 檢查
pnpm lint
# 確保沒有 ESLint 錯誤

# 5. 驗證 I18n 翻譯檔案
pnpm validate:i18n
# 確保所有翻譯 key 一致,沒有重複

# 6. 本地測試
pnpm dev
# 手動測試關鍵頁面:
# - /login
# - /register
# - /dashboard
# - /projects
```

---

## 2. 完整部署流程

### 2.1 構建 Docker 映像

**重要**: 確保使用 `Alpine 3.17` 作為基礎映像 (OpenSSL 1.1.x 相容性)

```bash
# 1. 檢查 Dockerfile (確保使用 alpine3.17)
cat docker/Dockerfile | grep "FROM node"
# 應該看到: FROM node:20-alpine3.17

# 2. 構建映像 (使用 ACR 完整名稱)
docker build -t acritpmdev.azurecr.io/itpm-web:latest -f docker/Dockerfile .

# 3. 驗證映像構建成功
docker images | grep itpm-web

# 4. (可選) 本地測試映像
docker run --rm \
  -e DATABASE_URL='postgresql://...' \
  -e NEXTAUTH_SECRET='test-secret' \
  -e NEXTAUTH_URL='http://localhost:3000' \
  -p 3001:3000 \
  acritpmdev.azurecr.io/itpm-web:latest

# 測試 http://localhost:3001
```

**構建時常見問題**:

| 問題 | 原因 | 解決方案 |
|------|------|----------|
| `Error: Cannot find module 'next/dist/compiled/send/index.js'` | Prisma Client 未生成 | 在 Dockerfile 中添加 `RUN pnpm db:generate` |
| `Error: Cannot find module '@opentelemetry/api'` | 依賴安裝不完整 | 使用 `pnpm install --frozen-lockfile` |
| `Error loading shared library libssl.so.1.1` | Alpine 版本錯誤 (使用 3.19+) | 改用 `FROM node:20-alpine3.17` |

### 2.2 推送映像到 Azure Container Registry

```bash
# 1. 確保已登入 ACR
az acr login --name acritpmdev

# 2. 推送映像
docker push acritpmdev.azurecr.io/itpm-web:latest

# 3. 驗證映像已推送
az acr repository show-tags \
  --name acritpmdev \
  --repository itpm-web \
  --output table

# 4. 檢查映像 digest (用於版本追蹤)
az acr repository show \
  --name acritpmdev \
  --image itpm-web:latest \
  --query "digest" \
  --output tsv
```

**推送時常見問題**:

| 問題 | 原因 | 解決方案 |
|------|------|----------|
| `unauthorized: authentication required` | 未登入 ACR | 執行 `az acr login --name acritpmdev` |
| `denied: requested access to the resource is denied` | 沒有 ACR 權限 | 聯繫 Azure 管理員添加 `AcrPush` 角色 |
| `timeout` | 網絡連接問題 | 檢查網絡連接,考慮使用 VPN |

### 2.3 更新 Azure App Service 環境變數

**⚠️ 重要**: Azure CLI 的 `az webapp config appsettings set` 預設會**替換所有環境變數**,必須使用以下方法避免意外清空:

#### 方法 1: 使用 `restore-azure-appsettings.sh` 腳本 (推薦)

```bash
# 執行腳本以確保所有環境變數正確設定
bash scripts/restore-azure-appsettings.sh

# 驗證環境變數
az webapp config appsettings list \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "[?name=='DATABASE_URL' || name=='NEXTAUTH_SECRET'].{name:name, hasValue:(value != null)}" \
  --output table
```

#### 方法 2: 手動添加單個環境變數 (安全)

```bash
# 只添加/更新單個環境變數,不影響其他變數
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings NEW_VARIABLE="value"
```

#### 方法 3: 批量設定 (謹慎使用)

```bash
# ⚠️ 一次設定所有變數 (會替換原有的!)
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="false" \
    DOCKER_REGISTRY_SERVER_URL="https://acritpmdev.azurecr.io" \
    NODE_ENV="production" \
    WEBSITES_PORT="3000" \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-DATABASE-URL/)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-NEXTAUTH-SECRET/)" \
    NEXTAUTH_URL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-NEXTAUTH-URL/)" \
    # ... (所有其他變數)
```

**環境變數檢查清單** (17 個必要變數):

```bash
# 1. Docker 配置 (3 個)
WEBSITES_ENABLE_APP_SERVICE_STORAGE="false"
DOCKER_REGISTRY_SERVER_URL="https://acritpmdev.azurecr.io"
DOCKER_ENABLE_CI="true"

# 2. Node.js 配置 (3 個)
NODE_ENV="production"
APP_NAME="IT Project Process Management Platform"
WEBSITES_PORT="3000"

# 3. 數據庫 (1 個)
DATABASE_URL="@Microsoft.KeyVault(...)"

# 4. NextAuth.js (2 個)
NEXTAUTH_SECRET="@Microsoft.KeyVault(...)"
NEXTAUTH_URL="@Microsoft.KeyVault(...)"

# 5. Azure AD (3 個)
AZURE_AD_TENANT_ID="@Microsoft.KeyVault(...)"
AZURE_AD_CLIENT_ID="@Microsoft.KeyVault(...)"
AZURE_AD_CLIENT_SECRET="@Microsoft.KeyVault(...)"

# 6. Azure Storage (4 個)
AZURE_STORAGE_ACCOUNT_NAME="@Microsoft.KeyVault(...)"
AZURE_STORAGE_ACCOUNT_KEY="@Microsoft.KeyVault(...)"
AZURE_STORAGE_CONTAINER_QUOTES="quotes"
AZURE_STORAGE_CONTAINER_INVOICES="invoices"

# 7. SendGrid (2 個)
SENDGRID_API_KEY="@Microsoft.KeyVault(...)"
SENDGRID_FROM_EMAIL="@Microsoft.KeyVault(...)"

# 8. ACR 認證 (2 個 - 自動設定)
DOCKER_REGISTRY_SERVER_USERNAME="@Microsoft.KeyVault(...)"
DOCKER_REGISTRY_SERVER_PASSWORD="@Microsoft.KeyVault(...)"
```

### 2.4 重啟 Azure App Service

```bash
# 1. 重啟 App Service (載入新映像)
az webapp restart \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev

# 2. 等待 30 秒讓服務完全啟動
sleep 30

# 3. 檢查應用程式狀態
az webapp show \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "state" \
  --output tsv
# 應該顯示: Running

# 4. 檢查最新的 Docker 映像
az webapp config container show \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "imageTag" \
  --output tsv
```

### 2.5 驗證部署

#### 2.5.1 健康檢查

```bash
# 1. 測試主頁
curl -I https://app-itpm-dev-001.azurewebsites.net
# 預期: HTTP/1.1 200 OK (或 307 重定向)

# 2. 測試 Login 頁面
curl -I https://app-itpm-dev-001.azurewebsites.net/zh-TW/login
# 預期: HTTP/1.1 200 OK

# 3. 測試 Register 頁面
curl -I https://app-itpm-dev-001.azurewebsites.net/zh-TW/register
# 預期: HTTP/1.1 200 OK

# 4. 測試 API 健康端點 (如果有)
curl https://app-itpm-dev-001.azurewebsites.net/api/health
```

#### 2.5.2 瀏覽器測試

使用瀏覽器訪問以下頁面並檢查:

1. **Login 頁面** (`/zh-TW/login`):
   - ✅ 頁面正常載入 (HTTP 200)
   - ✅ F12 Console 無 JavaScript 錯誤
   - ✅ Azure AD 登入按鈕顯示
   - ✅ Email/Password 登入表單顯示

2. **Register 頁面** (`/zh-TW/register`):
   - ✅ 頁面正常載入 (HTTP 200)
   - ✅ F12 Console 無錯誤
   - ✅ 所有表單欄位正確顯示
   - ✅ 表單提交功能正常

3. **Dashboard** (需登入):
   - ✅ 可以成功登入
   - ✅ Dashboard 數據正確顯示
   - ✅ 側邊欄導航正常

#### 2.5.3 檢查應用程式日誌

```bash
# 即時查看日誌 (最近 100 行)
az webapp log tail \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev

# 下載完整日誌
az webapp log download \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --log-file app-logs.zip

# 檢查是否有錯誤
unzip -p app-logs.zip | grep -i "error"
```

**常見錯誤日誌**:

| 日誌訊息 | 原因 | 解決方案 |
|----------|------|----------|
| `Error loading shared library libssl.so.1.1` | Alpine 版本錯誤 | 重新構建映像 (使用 alpine3.17) |
| `[next-auth][error][UNTRUSTED_HOST]` | NextAuth 配置錯誤 | 在 `auth.config.ts` 添加 `trustHost: true` |
| `[next-intl] MISSING_MESSAGE` | 翻譯 key 缺失 | 檢查並更新 `zh-TW.json` |
| `Error: Cannot find module 'prisma'` | Prisma Client 未生成 | 在 Dockerfile 添加 `pnpm db:generate` |

### 2.6 數據庫遷移和 Seed Data

#### 2.6.1 執行資料庫遷移

⚠️ **注意**: 只在數據庫 schema 有變更時執行

```bash
# 1. 設定 DATABASE_URL 環境變數 (使用 Azure PostgreSQL)
export DATABASE_URL='postgresql://itpmadmin:PASSWORD@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require'

# 2. 執行遷移
pnpm db:migrate

# 或者在 Docker 容器中執行
docker run --rm \
  -e DATABASE_URL='postgresql://...' \
  acritpmdev.azurecr.io/itpm-web:latest \
  pnpm db:migrate
```

#### 2.6.2 ⭐ 執行 Seed Data (關鍵步驟!)

**🚨 這是防止 Registration API 500 錯誤的關鍵步驟!**

Azure 部署後必須執行 seed data 初始化，確保 Role 和 Currency 等基礎表包含必要資料。

**為什麼必要?**
- User 表的 `roleId` 字段引用 Role 表，如果 Role 表為空，用戶註冊會失敗 (P2003 外鍵約束錯誤)
- BudgetPool 需要 Currency 表資料
- 本地環境有完整 seed data，Azure 環境只有 schema（只執行了 migration）

**執行方式一: 使用自動化腳本（推薦）**:

```bash
# 自動化腳本包含環境變數檢查、執行和驗證
./scripts/azure-seed.sh

# 預期輸出:
# ✅ 環境變數檢查通過
# ✅ 數據庫連接成功
# 🌱 Running minimal seed (基礎資料初始化)...
# ✅ 種子數據執行成功
# ✅ Role 資料驗證通過 (3 筆記錄)
# ✅ Currency 資料驗證通過 (6 筆記錄)
```

**執行方式二: 手動執行**:

```bash
# 設定環境變數
export DATABASE_URL='postgresql://itpmadmin:PASSWORD@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require'

# 執行 minimal seed（只包含 Role 和 Currency）
pnpm db:seed:minimal

# 或者在 Docker 容器中執行
docker run --rm \
  -e DATABASE_URL='postgresql://...' \
  acritpmdev.azurecr.io/itpm-web:latest \
  pnpm db:seed:minimal
```

#### 2.6.3 驗證 Seed Data

執行 seed 後，**必須驗證**基礎資料已正確插入：

```bash
# 方式一: 使用 psql 命令行
PGPASSWORD='PASSWORD' psql \
  -h psql-itpm-dev-001.postgres.database.azure.com \
  -U itpmadmin \
  -d itpm_dev \
  -c "SELECT * FROM \"Role\";"

# 預期結果（3 筆記錄）:
#  id |     name
# ----+----------------
#   1 | ProjectManager
#   2 | Supervisor
#   3 | Admin

# 驗證 Currency 表
PGPASSWORD='PASSWORD' psql \
  -h psql-itpm-dev-001.postgres.database.azure.com \
  -U itpmadmin \
  -d itpm_dev \
  -c "SELECT code, name FROM \"Currency\";"

# 預期結果（6 筆記錄）:
# code | name
# -----+--------
# TWD  | 新台幣
# USD  | 美元
# CNY  | 人民幣
# HKD  | 港幣
# JPY  | 日圓
# EUR  | 歐元
```

**檢查點**:
- [ ] Role 表包含 3 筆記錄 (ID: 1, 2, 3)
- [ ] Currency 表包含 6 筆記錄 (TWD, USD, CNY, HKD, JPY, EUR)
- [ ] 所有記錄的主鍵和欄位值正確

#### 2.6.4 Seed Data 故障排除

**問題: Seed 執行失敗**

```bash
# 檢查數據庫連接
PGPASSWORD='PASSWORD' psql \
  -h psql-itpm-dev-001.postgres.database.azure.com \
  -U itpmadmin \
  -d itpm_dev \
  -c "SELECT 1;"

# 如果連接失敗，檢查:
# 1. DATABASE_URL 環境變數是否正確
# 2. PostgreSQL 防火牆規則是否允許當前 IP
# 3. SSL 模式是否設置為 'require'
```

**問題: Seed 執行後 Role 表仍為空**

```bash
# 檢查是否有錯誤訊息
pnpm db:seed:minimal 2>&1 | grep -i "error"

# 手動插入 Role 資料（緊急修復）
PGPASSWORD='PASSWORD' psql \
  -h psql-itpm-dev-001.postgres.database.azure.com \
  -U itpmadmin \
  -d itpm_dev <<'SQL'
INSERT INTO "Role" (id, name, description) VALUES
  (1, 'ProjectManager', '專案經理'),
  (2, 'Supervisor', '主管'),
  (3, 'Admin', '系統管理員')
ON CONFLICT (id) DO NOTHING;
SQL
```

**⚠️ 重要提醒**:
- 如果跳過此步驟，用戶註冊功能將會失敗 (500 錯誤)
- Seed script 使用 upsert 模式，可以安全重複執行
- 完整的 seed data 實施總結: `claudedocs/AZURE-SEED-DATA-IMPLEMENTATION-SUMMARY.md`
- 部署檢查清單: `claudedocs/AZURE-DEPLOYMENT-CHECKLIST.md`

---

## 3. 常見問題與解決方案

本節整理了實際部署過程中遇到的所有問題及其解決方案。

### 3.1 問題 1: OpenSSL 動態連結庫缺失

**錯誤訊息**:
```
Error loading shared library libssl.so.1.1: No such file or directory (needed by /app/node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/libquery_engine-rhel-openssl-1.1.x.so.node)
```

**根本原因**:
- Prisma 引擎依賴 OpenSSL 1.1.x
- Alpine Linux 3.19+ 使用 OpenSSL 3.x (不向後兼容)
- Docker 映像使用了 `node:20-alpine` (預設是最新版本 3.19)

**解決方案**:
修改 `docker/Dockerfile`:
```dockerfile
# 錯誤寫法:
FROM node:20-alpine

# 正確寫法 (固定使用 Alpine 3.17):
FROM node:20-alpine3.17
```

**驗證**:
```bash
# 重新構建映像
docker build -t acritpmdev.azurecr.io/itpm-web:latest -f docker/Dockerfile .

# 測試映像
docker run --rm acritpmdev.azurecr.io/itpm-web:latest node --version
```

**相關檔案**:
- `docker/Dockerfile` (line 20)

---

### 3.2 問題 2: NextAuth.js UntrustedHost 錯誤

**錯誤訊息**:
```
[next-auth][error][UNTRUSTED_HOST]
https://next-auth.js.org/errors#untrusted_host app-itpm-dev-001.azurewebsites.net
```

**根本原因**:
- NextAuth.js v5 預設會檢查 HTTP `Host` header
- 在 Docker/Azure 環境中,反向代理可能會修改 Host header
- Host header 與 `NEXTAUTH_URL` 不完全匹配時會拋出錯誤

**解決方案**:
修改 `apps/web/src/auth.config.ts`:
```typescript
export const authConfig: NextAuthConfig = {
  // ... 其他配置

  // 添加 trustHost 設定
  trustHost: true,  // 允許接受任何 Host

  // ... 其他配置
};
```

**驗證**:
```bash
# 測試登入流程
curl -I https://app-itpm-dev-001.azurewebsites.net/api/auth/session
# 應該返回 200 或 401,而不是 500 錯誤
```

**相關檔案**:
- `apps/web/src/auth.config.ts` (lines 129-135)
- `packages/auth/src/index.ts` (如果使用集中式配置)

**安全考量**:
- `trustHost: true` 適用於已知安全環境 (Azure App Service)
- 生產環境建議配置明確的 `NEXTAUTH_URL`
- 確保 Azure App Service 已配置正確的 Custom Domain (如有)

---

### 3.3 問題 3: Azure CLI 意外清空所有環境變數

**問題描述**:
使用 `az webapp config appsettings set` 添加單個環境變數時,意外刪除了所有其他變數,導致應用程式無法啟動。

**根本原因**:
- Azure CLI 的 `az webapp config appsettings set` 預設行為是**替換所有環境變數**
- 不是增量更新,而是完全替換

**錯誤示例**:
```bash
# ❌ 這會刪除所有其他環境變數!
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings NEW_VARIABLE="value"
```

**解決方案 1: 使用 `restore-azure-appsettings.sh` 腳本**:

創建 `scripts/restore-azure-appsettings.sh`:
```bash
#!/bin/bash

APP_NAME="app-itpm-dev-001"
RESOURCE_GROUP="rg-itpm-dev"

# 一次設定所有環境變數 (單個命令)
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="false" \
    DOCKER_REGISTRY_SERVER_URL="https://acritpmdev.azurecr.io" \
    NODE_ENV="production" \
    # ... (所有 17 個環境變數)
```

執行腳本:
```bash
bash scripts/restore-azure-appsettings.sh
```

**解決方案 2: 使用 Azure Portal**:
1. 登入 Azure Portal
2. 進入 App Service → Configuration → Application settings
3. 手動添加/修改單個變數
4. 點擊 "Save" (不會影響其他變數)

**解決方案 3: 先讀取再更新 (PowerShell)**:
```powershell
# 1. 讀取現有變數
$settings = az webapp config appsettings list `
  --name app-itpm-dev-001 `
  --resource-group rg-itpm-dev `
  --query "[].{name:name, value:value}" | ConvertFrom-Json

# 2. 添加新變數
$settings += @{ name = "NEW_VARIABLE"; value = "value" }

# 3. 轉換為 az 命令格式
$settingsArgs = $settings | ForEach-Object { "$($_.name)=$($_.value)" }

# 4. 設定所有變數
az webapp config appsettings set `
  --name app-itpm-dev-001 `
  --resource-group rg-itpm-dev `
  --settings $settingsArgs
```

**驗證**:
```bash
# 檢查所有環境變數是否存在
az webapp config appsettings list \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "[].name" \
  --output table

# 應該看到 17+ 個變數
```

**相關檔案**:
- `scripts/restore-azure-appsettings.sh`
- `LogFiles/2025_11_21_azure_deployment_complete_summary.md` (Problem 3)

---

### 3.4 問題 4: React Hydration 錯誤 (Login Page)

**錯誤訊息** (F12 Console):
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
```

**根本原因**:
- 伺服器端渲染 (SSR) 時,`process.env.AZURE_AD_CLIENT_ID` 為空 (環境變數未載入)
- 客戶端渲染 (CSR) 時,環境變數已載入,條件渲染結果不同
- SSR HTML 與 CSR HTML 不匹配,導致 React Hydration 錯誤

**錯誤程式碼** (`apps/web/src/app/[locale]/login/page.tsx`):
```tsx
{/* ❌ 錯誤: 伺服器和客戶端可能有不同結果 */}
{process.env.AZURE_AD_CLIENT_ID && (
  <Button onClick={handleAzureLogin}>
    Azure AD Login
  </Button>
)}
```

**解決方案**:
移除環境變數條件檢查,按鈕始終顯示:
```tsx
{/* ✅ 正確: 按鈕始終顯示,避免 hydration mismatch */}
<>
  <Button onClick={handleAzureLogin}>
    Azure AD Login
  </Button>
</>
```

**驗證**:
1. 打開瀏覽器訪問 `https://app-itpm-dev-001.azurewebsites.net/zh-TW/login`
2. 按 F12 打開 Console
3. 應該**沒有紅色錯誤訊息**

**相關檔案**:
- `apps/web/src/app/[locale]/login/page.tsx` (lines 185-211)

**最佳實踐**:
- 避免在 SSR 組件中使用 `process.env` 進行條件渲染
- 使用 `'use client'` 指令將組件標記為純客戶端組件 (如果必須)
- 或者使用 `NEXT_PUBLIC_*` 環境變數 (會在構建時注入)

---

### 3.5 問題 5: Register 頁面 404 錯誤

**錯誤訊息**:
訪問 `https://app-itpm-dev-001.azurewebsites.net/zh-TW/register` 返回 404 頁面。

**根本原因**:
- Register 頁面檔案存在且完整 (253 lines)
- Docker 映像中頁面已構建成功
- **翻譯檔案 `zh-TW.json` 的 key 結構不完整**
- Page 使用嵌套 key (如 `t('name.label')`),但 `zh-TW.json` 只有扁平 key (`"name": "姓名"`)
- next-intl 找不到 key 時拋出錯誤,Next.js 捕獲錯誤並顯示 404

**錯誤的翻譯結構** (`apps/web/src/messages/zh-TW.json`):
```json
{
  "register": {
    "title": "註冊",
    "name": "姓名",  // ❌ 扁平結構
    "email": "電子郵件"
  }
}
```

**正確的翻譯結構**:
```json
{
  "register": {
    "title": "註冊",
    "name": {  // ✅ 嵌套結構
      "label": "姓名",
      "placeholder": "輸入您的姓名"
    },
    "email": {
      "label": "電子郵件",
      "placeholder": "輸入您的電子郵件"
    },
    "password": {
      "label": "密碼",
      "placeholder": "設定密碼（至少 8 個字元）"
    },
    "confirmPassword": {
      "label": "確認密碼",
      "placeholder": "再次輸入密碼"
    },
    "errors": {
      "passwordMismatch": "密碼不一致",
      "passwordTooShort": "密碼長度至少 8 個字元",
      "registerFailed": "註冊失敗，請稍後再試"
    },
    "successTitle": "註冊成功",
    "successDescription": "您的帳號已成功建立"
  }
}
```

**解決方案**:
1. 比較 `en.json` 和 `zh-TW.json` 的結構
2. 更新 `zh-TW.json` 以匹配 `en.json` 的嵌套結構
3. 添加所有缺失的翻譯 key (25+ keys)

**驗證**:
```bash
# 1. 驗證 JSON 格式
node -e "JSON.parse(require('fs').readFileSync('apps/web/src/messages/zh-TW.json', 'utf8'))"
# 沒有錯誤表示 JSON 格式正確

# 2. 驗證翻譯 key 一致性
pnpm validate:i18n
# 確保 en.json 和 zh-TW.json 的 key 完全一致

# 3. 本地測試
pnpm dev
curl http://localhost:3000/zh-TW/register
# 應該返回 200 OK (HTML 內容)

# 4. 清除 .next 快取 (如果修改後仍有問題)
rm -rf apps/web/.next
pnpm dev
```

**部署到 Azure**:
```bash
# 1. 重新構建 Docker 映像 (包含翻譯修復)
docker build -t acritpmdev.azurecr.io/itpm-web:latest -f docker/Dockerfile .

# 2. 推送到 ACR
docker push acritpmdev.azurecr.io/itpm-web:latest

# 3. 重啟 App Service
az webapp restart \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev

# 4. 等待 30 秒後驗證
sleep 30
curl -I https://app-itpm-dev-001.azurewebsites.net/zh-TW/register
# 應該返回 HTTP/1.1 200 OK
```

**相關檔案**:
- `apps/web/src/messages/zh-TW.json` (lines 227-262)
- `apps/web/src/app/[locale]/register/page.tsx`
- `scripts/validate-i18n.js` (驗證工具)

**最佳實踐**:
1. 使用 `en.json` 作為翻譯結構的範本
2. 添加新頁面時,先更新翻譯檔案,再使用翻譯 key
3. 定期執行 `pnpm validate:i18n` 檢查一致性
4. 避免在頁面中使用不存在的翻譯 key

---

## 4. 環境變數管理

### 4.1 本地開發環境 (`.env`)

```bash
# 數據庫 (注意: 本地 Docker 使用 5434)
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"

# NextAuth.js
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD (開發測試)
AZURE_AD_TENANT_ID="your-tenant-id"
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"

# Azure Storage (開發環境)
AZURE_STORAGE_ACCOUNT_NAME="devstorageaccount"
AZURE_STORAGE_ACCOUNT_KEY="dev-key"
AZURE_STORAGE_CONTAINER_QUOTES="quotes"
AZURE_STORAGE_CONTAINER_INVOICES="invoices"

# SendGrid (開發: 使用 Mailhog)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
```

### 4.2 Azure 生產環境 (Key Vault)

所有敏感資訊存儲在 Azure Key Vault (`kv-itpm-dev`):

```bash
# 添加新 secret
az keyvault secret set \
  --vault-name kv-itpm-dev \
  --name ITPM-DEV-NEW-SECRET \
  --value "secret-value"

# 在 App Service 中引用
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings \
    NEW_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-itpm-dev.vault.azure.net/secrets/ITPM-DEV-NEW-SECRET/)"
```

### 4.3 環境變數優先順序

1. **Key Vault** (最高優先順序) - 生產環境敏感資訊
2. **App Service Application Settings** - 非敏感配置
3. **Dockerfile ENV** - 預設值
4. **應用程式代碼中的預設值** - 回退值

---

## 5. 監控與日誌

### 5.1 即時日誌查看

```bash
# 即時查看應用程式日誌
az webapp log tail \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev

# 過濾錯誤日誌
az webapp log tail \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  | grep -i "error"
```

### 5.2 下載完整日誌

```bash
# 下載所有日誌 (zip 格式)
az webapp log download \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --log-file app-logs-$(date +%Y%m%d-%H%M%S).zip

# 解壓並查看
unzip app-logs-20251121-143000.zip
cat LogFiles/Application/console.log
```

### 5.3 性能監控

```bash
# 查看應用程式性能指標
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/rg-itpm-dev/providers/Microsoft.Web/sites/app-itpm-dev-001 \
  --metric "Http2xx,Http4xx,Http5xx,ResponseTime" \
  --start-time "2025-11-21T00:00:00Z" \
  --end-time "2025-11-21T23:59:59Z" \
  --interval PT1H \
  --output table
```

---

## 6. 回滾策略

### 6.1 快速回滾 (使用舊映像)

```bash
# 1. 列出所有可用的映像標籤
az acr repository show-tags \
  --name acritpmdev \
  --repository itpm-web \
  --output table

# 2. 設定 App Service 使用特定版本
az webapp config container set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --docker-custom-image-name acritpmdev.azurecr.io/itpm-web:previous-working-tag

# 3. 重啟服務
az webapp restart \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev
```

### 6.2 使用映像 Digest (精確回滾)

```bash
# 1. 查看映像 digest
az acr repository show \
  --name acritpmdev \
  --image itpm-web:latest \
  --query "digest" \
  --output tsv

# 2. 使用 digest 回滾
az webapp config container set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --docker-custom-image-name acritpmdev.azurecr.io/itpm-web@sha256:abc123...
```

### 6.3 數據庫遷移回滾

```bash
# ⚠️ 謹慎操作: 數據庫回滾可能導致數據丟失

# 1. 查看遷移歷史
pnpm prisma migrate status

# 2. 回滾到特定遷移
pnpm prisma migrate resolve --rolled-back "20251121143000_migration_name"

# 3. 或者還原數據庫快照 (推薦)
az postgres flexible-server restore \
  --resource-group rg-itpm-dev \
  --name psql-itpm-dev-001 \
  --restore-point-in-time "2025-11-21T14:00:00Z" \
  --target-server-name psql-itpm-dev-001-restore
```

---

## 7. 安全檢查清單

部署前必須完成的安全檢查:

### 7.1 敏感資訊檢查

- [ ] `.env` 檔案已添加到 `.gitignore`
- [ ] 沒有 hardcoded 的密碼、API keys 在程式碼中
- [ ] 所有 secrets 已存儲在 Azure Key Vault
- [ ] `NEXTAUTH_SECRET` 使用強隨機字符串 (≥32 字元)

### 7.2 網絡安全檢查

- [ ] PostgreSQL 防火牆規則已配置 (只允許 App Service IPs)
- [ ] Azure Storage 只允許 HTTPS 訪問
- [ ] NextAuth.js 配置了 `trustHost: true` (Azure 環境)
- [ ] CORS 設定正確 (如有前後端分離)

### 7.3 應用程式安全檢查

- [ ] 所有 API endpoints 需要驗證 (`protectedProcedure`)
- [ ] SQL 注入防護 (使用 Prisma ORM)
- [ ] XSS 防護 (React 自動轉義)
- [ ] CSRF 防護 (NextAuth.js 內建)
- [ ] Rate limiting (如有實作)

### 7.4 部署安全檢查

- [ ] Docker 映像使用固定版本標籤 (不只用 `latest`)
- [ ] 不包含不必要的開發工具在生產映像中
- [ ] 環境變數使用 Key Vault 引用,不直接存儲明文
- [ ] ACR 只允許授權用戶推送映像

---

## 8. 附錄

### 8.1 相關文檔

- **基礎設施設置**: `docs/infrastructure/azure-infrastructure-setup.md`
- **部署規劃**: `docs/deployment/azure-deployment-plan.md`
- **開發設置指南**: `DEVELOPMENT-SETUP.md`
- **問題解決總結**: `LogFiles/2025_11_21_azure_deployment_complete_summary.md`

### 8.2 有用的腳本

- **環境變數恢復**: `scripts/restore-azure-appsettings.sh`
- **環境檢查**: `scripts/check-environment.js`
- **I18n 驗證**: `scripts/validate-i18n.js`

### 8.3 聯繫資訊

遇到問題時,請聯繫:
- **DevOps Team**: devops@company.com
- **IT Support**: itsupport@company.com
- **Azure Support**: Azure Portal → Support Tickets

---

**文檔版本**: 2.0
**最後更新**: 2025-11-21
**維護者**: IT Department
