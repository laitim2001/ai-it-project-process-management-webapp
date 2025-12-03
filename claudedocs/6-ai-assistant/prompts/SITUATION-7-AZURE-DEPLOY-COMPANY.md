# SITUATION-7: Azure 公司環境部署指引

**用途**: 當需要部署到**公司 Azure 訂閱**時，使用此指引確保符合企業規範、安全合規的正式部署流程。

**目標環境**: 公司 Azure 訂閱（用於正式部署、生產環境、客戶訪問）

**觸發情境**:

- 首次部署到公司 Azure 環境
- 正式環境版本更新
- 執行生產部署
- 配置符合企業規範的資源
- Staging → Production 升級

**部署腳本**: `azure/scripts/deploy-to-company.sh`

---

## 🎯 公司環境部署原則

### 1. 安全與合規優先

```yaml
enterprise_requirements:
  - ✅ 所有部署需經授權確認
  - ✅ 符合公司 Azure 命名規範
  - ✅ 遵守企業安全政策
  - ✅ Key Vault 訪問權限申請
  - ✅ 網路隔離和防火牆配置
  - ✅ 監控和告警機制
  - ✅ 備份和災難恢復策略
```

### 2. 部署前確認提示

```yaml
security_confirmation:
  部署腳本包含強制確認步驟:
    - 顯示目標訂閱和資源群組
    - 列出部署資源清單
    - 要求輸入 'yes' 確認
    - 確認後才執行部署

  目的:
    - 避免誤部署到錯誤環境
    - 確保操作者了解影響範圍
    - 符合變更管理流程
```

### 3. 企業架構標準

```yaml
enterprise_architecture:
  資源命名: "rg-itpm-company-{env}" (公司環境前綴)
  訂閱: 公司 Azure 訂閱
  資料庫: 企業級 PostgreSQL (可能需要 Private Endpoint)
  儲存體: 冗余存儲 + 數據加密
  Key_Vault: 可能使用共用企業 Key Vault
  網路: 可能需要 VNet/NSG 配置
  監控: Application Insights + Log Analytics
```

---

## 📁 目錄結構參考

### 執行層（最重要）⭐⭐⭐⭐⭐

```
azure/
├── scripts/
│   └── deploy-to-company.sh    # ⭐ 公司環境部署入口（含安全確認）
├── environments/
│   └── company/                 # ⭐ 公司環境配置
│       ├── README.md            # ⚠️ 配置準備指引
│       └── (需創建 dev.env, staging.env, prod.env)
└── tests/                       # 部署後驗證腳本
```

### 文檔層（必讀）⭐⭐⭐⭐

```
docs/deployment/
├── AZURE-DEPLOYMENT-GUIDE.md      # 完整部署流程
├── 02-ci-cd-setup.md              # CI/CD 配置（可能適用）
├── 03-troubleshooting.md          # 故障排查
└── 04-rollback.md                 # 回滾程序
```

**參考**: 詳細目錄角色說明請查閱 `claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md`

---

## ⚠️ 部署前準備工作（必須完成）

### 步驟 1: 與公司 Azure Administrator 確認

```yaml
需要確認的信息:
  1. Azure 訂閱和租戶:
    - 訂閱 ID
    - 租戶 ID
    - 訂閱名稱

  2. 資源命名規範:
    - 資源群組命名前綴
    - 資源命名模式
    - 標籤(Tags)要求

  3. 網路配置要求:
    - 是否需要 VNet 配置
    - NSG 規則要求
    - Private Endpoint 需求
    - 防火牆白名單

  4. Key Vault 配置:
    - 使用共用 Key Vault 或獨立創建
    - 訪問策略申請流程
    - 密鑰命名規範

  5. 合規性要求:
    - 數據加密要求
    - 訪問日誌記錄
    - 備份策略
    - 災難恢復 RTO/RPO
```

### 步驟 2: 配置環境文件

```bash
# 1. 複製配置範例（從個人環境參考）
cp azure/environments/personal/dev.env.example azure/environments/company/dev.env

# 2. 根據公司規範修改配置
# 編輯 azure/environments/company/dev.env

# 重要: 修改資源命名避免與個人環境衝突
RESOURCE_GROUP="rg-itpm-company-dev"           # 加上 'company' 前綴
APP_SERVICE_NAME="app-itpm-company-dev-001"
POSTGRESQL_SERVER_NAME="psql-itpm-company-dev-001"
STORAGE_ACCOUNT_NAME="stitpmcompany001"        # 全球唯一
ACR_NAME="acritpmcompany"                      # 全球唯一
KEY_VAULT_NAME="kv-itpm-company-dev"

# Azure 訂閱（必需）
AZURE_SUBSCRIPTION_ID="公司訂閱 ID"
AZURE_TENANT_ID="公司租戶 ID"
```

### 步驟 3: 獲取部署權限

```yaml
需要的權限:
  Azure RBAC:
    - Contributor（資源群組層級）
    - 或特定資源的 Owner/Contributor

  Key Vault:
    - Key Vault Secrets User（讀取密鑰）
    - Key Vault Secrets Officer（管理密鑰）

  網路:
    - Network Contributor（如需配置 VNet）

申請流程:
  1. 提交權限申請（公司內部流程）
  2. 說明部署目的和資源需求
  3. 等待 Azure Admin 審批
  4. 驗證權限: az role assignment list --assignee <your-email>
```

### 步驟 4: Service Principal 配置（如需 CI/CD）

```bash
# 由 Azure Administrator 創建
az ad sp create-for-rbac \
  --name "sp-itpm-company-deployment" \
  --role contributor \
  --scopes /subscriptions/<COMPANY_SUBSCRIPTION_ID>/resourceGroups/rg-itpm-company-dev

# 獲得輸出:
# {
#   "appId": "xxx",           # AZURE_CLIENT_ID
#   "password": "xxx",        # AZURE_CLIENT_SECRET
#   "tenant": "xxx"           # AZURE_TENANT_ID
# }

# 配置 GitHub Secrets（如使用 GitHub Actions）
# - AZURE_CLIENT_ID_COMPANY
# - AZURE_CLIENT_SECRET_COMPANY
# - AZURE_TENANT_ID_COMPANY
# - AZURE_SUBSCRIPTION_ID_COMPANY
```

---

## 🚀 部署執行流程

### 安全確認部署

```bash
# 從項目根目錄執行
bash azure/scripts/deploy-to-company.sh dev

# 腳本會顯示確認提示:
# ================================================
# ⚠️  您即將部署到公司 Azure 環境
# ================================================
#
# 📋 部署目標信息:
#   環境: company/dev
#   訂閱 ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#   資源群組: rg-itpm-company-dev
#   區域: East Asia
#   應用名稱: app-itpm-company-dev-001
#
# ⚠️  請確認以下事項：
#   [ ] 已獲得部署授權
#   [ ] 配置符合公司規範
#   [ ] 已與 Azure Admin 確認
#   [ ] 了解變更影響範圍
#
# 確認繼續部署? (輸入 'yes' 繼續):
```

**輸入 `yes` 後才會開始部署**。

### 部署階段（與個人環境相同）

腳本會自動執行 6 個階段：

1. ✅ 設置資源群組
2. ✅ 設置 PostgreSQL 資料庫
3. ✅ 設置 Blob Storage
4. ✅ 設置 Container Registry
5. ✅ 設置 App Service
6. ✅ 部署應用程式

**預計時間**: 首次部署 15-25 分鐘（取決於網路和資源配置）

---

## 🔑 環境變數配置（公司環境）

### 配置文件位置

```
azure/environments/company/dev.env
azure/environments/company/staging.env
azure/environments/company/prod.env
```

### 必需環境變數

