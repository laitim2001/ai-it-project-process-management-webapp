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
  1. 聯繫 Azure Administrator 申請訪問權限
  2. 提供 App Service Managed Identity Principal ID
  3. 等待 Admin 授予權限
  4. 確認密鑰命名符合公司規範
  5. 驗證 App Service 可訪問密鑰
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

  2. 企業帳號登入:
     使用公司 Azure AD B2C 帳號登入
     驗證 SSO 流程正常

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
    az postgres flexible-server vnet-rule create \
      --resource-group rg-itpm-company-prod \
      --server-name psql-itpm-company-prod-001 \
      --name app-service-vnet-rule \
      --vnet-name company-vnet \
      --subnet app-service-subnet
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
    az postgres flexible-server update \
      --resource-group rg-itpm-company-prod \
      --name psql-itpm-company-prod-001 \
      --backup-retention 35 \
      --geo-redundant-backup Enabled
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
  1. 在 Azure Portal 創建支持票證
  2. 選擇適當的嚴重性級別（Severity A-C）
  3. 提供完整診斷資訊
  4. 跟進至問題解決
```

---

## ✅ 公司環境部署檢查清單

### 部署前（必須完成）
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
- [ ] 自動化驗證腳本全部通過
- [ ] 手動功能測試完成
- [ ] 企業帳號登入正常（Azure AD B2C）
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
resource_group: RG-RCITest-RAPO-N8N  # 使用現有資源群組
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
import { PrismaClient } from "@prisma/client";

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
    - [ ] Service Principal 登入成功
    - [ ] 資源群組存在且有權限
    - [ ] ACR 已建立且可登入

  docker_build:
    - [ ] Prisma Proxy lazy loading 已實作
    - [ ] binaryTargets 包含 linux-musl-openssl-3.0.x
    - [ ] API routes 已添加 dynamic export
    - [ ] Docker build 成功完成

  deployment:
    - [ ] 映像已推送到 ACR
    - [ ] App Service 配置正確
    - [ ] 環境變數已設定（App Settings 或 Key Vault）
    - [ ] 資料庫防火牆規則已配置

  post_deployment:
    - [ ] 網站可訪問
    - [ ] 資料庫連接正常
    - [ ] 認證功能正常
```

### 有用的診斷命令

```bash
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
```

---

**版本**: 1.1.0
**最後更新**: 2025-11-25
**維護者**: DevOps Team + Azure Administrator
**適用環境**: 公司 Azure 訂閱（Staging、Production、正式環境）
**更新記錄**: 
- v1.1.0 (2025-11-25): 添加首次部署實戰經驗章節
