# Azure 部署配置

IT Project Management Platform 的 Azure 部署配置，支持**雙 Azure 訂閱部署策略**。

> **架構更新日期**: 2025-11-25 **狀態**: ✅ 個人環境已部署 (v9-fresh-build) | ✅ 公司環境已部署

---

## 📁 目錄結構

```
azure/
├── README.md                           # 本文件
├── environments/                       # 環境配置
│   ├── personal/                       # 個人 Azure 訂閱
│   │   ├── dev.env.example
│   │   ├── staging.env.example
│   │   ├── prod.env.example
│   │   └── README.md
│   └── company/                        # 公司 Azure 訂閱
│       ├── README.md (配置指引)
│       └── (待創建 .env 文件)
├── scripts/                            # 部署腳本
│   ├── deploy-to-personal.sh          # 個人環境部署入口
│   ├── deploy-to-company.sh           # 公司環境部署入口（含安全確認）
│   ├── 01-setup-resources.sh          # 資源群組設置
│   ├── 02-setup-database.sh           # PostgreSQL 設置
│   ├── 03-setup-storage.sh            # Blob Storage 設置
│   ├── 04-setup-acr.sh                # Container Registry 設置
│   ├── 05-setup-appservice.sh         # App Service 設置
│   ├── 06-deploy-app.sh               # 應用程式部署
│   └── helper/                         # 工具腳本
│       ├── add-secret.sh
│       ├── list-secrets.sh
│       ├── rotate-secret.sh
│       └── verify-deployment.sh
├── templates/                          # Infrastructure as Code
│   ├── README.md
│   ├── app-service.bicep              # App Service 模板
│   ├── postgresql.bicep               # PostgreSQL 模板
│   └── storage.bicep                  # Storage 模板
├── deployment-history/                 # 部署記錄
│   ├── personal/
│   └── company/
├── docs/                               # 文檔
│   └── service-principal-setup.md
└── tests/                              # 測試腳本
    ├── smoke-test.sh
    ├── test-azure-connectivity.sh
    └── test-environment-config.sh
```

---

## 🎯 雙環境部署策略

### 為什麼需要雙環境？

本項目支持以下部署流程：

1. **個人 Azure 訂閱**: 用於開發、測試和驗證
2. **公司 Azure 訂閱**: 用於正式部署和生產環境

兩套環境使用**相同的部署腳本**，但配置內容不同（環境變數、密鑰、ID/密碼等）。

### 環境對比

| 項目         | 個人環境                 | 公司環境                |
| ------------ | ------------------------ | ----------------------- |
| **訂閱**     | 個人 Azure 訂閱          | 公司 Azure 訂閱         |
| **資源命名** | `rg-itpm-dev`            | `rg-itpm-company-dev`   |
| **部署目的** | 開發、測試               | 正式部署                |
| **部署權限** | 完全控制                 | 受限訪問                |
| **部署腳本** | `deploy-to-personal.sh`  | `deploy-to-company.sh`  |
| **環境配置** | `environments/personal/` | `environments/company/` |
| **安全確認** | 無                       | ✅ 部署前需確認         |

---

## 🚀 快速開始

### 前置需求

1. **Azure CLI**: 已安裝並登入

   ```bash
   az login
   az account show  # 確認當前訂閱
   ```

2. **Docker**: 用於建置應用映像

   ```bash
   docker --version
   ```

3. **pnpm**: 用於專案構建
   ```bash
   pnpm --version
   ```

### 部署到個人 Azure 環境

```bash
# 從項目根目錄執行
bash azure/scripts/deploy-to-personal.sh dev
```

**支持的環境**:

- `dev` - 開發環境
- `staging` - Staging 環境
- `prod` - 生產環境

### 部署到公司 Azure 環境

**⚠️ 注意**: 部署到公司環境前，請先閱讀 `azure/environments/company/README.md` 完成準備工作。

```bash
# 會提示確認部署信息
bash azure/scripts/deploy-to-company.sh dev
```

部署腳本會顯示目標訂閱和資源群組供確認，確保不會誤部署到錯誤環境。

---

## 📋 當前部署資源（個人環境 - Dev）

### 已部署資源

- **資源群組**: `rg-itpm-dev`
- **位置**: East Asia
- **App Service**: `app-itpm-dev-001`
  - URL: https://app-itpm-dev-001.azurewebsites.net
  - 狀態: ✅ 運行中
- **PostgreSQL**: `psql-itpm-dev-001`
  - 版本: PostgreSQL 16
  - 層級: Flexible Server (Burstable B1ms)
- **Container Registry**: `acritpmdev`
- **Storage Account**: `stitpmdev001`
  - Containers: `quotes`, `invoices`
- **Key Vault**: `kv-itpm-dev`

### 最新部署版本

**個人環境**:

- **版本**: v9-fresh-build
- **部署時間**: 2025-11-25
- **狀態**: ✅ 成功部署並驗證通過
- **驗證記錄**: `claudedocs/AZURE-SITUATION-6-VALIDATION-V9.md`

**公司環境**:

- **版本**: v10-company-deploy
- **部署時間**: 2025-11-25
- **狀態**: ✅ 首次部署成功