```bash
# Azure 訂閱（公司）
AZURE_SUBSCRIPTION_ID="公司訂閱 ID"
AZURE_TENANT_ID="公司租戶 ID"

# Azure 資源（避免與個人環境衝突）
RESOURCE_GROUP="rg-itpm-company-dev"
LOCATION="eastasia"
APP_SERVICE_NAME="app-itpm-company-dev-001"
POSTGRESQL_SERVER_NAME="psql-itpm-company-dev-001"
STORAGE_ACCOUNT_NAME="stitpmcompany001"         # 全球唯一
ACR_NAME="acritpmcompany"                       # 全球唯一
KEY_VAULT_NAME="kv-itpm-company-dev"

# 或使用共用企業 Key Vault
KEY_VAULT_NAME="kv-company-shared"              # 公司共用 Key Vault

# 資料庫連接（Key Vault 引用）
DATABASE_URL="@Microsoft.KeyVault(VaultName=kv-itpm-company-dev;SecretName=ITPM-COMPANY-DEV-DATABASE-URL)"

# NextAuth.js
NEXTAUTH_SECRET="@Microsoft.KeyVault(VaultName=kv-itpm-company-dev;SecretName=ITPM-COMPANY-DEV-NEXTAUTH-SECRET)"
NEXTAUTH_URL="https://app-itpm-company-dev-001.azurewebsites.net"

# Azure AD B2C（公司企業帳戶）
AZURE_AD_B2C_TENANT_NAME="companytenantname"
AZURE_AD_B2C_CLIENT_ID="公司 B2C Client ID"
AZURE_AD_B2C_CLIENT_SECRET="@Microsoft.KeyVault(VaultName=kv-itpm-company-dev;SecretName=ITPM-COMPANY-DEV-AZUREADB2C-CLIENT-SECRET)"

# Email（生產環境使用 SendGrid）
SENDGRID_API_KEY="@Microsoft.KeyVault(VaultName=kv-itpm-company-dev;SecretName=ITPM-COMPANY-DEV-SENDGRID-API-KEY)"
SENDGRID_FROM_EMAIL="noreply@company.com"
SENDGRID_FROM_NAME="IT Project Management"
```

### Key Vault 密鑰配置

**如果使用獨立 Key Vault**:

```bash
# 配置密鑰（需要 Key Vault Secrets Officer 權限）
az keyvault secret set \
  --vault-name kv-itpm-company-dev \
  --name ITPM-COMPANY-DEV-DATABASE-URL \
  --value "postgresql://..."

az keyvault secret set \
  --vault-name kv-itpm-company-dev \
  --name ITPM-COMPANY-DEV-NEXTAUTH-SECRET \
  --value "$(openssl rand -base64 32)"

# 授予 App Service Managed Identity 訪問權限
PRINCIPAL_ID=$(az webapp identity show \
  --name app-itpm-company-dev-001 \
  --resource-group rg-itpm-company-dev \
  --query "principalId" -o tsv)

az keyvault set-policy \
  --name kv-itpm-company-dev \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

**如果使用公司共用 Key Vault**:

```yaml
訪問流程:
  1. 聯繫 Azure Administrator 申請訪問權限 2. 提供 App Service Managed Identity Principal ID 3. 等待
  Admin 授予權限 4. 確認密鑰命名符合公司規範 5. 驗證 App Service 可訪問密鑰
```

---

## 🔍 部署後驗證

### 自動化驗證（必須執行）

```bash
# 1. 驗證部署成功
bash azure/scripts/helper/verify-deployment.sh

# 檢查項目:
- ✅ App Service 狀態 = Running
- ✅ HTTP 健康檢查 = 200
- ✅ 容器日誌無嚴重錯誤
- ✅ 資料庫連接正常
- ✅ Key Vault 訪問正常

# 2. 完整煙霧測試
bash azure/tests/smoke-test.sh company-dev

# 測試項目:
- ✅ 首頁訪問
- ✅ API 健康檢查
- ✅ 資料庫讀寫
- ✅ Blob Storage 訪問
- ✅ 登入功能
- ✅ 郵件發送（SendGrid）
```

### 手動驗證（推薦）

```yaml
critical_checks:
  1. 應用程式訪問:
    URL: https://app-itpm-company-dev-001.azurewebsites.net
    預期: 顯示登入頁面，無錯誤

  2. 企業帳號登入: 使用公司 Azure AD B2C 帳號登入 驗證 SSO 流程正常

  3. 核心功能測試:
    - 創建測試項目
    - 上傳文件（Blob Storage）
    - 提交預算提案
    - 驗證郵件通知

  4. 安全性檢查:
    - 確認 HTTPS 啟用
    - 檢查環境變數無硬編碼密鑰
    - 驗證 Key Vault 訪問權限最小化

  5. 監控和日誌:
    - Application Insights 數據收集
    - 日誌正常寫入 Log Analytics
    - 告警規則已配置
```

### 查看應用程式日誌

```bash
# 即時日誌串流
az webapp log tail \
  --name app-itpm-company-dev-001 \
  --resource-group rg-itpm-company-dev

# 過濾錯誤
az webapp log tail \
  --name app-itpm-company-dev-001 \
  --resource-group rg-itpm-company-dev | grep -i "error\|exception"
```

---

## 🛡️ 企業安全最佳實踐

### 1. 網路安全

```yaml
network_configuration:
  VNet_Integration:
    - 應用與資料庫間使用 Private Endpoint
    - NSG 限制入站流量來源
    - 啟用 DDoS Protection（Production）

  防火牆規則:
    - PostgreSQL: 僅允許 App Service VNet 訪問
    - Storage: 啟用防火牆，限制訪問來源
    - Key Vault: 啟用網路規則，限制訪問

  示例 - PostgreSQL VNet 訪問:
    az postgres flexible-server vnet-rule create \ --resource-group rg-itpm-company-prod \
    --server-name psql-itpm-company-prod-001 \ --name app-service-vnet-rule \ --vnet-name
    company-vnet \ --subnet app-service-subnet
```

### 2. 數據加密

```yaml
encryption_requirements:
  傳輸加密:
    - HTTPS Only（強制）
    - TLS 1.2+
    - PostgreSQL SSL 連接

  靜態加密:
    - Blob Storage: 啟用加密
    - PostgreSQL: 透明數據加密（TDE）
    - Key Vault: 受保護的密鑰管理

  配置示例:
    # 強制 HTTPS
    az webapp update \
      --name app-itpm-company-prod-001 \
      --resource-group rg-itpm-company-prod \
      --set httpsOnly=true

    # 強制 TLS 1.2
    az webapp config set \
      --name app-itpm-company-prod-001 \
      --resource-group rg-itpm-company-prod \
      --min-tls-version 1.2
```

### 3. 訪問控制

```yaml
access_control:
  RBAC:
    - 最小權限原則
    - 定期審查權限
    - 使用 Azure AD 群組管理

  Managed_Identity:
    - App Service → Key Vault: System-assigned MI
    - App Service → Storage: MI 訪問
    - App Service → PostgreSQL: MI 認證（可選）

  審計:
    - 啟用 Azure Activity Log
    - 監控權限變更
    - 定期審查訪問日誌
```

### 4. 備份和災難恢復

```yaml
backup_strategy:
  資料庫備份:
    - 自動備份: 每日
    - 保留期: 7-35 天（根據合規要求）
    - 測試恢復: 每月

  應用程式備份:
    - Docker 映像: 版本標籤保留所有版本
    - 配置: Git 版本控制
    - 部署歷史: 記錄在 azure/deployment-history/company/

  災難恢復:
    - RTO: < 4 小時
    - RPO: < 1 小時
    - 異地備份: 考慮 Geo-redundant Storage

  示例 - 配置 PostgreSQL 備份:
    az postgres flexible-server update \ --resource-group rg-itpm-company-prod \ --name
    psql-itpm-company-prod-001 \ --backup-retention 35 \ --geo-redundant-backup Enabled
```

---

## 📊 監控和告警（企業級）

### Application Insights 配置

```bash
# 創建 Application Insights
az monitor app-insights component create \
  --app app-itpm-company-prod-insights \
  --location eastasia \
  --resource-group rg-itpm-company-prod \
  --application-type web

# 獲取 Instrumentation Key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app app-itpm-company-prod-insights \
  --resource-group rg-itpm-company-prod \
  --query instrumentationKey -o tsv)

# 配置 App Service 連接
az webapp config appsettings set \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### 告警規則配置

```yaml
alert_rules:
  high_priority:
    - HTTP 5xx 錯誤率 > 5%
    - 可用性 < 99%
    - 平均響應時間 > 3 秒
    - CPU 使用率 > 80%
    - 記憶體使用率 > 85%

  medium_priority:
    - HTTP 4xx 錯誤率 > 10%
    - 資料庫連接池耗盡
    - Blob Storage 限流

  notification:
    - Email: devops@company.com
    - SMS: 緊急聯繫人
    - Slack: #alerts-production
```

---

## 🔄 回滾程序（生產環境）

### Production 環境回滾流程

**方案 1: Slot Swap 回滾（推薦，最快）**

