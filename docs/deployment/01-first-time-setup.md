# 首次 Azure 部署設置指南

**最後更新**: 2025-11-20
**預計時間**: 2-3 小時（每個環境）

---

## 📋 目錄

- [部署概覽](#部署概覽)
- [階段 1: 準備工作](#階段-1-準備工作)
- [階段 2: 創建 Azure 資源](#階段-2-創建-azure-資源)
- [階段 3: 配置 Azure Key Vault](#階段-3-配置-azure-key-vault)
- [階段 4: 首次應用部署](#階段-4-首次應用部署)
- [階段 5: 驗證與測試](#階段-5-驗證與測試)
- [階段 6: 設置 CI/CD](#階段-6-設置-cicd)

---

## 🎯 部署概覽

### 部署架構

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure 訂閱                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Resource Group: rg-itpm-{env}                        │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ App Service │  │ PostgreSQL  │  │   Storage   │  │  │
│  │  │   (Web App) │  │  Flexible   │  │   Account   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Container   │  │     Log     │  │   Network   │  │  │
│  │  │  Registry   │  │  Analytics  │  │  Security   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Shared Services                                       │  │
│  │  • Azure Key Vault (公司共用)                        │  │
│  │  • Azure AD B2C (企業身份驗證)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 部署順序

建議按照以下順序部署環境：

1. **Development (Dev)** - 開發環境，用於測試和驗證
2. **Staging** - 預發布環境，模擬生產環境
3. **Production (Prod)** - 生產環境，面向最終用戶

---

## 🚀 階段 1: 準備工作

### 1.1 檢查前置條件

確認所有前置條件已滿足：

```bash
# 檢查工具版本
node --version  # 應該是 v20.11.0
pnpm --version  # 應該是 8.15.3
docker --version
az --version

# 檢查 Azure 登入
az account show
```

### 1.2 選擇部署環境

```bash
# 設置環境變數（選擇一個）
export ENVIRONMENT="dev"      # 開發環境
# export ENVIRONMENT="staging"  # 預發布環境
# export ENVIRONMENT="prod"     # 生產環境

echo "部署環境: $ENVIRONMENT"
```

### 1.3 創建工作目錄

```bash
# 創建輸出目錄（用於保存憑證和配置）
mkdir -p .azure/output

# 確保目錄已加入 .gitignore
echo ".azure/output/" >> .gitignore
```

---

## 🏗️ 階段 2: 創建 Azure 資源

### 2.1 創建資源組和基礎設施

執行第一個腳本：

```bash
cd .azure/scripts

# 使腳本可執行（Linux/macOS）
chmod +x *.sh

# 執行資源組設置
./01-setup-resources.sh $ENVIRONMENT
```

**預期輸出**:
```
✅ 資源組: rg-itpm-dev
✅ 網路安全組: nsg-itpm-dev
✅ Log Analytics Workspace: law-itpm-dev
```

**驗證**:
```bash
az group show --name "rg-itpm-$ENVIRONMENT" --output table
```

### 2.2 創建 PostgreSQL 資料庫

```bash
./02-setup-database.sh $ENVIRONMENT
```

**重要**: 腳本會生成隨機密碼並保存到 `.azure/output/${ENVIRONMENT}-database-credentials.txt`

**立即執行** (在憑證文件仍然存在時):

1. 打開憑證文件:
   ```bash
   cat .azure/output/${ENVIRONMENT}-database-credentials.txt
   ```

2. **複製所有憑證資訊**（稍後需要添加到 Key Vault）

3. 測試資料庫連接:
   ```bash
   # 使用憑證文件中的連接字符串
   psql "postgresql://itpmadmin:PASSWORD@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"
   ```

### 2.3 創建 Blob Storage

```bash
./03-setup-storage.sh $ENVIRONMENT
```

**預期輸出**:
```
✅ Storage Account: stgitpmdev001
✅ 3 個 Containers: quotes, invoices, proposals
```

**憑證文件**: `.azure/output/${ENVIRONMENT}-storage-credentials.txt`

### 2.4 創建 Container Registry

```bash
./04-setup-acr.sh $ENVIRONMENT
```

**預期輸出**:
```
✅ ACR: acritpmdev.azurecr.io
✅ 管理員帳號已啟用
```

**憑證文件**: `.azure/output/${ENVIRONMENT}-acr-credentials.txt`

**測試 ACR 登入**:
```bash
# 從憑證文件獲取資訊
ACR_NAME=$(grep "ACR 名稱" .azure/output/${ENVIRONMENT}-acr-credentials.txt | awk '{print $NF}')
az acr login --name $ACR_NAME
```

### 2.5 創建 App Service

```bash
./05-setup-appservice.sh $ENVIRONMENT
```

**預期輸出**:
```
✅ App Service Plan: asp-itpm-dev
✅ App Service: app-itpm-dev-001
✅ Managed Identity 已啟用
✅ ACR 存取權限已配置
```

**驗證 App Service**:
```bash
az webapp show \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT" \
  --query "{Name:name, State:state, URL:defaultHostName}" -o table
```

---

## 🔐 階段 3: 配置 Azure Key Vault

### 3.1 獲取 Key Vault 資訊

```bash
# 列出可用的 Key Vault
az keyvault list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table

# 設置 Key Vault 名稱
export KV_NAME="YOUR_COMPANY_KV"
```

### 3.2 添加資料庫憑證到 Key Vault

```bash
# 從憑證文件獲取 DATABASE_URL
DATABASE_URL=$(grep "^postgresql://" .azure/output/${ENVIRONMENT}-database-credentials.txt)

# 添加到 Key Vault
az keyvault secret set \
  --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-DATABASE-URL" \
  --value "$DATABASE_URL"
```

### 3.3 添加 Storage 憑證到 Key Vault

```bash
# 獲取憑證
STORAGE_ACCOUNT=$(grep "Storage Account 名稱:" .azure/output/${ENVIRONMENT}-storage-credentials.txt | awk '{print $NF}')
STORAGE_KEY=$(grep "Storage Account Key:" .azure/output/${ENVIRONMENT}-storage-credentials.txt | awk '{print $NF}')
CONNECTION_STRING=$(grep "Connection String:" .azure/output/${ENVIRONMENT}-storage-credentials.txt | cut -d: -f2- | xargs)

# 添加到 Key Vault
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-NAME" \
  --value "$STORAGE_ACCOUNT"

az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-KEY" \
  --value "$STORAGE_KEY"

az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-CONNECTION-STRING" \
  --value "$CONNECTION_STRING"
```

### 3.4 添加其他必需密鑰

```bash
# NEXTAUTH_SECRET (生成新的)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-NEXTAUTH-SECRET" \
  --value "$NEXTAUTH_SECRET"

# NEXTAUTH_URL
NEXTAUTH_URL="https://app-itpm-$ENVIRONMENT-001.azurewebsites.net"
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-NEXTAUTH-URL" \
  --value "$NEXTAUTH_URL"

# SendGrid API Key（需要手動提供）
read -p "輸入 SendGrid API Key: " SENDGRID_KEY
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-SENDGRID-API-KEY" \
  --value "$SENDGRID_KEY"

# SendGrid From Email
read -p "輸入 SendGrid From Email: " SENDGRID_EMAIL
az keyvault secret set --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-SENDGRID-FROM-EMAIL" \
  --value "$SENDGRID_EMAIL"
```

### 3.5 授予 App Service Managed Identity 存取權限

```bash
# 獲取 Managed Identity Principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT" \
  --query "principalId" -o tsv)

# 授予 Key Vault Secrets User 權限
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee "$PRINCIPAL_ID" \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$(az keyvault show --name $KV_NAME --query resourceGroup -o tsv)/providers/Microsoft.KeyVault/vaults/$KV_NAME"
```

### 3.6 配置 App Service 環境變數

使用 Key Vault 引用配置環境變數：

```bash
az webapp config appsettings set \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT" \
  --settings \
    "NODE_ENV=production" \
    "PORT=3000" \
    "DATABASE_URL=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-DATABASE-URL)" \
    "NEXTAUTH_SECRET=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-NEXTAUTH-SECRET)" \
    "NEXTAUTH_URL=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-NEXTAUTH-URL)" \
    "NEXTAUTH_SESSION_MAX_AGE=86400" \
    "AZURE_STORAGE_ACCOUNT_NAME=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-NAME)" \
    "AZURE_STORAGE_ACCOUNT_KEY=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-KEY)" \
    "AZURE_STORAGE_CONTAINER_QUOTES=quotes" \
    "AZURE_STORAGE_CONTAINER_INVOICES=invoices" \
    "AZURE_STORAGE_CONTAINER_PROPOSALS=proposals" \
    "SENDGRID_API_KEY=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-SENDGRID-API-KEY)" \
    "SENDGRID_FROM_EMAIL=@Microsoft.KeyVault(VaultName=$KV_NAME;SecretName=ITPM-${ENVIRONMENT^^}-SENDGRID-FROM-EMAIL)" \
    "SENDGRID_FROM_NAME=IT Project Management ($ENVIRONMENT)" \
    "NEXT_PUBLIC_FEATURE_AI_ASSISTANT=false" \
    "NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION=false"
```

---

## 🚀 階段 4: 首次應用部署

### 4.1 執行資料庫遷移

在首次部署前，必須在 Azure PostgreSQL 上執行 Prisma 遷移：

```bash
# 從本地連接到 Azure PostgreSQL
# 使用 .azure/output/${ENVIRONMENT}-database-credentials.txt 中的連接字符串

cd packages/db

# 設置 DATABASE_URL 環境變數
export DATABASE_URL="postgresql://itpmadmin:PASSWORD@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"

# 執行遷移
npx prisma migrate deploy

# 驗證遷移
npx prisma db push --skip-generate
```

### 4.2 構建並推送 Docker 鏡像

```bash
# 返回專案根目錄
cd ../..

# 執行部署腳本
./.azure/scripts/06-deploy-app.sh $ENVIRONMENT v1.0.0
```

**腳本會執行**:
1. 構建 Docker 鏡像
2. 推送到 Azure Container Registry
3. 更新 App Service 配置
4. 重啟應用
5. 等待應用啟動（最多 2 分鐘）

### 4.3 查看部署日誌

```bash
# 即時日誌串流
az webapp log tail \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT"

# 下載日誌
az webapp log download \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT" \
  --log-file "${ENVIRONMENT}-logs.zip"
```

---

## ✅ 階段 5: 驗證與測試

### 5.1 健康檢查

```bash
# 獲取應用 URL
APP_URL="https://app-itpm-$ENVIRONMENT-001.azurewebsites.net"

# 測試健康端點
curl -I "$APP_URL"

# 應該返回 HTTP 200 或 302
```

### 5.2 功能測試

訪問應用並測試以下功能：

- [ ] 訪問主頁: `$APP_URL`
- [ ] 登入功能
- [ ] 創建測試專案
- [ ] 上傳測試文件（驗證 Blob Storage）
- [ ] 發送測試郵件（驗證 SendGrid）
- [ ] 檢查資料庫連接

### 5.3 查看應用指標

```bash
# 查看應用狀態
az webapp show \
  --name "app-itpm-$ENVIRONMENT-001" \
  --resource-group "rg-itpm-$ENVIRONMENT" \
  --query "{Name:name, State:state, DefaultHostName:defaultHostName}" -o table

# 查看最近的 HTTP 請求
az monitor metrics list \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-itpm-$ENVIRONMENT/providers/Microsoft.Web/sites/app-itpm-$ENVIRONMENT-001" \
  --metric "Http2xx" \
  --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S') \
  --end-time $(date -u '+%Y-%m-%dT%H:%M:%S') \
  --interval PT1M \
  --query "value[0].timeseries[0].data[-10:]" -o table
```

---

## 🔄 階段 6: 設置 CI/CD

一旦手動部署成功，請設置 GitHub Actions 自動化部署。

詳細步驟請參考: [CI/CD 配置指南](./02-ci-cd-setup.md)

---

## 🧹 清理臨時文件

**重要**: 完成部署後，立即刪除包含敏感資訊的憑證文件：

```bash
# 刪除所有憑證文件
rm -f .azure/output/${ENVIRONMENT}-*-credentials.txt

# 確認刪除
ls -la .azure/output/
```

---

## 📊 部署檢查清單

### 資源創建

- [ ] 資源組已創建
- [ ] PostgreSQL 資料庫已創建並可連接
- [ ] Blob Storage 已創建（3 個 containers）
- [ ] Container Registry 已創建
- [ ] App Service 已創建
- [ ] Managed Identity 已配置

### Key Vault 配置

- [ ] DATABASE_URL 已添加
- [ ] Storage 憑證已添加
- [ ] NEXTAUTH 密鑰已添加
- [ ] SendGrid 密鑰已添加
- [ ] Managed Identity 已授予存取權限
- [ ] App Service 環境變數已配置（使用 Key Vault 引用）

### 應用部署

- [ ] Prisma 遷移已執行
- [ ] Docker 鏡像已構建並推送
- [ ] 應用已部署到 App Service
- [ ] 應用可正常訪問
- [ ] 所有功能測試通過

### 安全與清理

- [ ] 臨時憑證文件已刪除
- [ ] `.azure/output/` 已加入 .gitignore
- [ ] 沒有密鑰提交到版本控制

---

## 🆘 故障排除

如遇問題，請參考:

- [故障排除指南](./03-troubleshooting.md)
- [回滾指南](./04-rollback.md)

常見問題:

1. **App Service 無法啟動** → 檢查環境變數和日誌
2. **資料庫連接失敗** → 檢查防火牆規則和連接字符串
3. **Blob Storage 404** → 確認 Containers 已創建
4. **Key Vault 存取被拒** → 檢查 Managed Identity 權限

---

**下一步**: [CI/CD 配置 →](./02-ci-cd-setup.md)
