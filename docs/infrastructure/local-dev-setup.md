# 本地開發環境設置指南

**版本**: 1.0
**日期**: 2025-10-02
**適用對象**: 開發團隊成員

---

## 📋 目錄

1. [前置需求](#前置需求)
2. [首次設置](#首次設置)
3. [Docker 服務配置](#docker-服務配置)
4. [資料庫設置](#資料庫設置)
5. [環境變數詳解](#環境變數詳解)
6. [Azure 服務本地開發配置](#azure-服務本地開發配置)
7. [常見問題排查](#常見問題排查)

---

## 1. 前置需求

### 必須安裝的軟體

| 軟體 | 最低版本 | 推薦版本 | 下載連結 | 驗證指令 |
|------|---------|---------|---------|---------|
| **Node.js** | 18.x | 20.x LTS | [nodejs.org](https://nodejs.org/) | `node --version` |
| **pnpm** | 8.0 | 8.x+ | `npm install -g pnpm` | `pnpm --version` |
| **Git** | 2.30+ | Latest | [git-scm.com](https://git-scm.com/) | `git --version` |
| **Docker Desktop** | 4.0+ | Latest | [docker.com](https://www.docker.com/products/docker-desktop) | `docker --version` |
| **VS Code** | - | Latest | [code.visualstudio.com](https://code.visualstudio.com/) | - |

### 推薦安裝的工具

- **Azure CLI**: `winget install Microsoft.AzureCLI` (Windows)
- **Postman/Insomnia**: API 測試工具 (可選, tRPC 已有端到端類型安全)
- **TablePlus/DBeaver**: 資料庫 GUI 工具 (可選, 已有 pgAdmin 和 Prisma Studio)

---

## 2. 首次設置

### Step 1: 克隆專案

```bash
# 使用 HTTPS
git clone https://github.com/your-org/ai-it-project-process-management-webapp.git
cd ai-it-project-process-management-webapp

# 或使用 SSH
git clone git@github.com:your-org/ai-it-project-process-management-webapp.git
cd ai-it-project-process-management-webapp
```

### Step 2: 安裝相依套件

```bash
# 使用 pnpm (推薦)
pnpm install

# 預期輸出: 安裝所有 workspace 的相依套件
# 耗時約 2-5 分鐘 (取決於網路速度)
```

**⚠️ 重要**: 請務必使用 `pnpm`, 不要使用 `npm` 或 `yarn`, 以確保與團隊的 lock file 一致。

### Step 3: 設置環境變數

```bash
# 複製範例檔案
cp .env.example .env

# 使用編輯器打開 .env
code .env  # VS Code
# 或
notepad .env  # Windows 記事本
```

**最小必填變數** (本地開發):

```bash
# Database (保持預設即可)
DATABASE_URL="postgresql://postgres:localdev123@localhost:5432/itpm_dev"

# NextAuth (需要生成)
NEXTAUTH_SECRET="<執行下方指令生成>"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD B2C (暫時可留空, 稍後配置)
AZURE_AD_B2C_TENANT_NAME=""
AZURE_AD_B2C_CLIENT_ID=""
AZURE_AD_B2C_CLIENT_SECRET=""
AZURE_AD_B2C_PRIMARY_USER_FLOW=""

# SendGrid (本地開發使用 Mailhog, 可留空)
SENDGRID_API_KEY=""
```

**生成 NEXTAUTH_SECRET**:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 4: 啟動 Docker 服務

```bash
# 啟動所有服務 (PostgreSQL, pgAdmin, Redis, Mailhog)
docker-compose up -d

# 驗證服務運行狀態
docker-compose ps

# 預期輸出:
# NAME                   STATUS              PORTS
# itpm-postgres-dev      Up (healthy)        0.0.0.0:5432->5432/tcp
# itpm-pgadmin           Up                  0.0.0.0:5050->80/tcp
# itpm-redis-dev         Up (healthy)        0.0.0.0:6379->6379/tcp
# itpm-mailhog           Up                  0.0.0.0:1025->1025/tcp, 0.0.0.0:8025->8025/tcp
```

### Step 5: 初始化資料庫

```bash
# 執行資料庫遷移 (會自動創建所有資料表)
pnpm prisma migrate dev

# 輸入遷移名稱 (例如: init)
# Enter a name for the new migration: › init

# (可選) 填充種子資料
pnpm prisma db seed

# 開啟 Prisma Studio 檢視資料
pnpm prisma studio
# 瀏覽器會自動開啟 http://localhost:5555
```

### Step 6: 啟動開發伺服器

```bash
# 啟動所有服務 (Next.js, tRPC API)
pnpm dev

# 預期輸出:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# - Ready in 3.2s
```

### Step 7: 驗證設置成功

開啟瀏覽器訪問:

- ✅ **應用程式**: http://localhost:3000
- ✅ **Prisma Studio**: http://localhost:5555 (需先執行 `pnpm prisma studio`)
- ✅ **pgAdmin**: http://localhost:5050 (帳號: `admin@itpm.local` / 密碼: `admin123`)
- ✅ **Mailhog** (Email 測試): http://localhost:8025

---

## 3. Docker 服務配置

### 服務概覽

| 服務 | 容器名稱 | 端口 | 用途 | 必要性 |
|------|---------|------|------|-------|
| PostgreSQL | `itpm-postgres-dev` | 5432 | 主資料庫 | ✅ 必要 |
| pgAdmin | `itpm-pgadmin` | 5050 | 資料庫 GUI 管理 | 🟡 可選 |
| Redis | `itpm-redis-dev` | 6379 | 快取/Session | 🟡 可選 (未來使用) |
| Mailhog | `itpm-mailhog` | 1025 (SMTP), 8025 (Web) | 本地 Email 測試 | 🟡 可選 |

### 常用 Docker 指令

```bash
# 啟動所有服務
docker-compose up -d

# 停止所有服務
docker-compose down

# 查看日誌
docker-compose logs -f postgres     # PostgreSQL 日誌
docker-compose logs -f --tail=100   # 所有服務最近 100 行日誌

# 重啟特定服務
docker-compose restart postgres

# 進入容器 Shell
docker exec -it itpm-postgres-dev psql -U postgres -d itpm_dev

# 清理所有資料 (⚠️ 慎用!)
docker-compose down -v  # 會刪除所有 volumes
```

### 如果不想使用某些服務

編輯 `docker-compose.yml`, 註解掉不需要的服務:

```yaml
# pgAdmin (可註解)
# pgadmin:
#   image: dpage/pgadmin4:latest
#   ...

# Redis (可註解)
# redis:
#   image: redis:7-alpine
#   ...
```

---

## 4. 資料庫設置

### 使用 pgAdmin 連接資料庫

1. 開啟 http://localhost:5050
2. 登入 (帳號: `admin@itpm.local`, 密碼: `admin123`)
3. 點擊 "Add New Server"
4. 填寫以下資訊:

   **General 標籤**:
   - Name: `ITPM Dev Database`

   **Connection 標籤**:
   - Host: `postgres` (⚠️ 不是 localhost, 因為在 Docker 網路內)
   - Port: `5432`
   - Username: `postgres`
   - Password: `localdev123`
   - Save password: ✅ 勾選

### 使用 Prisma Studio 管理資料

```bash
# 啟動 Prisma Studio
pnpm prisma studio

# 瀏覽器開啟 http://localhost:5555
# 可以直接新增/編輯/刪除資料, 非常適合測試
```

### 資料庫遷移管理

```bash
# 創建新的遷移
pnpm prisma migrate dev --name add_new_field

# 查看遷移狀態
pnpm prisma migrate status

# 重置資料庫 (開發環境, ⚠️ 會刪除所有資料)
pnpm prisma migrate reset

# 僅推送 schema 變更 (不創建遷移文件)
pnpm prisma db push  # 僅用於快速原型開發
```

---

## 5. 環境變數詳解

### Database 相關

```bash
# 本地開發 (Docker)
DATABASE_URL="postgresql://postgres:localdev123@localhost:5432/itpm_dev"

# Azure 開發環境 (如需連接遠端資料庫)
DATABASE_URL="postgresql://[username]:[password]@[server].postgres.database.azure.com:5432/[dbname]?sslmode=require"

# 測試資料庫 (獨立的測試環境)
TEST_DATABASE_URL="postgresql://postgres:localdev123@localhost:5432/itpm_test"
```

### Azure AD B2C 配置

在 [Azure Portal](https://portal.azure.com) 完成設置後填寫:

```bash
AZURE_AD_B2C_TENANT_NAME="yourcompany"         # 你的 Tenant 名稱
AZURE_AD_B2C_CLIENT_ID="xxxx-xxxx-xxxx-xxxx"   # Application (client) ID
AZURE_AD_B2C_CLIENT_SECRET="your-secret-value"  # Client secret value
AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signupsignin"  # User flow 名稱
```

詳細設置步驟見 [azure-infrastructure-setup.md](./azure-infrastructure-setup.md#azure-ad-b2c-設置)

### Email 服務 (本地開發)

**選項 1: 使用 Mailhog (推薦本地開發)**

所有發送的 Email 會被 Mailhog 攔截, 可在 http://localhost:8025 查看。

```bash
# 使用 Mailhog SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASSWORD=""
```

**選項 2: 使用真實 SendGrid**

```bash
SENDGRID_API_KEY="SG.xxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

---

## 6. Azure 服務本地開發配置

### Azure Blob Storage 模擬

**選項 1: 使用 Azurite (Azure Storage Emulator)**

```bash
# 安裝 Azurite
npm install -g azurite

# 啟動 Blob Storage 模擬器
azurite --silent --location ./azurite-data --blobPort 10000

# 在 .env 中配置
AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true;DevelopmentStorageProxyUri=http://127.0.0.1"
```

**選項 2: 直接使用 Azure 開發環境的 Storage**

在 Azure Portal 創建 Storage Account 後:

```bash
AZURE_STORAGE_ACCOUNT_NAME="yourdevstorageaccount"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;"
```

### Azure Application Insights (可選)

本地開發建議關閉以減少雜訊:

```bash
# 留空即不啟用
AZURE_APP_INSIGHTS_CONNECTION_STRING=""
```

---

## 7. 常見問題排查

### ❌ `pnpm install` 失敗

**錯誤**: `ERR_PNPM_FETCH_404`

**解決方案**:
```bash
# 清理 pnpm cache
pnpm store prune

# 刪除 node_modules 和 lock file
rm -rf node_modules pnpm-lock.yaml

# 重新安裝
pnpm install
```

### ❌ Docker 容器無法啟動

**錯誤**: `port is already allocated`

**解決方案**:
```bash
# 檢查端口佔用 (Windows)
netstat -ano | findstr :5432

# 停止佔用端口的程序, 或修改 docker-compose.yml 的端口映射
# 例如: "5433:5432" (將主機端口改為 5433)
```

**錯誤**: `Cannot connect to the Docker daemon`

**解決方案**:
- 確保 Docker Desktop 正在運行
- Windows: 檢查 WSL2 是否啟用

### ❌ Prisma 遷移失敗

**錯誤**: `P1001: Can't reach database server`

**解決方案**:
```bash
# 1. 確認 PostgreSQL 容器正在運行
docker-compose ps postgres

# 2. 驗證 DATABASE_URL 正確
echo $DATABASE_URL  # Linux/macOS
echo %DATABASE_URL%  # Windows CMD

# 3. 測試資料庫連線
docker exec -it itpm-postgres-dev psql -U postgres -c "SELECT version();"
```

### ❌ Next.js 啟動失敗

**錯誤**: `Module not found: Can't resolve '@/...'`

**解決方案**:
```bash
# 重新生成 TypeScript 類型
pnpm prisma generate

# 重啟 TypeScript 伺服器 (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# 清理建置快取
rm -rf .next .turbo
pnpm dev
```

### ❌ tRPC 類型推導失敗

**錯誤**: 前端調用 API 時無自動完成

**解決方案**:
```bash
# 1. 確保 packages/api 已正確建置
pnpm build --filter=api

# 2. 重新生成 Prisma Client
pnpm prisma generate

# 3. 重啟開發伺服器
pnpm dev
```

### ⚠️ Azure AD B2C 登入重定向錯誤

**錯誤**: `redirect_uri_mismatch`

**解決方案**:
1. 檢查 `.env` 中的 `NEXTAUTH_URL` 是否正確
2. 在 Azure Portal 的 B2C 應用程式中, 確認 Redirect URIs 包含:
   - `http://localhost:3000/api/auth/callback/azure-ad-b2c`

### 💡 如何切換到 Azure 開發資料庫?

```bash
# 1. 在 Azure Portal 找到 PostgreSQL 連接字串
# 2. 修改 .env
DATABASE_URL="postgresql://username:password@server.postgres.database.azure.com:5432/dbname?sslmode=require"

# 3. 執行遷移
pnpm prisma migrate deploy  # 生產模式, 不會重置資料
```

---

## 📞 需要協助?

- 📧 Email: dev-team@company.com
- 💬 Teams: #itpm-dev-support
- 📖 文檔: [內部 Wiki](https://wiki.company.com/itpm)

---

**下一步**: 閱讀 [Azure Infrastructure Setup Guide](./azure-infrastructure-setup.md)