```bash
# 前提: 使用了 Deployment Slots（Staging + Production）

# 1. 立即 Swap 回 Staging Slot
az webapp deployment slot swap \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --slot staging \
  --target-slot production \
  --action swap

# 2. 驗證回滾成功
bash azure/tests/smoke-test.sh company-prod

# 3. 監控 10 分鐘確保穩定
az webapp log tail \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod
```

**方案 2: 部署舊版本鏡像**

```bash
# 1. 確認要回滾的版本
OLD_VERSION="v1.5.2"  # 穩定版本

# 2. 切換到舊版本鏡像
az webapp config container set \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --docker-custom-image-name acritpmcompany.azurecr.io/itpm-web:$OLD_VERSION

# 3. 重啟應用程式
az webapp restart \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod

# 4. 驗證回滾
bash azure/tests/smoke-test.sh company-prod
```

**方案 3: Git 回滾 + 重新部署**

```bash
# 1. 回滾代碼
git revert <commit-hash>
git push origin main

# 2. 觸發 CI/CD Pipeline（如配置）
# 或手動部署
bash azure/scripts/deploy-to-company.sh prod
```

---

## 📋 部署記錄和審計

### 自動記錄

```bash
# 部署腳本會自動創建記錄
azure/deployment-history/company/deploy-{env}-{timestamp}.log

# 記錄內容:
- 部署時間
- 環境（company/dev|staging|prod）
- Azure 訂閱 ID
- 資源群組
- 應用名稱
- 執行者
- 部署狀態
```

### 變更管理流程

```yaml
change_management:
  部署前:
    - [ ] 創建變更請求（公司內部流程）
    - [ ] 獲得 Change Advisory Board (CAB) 批准
    - [ ] 通知相關團隊
    - [ ] 準備回滾計劃

  部署中:
    - [ ] 按照批准的變更窗口執行
    - [ ] 實時監控部署進度
    - [ ] 記錄所有操作

  部署後:
    - [ ] 驗證部署成功
    - [ ] 更新變更記錄
    - [ ] 通知團隊部署完成
    - [ ] 監控 24 小時穩定性
```

---

## 📞 支持和升級路徑

### Level 1: 自助診斷（0-30 分鐘）

```yaml
actions:
  - 查看 SITUATION-9-AZURE-TROUBLESHOOT-COMPANY.md
  - 執行診斷腳本: bash azure/tests/test-azure-connectivity.sh company-{env}
  - 查看應用程式日誌
  - 檢查 Application Insights
```

### Level 2: 內部 DevOps Team（30-60 分鐘）

```yaml
contacts:
  - Email: devops@company.com
  - Slack: #devops-support
  - 緊急熱線: +886-XXX-XXXX
```

### Level 3: Azure Administrator（1-2 小時）

```yaml
scenarios:
  - 權限問題
  - 網路配置問題
  - Key Vault 訪問問題
  - 訂閱配額問題
```

### Level 4: Microsoft Azure Support（嚴重故障）

```yaml
process:
  1. 在 Azure Portal 創建支持票證 2. 選擇適當的嚴重性級別（Severity A-C） 3. 提供完整診斷資訊 4.
  跟進至問題解決
```

---

## 🔐 Schema 完整性驗證（部署前必做）

> ⚠️ **重要**: 這是防止「部分頁面 500 錯誤」的關鍵步驟！每次部署前必須執行。

### 為什麼需要這個檢查？

```yaml
歷史教訓:
  問題 0.6 (2025-12-02): FEAT-001 欄位缺失 → /projects 500
  問題 0.7 (2025-12-03): Post-MVP 表格缺失 → /om-expenses, /om-summary 500

根本原因:
  - schema.prisma 定義了新的 model/欄位
  - 但 migration SQL 沒有包含這些變更
  - Azure 資料庫缺少表格或欄位
  - API 查詢時失敗，返回 500

預防原則:
  - 每次部署前驗證 schema 和 migration 完全一致
  - 不是只測試「重要頁面」，而是確保「整個項目」的 schema 完整
```

### 自動化驗證腳本

**在部署前執行以下驗證命令**：

```bash
# ============================================================
# Schema 完整性驗證腳本
# 在每次部署前執行，確保 schema.prisma 和 migrations 一致
# ============================================================

echo "🔍 開始 Schema 完整性驗證..."

# 1. 統計 schema.prisma 中的 model 數量
SCHEMA_MODELS=$(grep -c "^model " packages/db/prisma/schema.prisma)
echo "📊 Schema models 數量: $SCHEMA_MODELS"

# 2. 統計 migration SQL 中的 CREATE TABLE 數量
MIGRATION_TABLES=$(grep -rh "CREATE TABLE" packages/db/prisma/migrations/*/migration.sql 2>/dev/null | wc -l)
echo "📊 Migration CREATE TABLE 數量: $MIGRATION_TABLES"

# 3. 列出 schema.prisma 中的所有 model
echo ""
echo "📋 Schema.prisma 中的 Models:"
grep "^model " packages/db/prisma/schema.prisma | sed 's/model /  - /' | sed 's/ {//'

# 4. 列出 migration SQL 中的所有表格
echo ""
echo "📋 Migration SQL 中的表格:"
grep -rh "CREATE TABLE" packages/db/prisma/migrations/*/migration.sql 2>/dev/null | \
  sed 's/.*CREATE TABLE[^"]*"\([^"]*\)".*/  - \1/' | sort | uniq

# 5. 檢查關鍵表格是否存在於 migration 中
echo ""
echo "🔍 檢查關鍵表格..."

CRITICAL_TABLES=(
  "User" "Role" "Project" "BudgetPool" "BudgetProposal"
  "Vendor" "Quote" "PurchaseOrder" "Expense"
  "ExpenseCategory" "OperatingCompany" "OMExpense"
  "ChargeOut" "Currency" "Notification"
)

MISSING_TABLES=()
for table in "${CRITICAL_TABLES[@]}"; do
  if ! grep -rq "CREATE TABLE.*\"$table\"" packages/db/prisma/migrations/*/migration.sql 2>/dev/null; then
    MISSING_TABLES+=("$table")
    echo "  ❌ $table - 缺失！"
  else
    echo "  ✅ $table"
  fi
done

# 6. 檢查 FEAT-001 欄位（Project 表）
echo ""
echo "🔍 檢查 Project 表欄位..."
FEAT001_FIELDS=("projectCode" "globalFlag" "priority" "currencyId")
for field in "${FEAT001_FIELDS[@]}"; do
  if grep -rq "\"$field\"" packages/db/prisma/migrations/*/migration.sql 2>/dev/null; then
    echo "  ✅ $field"
  else
    echo "  ⚠️ $field - 可能缺失，請確認"
  fi
done

# 7. 總結
echo ""
echo "============================================================"
if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
  echo "✅ Schema 完整性驗證通過！"
  echo "   可以安全進行部署。"
else
  echo "❌ Schema 完整性驗證失敗！"
  echo "   缺失的表格: ${MISSING_TABLES[*]}"
  echo "   請先創建缺失表格的 migration SQL 再進行部署。"
  echo ""
  echo "   解決方案參考:"
  echo "   - 問題 0.6: FEAT-001 欄位缺失"
  echo "   - 問題 0.7: Post-MVP 表格缺失"
fi
echo "============================================================"
```

### 快速驗證命令（簡化版）

```bash
# 一行命令快速檢查
echo "Models: $(grep -c '^model ' packages/db/prisma/schema.prisma) | Tables: $(grep -rh 'CREATE TABLE' packages/db/prisma/migrations/*/migration.sql 2>/dev/null | wc -l)"

# 檢查特定表格是否存在
grep -r "CREATE TABLE.*ExpenseCategory" packages/db/prisma/migrations/*/migration.sql
grep -r "CREATE TABLE.*OperatingCompany" packages/db/prisma/migrations/*/migration.sql
grep -r "CREATE TABLE.*OMExpense" packages/db/prisma/migrations/*/migration.sql
```

### 當發現缺失時的處理流程

