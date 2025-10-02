# 專案設置檢查清單 (Project Setup Checklist)

**版本**: 1.0
**日期**: 2025-10-02

本檢查清單涵蓋從零開始設置「IT 專案流程管理平台」所需的所有步驟。

---

## 📋 階段概覽

```mermaid
graph LR
    A[階段 0<br/>環境準備] --> B[階段 1<br/>Azure 設置]
    B --> C[階段 2<br/>專案初始化]
    C --> D[階段 3<br/>開發工具配置]
    D --> E[階段 4<br/>驗證設置]
    E --> F[✅ 開始開發]
```

**預估總時間**: 1-2 個工作日 (首次設置)

---

## 🚀 階段 0: 環境準備 (1-2 小時)

### 軟體安裝

- [ ] **Node.js 20.x LTS**
  - 下載: https://nodejs.org/
  - 驗證: `node --version` (應顯示 v20.x.x)

- [ ] **pnpm 8+**
  - 安裝: `npm install -g pnpm`
  - 驗證: `pnpm --version`

- [ ] **Git**
  - 下載: https://git-scm.com/
  - 驗證: `git --version`
  - 配置:
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@company.com"
    ```

- [ ] **Docker Desktop**
  - 下載: https://www.docker.com/products/docker-desktop
  - 驗證: `docker --version` && `docker-compose --version`
  - 啟動 Docker Desktop 並確保正在運行

- [ ] **VS Code** (推薦)
  - 下載: https://code.visualstudio.com/
  - 安裝推薦擴充套件 (開啟專案後會自動提示)

- [ ] **Azure CLI** (可選, 用於 Azure 設置)
  - Windows: `winget install Microsoft.AzureCLI`
  - macOS: `brew install azure-cli`
  - 驗證: `az --version`
  - 登入: `az login`

### 權限確認

- [ ] GitHub Repository 存取權限 (Read/Write)
- [ ] Azure 訂閱權限
  - [ ] Contributor 或 Owner 角色
  - [ ] Global Administrator (用於創建 B2C Tenant)

---

## ☁️ 階段 1: Azure 基礎設施設置 (4-6 小時)

> 📖 **詳細指南**: [azure-infrastructure-setup.md](./azure-infrastructure-setup.md)

### 1.1 資源群組創建

- [ ] 創建 Development 資源群組: `rg-itpm-dev`
- [ ] 創建 Staging 資源群組: `rg-itpm-staging`
- [ ] 創建 Production 資源群組: `rg-itpm-prod`

### 1.2 Azure AD B2C 設置 (⏱️ 1-2 小時)

- [ ] 創建 Azure AD B2C Tenant
  - [ ] Organization name: `IT Project Management`
  - [ ] Initial domain: `itpmplatform` (需全域唯一)
  - [ ] 記錄 Tenant ID

- [ ] 創建 User Flows
  - [ ] Sign-up and Sign-in Flow: `B2C_1_signupsignin1`
  - [ ] (可選) Password Reset Flow: `B2C_1_passwordreset1`
  - [ ] (可選) Profile Editing Flow: `B2C_1_profileediting1`

- [ ] 註冊應用程式
  - [ ] Application Name: `IT Project Management Platform - Dev`
  - [ ] 設置 Redirect URIs:
    - [ ] `http://localhost:3000/api/auth/callback/azure-ad-b2c`
    - [ ] Staging/Production URIs (稍後添加)
  - [ ] 創建 Client Secret (有效期 24 個月)
  - [ ] 記錄 Application (client) ID
  - [ ] 記錄 Client Secret Value ⚠️

### 1.3 Azure Database for PostgreSQL (⏱️ 30 分鐘)

**Development 環境:**
- [ ] 創建 Flexible Server: `psql-itpm-dev-001`
  - [ ] SKU: `Standard_B1ms` (1 vCore, 2GB RAM)
  - [ ] PostgreSQL 版本: 16
  - [ ] 儲存: 32GB
- [ ] 創建資料庫: `itpm_dev`
- [ ] 配置防火牆規則:
  - [ ] 允許 Azure 服務
  - [ ] 允許本地開發 IP
- [ ] 記錄連接字串

**Production 環境** (可稍後設置):
- [ ] 創建 Flexible Server: `psql-itpm-prod-001`
  - [ ] SKU: `Standard_D2s_v3` (2 vCore, 8GB RAM)
  - [ ] 啟用 High Availability
- [ ] 創建資料庫: `itpm_prod`

### 1.4 Azure Blob Storage (⏱️ 20 分鐘)

- [ ] 創建 Storage Account: `stitpmdev001`
  - [ ] SKU: Standard_LRS
  - [ ] Access Tier: Hot
- [ ] 創建 Blob Containers:
  - [ ] `quotes`
  - [ ] `invoices`