---

## 🔑 密鑰管理策略

### Key Vault 引用格式

本項目使用 **Azure Key Vault** 集中管理所有敏感密鑰。

在 App Service 環境變數中使用以下格式引用密鑰：

```bash
DATABASE_URL=@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-DATABASE-URL)
```

### 密鑰管理工具

```bash
# 列出所有密鑰
bash azure/scripts/helper/list-secrets.sh

# 添加新密鑰
bash azure/scripts/helper/add-secret.sh SECRET_NAME "secret_value"

# 輪換密鑰
bash azure/scripts/helper/rotate-secret.sh SECRET_NAME "new_value"
```

### Managed Identity

App Service 使用 **System-Assigned Managed Identity** 訪問 Key Vault，無需管理密碼。

---

## 🏗️ Infrastructure as Code (可選)

`azure/templates/` 目錄包含 Bicep 模板用於基礎設施部署。

### 可用模板

- `app-service.bicep` - App Service + App Service Plan
- `postgresql.bicep` - PostgreSQL Flexible Server
- `storage.bicep` - Blob Storage

### 使用方式

```bash
az deployment group create \
  --resource-group rg-itpm-dev \
  --template-file azure/templates/app-service.bicep \
  --parameters location=eastasia
```

**注意**: 當前部署腳本主要使用 Azure CLI 命令，Bicep 模板為可選替代方案。

---

## 🔍 部署驗證和故障排除

### 驗證部署成功

```bash
bash azure/scripts/helper/verify-deployment.sh
```

### 查看應用日誌

```bash
az webapp log tail \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev
```

### 重啟應用

```bash
az webapp restart \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev
```

### 測試數據庫連接

```bash
bash azure/tests/test-azure-connectivity.sh
```

---

## 📚 相關文檔

### 環境配置

- [個人環境配置指引](environments/personal/README.md)
- [公司環境配置指引](environments/company/README.md)

### 部署指南

- [Service Principal 設置](docs/service-principal-setup.md)
- [完整部署指南](../docs/deployment/AZURE-DEPLOYMENT-GUIDE.md)
- [Prisma Client 修復記錄](../claudedocs/AZURE-PRISMA-FIX-DEPLOYMENT-SUCCESS.md)
- ⚠️ [**部署故障排除指南**](docs/DEPLOYMENT-TROUBLESHOOTING.md) -
  **必讀！包含 .dockerignore 重要修復**

### Infrastructure as Code

- [Bicep 模板使用指引](templates/README.md)

---

## ⚠️ 重要注意事項

### 安全

1. **永不提交 .env 文件**: 所有 `.env` 文件都在 `.gitignore` 中
2. **密鑰僅存儲在 Key Vault**: 不要將敏感信息提交到代碼庫
3. **使用 Managed Identity**: 避免在配置中存儲密碼
4. **公司環境需要確認**: 部署前與 Azure Admin 確認配置

### 部署

1. **環境隔離**: 個人和公司環境完全獨立
2. **資源命名衝突**: 確保資源名稱全球唯一
3. **成本控制**: 注意各環境的資源層級配置
4. **數據庫遷移**: 每次部署後執行 `pnpm db:migrate`

### 工作流程

1. **開發 → 個人 Azure 測試 → 公司 Azure 部署**
2. 在個人環境驗證通過後再部署到公司環境
3. 保持兩套部署流程的一致性

---

## 🆘 獲取幫助

### 個人環境問題

- 參考: `environments/personal/README.md`
- 查看部署記錄: `deployment-history/personal/`

### 公司環境問題

- 參考: `environments/company/README.md`
- 聯繫公司 Azure Administrator
- 檢查公司 Key Vault 訪問權限

### 一般問題

- 故障排查: `azure/tests/`
- 部署腳本問題: 檢查 `azure/scripts/`
- 查看完整文檔: `docs/deployment/`

---

**最後更新**: 2025-11-25 **維護者**: 開發團隊 **架構版本**: v2.1 (雙環境支持 + 腳本優化)

---

## 📝 更新記錄

### v2.2 (2025-11-26)

- 🔴 **重大修復**: `.dockerignore` 排除了 `**/migrations`，導致 Docker image 中缺少 Prisma
  migrations
- ✅ 創建新的 migration `20251126100000_add_currency` 添加 Currency 表
- ✅ 修改 `schema.prisma` 讓 `BudgetPool.currencyId` 為 nullable
- ✅ 新增 [部署故障排除指南](docs/DEPLOYMENT-TROUBLESHOOTING.md)
- ✅ 用戶註冊功能修復完成

### v2.1 (2025-11-25)

- ✅ 個人環境 v9-fresh-build 部署驗證通過
- ✅ 公司環境首次部署成功
- ✅ 所有部署腳本移除 `jq` 依賴，改用 Azure CLI 原生查詢
- ✅ Storage Account 認證改用 Account Key 方式
- ✅ ACR 角色分配添加錯誤處理

### v2.0 (2025-11-23)

- 支持雙 Azure 訂閱部署策略（個人/公司）
- v8-prisma-fix 部署成功