```yaml
發現缺失時:
  1. 停止部署:
    - 不要繼續部署，先修復問題

  2. 創建補充 migration:
    - mkdir -p packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_missing_xxx
    - 創建 idempotent migration SQL (使用 IF NOT EXISTS)

  3. 驗證 Docker image:
    - docker build -f docker/Dockerfile -t test-image .
    - docker run --rm test-image ls -la /app/packages/db/prisma/migrations/
    - 確認新 migration 存在於 image 中

  4. 重新驗證:
    - 再次執行 Schema 完整性驗證腳本
    - 確認所有檢查通過

  5. 繼續部署:
    - 所有驗證通過後才能部署

idempotent_migration_template: |
  -- 使用 IF NOT EXISTS 確保可重複執行
  CREATE TABLE IF NOT EXISTS "TableName" (
    "id" TEXT NOT NULL,
    ...
    CONSTRAINT "TableName_pkey" PRIMARY KEY ("id")
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "TableName_field_key" ON "TableName"("field");

  -- 添加欄位時使用 DO $$ BEGIN ... END $$
  DO $$ BEGIN
    ALTER TABLE "TableName" ADD COLUMN "newField" TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END $$;
```

### 完整的 Model 清單（供參考）

```yaml
# 截至 2025-12-03，schema.prisma 應包含以下 24 個 models:

MVP_階段_models:
  認證相關:
    - User
    - Role
    - Account
    - Session
    - VerificationToken

  預算管理:
    - BudgetPool
    - BudgetCategory
    - Project
    - BudgetProposal

  採購管理:
    - Vendor
    - Quote
    - PurchaseOrder
    - Expense

  通知系統:
    - Notification
    - Comment
    - History

Post_MVP_階段_models:
  費用類別:
    - ExpenseCategory      # ⚠️ 常見遺漏
    - ExpenseItem

  營運費用:
    - OperatingCompany     # ⚠️ 常見遺漏
    - OMExpense            # ⚠️ 常見遺漏
    - OMExpenseMonthly

  費用分攤:
    - ChargeOut
    - ChargeOutItem

  採購明細:
    - PurchaseOrderItem

  幣別:
    - Currency

驗證命令:
  grep "^model " packages/db/prisma/schema.prisma | wc -l
  # 應該返回 24（或更多，如果有新增）
```

---

## ✅ 公司環境部署檢查清單

### 部署前（必須完成）

**Schema 完整性驗證（最重要！）**
- [ ] ⭐ 執行 Schema 完整性驗證腳本
- [ ] ⭐ 確認所有 24 個 models 都有對應的 CREATE TABLE
- [ ] ⭐ 確認 FEAT-001 欄位（projectCode, globalFlag, priority）存在
- [ ] ⭐ 確認 Post-MVP 表格（ExpenseCategory, OperatingCompany, OMExpense）存在
- [ ] ⭐ 驗證 Docker image 中的 migrations 完整

**企業環境確認**
- [ ] 已與公司 Azure Administrator 確認配置
- [ ] 已獲得必要的部署授權
- [ ] 配置文件符合公司命名規範
- [ ] Key Vault 訪問權限已申請並授予
- [ ] 網路配置（VNet/NSG）已確認
- [ ] 監控和告警已配置
- [ ] 備份策略已規劃
- [ ] 變更請求已批准（Production）

### 部署中

- [ ] 安全確認提示已仔細閱讀
- [ ] 輸入 'yes' 前再次確認訂閱和資源群組
- [ ] 部署過程無錯誤
- [ ] 所有 6 個階段成功完成
- [ ] 應用程式容器啟動成功

### 部署後

**⭐ 完整頁面測試（必須全部通過！）**

執行以下自動化測試腳本：

```bash
# 部署後完整頁面測試腳本
BASE_URL="https://app-itpm-company-dev-001.azurewebsites.net"

echo "🔍 開始部署後完整頁面測試..."
echo "============================================================"

# 所有頁面列表（按功能模組分類）
declare -A PAGES=(
  # MVP 核心頁面
  ["登入頁面"]="/zh-TW/login"
  ["首頁"]="/zh-TW"
  ["Dashboard"]="/zh-TW/dashboard"

  # 用戶管理
  ["用戶列表"]="/zh-TW/users"

  # 預算管理
  ["預算池列表"]="/zh-TW/budget-pools"
  ["項目列表"]="/zh-TW/projects"
  ["提案列表"]="/zh-TW/proposals"

  # 採購管理
  ["供應商列表"]="/zh-TW/vendors"
  ["報價單列表"]="/zh-TW/quotes"
  ["採購單列表"]="/zh-TW/purchase-orders"
  ["費用列表"]="/zh-TW/expenses"

  # Post-MVP 功能（常見遺漏！）
  ["營運費用"]="/zh-TW/om-expenses"
  ["營運摘要"]="/zh-TW/om-summary"
  ["費用分攤"]="/zh-TW/charge-outs"
  ["費用類別"]="/zh-TW/om-expense-categories"
  ["營運公司"]="/zh-TW/operating-companies"

  # 系統設置
  ["通知中心"]="/zh-TW/notifications"
  ["設置頁面"]="/zh-TW/settings"
  ["幣別設置"]="/zh-TW/settings/currencies"
)

FAILED=()
PASSED=0

for name in "${!PAGES[@]}"; do
  path="${PAGES[$name]}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")

  # 200 或 302（重定向到登入）都算正常
  if [ "$status" = "200" ] || [ "$status" = "302" ]; then
    echo "  ✅ $name ($path) - HTTP $status"
    ((PASSED++))
  else
    echo "  ❌ $name ($path) - HTTP $status"
    FAILED+=("$name")
  fi
done

echo "============================================================"
echo "📊 測試結果: $PASSED/${#PAGES[@]} 通過"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "❌ 失敗的頁面: ${FAILED[*]}"
  echo ""
  echo "⚠️ 部署驗證失敗！請檢查:"
  echo "   1. 查看容器日誌: az webapp log tail ..."
  echo "   2. 檢查是否有表格/欄位缺失"
  echo "   3. 參考 SITUATION-9 進行問題排查"
else
  echo "✅ 所有頁面測試通過！部署成功完成。"
fi
```

**檢查清單**

- [ ] ⭐ 執行完整頁面測試腳本（上方）
- [ ] ⭐ 所有 19+ 個頁面返回 200 或 302
- [ ] 自動化驗證腳本全部通過
- [ ] 手動功能測試完成
- [ ] 企業帳號登入正常（Azure AD B2C）
- [ ] 容器日誌無 "column does not exist" 或 "relation does not exist" 錯誤
- [ ] 監控數據開始收集
- [ ] 日誌正常寫入
- [ ] 告警規則已測試
- [ ] 團隊已通知部署完成
- [ ] 部署記錄已歸檔

---

## 🎯 實戰經驗：2025-11-25 首次部署記錄

> 本章節記錄首次部署到公司 Azure 環境的實際經驗和解決方案，供後續部署參考。

### 實際使用的資源

```yaml
resource_group: RG-RCITest-RAPO-N8N # 使用現有資源群組
location: eastasia

resources_created:
  postgresql: psql-itpm-company-dev-001
  storage: stitpmcompanydev001
  acr: acritpmcompany
  app_service_plan: asp-itpm-company-dev-001
  app_service: app-itpm-company-dev-001

service_principal:
  name: RIT
  tenant_id: 4f63aaa0-5612-4fe8-8175-9f9f4d26c7b4
  client_id: a19dfe76-8dde-4e94-b8c4-ee18ea514d09
  subscription_id: 30dac177-6dcb-412e-94f6-da9308fd1d09
```

### 關鍵問題與解決方案

#### 🔴 問題 0: .dockerignore 排除 Prisma Migrations（2025-11-26 重大發現）

> ⚠️ **Critical Issue**：這是導致用戶註冊 500 錯誤的根本原因！

**症狀**:

```
❌ 用戶註冊返回 500 Internal Server Error
❌ 容器日誌顯示 "No migration found in prisma/migrations"
❌ 資料庫表不存在（Role、Currency 等）
```

**根本原因**:

```yaml
root_cause_chain:
  1. .dockerignore 包含 "**/migrations" 規則 2. Docker 建置時 migrations 資料夾被排除 3. Container
  中 /app/packages/db/prisma/migrations/ 為空 4. startup.sh 執行 "prisma migrate deploy" 報告 "No
  migration found" 5. 資料庫 Schema 未建立 6. Seed 無法執行 7. 用戶註冊時 roleId 外鍵約束失敗
```

**解決方案**:

**步驟 1: 修改 .dockerignore**

```diff
# Prisma - Keep migrations for migrate deploy
- **/migrations
+ # **/migrations  <-- REMOVED: migrations are required for prisma migrate deploy
```

**步驟 2: 確認 .gitignore 允許 migration SQL**

```diff
# Database dumps
*.sql
*.dump
!scripts/init-db.sql
+ !packages/db/prisma/migrations/**/*.sql  # Allow Prisma migration SQL files
```