- [ ] 配置 CORS (允許前端直接上傳)
- [ ] 記錄 Connection String
- [ ] 記錄 Access Key

### 1.5 SendGrid Email 服務 (⏱️ 1-2 小時, 含域名驗證等待時間)

- [ ] 註冊 SendGrid 帳號 (或在 Azure Marketplace 訂閱)
- [ ] 創建 API Key: `ITPM Platform - Production`
  - [ ] Permissions: Mail Send (Full Access)
  - [ ] 記錄 API Key ⚠️
- [ ] 驗證發件人域名
  - [ ] 在 DNS 添加 CNAME 記錄
  - [ ] 等待驗證完成 (可能需 1-2 小時)
- [ ] (可選) 創建 Dynamic Templates
  - [ ] Proposal Submitted
  - [ ] Proposal Approved
  - [ ] Proposal Rejected
  - [ ] More Information Required

### 1.6 Azure Application Insights (⏱️ 15 分鐘)

- [ ] 創建 Application Insights: `appi-itpm-prod`
- [ ] 記錄 Connection String
- [ ] 記錄 Instrumentation Key

### 1.7 Azure App Service + Container Registry (⏱️ 30 分鐘)

**App Service Plan:**
- [ ] Development: `plan-itpm-dev` (SKU: B1)
- [ ] Production: `plan-itpm-prod` (SKU: P1v3)

**Web App:**
- [ ] Development: `app-itpm-dev-001`
- [ ] Production: `app-itpm-prod-001`
  - [ ] 創建 Staging Slot

**Container Registry:**
- [ ] 創建 ACR: `acritpmprod001`
- [ ] 記錄登入憑證

### 1.8 Azure Key Vault (⏱️ 15 分鐘, 僅 Production)

- [ ] 創建 Key Vault: `kv-itpm-prod-001`
- [ ] 添加 Secrets:
  - [ ] `DATABASE-URL`
  - [ ] `NEXTAUTH-SECRET`
  - [ ] `SENDGRID-API-KEY`
  - [ ] `AZURE-AD-B2C-CLIENT-SECRET`

---

## 💻 階段 2: 本地專案初始化 (30 分鐘)

### 2.1 克隆專案

```bash
# 克隆 Repository
git clone <repository-url>
cd ai-it-project-process-management-webapp

# 驗證檔案存在
ls -la  # 應看到 README.md, docker-compose.yml, .env.example 等
```

- [ ] 專案已成功克隆
- [ ] 確認所有基礎檔案存在

### 2.2 安裝相依套件

```bash
# 安裝所有 workspace 的相依套件
pnpm install
```

- [ ] `pnpm install` 執行成功
- [ ] 無錯誤訊息

### 2.3 環境變數設置

```bash
# 複製環境變數樣板
cp .env.example .env

# 使用編輯器開啟
code .env  # VS Code
```

**必填變數:**

- [ ] `DATABASE_URL`
  ```bash
  # 本地開發 (Docker)
  DATABASE_URL="postgresql://postgres:localdev123@localhost:5432/itpm_dev"

  # 或使用 Azure (如已設置)
  DATABASE_URL="postgresql://itpmadmin:YourPassword@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"
  ```

- [ ] `NEXTAUTH_SECRET`
  ```bash
  # 生成密鑰
  # macOS/Linux:
  openssl rand -base64 32

  # Windows (PowerShell):
  # [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

  NEXTAUTH_SECRET="<生成的密鑰>"
  ```

- [ ] `NEXTAUTH_URL`
  ```bash
  NEXTAUTH_URL="http://localhost:3000"
  ```

- [ ] Azure AD B2C 設定 (從階段 1.2 獲取)
  ```bash
  AZURE_AD_B2C_TENANT_NAME="itpmplatform"
  AZURE_AD_B2C_CLIENT_ID="<Application (client) ID>"
  AZURE_AD_B2C_CLIENT_SECRET="<Client Secret Value>"
  AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signupsignin1"
  ```

- [ ] (可選) SendGrid 設定
  ```bash
  SENDGRID_API_KEY="SG.xxxx"
  SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
  ```

- [ ] (可選) Azure Storage 設定
  ```bash
  AZURE_STORAGE_ACCOUNT_NAME="stitpmdev001"
  AZURE_STORAGE_ACCOUNT_KEY="<Access Key>"
  ```

### 2.4 啟動 Docker 服務

```bash
# 啟動所有服務
docker-compose up -d

# 驗證服務狀態
docker-compose ps
```

**預期輸出:**
- [ ] `itpm-postgres-dev` - Up (healthy)
- [ ] `itpm-pgadmin` - Up
- [ ] `itpm-redis-dev` - Up (healthy)
- [ ] `itpm-mailhog` - Up

