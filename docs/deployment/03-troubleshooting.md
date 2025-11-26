# Azure 部署故障排除指南

**最後更新**: 2025-11-26

---

## 📋 目錄

- [🔴 高優先：容器內 Migrations 缺失](#-高優先容器內-migrations-缺失)
- [快速診斷](#快速診斷)
- [常見問題分類](#常見問題分類)
- [資源創建問題](#資源創建問題)
- [資料庫問題](#資料庫問題)
- [應用部署問題](#應用部署問題)
- [網路與連接問題](#網路與連接問題)
- [Key Vault 問題](#key-vault-問題)
- [CI/CD 問題](#cicd-問題)
- [性能問題](#性能問題)

---

## 🔴 高優先：容器內 Migrations 缺失

> ⚠️ **最常見致命問題**：這是 Azure 部署失敗最常見的根本原因！

### 症狀

- 用戶註冊返回 500 Internal Server Error
- API 返回 "The table public.Role does not exist"
- API 返回 "The table public.Currency does not exist"
- 容器日誌顯示 "No migration found in prisma/migrations"
- Seed 失敗或無法執行

### 根本原因

`.dockerignore` 文件中包含 `**/migrations` 規則，導致 Prisma migration 文件被排除在 Docker
image 之外。

```yaml
root_cause_chain:
  1. .dockerignore 包含 "**/migrations" 規則 2. Docker build context 排除 migrations 資料夾 3.
  Container 中 /app/packages/db/prisma/migrations/ 為空 4. startup.sh 執行 "prisma migrate deploy"
  報告 "No migration found" 5. 資料庫表結構未建立（Role, Currency 等表不存在） 6.
  應用程式嘗試操作不存在的表 → 500 錯誤
```

### 快速診斷

```bash
# 1. 檢查 .dockerignore 是否排除 migrations
grep -n "migrations" .dockerignore
# 如果看到未被註解的 "**/migrations"，這就是問題！

# 2. 驗證 Docker image 中 migrations 是否存在
docker build -f docker/Dockerfile -t test-build .
docker run --rm test-build ls -la /app/packages/db/prisma/migrations/
# 應該看到 3 個資料夾，不應該是空的

# 3. 查看容器日誌中的 migration 訊息
az webapp log tail --name <APP_NAME> --resource-group <RG_NAME> | grep -i "migration"
# 應該看到 "3 migrations found" 而非 "No migration found"
```

### 解決步驟

```bash
# 步驟 1: 修改 .dockerignore
# 找到 "**/migrations" 並註解掉
# 將: **/migrations
# 改為: # **/migrations  <-- REMOVED: migrations required for prisma migrate deploy

# 步驟 2: 確認 .gitignore 允許 migration SQL
# 添加這行到 .gitignore:
!packages/db/prisma/migrations/**/*.sql

# 步驟 3: 重建 Docker image
docker build -f docker/Dockerfile -t <ACR_NAME>.azurecr.io/itpm-web:latest .

# 步驟 4: 驗證 migrations 存在於 image 中
docker run --rm <ACR_NAME>.azurecr.io/itpm-web:latest ls /app/packages/db/prisma/migrations/
# 預期輸出: 20251024082756_init  20251111065801_new  20251126100000_add_currency

# 步驟 5: 推送並重啟
docker push <ACR_NAME>.azurecr.io/itpm-web:latest
az webapp restart --name <APP_NAME> --resource-group <RG_NAME>

# 步驟 6: 驗證 migration 執行成功
az webapp log tail --name <APP_NAME> --resource-group <RG_NAME> | grep -i "migration"
# 預期: "3 migrations found" 和 "All migrations have been successfully applied"

# 步驟 7: 執行 Seed（如果需要）
curl -X POST "https://<APP_NAME>.azurewebsites.net/api/admin/seed" \
  -H "Content-Type: application/json"
```

### 預防措施

```yaml
deployment_checklist:
  - [ ] 部署前檢查 .dockerignore 不排除 migrations
  - [ ] 驗證 Docker image 中包含 migration 文件
  - [ ] CI/CD pipeline 中添加 migrations 存在性驗證
  - [ ] 容器啟動後檢查日誌確認 "X migrations found"
```

**詳細說明**: 參見 `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md`

---

## 🔍 快速診斷

### 診斷流程

```
問題發生
    │
    ▼
檢查應用狀態 → az webapp show
    │
    ▼
查看日誌 → az webapp log tail
    │
    ▼
檢查環境變數 → az webapp config appsettings list
    │
    ▼
測試連接 → 資料庫/Storage/ACR
    │
    ▼
查看指標 → Azure Portal Metrics
```

### 一鍵診斷腳本

```bash
#!/bin/bash
ENVIRONMENT="dev"
APP_NAME="app-itpm-$ENVIRONMENT-001"
RG_NAME="rg-itpm-$ENVIRONMENT"

echo "=== App Service 狀態 ==="
az webapp show --name $APP_NAME --resource-group $RG_NAME \
  --query "{Name:name, State:state, DefaultHostName:defaultHostName}" -o table

echo -e "\n=== 最近 50 條日誌 ==="
az webapp log tail --name $APP_NAME --resource-group $RG_NAME --limit 50

echo -e "\n=== 環境變數（僅顯示鍵） ==="
az webapp config appsettings list --name $APP_NAME --resource-group $RG_NAME \
  --query "[].name" -o table
```

---

## 📂 常見問題分類

### 按嚴重性分類

| 嚴重性          | 症狀             | 影響         | 解決優先級  |
| --------------- | ---------------- | ------------ | ----------- |
| 🔴 **Critical** | 應用完全無法訪問 | 生產服務中斷 | ⚡ 立即     |
| 🟠 **High**     | 功能部分失效     | 用戶體驗受損 | 🔥 1小時內  |
| 🟡 **Medium**   | 性能下降         | 響應變慢     | 📅 1天內    |
| 🟢 **Low**      | 日誌警告         | 無明顯影響   | 📋 計劃修復 |

---

## 🏗️ 資源創建問題

### 問題 1: 資源組創建失敗

**症狀**:

```
ERROR: The subscription is not registered to use namespace 'Microsoft.Resources'
```

**原因**: 訂閱未註冊資源提供者

**解決方案**:

```bash
# 註冊資源提供者
az provider register --namespace Microsoft.Resources
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Storage

# 檢查註冊狀態
az provider show --namespace Microsoft.Resources --query "registrationState"
```

### 問題 2: 配額不足

**症狀**:

```
ERROR: Operation could not be completed as it results in exceeding approved quota
```

**原因**: 訂閱配額已達上限

**解決方案**:

```bash
# 檢查當前配額
az vm list-usage --location eastasia -o table

# 申請提高配額
# Azure Portal → Subscriptions → Usage + quotas → Request increase
```

### 問題 3: 區域不支援

**症狀**:

```
ERROR: The requested VM size is not available in the current region
```

**解決方案**:

```bash
# 檢查可用 SKU
az appservice list-locations --sku P1V3 --linux-workers-enabled

# 更改部署區域（在腳本中修改 LOCATION 變數）
```

---

## 🗄️ 資料庫問題

### 問題 1: 無法連接到 PostgreSQL

**症狀**:

```
Error: Connection refused
```

**診斷步驟**:

```bash
# 1. 檢查伺服器狀態
az postgres flexible-server show \
  --name psql-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "{Name:name, State:state, FQDN:fullyQualifiedDomainName}" -o table

# 2. 檢查防火牆規則
az postgres flexible-server firewall-rule list \
  --name psql-itpm-dev-001 \
  --resource-group rg-itpm-dev -o table

# 3. 測試連接
psql "postgresql://USERNAME:PASSWORD@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"
```

**解決方案**:

```bash
# 添加您的 IP 到防火牆規則
MY_IP=$(curl -s https://api.ipify.org)

az postgres flexible-server firewall-rule create \
  --name AllowMyIP \
  --server-name psql-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### 問題 2: Prisma 遷移失敗

**症狀**:

```
Error: P1001: Can't reach database server
```

**解決方案**:

```bash
# 1. 驗證 DATABASE_URL 格式
echo $DATABASE_URL

# 正確格式:
# postgresql://user:pass@host.postgres.database.azure.com:5432/db?sslmode=require

# 2. 測試連接
npx prisma db execute --stdin <<< "SELECT 1"

# 3. 如果連接成功，重新執行遷移
npx prisma migrate deploy
```

### 問題 3: 資料庫性能問題

**症狀**: 查詢緩慢

**診斷**:

```bash
# 連接到資料庫並檢查慢查詢
psql "$DATABASE_URL" <<EOF
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
EOF
```

**解決方案**:

- 添加索引
- 優化查詢
- 考慮升級 SKU

---

## 🚀 應用部署問題

### 問題 1: Container 無法啟動

**症狀**:

```
Container didn't respond to HTTP pings on port: 3000
```

**診斷步驟**:

```bash
# 1. 查看容器日誌
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 2. 檢查容器配置
az webapp config show --name app-itpm-dev-001 --resource-group rg-itpm-dev \
  --query "{Port:linuxFxVersion, Command:appCommandLine}" -o table

# 3. 檢查環境變數
az webapp config appsettings list --name app-itpm-dev-001 --resource-group rg-itpm-dev \
  --query "[?name=='WEBSITES_PORT' || name=='PORT']" -o table
```

**解決方案**:

```bash
# 確保應用監聽正確端口
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings WEBSITES_PORT=3000 PORT=3000

# 重啟應用
az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev
```

### 問題 2: 環境變數未生效

**症狀**: Key Vault 引用無法解析

**診斷**:

```bash
# 檢查 Managed Identity
az webapp identity show --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 檢查 Key Vault 權限
az role assignment list \
  --assignee <PRINCIPAL_ID> \
  --scope /subscriptions/<SUB_ID>/resourceGroups/<RG>/providers/Microsoft.KeyVault/vaults/<KV_NAME>
```

**解決方案**:

```bash
# 授予 Managed Identity Key Vault 存取權限
PRINCIPAL_ID=$(az webapp identity show --name app-itpm-dev-001 --resource-group rg-itpm-dev --query principalId -o tsv)

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope <KEY_VAULT_RESOURCE_ID>
```

### 問題 3: Docker 鏡像版本錯誤

**症狀**: 部署後應用未更新

**解決方案**:

```bash
# 1. 確認最新鏡像已推送到 ACR
az acr repository show-tags --name acritpmdev --repository itpm-web --orderby time_desc --top 5

# 2. 手動更新容器鏡像
az webapp config container set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --docker-custom-image-name acritpmdev.azurecr.io/itpm-web:latest

# 3. 啟用持續部署
az webapp deployment container config \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --enable-cd true
```

---

## 🌐 網路與連接問題

### 問題 1: CORS 錯誤

**症狀**:

```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS policy
```

**解決方案**:

```bash
# 配置 CORS（如果需要）
az webapp cors add \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --allowed-origins "https://yourdomain.com" "http://localhost:3000"
```

### 問題 2: Blob Storage 404

**症狀**: 文件上傳後無法訪問

**診斷**:

```bash
# 檢查 Container 是否存在
az storage container list \
  --account-name stgitpmdev001 \
  --auth-mode login \
  --query "[].name" -o table

# 檢查 Blob
az storage blob list \
  --container-name quotes \
  --account-name stgitpmdev001 \
  --auth-mode login \
  --query "[].{Name:name, Size:properties.contentLength}" -o table
```

**解決方案**:

```bash
# 創建缺少的 Container
az storage container create \
  --name quotes \
  --account-name stgitpmdev001 \
  --auth-mode login

# 檢查應用是否有 Storage 存取權限
# 驗證環境變數 AZURE_STORAGE_ACCOUNT_NAME 和 AZURE_STORAGE_ACCOUNT_KEY
```

---

## 🔐 Key Vault 問題

### 問題 1: 無法讀取 Secret

**症狀**:

```
ERROR: The user, group or application '...' does not have secrets get permission
```

**解決方案**:

```bash
# 授予 Managed Identity 權限
PRINCIPAL_ID=<YOUR_MANAGED_IDENTITY_PRINCIPAL_ID>
KV_NAME=<YOUR_KEY_VAULT_NAME>

az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/<RG>/providers/Microsoft.KeyVault/vaults/$KV_NAME"
```

### 問題 2: Secret 引用格式錯誤

**症狀**: 環境變數顯示為 `@Microsoft.KeyVault(...)`字串

**原因**: Key Vault 引用格式錯誤

**正確格式**:

```bash
# ✅ 正確
@Microsoft.KeyVault(VaultName=YOUR_KV;SecretName=SECRET_NAME)

# ❌ 錯誤（缺少 SecretName）
@Microsoft.KeyVault(VaultName=YOUR_KV)

# ❌ 錯誤（使用 SecretUri）
@Microsoft.KeyVault(SecretUri=https://...)
```

---

## ⚙️ CI/CD 問題

### 問題 1: GitHub Actions 驗證失敗

**症狀**:

```
Error: Login failed with Error: ...
```

**解決方案**:

```bash
# 1. 驗證 Service Principal
az login --service-principal \
  --username <CLIENT_ID> \
  --password <CLIENT_SECRET> \
  --tenant <TENANT_ID>

# 2. 檢查權限
az role assignment list --assignee <CLIENT_ID>

# 3. 如果失敗，重新創建 Service Principal
az ad sp create-for-rbac \
  --name "ITPM-Deploy-Dev-SP" \
  --role "Contributor" \
  --scopes "/subscriptions/<SUB_ID>/resourceGroups/rg-itpm-dev" \
  --sdk-auth
```

### 問題 2: Docker 構建超時

**症狀**: GitHub Actions 超過 6 小時限制

**解決方案**:

- 使用 Docker 層緩存
- 優化 Dockerfile
- 使用 pnpm store

---

## ⚡ 性能問題

### 問題 1: 應用響應緩慢

**診斷**:

```bash
# 查看 CPU 和內存使用率
az monitor metrics list \
  --resource "/subscriptions/<SUB_ID>/resourceGroups/rg-itpm-dev/providers/Microsoft.Web/sites/app-itpm-dev-001" \
  --metric "CpuPercentage" "MemoryPercentage" \
  --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S') \
  --end-time $(date -u '+%Y-%m-%dT%H:%M:%S') \
  --interval PT5M \
  --query "value[].timeseries[0].data[-6:]" -o table
```

**解決方案**:

- 考慮升級 App Service Plan SKU
- 優化資料庫查詢
- 啟用 CDN（靜態資源）

---

## 📚 有用的命令

### 快速診斷

```bash
# 檢查所有資源狀態
az resource list --resource-group rg-itpm-dev --query "[].{Name:name, Type:type, State:provisioningState}" -o table

# 查看最近的部署
az webapp deployment list --name app-itpm-dev-001 --resource-group rg-itpm-dev -o table

# 下載診斷日誌
az webapp log download --name app-itpm-dev-001 --resource-group rg-itpm-dev --log-file logs.zip
```

---

## 🆘 獲取幫助

1. **Azure 狀態頁面**: https://status.azure.com/
2. **Azure 支援**: Azure Portal → Help + support
3. **GitHub Issues**: 專案 Issues 頁面
4. **內部 IT 支援**: 聯繫團隊

---

**相關文檔**:

- [首次部署](./01-first-time-setup.md)
- [CI/CD 配置](./02-ci-cd-setup.md)
- [回滾指南](./04-rollback.md)
