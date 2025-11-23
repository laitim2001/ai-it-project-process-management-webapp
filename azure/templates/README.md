# Azure Infrastructure as Code 模板

本目錄包含用於部署 IT Project Management Platform 的 ARM/Bicep 模板。

## 📁 模板文件

### App Service 模板
- **文件**: `app-service.bicep`
- **用途**: 部署 Azure App Service 和 App Service Plan
- **包含資源**:
  - App Service Plan (Linux, Container-based)
  - App Service (Web App)
  - Application Insights 整合
  - Key Vault 引用配置

### PostgreSQL 模板
- **文件**: `postgresql.bicep`
- **用途**: 部署 Azure Database for PostgreSQL Flexible Server
- **包含資源**:
  - PostgreSQL Flexible Server
  - 防火牆規則
  - 數據庫創建
  - 備份配置

### Storage 模板
- **文件**: `storage.bicep`
- **用途**: 部署 Azure Blob Storage
- **包含資源**:
  - Storage Account
  - Blob Containers (quotes, invoices)
  - 訪問策略配置

## 🚀 使用方式

### 使用 Azure CLI 部署

```bash
# 部署 App Service
az deployment group create \
  --resource-group rg-itpm-dev \
  --template-file templates/app-service.bicep \
  --parameters location=eastasia

# 部署 PostgreSQL
az deployment group create \
  --resource-group rg-itpm-dev \
  --template-file templates/postgresql.bicep \
  --parameters location=eastasia

# 部署 Storage
az deployment group create \
  --resource-group rg-itpm-dev \
  --template-file templates/storage.bicep \
  --parameters location=eastasia
```

### 使用部署腳本

部署腳本（`azure/scripts/01-06.sh`）會自動使用這些模板，或使用 Azure CLI 命令直接創建資源。

## 📝 模板參數

每個模板支持以下通用參數：
- `location`: Azure 區域（預設: eastasia）
- `environment`: 環境名稱（dev/staging/prod）
- `resourcePrefix`: 資源命名前綴

## ⚠️ 注意事項

1. **命名衝突**: 確保資源名稱在 Azure 全球唯一（如 Storage Account、ACR）
2. **Key Vault 整合**: App Service 環境變數使用 Key Vault 引用格式
3. **網路配置**: PostgreSQL 需要正確配置防火牆規則以允許 App Service 訪問

## 🔄 維護

當前這些模板是**可選的**。部署腳本主要使用 Azure CLI 命令。未來可以：
1. 將所有 Azure CLI 命令轉換為 Bicep 模板
2. 使用模板參數化環境差異
3. 建立完整的 Infrastructure as Code 工作流