**測試連線:**
- [ ] PostgreSQL: `docker exec -it itpm-postgres-dev psql -U postgres -c "SELECT version();"`
- [ ] pgAdmin: http://localhost:5050 (帳密: admin@itpm.local / admin123)
- [ ] Mailhog: http://localhost:8025

---

## 🛠️ 階段 3: 開發工具配置 (15 分鐘)

### 3.1 VS Code 設定

- [ ] 開啟專案資料夾: `code .`
- [ ] 安裝推薦擴充套件 (會自動提示)
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Prisma
  - [ ] Tailwind CSS IntelliSense
  - [ ] 其他 (見 `.vscode/extensions.json`)

### 3.2 Git Hooks 設置 (需專案初始化後)

```bash
# 安裝 Husky (會在專案初始化時完成)
# pnpm add -D husky lint-staged
# npx husky install
```

- [ ] Pre-commit hook 已設置
- [ ] Commit-msg hook 已設置 (commitlint)

---

## ✅ 階段 4: 驗證設置 (15 分鐘)

### 4.1 基礎驗證

```bash
# 1. 類型檢查 (需專案初始化後)
# pnpm typecheck

# 2. Lint 檢查
# pnpm lint

# 3. 格式化檢查
# pnpm format:check
```

- [ ] 所有檢查通過 (或在專案初始化後執行)

### 4.2 Docker 服務驗證

- [ ] PostgreSQL 可連接
  ```bash
  docker exec -it itpm-postgres-dev psql -U postgres -d itpm_dev -c "\dt"
  ```

- [ ] Redis 可連接
  ```bash
  docker exec -it itpm-redis-dev redis-cli ping
  # 應回應: PONG
  ```

### 4.3 Azure 服務驗證

- [ ] Azure AD B2C
  - [ ] 前往 User Flows 並執行測試
  - [ ] 確認登入流程正常

- [ ] PostgreSQL (Azure)
  ```bash
  psql "postgresql://itpmadmin:password@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require" -c "SELECT version();"
  ```

- [ ] Blob Storage
  ```bash
  az storage blob list --container-name quotes --account-name stitpmdev001
  ```

- [ ] SendGrid (發送測試郵件)
  - [ ] 使用 SendGrid Dashboard 發送測試郵件
  - [ ] 確認郵件成功送達

### 4.4 文檔檢查

- [ ] 已閱讀 [README.md](../README.md)
- [ ] 已閱讀 [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [ ] 已閱讀 [local-dev-setup.md](./local-dev-setup.md)
- [ ] 已閱讀 [azure-infrastructure-setup.md](./azure-infrastructure-setup.md)

---

## 🎯 下一步: 開始開發

完成所有檢查清單後, 你已準備好開始開發! 接下來的步驟:

### Story 1.1: 專案初始化與基礎架構設定

參考: [docs/stories/epic-1-platform-foundation-and-user-authentication/story-1.1-project-initialization-and-infrastructure-setup.md](../stories/epic-1-platform-foundation-and-user-authentication/story-1.1-project-initialization-and-infrastructure-setup.md)

**任務:**
- [ ] 初始化 Turborepo monorepo
- [ ] 創建 `apps/web` 目錄 (Next.js 14 App Router)
- [ ] 創建 `packages/api` 目錄 (tRPC)
- [ ] 創建 `packages/db` 目錄 (Prisma)
- [ ] 創建 `packages/auth` 目錄 (Azure AD B2C)
- [ ] 創建 `packages/eslint-config` (共享 ESLint)
- [ ] 創建 `packages/tsconfig` (共享 TypeScript 配置)
- [ ] 設置 Turborepo 配置 (`turbo.json`)
- [ ] 設置根 `package.json` 的 scripts
- [ ] 驗證 `pnpm dev` 可啟動開發伺服器

---

## 📝 設置完成確認

**日期**: ____________

**設置人員**: ____________

**環境:**
- [ ] Local Development 環境已設置
- [ ] Azure Development 環境已設置
- [ ] Azure Staging 環境已設置 (可選)
- [ ] Azure Production 環境已設置 (可稍後)

**已記錄的憑證與 URLs:**
- [ ] 所有 Azure 資源 IDs 已記錄
- [ ] 所有 Connection Strings 已安全保存
- [ ] 所有 API Keys 已安全保存
- [ ] .env 檔案已正確設置 (且未提交到 Git)

**團隊通知:**
- [ ] 已通知團隊成員設置完成
- [ ] 已分享 Azure 資源存取權限
- [ ] 已建立開發溝通頻道 (Teams/Slack)

---

## 🆘 遇到問題?

- 📖 查看 [Troubleshooting Guide](./local-dev-setup.md#常見問題排查)
- 💬 在 Teams #itpm-dev-support 頻道提問
- 📧 聯繫 dev-team@company.com

---

**檢查清單版本**: 1.0
**最後更新**: 2025-10-02