**步驟 3: 驗證 Docker Image**

```bash
# 重建並驗證
docker build -f docker/Dockerfile -t acritpmcompany.azurecr.io/itpm-web:latest .

# 確認 migrations 存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/packages/db/prisma/migrations/
# 應該看到: 20251024082756_init/, 20251111065801_new/, 20251126100000_add_currency/
```

**步驟 4: 執行 Seed**

```bash
# 部署後執行 seed
curl -X POST "https://app-itpm-company-dev-001.azurewebsites.net/api/admin/seed" \
  -H "Authorization: Bearer <NEXTAUTH_SECRET>" \
  -H "Content-Type: application/json"

# 預期成功響應:
# {"success":true,"results":{"roles":{"processed":3},"currencies":{"processed":6}}}
```

**參考文檔**: `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md`

---

#### 🔴 問題 0.6: FEAT-001 Schema 不匹配（2025-12-02 重大發現）

> ⚠️ **Critical Issue**：這是導致 `/projects` 頁面 500 錯誤的根本原因！

**症狀**:

```
❌ /zh-TW/projects 頁面返回 500 Internal Server Error
❌ API project.getAll 返回 500 錯誤
❌ 容器日誌顯示 "column does not exist" 或 Prisma 查詢錯誤
❌ 其他頁面（如 /users）可以正常訪問
```

**根本原因**:

```yaml
root_cause_chain:
  1. schema.prisma 定義了 FEAT-001 新欄位（projectCode, globalFlag, priority）
  2. 但 migration SQL 只添加了 currencyId 欄位
  3. 資料庫中 Project 表缺少 3 個必填欄位
  4. Prisma Client 查詢時嘗試 SELECT 不存在的欄位
  5. PostgreSQL 返回 "column does not exist" 錯誤
  6. tRPC 將錯誤轉換為 500 Internal Server Error

schema_vs_migration:
  schema.prisma 定義:
    - projectCode String @unique  # 必填
    - globalFlag String @default("Region")  # 必填
    - priority String @default("Medium")  # 必填
    - currencyId String?  # 可選

  migration 20251126100000_add_currency 只添加:
    - currencyId TEXT  # ✅ 已添加
    # ❌ projectCode 未添加
    # ❌ globalFlag 未添加
    # ❌ priority 未添加
```

**快速診斷**:

```bash
# 1. 檢查 migrations 目錄中的 SQL 是否包含所有 FEAT-001 欄位
cat packages/db/prisma/migrations/*/migration.sql | grep -E "projectCode|globalFlag|priority"
# 如果沒有結果，說明 migration 缺少這些欄位！

# 2. 直接測試 API（需要先登入獲取 session）
curl -s "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/project.getAll" \
  -H "Cookie: <your-session-cookie>"
# 如果返回 500，而 user.getAll 返回 200，說明是 Project 表問題

# 3. 比較 schema.prisma 和 migration SQL
# schema.prisma 中 Project model 的欄位 vs migration SQL 中 ALTER TABLE "Project" 的欄位
```

**解決方案**:

**步驟 1: 創建補充 migration SQL**

```bash
# 創建新的 migration 目錄
mkdir -p packages/db/prisma/migrations/20251202100000_add_feat001_project_fields

# 創建 migration.sql 文件
```

**步驟 2: 添加 migration SQL 內容**

```sql
-- 20251202100000_add_feat001_project_fields/migration.sql
-- FEAT-001: 添加缺失的 Project 欄位

-- 添加欄位（先設為 nullable 以支援現有資料）
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectCode" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "globalFlag" TEXT DEFAULT 'Region';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'Medium';

-- 為現有記錄生成臨時 projectCode（使用 UUID 前 8 位）
UPDATE "Project" SET "projectCode" = 'PRJ-' || SUBSTRING(id::text, 1, 8) WHERE "projectCode" IS NULL;

-- 設置 NOT NULL 約束
ALTER TABLE "Project" ALTER COLUMN "projectCode" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "globalFlag" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "priority" SET NOT NULL;

-- 添加唯一約束
CREATE UNIQUE INDEX IF NOT EXISTS "Project_projectCode_key" ON "Project"("projectCode");

-- 添加索引
CREATE INDEX IF NOT EXISTS "Project_projectCode_idx" ON "Project"("projectCode");
CREATE INDEX IF NOT EXISTS "Project_globalFlag_idx" ON "Project"("globalFlag");
CREATE INDEX IF NOT EXISTS "Project_priority_idx" ON "Project"("priority");
```

**步驟 3: 重建並部署 Docker image**

```bash
# 重建 Docker image
docker build -f docker/Dockerfile -t acritpmcompany.azurecr.io/itpm-web:v7-fix-feat001 .

# 驗證 migrations 存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:v7-fix-feat001 \
  ls -la /app/packages/db/prisma/migrations/
# 應該看到新的 20251202100000_add_feat001_project_fields/ 目錄

# 推送到 ACR
docker push acritpmcompany.azurecr.io/itpm-web:v7-fix-feat001

# 更新 App Service 配置
az webapp config container set \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N \
  --docker-custom-image-name acritpmcompany.azurecr.io/itpm-web:v7-fix-feat001

# 重啟 App Service
az webapp restart --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N
```

**步驟 4: 驗證修復**

```bash
# 等待 2-3 分鐘讓容器啟動和 migration 執行
# 查看日誌確認 migration 成功
az webapp log tail --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N | grep -i "migration"
# 應該看到 "Applying migration 20251202100000_add_feat001_project_fields"

# 測試 /projects 頁面
curl -s -o /dev/null -w "%{http_code}" "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/projects"
# 應該返回 200 或 302（重定向到登入）
```

**預防措施**:

```yaml
prevention_checklist:
  開發階段:
    - [ ] 每次修改 schema.prisma 後，必須創建對應的 migration
    - [ ] 使用 `pnpm db:migrate` 而非手動修改 migration SQL
    - [ ] 確保 migration SQL 包含所有 schema 變更

  部署前:
    - [ ] 比較 schema.prisma 和所有 migration SQL 的欄位一致性
    - [ ] 在本地開發環境先測試 migration
    - [ ] 驗證 Docker image 中的 migrations 完整性

  CI/CD:
    - [ ] 添加 schema-migration 一致性檢查步驟
    - [ ] 在部署前驗證資料庫 schema 狀態
```

**詳細參考**: 本文件「問題 0.5」章節（Currency 表缺失問題）類似案例

---

#### 🔴 問題 0.7: Post-MVP 表格缺失（2025-12-02 重大發現）

> ⚠️ **Critical Issue**：這是導致 `/om-expenses` 和 `/om-summary` 頁面 500 錯誤的根本原因！

**症狀**:

```
❌ /zh-TW/om-expenses 頁面返回 500 Internal Server Error
❌ /zh-TW/om-summary 頁面返回 500 Internal Server Error
❌ API omExpense.getCategories 返回 500 錯誤
❌ API omExpense.getAll 返回 500 錯誤
❌ 其他頁面（如 /projects、/users、/login）可以正常訪問
```

**根本原因**:

```yaml
root_cause_chain:
  1. schema.prisma 定義了 Post-MVP 新表格（ExpenseCategory, OperatingCompany, OMExpense 等）
  2. 但 Azure 資料庫中這些表格不存在（僅有 MVP 階段的表格）
  3. omExpense.getCategories API 查詢 ExpenseCategory 表
  4. PostgreSQL 返回 "relation ExpenseCategory does not exist" 錯誤
  5. tRPC 將錯誤轉換為 500 Internal Server Error

missing_tables:
  Post-MVP 表格（8個）:
    - ExpenseCategory  # ❌ 缺失 - 導致 om-expenses 500
    - OperatingCompany  # ❌ 缺失
    - OMExpense  # ❌ 缺失
    - OMExpenseMonthly  # ❌ 缺失
    - ChargeOut  # ❌ 缺失
    - ChargeOutItem  # ❌ 缺失
    - PurchaseOrderItem  # ❌ 缺失
    - ExpenseItem  # ❌ 缺失

why_only_om_pages_affected:
  - ExpenseCategory 是 om-expenses 頁面的核心依賴
  - 其他頁面使用的是 MVP 階段已存在的表格
  - /projects、/users 等頁面不依賴 Post-MVP 表格
```

**快速診斷**:

```bash
# 1. 確認問題範圍 - 測試不同頁面
curl -s -o /dev/null -w "%{http_code}" "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/projects"
# 應該返回 200

curl -s -o /dev/null -w "%{http_code}" "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/om-expenses"
# 如果返回 500，說明是 Post-MVP 表格問題

# 2. 檢查 migrations 是否包含 Post-MVP 表格
cat packages/db/prisma/migrations/*/migration.sql | grep -E "ExpenseCategory|OperatingCompany|OMExpense"
# 如果沒有輸出，說明 migration 缺少這些表格

# 3. 檢查 schema.prisma 中的 Post-MVP models
grep -E "^model (ExpenseCategory|OperatingCompany|OMExpense)" packages/db/prisma/schema.prisma
# 應該看到這些 model 定義

# 4. 查看容器日誌中的錯誤詳情
az webapp log tail --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N 2>&1 | grep -i "error\|relation\|does not exist"
```

**解決方案**:

**步驟 1: 創建 Post-MVP 表格 migration**

```bash
# 創建新的 migration 目錄
mkdir -p packages/db/prisma/migrations/20251202110000_add_postmvp_tables
```

**步驟 2: 創建 idempotent migration SQL**

```sql
-- 20251202110000_add_postmvp_tables/migration.sql
-- Post-MVP: 添加缺失的表格（使用 IF NOT EXISTS 確保冪等性）

-- 1. ExpenseCategory 表（費用類別）
CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_code_key" ON "ExpenseCategory"("code");

-- 2. OperatingCompany 表（營運公司）
CREATE TABLE IF NOT EXISTS "OperatingCompany" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperatingCompany_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OperatingCompany_code_key" ON "OperatingCompany"("code");

-- 3-8. 其他 Post-MVP 表格...
-- （完整 SQL 參見 packages/db/prisma/migrations/20251202110000_add_postmvp_tables/migration.sql）

-- Seed 基礎數據
INSERT INTO "ExpenseCategory" ("id", "code", "name", "description", "sortOrder")
VALUES
  (gen_random_uuid()::text, 'HW', '硬體', '硬體設備、伺服器、工作站等', 1),
  (gen_random_uuid()::text, 'SW', '軟體', '軟體授權、應用程式購買', 2),
  -- ... 其他類別
ON CONFLICT ("code") DO NOTHING;
```

**步驟 3: 重建並部署 Docker image**

```bash
# 重建 Docker image
docker build -f docker/Dockerfile -t acritpmcompany.azurecr.io/itpm-web:v8-postmvp-tables .

# 驗證 migrations 存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:v8-postmvp-tables \
  ls -la /app/packages/db/prisma/migrations/
# 應該看到新的 20251202110000_add_postmvp_tables/ 目錄

# 推送到 ACR
az acr login --name acritpmcompany
docker push acritpmcompany.azurecr.io/itpm-web:v8-postmvp-tables

# 更新 App Service 配置
az webapp config container set \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N \
  --container-image-name acritpmcompany.azurecr.io/itpm-web:v8-postmvp-tables

# 重啟 App Service
az webapp restart --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N
```

**步驟 4: 驗證修復**

```bash
# 等待容器重啟（2-3 分鐘）
sleep 180

# 查看日誌確認 migration 執行
az webapp log tail --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N 2>&1 | grep -i "migration"
# 應該看到 "Applying migration 20251202110000_add_postmvp_tables"

# 測試 /om-expenses 頁面
curl -s -o /dev/null -w "%{http_code}" "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/om-expenses"
# 應該返回 200

# 測試 /om-summary 頁面
curl -s -o /dev/null -w "%{http_code}" "https://app-itpm-company-dev-001.azurewebsites.net/zh-TW/om-summary"
# 應該返回 200
```

**預防措施**:

```yaml
prevention_checklist:
  開發階段:
    - [ ] 每次添加新功能（Epic/Feature）時，確保創建完整的 migration
    - [ ] 使用 `pnpm db:migrate` 自動生成 migration，不要手動創建
    - [ ] 在 PR 中確認 schema.prisma 變更有對應的 migration SQL

  部署前驗證:
    - [ ] 比較 schema.prisma 中的 model 數量和 migration 中的 CREATE TABLE 數量
    - [ ] 驗證所有 Post-MVP 表格都有對應的 migration
    - [ ] 在本地 Docker 環境先測試完整部署流程
    - [ ] 測試所有核心頁面（不只是登入頁面）

  CI/CD 強化:
    - name: Validate all models have migrations
      run: |
        # 檢查 schema.prisma 中的所有 model 是否都有對應的 CREATE TABLE
        SCHEMA_MODELS=$(grep "^model " packages/db/prisma/schema.prisma | wc -l)
        MIGRATION_TABLES=$(grep "CREATE TABLE" packages/db/prisma/migrations/*/migration.sql | wc -l)
        echo "Schema models: $SCHEMA_MODELS, Migration tables: $MIGRATION_TABLES"
        # 如果數量不匹配，發出警告

  部署後驗證:
    - [ ] 測試所有主要頁面（projects, users, om-expenses, om-summary 等）
    - [ ] 不能只測試登入頁面就認為部署成功
    - [ ] 使用自動化腳本測試所有 API 端點
```

**關鍵學習**:

```yaml
key_insights:
  1. 部分頁面正常不代表部署完全成功:
    - 只有訪問使用缺失表格的頁面才會出錯
    - 登入、用戶管理等基礎功能可能正常
    - 必須測試所有功能模組

  2. Migration 必須覆蓋所有 schema 變更:
    - 每個 schema.prisma 中的 model 都需要對應的 CREATE TABLE
    - 每個新增欄位都需要對應的 ALTER TABLE
    - 使用 IF NOT EXISTS 確保 migration 冪等性

  3. Idempotent migration 很重要:
    - 使用 CREATE TABLE IF NOT EXISTS
    - 使用 CREATE INDEX IF NOT EXISTS
    - 使用 ON CONFLICT DO NOTHING 處理 seed 數據
    - 允許 migration 重複執行而不出錯
```

---

#### 🔴 問題 0.8: Prisma Client Docker 生成失敗（2025-12-03 重大發現）

> ⚠️ **Critical Issue**：這是導致容器啟動後 API 返回 500 錯誤的根本原因之一！

**症狀**:

```
❌ 所有 API 調用返回 500 Internal Server Error
❌ 容器日誌顯示 Prisma Client 相關錯誤
❌ health.dbCheck 返回 "unhealthy"
❌ 但容器本身可以啟動，首頁可以載入
```

**根本原因**:

```yaml
root_cause_chain:
  1. Dockerfile 使用 `pnpm --filter @itpm/db run db:generate` 生成 Prisma Client
  2. pnpm 在 Docker 環境中報告 "None of the selected packages has a 'prisma' script"
  3. Prisma Client 未正確生成，變成 stub 文件
  4. 運行時 Prisma 無法執行任何資料庫操作
  5. 所有使用資料庫的 API 返回 500 錯誤

verification:
  # 檢查 Prisma Client 是否正確生成
  docker run --rm <image> cat /app/node_modules/.prisma/client/index.js | head -20
  # 如果看到 "stub" 或文件很小，說明 Client 未正確生成
```

**快速診斷**:

```bash
# 1. 測試 health API
curl "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.ping"
# 如果返回 pong，說明應用本身正常

curl "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.dbCheck"
# 如果返回 unhealthy，可能是 Prisma Client 問題

# 2. 檢查 Docker image 中的 Prisma Client
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/node_modules/.prisma/client/
# 應該看到 libquery_engine-*.so.node 文件
```

**解決方案**:

**步驟 1: 修改 Dockerfile，使用 npx 直接執行 prisma generate**

```dockerfile
# ❌ 錯誤方式（在 Docker 中可能失敗）
# RUN pnpm --filter @itpm/db run db:generate

# ✅ 正確方式（直接使用 npx）
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma
```

**步驟 2: 確保正確複製 Prisma Client 到 runner stage**

```dockerfile
# Copy Prisma generated client from pnpm store
# 注意：pnpm 將 Prisma Client 放在 node_modules/.pnpm/ 下
COPY --from=builder --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma \
  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client \
  ./node_modules/@prisma/client
```

**驗證修復**:

```bash
# 重建 Docker image
docker build -t acritpmcompany.azurecr.io/itpm-web:vX-prisma-fix .

# 驗證 Prisma Client 存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:vX-prisma-fix \
  ls -la /app/node_modules/.prisma/client/
# 應該看到 libquery_engine-linux-musl-openssl-3.0.x.so.node

# 推送並部署後測試
curl "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.dbCheck"
# 應該返回 {"status": "healthy", "database": "connected"}
```

