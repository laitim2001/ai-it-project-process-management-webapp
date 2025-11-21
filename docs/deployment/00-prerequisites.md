# Azure 部署前置條件

**最後更新**: 2025-11-20
**適用環境**: Development, Staging, Production

---

## 📋 目錄

- [必需工具](#必需工具)
- [Azure 訂閱與權限](#azure-訂閱與權限)
- [本地環境設置](#本地環境設置)
- [Azure 服務需求](#azure-服務需求)
- [第三方服務](#第三方服務)
- [檢查清單](#檢查清單)

---

## 🛠️ 必需工具

### 1. 開發工具

| 工具 | 最低版本 | 推薦版本 | 安裝指令 |
|------|---------|---------|---------|
| **Node.js** | 20.0.0 | 20.11.0 | `nvm install 20.11.0` |
| **pnpm** | 8.0.0 | 8.15.3 | `npm install -g pnpm@8.15.3` |
| **Docker** | 20.10.0 | 最新 | [官方網站](https://www.docker.com/) |
| **Git** | 2.30.0 | 最新 | [官方網站](https://git-scm.com/) |

### 2. Azure 工具

| 工具 | 用途 | 安裝指令 |
|------|------|---------|
| **Azure CLI** | Azure 資源管理 | [安裝指南](https://docs.microsoft.com/cli/azure/install-azure-cli) |
| **Azure Functions Core Tools** | 本地測試（可選） | `npm install -g azure-functions-core-tools@4` |

**驗證 Azure CLI 安裝**:
```bash
az version
az login
az account show
```

### 3. 其他工具

| 工具 | 用途 | 安裝指令 |
|------|------|---------|
| **jq** | JSON 處理 | `brew install jq` (macOS) 或 `choco install jq` (Windows) |
| **curl** | HTTP 測試 | 通常預裝 |

---

## ☁️ Azure 訂閱與權限

### 1. Azure 訂閱要求

- ✅ 有效的 Azure 訂閱（企業訂閱或 Pay-As-You-Go）
- ✅ 訂閱必須啟用以下資源提供者：
  - `Microsoft.Web` - App Service
  - `Microsoft.ContainerRegistry` - Container Registry
  - `Microsoft.DBforPostgreSQL` - PostgreSQL Database
  - `Microsoft.Storage` - Storage Account
  - `Microsoft.Insights` - Application Insights
  - `Microsoft.OperationalInsights` - Log Analytics

**檢查資源提供者**:
```bash
az provider show --namespace Microsoft.Web --query "registrationState"
az provider show --namespace Microsoft.ContainerRegistry --query "registrationState"
az provider show --namespace Microsoft.DBforPostgreSQL --query "registrationState"
az provider show --namespace Microsoft.Storage --query "registrationState"
```

**註冊資源提供者**（如果需要）:
```bash
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Storage
```

### 2. 權限要求

#### 部署人員權限

最低權限：
- **Resource Group Contributor** - 在目標資源組的範圍內
- **User Access Administrator** - 用於配置 Managed Identity 和 RBAC

推薦權限：
- **Subscription Contributor** - 完整的訂閱級別權限（生產環境可限制）

#### Service Principal 權限

每個環境需要獨立的 Service Principal：

| Service Principal | 用途 | 權限 |
|-------------------|------|------|
| `ITPM-Deploy-Dev-SP` | Dev 環境 CI/CD | `Contributor` on `rg-itpm-dev` |
| `ITPM-Deploy-Staging-SP` | Staging 環境 CI/CD | `Contributor` on `rg-itpm-staging` |
| `ITPM-Deploy-Prod-SP` | Prod 環境 CI/CD | `Contributor` on `rg-itpm-prod` |
| `ITPM-AI-Tools-SP` | AI 助手自動化 | `Reader` + 特定操作權限 |

**創建 Service Principal**:
```bash
# 範例：為 Dev 環境創建 SP
az ad sp create-for-rbac \
  --name "ITPM-Deploy-Dev-SP" \
  --role "Contributor" \
  --scopes "/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/rg-itpm-dev" \
  --sdk-auth
```

---

## 💻 本地環境設置

### 1. 克隆專案

```bash
git clone https://github.com/your-org/it-project-management-platform.git
cd it-project-management-platform
```

### 2. 安裝依賴

```bash
# 使用 Node.js 20.11.0
nvm use 20.11.0

# 安裝依賴
pnpm install

# 驗證安裝
pnpm typecheck
pnpm lint
```

### 3. 本地開發環境驗證

```bash
# 啟動 Docker 服務
docker-compose up -d

# 檢查環境
pnpm check:env

# 生成 Prisma Client
pnpm db:generate

# 執行資料庫遷移
pnpm db:migrate

# 啟動開發服務器
pnpm dev
```

訪問 http://localhost:3000 確認應用正常運行。

---

## ☁️ Azure 服務需求

### 1. Azure Key Vault

**要求**:
- ✅ 公司現有的 Azure Key Vault
- ✅ Key Vault 必須啟用 RBAC 授權模式
- ✅ 部署人員需要 **Key Vault Secrets Officer** 角色

**獲取 Key Vault 資訊**:
```bash
az keyvault list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table
```

**授予權限**:
```bash
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <YOUR_USER_PRINCIPAL_ID> \
  --scope /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RG}/providers/Microsoft.KeyVault/vaults/{KV_NAME}
```

### 2. Azure AD B2C (可選但推薦)

如果使用企業級身份驗證：

- ✅ 已創建 Azure AD B2C Tenant
- ✅ 註冊應用程式並獲取 Client ID 和 Client Secret
- ✅ 配置 User Flows:
  - `B2C_1_signupsignin` - 註冊/登入
  - `B2C_1_profileediting` - 個人資料編輯（可選）
  - `B2C_1_passwordreset` - 密碼重設（可選）

**參考文檔**: `.azure/docs/service-principal-setup.md`

### 3. 資源配額檢查

確認訂閱有足夠配額：

| 資源 | Dev | Staging | Prod | 檢查指令 |
|------|-----|---------|------|---------|
| vCPU（App Service） | 1 | 1 | 2 | `az vm list-usage --location eastasia` |
| PostgreSQL Server | 1 | 1 | 1 | - |
| Storage Account | 1 | 1 | 1 | - |
| Container Registry | 1 | 1 | 1 | - |

---

## 🔌 第三方服務

### 1. SendGrid（Email 服務）

**要求**:
- ✅ SendGrid 帳號（免費層級或付費）
- ✅ API Key（至少 `Mail Send` 權限）
- ✅ 驗證寄件人電子郵件地址或網域

**設置步驟**:
1. 註冊 SendGrid: https://sendgrid.com/
2. 創建 API Key
3. 驗證寄件人電子郵件

**本地測試**:
使用 Mailhog 代替 SendGrid（已包含在 docker-compose.yml）:
```bash
docker-compose up -d mailhog

# 訪問 Mailhog UI
open http://localhost:8025
```

### 2. GitHub (CI/CD)

**要求**:
- ✅ GitHub 帳號
- ✅ GitHub Repository（公開或私有）
- ✅ GitHub Actions 已啟用

**需要配置的 Secrets**:
- `AZURE_CREDENTIALS_DEV` - Dev 環境 Service Principal JSON
- `AZURE_CREDENTIALS_STAGING` - Staging 環境 Service Principal JSON
- `AZURE_CREDENTIALS_PROD` - Prod 環境 Service Principal JSON
- `ACR_REGISTRY` - Container Registry 登入伺服器
- `ACR_USERNAME` - Container Registry 用戶名
- `ACR_PASSWORD` - Container Registry 密碼

---

## ✅ 檢查清單

部署前請確認以下所有項目：

### 本地環境

- [ ] Node.js 20.11.0 已安裝
- [ ] pnpm 8.15.3 已安裝
- [ ] Docker Desktop 已安裝並運行
- [ ] Azure CLI 已安裝並登入
- [ ] Git 已配置
- [ ] 專案依賴已安裝 (`pnpm install`)
- [ ] 本地開發環境可正常運行 (`pnpm dev`)

### Azure 訂閱

- [ ] Azure 訂閱有效且可存取
- [ ] 所需資源提供者已註冊
- [ ] 訂閱配額足夠
- [ ] 已登入正確的 Azure 訂閱 (`az account show`)

### Azure 權限

- [ ] 擁有 Resource Group Contributor 權限
- [ ] 已創建 Service Principal（Dev/Staging/Prod）
- [ ] Service Principal 憑證已保存

### Azure 服務

- [ ] 已確認公司 Key Vault 名稱和位置
- [ ] 擁有 Key Vault Secrets Officer 權限
- [ ] （可選）Azure AD B2C Tenant 已設置

### 第三方服務

- [ ] SendGrid API Key 已獲取
- [ ] SendGrid 寄件人電子郵件已驗證
- [ ] GitHub Repository 已創建
- [ ] GitHub Actions 已啟用

### 文檔與腳本

- [ ] 已閱讀 `DEVELOPMENT-SETUP.md`
- [ ] 已閱讀 `.azure/README.md`
- [ ] 已確認 6 個部署腳本可執行
- [ ] 已準備環境變數範例檔案

---

## 📚 相關文檔

- [首次部署設置](./01-first-time-setup.md)
- [CI/CD 配置](./02-ci-cd-setup.md)
- [故障排除](./03-troubleshooting.md)
- [回滾指南](./04-rollback.md)
- [Service Principal 設置](./../.azure/docs/service-principal-setup.md)
- [Key Vault 密鑰列表](./key-vault-secrets-list.md)

---

## 🆘 獲取幫助

如果遇到問題：

1. **查看故障排除文檔**: `docs/deployment/03-troubleshooting.md`
2. **檢查 Azure 狀態**: https://status.azure.com/
3. **聯繫團隊**: 內部 IT 支援團隊
4. **Azure 支援**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade

---

**下一步**: [首次部署設置 →](./01-first-time-setup.md)