---

#### 🔴 問題 0.9: OpenSSL 3.0 相容性問題（2025-12-03 重大發現）

> ⚠️ **Critical Issue**：Alpine Linux 3.22+ 移除了 OpenSSL 1.1，導致 Prisma 無法啟動！

**症狀**:

```
❌ 容器日誌顯示 "Error loading shared library libssl.so.1.1"
❌ Prisma Client 無法初始化
❌ 所有資料庫操作失敗
```

**根本原因**:

```yaml
root_cause:
  - Node.js 20-alpine 基於 Alpine Linux 3.22
  - Alpine 3.22 移除了 OpenSSL 1.1 (libssl.so.1.1)
  - 只提供 OpenSSL 3.0 (libssl.so.3)
  - Prisma 預設嘗試載入 OpenSSL 1.1 版本的 Query Engine
  - 找不到 libssl.so.1.1，導致啟動失敗

attempted_fix_that_failed:
  # 這個方法在 Alpine 3.22 中不再有效
  RUN apk add --no-cache openssl1.1-compat
  # 返回 "ERROR: unable to select packages: openssl1.1-compat (no such package)"
```

**解決方案**:

**方法 1: 設置環境變數指向 OpenSSL 3.0 Engine（推薦）**

```dockerfile
# 在 Dockerfile 的 runner stage 添加
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node
```

**方法 2: 確保 schema.prisma 包含正確的 binaryTargets**

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

**驗證修復**:

```bash
# 檢查 Prisma engine 文件存在
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/node_modules/.prisma/client/ | grep libquery_engine
# 應該看到: libquery_engine-linux-musl-openssl-3.0.x.so.node

# 測試 API
curl "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.dbCheck"
# 應該返回 healthy
```

---

#### 🔴 問題 0.10: Migration 卡住（finishedAt 為 null）（2025-12-03 重大發現）

> ⚠️ **Critical Issue**：Migration 執行但未完成，導致表格缺失！

**症狀**:

```
❌ 容器日誌顯示 migration 正在執行
❌ 但某些表格仍然不存在
❌ schemaCheck API 顯示表格 exists: false
❌ _prisma_migrations 表中 finishedAt 為 null
```

**根本原因**:

```yaml
root_cause_chain:
  1. Prisma migrate deploy 開始執行 migration
  2. 在 _prisma_migrations 表中創建記錄（finishedAt = null）
  3. Migration SQL 執行過程中發生錯誤（可能是網路、超時等）
  4. Migration 未完成，finishedAt 保持 null
  5. 下次啟動時，Prisma 認為 migration 正在進行中，跳過執行
  6. 表格永遠不會被創建

diagnosis:
  # 使用 schemaCheck API 檢查
  curl "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.schemaCheck"
  # 查看 migrations 數組中是否有 finishedAt: null 的記錄
```

**解決方案**:

**使用 fixMigration API 端點修復**

我們在 `packages/api/src/routers/health.ts` 中添加了專用修復端點：

```bash
# 調用 fixMigration API（POST 請求，因為是 mutation）
curl -X POST "https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.fixMigration"

# 預期響應
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "results": [
          "Created ExpenseCategory table (if not existed)",
          "Added unique constraint on code",
          "Created indexes",
          "Inserted default expense categories",
          "Marked migration 20251202110000_add_postmvp_tables as complete"
        ],
        "timestamp": "2025-12-03T09:14:50.819Z"
      }
    }
  }
}
```

**fixMigration 端點功能**:

```typescript
// packages/api/src/routers/health.ts
fixMigration: publicProcedure.mutation(async ({ ctx }) => {
  // 1. 創建缺失的表格（使用 IF NOT EXISTS）
  // 2. 添加約束和索引
  // 3. 插入預設數據
  // 4. 將卡住的 migration 標記為完成（更新 finishedAt）
});
```

**驗證修復**:

```bash
# 1. 調用修復端點
curl -X POST "https://...azurewebsites.net/api/trpc/health.fixMigration"

# 2. 驗證所有表格存在
curl "https://...azurewebsites.net/api/trpc/health.schemaCheck"
# 應該顯示 "status": "complete" 且所有表格 exists: true

# 3. 測試之前失敗的頁面
curl -s -o /dev/null -w "%{http_code}" "https://...azurewebsites.net/zh-TW/om-expenses"
# 應該返回 200 或 302（需登入）
```

---

### 🔧 Health API 診斷工具

> 新增於 v1.6.0 - 提供遠程診斷和修復能力

**端點位置**: `packages/api/src/routers/health.ts`

**可用端點**:

| 端點 | 方法 | 用途 |
|------|------|------|
| `health.ping` | GET | 基礎健康檢查，驗證 API 運行 |
| `health.dbCheck` | GET | 資料庫連線檢查 |
| `health.schemaCheck` | GET | 驗證 Post-MVP 表格是否存在 |
| `health.fixMigration` | POST | 修復卡住的 migration |
| `health.echo` | GET | 回顯測試 |

**使用範例**:

```bash
BASE_URL="https://app-itpm-company-dev-001.azurewebsites.net"

# 1. 基礎健康檢查
curl "$BASE_URL/api/trpc/health.ping"
# 返回: {"result":{"data":{"json":{"message":"pong","timestamp":"..."}}}}

# 2. 資料庫連線檢查
curl "$BASE_URL/api/trpc/health.dbCheck"
# 返回: {"status":"healthy","database":"connected"} 或 {"status":"unhealthy",...}

# 3. Schema 完整性檢查
curl "$BASE_URL/api/trpc/health.schemaCheck"
# 返回所有 Post-MVP 表格的存在狀態和記錄數

# 4. 修復卡住的 migration（慎用！）
curl -X POST "$BASE_URL/api/trpc/health.fixMigration"
# 創建缺失表格並標記 migration 為完成
```

**⚠️ 安全注意事項**:

- `fixMigration` 是 `publicProcedure`，無需認證即可調用
- 在生產環境中，考慮添加認證或 IP 白名單保護
- 此端點使用 `IF NOT EXISTS`，重複調用是安全的

---

#### 問題 1: Key Vault 創建權限不足

**症狀**:

```
ERROR: The subscription is not registered to use namespace 'Microsoft.KeyVault'
或
ERROR: Authorization failed for action 'Microsoft.KeyVault/vaults/write'
```

**解決方案**: 直接使用 App Service App Settings 配置環境變數

```bash
# 不使用 Key Vault，直接配置 App Settings
az webapp config appsettings set \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N \
  --settings \
    DATABASE_URL="postgresql://..." \
    NEXTAUTH_SECRET="..." \
    NEXTAUTH_URL="https://app-itpm-company-dev-001.azurewebsites.net"
```

#### 問題 2: Docker 建置時 Prisma 初始化失敗

**症狀**:

```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine
或
Error: ENOENT: no such file or directory, open '.../libquery_engine-linux-musl-openssl-3.0.x.so.node'
```

**根本原因**: Prisma Client 在 `import` 時就嘗試初始化，但 Docker 建置階段沒有資料庫連接。

**解決方案**: 使用 Proxy 模式實現真正的 lazy loading

```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

// 使用 Proxy 實現真正的 lazy loading
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    return getPrisma()[prop];
  },
});
```

同時需要在 `schema.prisma` 添加：

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

#### 問題 3: API Routes 在建置時預渲染

**症狀**:

```
Error during Next.js build: Cannot read properties of undefined
（在建置 API routes 時發生）
```

**解決方案**: 在所有使用資料庫的 API routes 添加：

```typescript
export const dynamic = 'force-dynamic';
```

需要修改的檔案：

- `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- `apps/web/src/app/api/projects/route.ts`
- `apps/web/src/app/api/projects/[id]/route.ts`
- `apps/web/src/app/api/health/route.ts`

#### 問題 4: Database 網路連接

**症狀**:

```
Connection timeout 或 ECONNREFUSED
```

**解決方案**: 配置 PostgreSQL 防火牆規則

```bash
# 添加 Azure 服務訪問
az postgres flexible-server firewall-rule create \
  --resource-group RG-RCITest-RAPO-N8N \
  --name psql-itpm-company-dev-001 \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 如需本地開發測試，添加開發機 IP
az postgres flexible-server firewall-rule create \
  --resource-group RG-RCITest-RAPO-N8N \
  --name psql-itpm-company-dev-001 \
  --rule-name AllowDevMachine \
  --start-ip-address <YOUR_IP> \
  --end-ip-address <YOUR_IP>
```

### 部署流程驗證清單

```yaml
deployment_checklist:
  pre_deployment:
    - [ ] .dockerignore 不排除 migrations（檢查 **/migrations 已註解）
    - [ ] Service Principal 登入成功
    - [ ] 資源群組存在且有權限
    - [ ] ACR 已建立且可登入
    - [ ] ⭐ Dockerfile 使用 npx prisma generate（不是 pnpm filter）
    - [ ] ⭐ Dockerfile 設置 PRISMA_QUERY_ENGINE_LIBRARY 環境變數

  docker_build:
    - [ ] Prisma Proxy lazy loading 已實作
    - [ ] binaryTargets 包含 linux-musl-openssl-3.0.x
    - [ ] API routes 已添加 dynamic export
    - [ ] Docker build 成功完成
    - [ ] migrations 資料夾存在於 image 中
    - [ ] ⭐ Prisma Client 正確生成（檢查 libquery_engine-*.so.node 存在）

  deployment:
    - [ ] 映像已推送到 ACR
    - [ ] App Service 配置正確
    - [ ] 環境變數已設定（App Settings 或 Key Vault）
    - [ ] 資料庫防火牆規則已配置

  post_deployment:
    - [ ] 容器日誌顯示 "X migrations found"
    - [ ] 容器日誌顯示 "All migrations have been successfully applied"
    - [ ] 容器日誌顯示 "Seed 執行成功" (自動執行)
    - [ ] 網站可訪問
    - [ ] 用戶註冊功能正常
    - [ ] ⭐ health.ping 返回 pong
    - [ ] ⭐ health.dbCheck 返回 healthy
    - [ ] ⭐ health.schemaCheck 返回 status: complete

  migration_issues:  # 如果遇到 migration 問題
    - [ ] 調用 health.schemaCheck 檢查表格狀態
    - [ ] 如有 finishedAt: null，調用 health.fixMigration
    - [ ] 再次驗證 schemaCheck 返回 complete
```

### startup.sh 自動遷移和 Seed 機制

**檔案位置**: `docker/startup.sh`

**重要更新 (v1.3.0)**: startup.sh 現在會自動執行 Seed，不再需要手動執行 `/api/admin/seed`！

```bash
#!/bin/sh
# 容器啟動時自動執行：
# 1. Prisma migrate deploy - 執行資料庫遷移
# 2. Seed 基礎數據 - 植入 Role 和 Currency（使用 upsert 確保冪等）
# 3. 啟動 Next.js 應用

echo "🚀 ITPM 應用程式啟動"
echo "📦 Step 1/2: 執行 Prisma 資料庫遷移..."
node ... prisma migrate deploy ...

echo "🌱 Step 2/2: 執行基礎種子資料 (Seed)..."
# 自動執行 Seed 腳本，植入：
# - 3 個 Roles (ProjectManager, Supervisor, Admin)
# - 6 個 Currencies (TWD, USD, CNY, JPY, EUR, HKD)

echo "🌐 啟動 Next.js 應用..."
exec node apps/web/server.js
```

**Seed 使用 upsert 確保冪等性**：

- 每次容器啟動都會執行 Seed
- 使用 `upsert` 操作，已存在的數據不會重複創建
- 保證 Role 和 Currency 表永不為空

### Seed API 端點（備用方案）

**端點**: `POST /api/admin/seed`

**用途**: 備用方案 - 如果 startup.sh 的自動 Seed 失敗，可以手動執行此 API

**注意**: v1.3.0 之後，正常情況下**不再需要手動執行**此 API，因為 startup.sh 會自動執行 Seed。

**認證**: 需要 `Authorization: Bearer <NEXTAUTH_SECRET>`

**檔案位置**: `apps/web/src/app/api/admin/seed/route.ts`

**使用場景**:

- startup.sh 的 Seed 執行失敗時
- 需要重新植入基礎數據時
- 驗證數據完整性時（使用 GET 端點）

**響應範例**:

```json
{
  "success": true,
  "message": "Seed 成功完成",
  "results": {
    "roles": { "processed": 3, "total": 3, "errors": [] },
    "currencies": { "processed": 6, "total": 6, "errors": [] }
  },
  "verification": {
    "hasProjectManagerRole": true,
    "roleCount": 3,
    "currencyCount": 6
  }
}
```

---

### 有用的診斷命令

```bash
# ============================================================
# Azure CLI 診斷命令
# ============================================================

# 檢查 App Service 狀態
az webapp show --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N --query state

# 查看即時日誌
az webapp log tail --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N

# 檢查容器設定
az webapp config container show --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N

# 重啟應用
az webapp restart --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N

# 檢查 ACR 映像
az acr repository show-tags --name acritpmcompany --repository itpm-web

# ============================================================
# ⭐ Health API 診斷命令（推薦使用！）
# ============================================================

BASE_URL="https://app-itpm-company-dev-001.azurewebsites.net"

# 基礎健康檢查
curl "$BASE_URL/api/trpc/health.ping"

# 資料庫連線檢查
curl "$BASE_URL/api/trpc/health.dbCheck"

# Schema 完整性檢查（檢查所有 Post-MVP 表格）
curl "$BASE_URL/api/trpc/health.schemaCheck"

# 修復卡住的 migration（創建缺失表格 + 標記 migration 完成）
curl -X POST "$BASE_URL/api/trpc/health.fixMigration"

# ============================================================
# Docker Image 驗證命令
# ============================================================

# 檢查 Prisma Client 是否正確生成
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/node_modules/.prisma/client/

# 檢查 migrations 是否存在於 image 中
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls -la /app/packages/db/prisma/migrations/

# 檢查 OpenSSL 3.0 engine 文件
docker run --rm acritpmcompany.azurecr.io/itpm-web:latest \
  ls /app/node_modules/.prisma/client/ | grep libquery_engine
```

---

**版本**: 1.6.0 **最後更新**: 2025-12-03 **維護者**: DevOps Team + Azure Administrator
**適用環境**: 公司 Azure 訂閱（Staging、Production、正式環境）

**更新記錄**:

- v1.6.0 (2025-12-03): **重大更新** - Docker 建置和 Migration 診斷工具
  - 添加「問題 0.8: Prisma Client Docker 生成失敗」- pnpm db:generate 在 Docker 中失敗
  - 添加「問題 0.9: OpenSSL 3.0 相容性問題」- Alpine 3.22 移除 OpenSSL 1.1
  - 添加「問題 0.10: Migration 卡住」- finishedAt 為 null 導致表格缺失
  - 添加「Health API 診斷工具」章節 - schemaCheck、fixMigration 端點使用指南
  - 記錄 Dockerfile 修復：使用 npx prisma generate 代替 pnpm filter
  - 記錄 PRISMA_QUERY_ENGINE_LIBRARY 環境變數解決方案
- v1.5.0 (2025-12-03): **重大更新** - 添加 Post-MVP 表格缺失問題
  - 添加「問題 0.7: Post-MVP 表格缺失」- Azure 資料庫缺少 ExpenseCategory 等 8 個 Post-MVP 表格
  - 記錄 /om-expenses 和 /om-summary 頁面 500 錯誤的案例
  - 強調「部分頁面正常不代表部署完全成功」的關鍵學習
  - 添加 idempotent migration SQL 範例和最佳實踐
  - 更新部署後驗證清單，要求測試所有主要頁面
- v1.4.0 (2025-12-02): **重大更新** - 添加 FEAT-001 Schema 不匹配問題
  - 添加「問題 0.6: FEAT-001 Schema 不匹配」- schema.prisma 與 migration SQL 欄位不一致問題
  - 記錄 projectCode, globalFlag, priority 欄位缺失導致 /projects 500 錯誤的案例
  - 提供完整的診斷步驟和 migration SQL 修復方案
  - 更新預防措施檢查清單
- v1.3.0 (2025-11-26): **重大更新** - startup.sh 現在自動執行 Seed，解決每次部署後需手動 Seed 的問題
  - 修改 `docker/startup.sh` 添加自動 Seed 邏輯
  - Seed 使用 upsert 確保冪等性
  - 更新部署檢查清單
  - Seed API 改為備用方案
- v1.2.0 (2025-11-26): 添加 .dockerignore 關鍵問題、Migration 缺失問題、startup.sh 自動遷移、Seed
  API 端點
- v1.1.0 (2025-11-25): 添加首次部署實戰經驗章節
