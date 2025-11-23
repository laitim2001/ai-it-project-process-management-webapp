# SITUATION-6: Azure 個人環境部署指引

**用途**: 當需要部署到**個人 Azure 訂閱**時，使用此指引確保正確、快速、高效的部署流程。

**目標環境**: 個人 Azure 訂閱（用於開發、測試、快速驗證）

**觸發情境**:
- 首次部署到個人 Azure 環境
- 更新個人環境的應用程式版本
- 測試新功能或修復 Bug
- 快速驗證部署流程
- 學習和實驗 Azure 配置

**部署腳本**: `azure/scripts/deploy-to-personal.sh`

---

## 🎯 個人環境部署原則

### 1. 快速迭代優先
```yaml
deployment_philosophy:
  - ✅ 快速部署，快速驗證
  - ✅ 自動化測試，減少手動步驟
  - ✅ 容錯性高，允許試錯
  - ✅ 文檔完整，便於學習
  - ✅ 成本優化，使用基礎層級資源
```

### 2. 環境隔離
```yaml
isolation_strategy:
  資源命名: "rg-itpm-dev" (個人環境前綴)
  訂閱: 個人 Azure 訂閱
  資料庫: 獨立 PostgreSQL instance
  儲存體: 獨立 Storage Account
  Key_Vault: 獨立 Key Vault (kv-itpm-dev)
```

### 3. 安全原則（簡化版）
```yaml
security_checklist:
  - ✅ 敏感資料存放在 Key Vault
  - ✅ 使用 Managed Identity（無需密碼）
  - ✅ DATABASE_URL 不硬編碼
  - ⚠️  開發環境可暫時放寬防火牆規則
  - ℹ️  不需要人工審批流程
```

---

## 📁 目錄結構參考

### 執行層（最重要）⭐⭐⭐⭐⭐
```
azure/
├── scripts/
│   └── deploy-to-personal.sh   # ⭐ 個人環境部署入口
├── environments/
│   └── personal/                # ⭐ 個人環境配置
│       ├── dev.env.example
│       ├── staging.env.example
│       ├── prod.env.example
│       └── README.md
└── tests/                       # 部署後驗證腳本
```

### 文檔層（學習參考）⭐⭐⭐⭐
```
docs/deployment/
├── AZURE-DEPLOYMENT-GUIDE.md
├── 01-first-time-setup.md
└── 03-troubleshooting.md
```

### 記錄層（歷史參考）⭐⭐⭐
```
claudedocs/
├── AZURE-PRISMA-FIX-DEPLOYMENT-SUCCESS.md
└── AZURE-LOGIN-I18N-FIX-DEPLOYMENT.md
```

**參考**: 詳細目錄角色說明請查閱 `claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md`

---

## 🚀 快速開始：首次部署

### 前置檢查
```bash
# 1. 登入個人 Azure 訂閱
az login
az account show  # 確認訂閱正確

# 2. 驗證必需工具
node --version     # >= 20.0.0
pnpm --version     # >= 8.0.0
docker --version   # 確認 Docker daemon 運行中

# 3. 檢查環境變數（可選）
pnpm check:env
```

### 一鍵部署到 Dev 環境
```bash
# 從項目根目錄執行
bash azure/scripts/deploy-to-personal.sh dev
```

**腳本會自動執行 6 個階段**:
1. ✅ 設置資源群組
2. ✅ 設置 PostgreSQL 資料庫
3. ✅ 設置 Blob Storage
4. ✅ 設置 Container Registry
5. ✅ 設置 App Service
6. ✅ 部署應用程式

**預計時間**: 首次部署 15-20 分鐘

---

## 📋 部署流程詳解

### 階段 1: 資源群組設置
```bash
# 腳本會執行
bash azure/scripts/01-setup-resources.sh

# 創建的資源
- 資源群組: rg-itpm-dev
- 位置: East Asia
```

### 階段 2: PostgreSQL 資料庫
```bash
# 腳本會執行
bash azure/scripts/02-setup-database.sh

# 創建的資源
- PostgreSQL Flexible Server: psql-itpm-dev-001
- 版本: PostgreSQL 16
- 層級: Burstable B1ms（成本優化）
- 防火牆規則: 允許 Azure 服務訪問
```

**資料庫連接字串格式**:
```
postgresql://username:password@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require
```

### 階段 3: Blob Storage
```bash
# 腳本會執行
bash azure/scripts/03-setup-storage.sh

# 創建的資源
- Storage Account: stitpmdev001
- 容器: quotes, invoices
- 訪問層級: Private
```

### 階段 4: Container Registry
```bash
# 腳本會執行
bash azure/scripts/04-setup-acr.sh

# 創建的資源
- ACR: acritpmdev
- 層級: Basic
- Admin 啟用: 是（簡化開發流程）
```

### 階段 5: App Service
```bash
# 腳本會執行
bash azure/scripts/05-setup-appservice.sh

# 創建的資源
- App Service Plan: plan-itpm-dev (Linux, B1)
- App Service: app-itpm-dev-001
- Runtime: Docker Container
- Managed Identity: 啟用（訪問 Key Vault）
```

### 階段 6: 應用程式部署
```bash
# 腳本會執行
bash azure/scripts/06-deploy-app.sh

# 執行內容
1. 構建 Docker 映像
2. 推送到 ACR
3. 配置環境變數（Key Vault 引用）
4. 重啟 App Service
5. 等待容器啟動
```

---

## 🔑 環境變數配置

### 配置文件位置
```
azure/environments/personal/dev.env.example
```

### 必需環境變數
```bash
# Azure 資源
RESOURCE_GROUP="rg-itpm-dev"
LOCATION="eastasia"
APP_SERVICE_NAME="app-itpm-dev-001"
POSTGRESQL_SERVER_NAME="psql-itpm-dev-001"
STORAGE_ACCOUNT_NAME="stitpmdev001"
ACR_NAME="acritpmdev"
KEY_VAULT_NAME="kv-itpm-dev"

# 資料庫連接
DATABASE_URL="@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-DATABASE-URL)"

# NextAuth.js
NEXTAUTH_SECRET="@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-NEXTAUTH-SECRET)"
NEXTAUTH_URL="https://app-itpm-dev-001.azurewebsites.net"

# Azure AD B2C（可選）
AZURE_AD_B2C_TENANT_NAME="yourtenantname"
AZURE_AD_B2C_CLIENT_ID="your-client-id"
AZURE_AD_B2C_CLIENT_SECRET="@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-CLIENT-SECRET)"

# Email（開發環境使用 Mailhog）
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

### Key Vault 密鑰清單
```bash
# 查看已配置的密鑰
bash azure/scripts/helper/list-secrets.sh

# 預期密鑰
- ITPM-DEV-DATABASE-URL
- ITPM-DEV-NEXTAUTH-SECRET
- ITPM-DEV-STORAGE-ACCOUNT-KEY
- ITPM-DEV-AZUREADB2C-CLIENT-SECRET（可選）
```

---

## 🔍 部署後驗證

### 自動化驗證
```bash
# 1. 驗證部署成功
bash azure/scripts/helper/verify-deployment.sh

# 檢查項目
- ✅ App Service 狀態 = Running
- ✅ HTTP 健康檢查 = 200
- ✅ 容器日誌無錯誤

# 2. 煙霧測試（可選）
bash azure/tests/smoke-test.sh dev

# 測試項目
- ✅ 首頁訪問
- ✅ API 健康檢查
- ✅ 資料庫連接
- ✅ Blob Storage 訪問
- ✅ 登入功能
```

### 手動驗證
```yaml
manual_checks:
  1. 訪問應用程式:
     URL: https://app-itpm-dev-001.azurewebsites.net
     預期: 顯示登入頁面

  2. 測試登入:
     - 使用 Azure AD B2C（如已配置）
     - 或使用本地帳號

  3. 創建測試數據:
     - 創建測試項目
     - 上傳測試文件
     - 驗證資料庫寫入

  4. 查看應用程式日誌:
     az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev
```

---

## 🔄 更新部署（後續部署）

### 情境 1: 代碼更新
```bash
# 重新部署應用程式（跳過資源設置）
bash azure/scripts/06-deploy-app.sh

# 或完整重新部署
bash azure/scripts/deploy-to-personal.sh dev
```

### 情境 2: 環境變數更新
```bash
# 1. 在 Key Vault 更新密鑰
az keyvault secret set \
  --vault-name kv-itpm-dev \
  --name ITPM-DEV-NEW-SETTING \
  --value "new-value"

# 2. 更新 App Service 環境變數
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings NEW_SETTING="@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-NEW-SETTING)"

# 3. 重啟應用程式
az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev
```

### 情境 3: 資料庫遷移
```bash
# 在本地測試遷移
pnpm db:migrate

# 部署新版本（自動執行遷移）
bash azure/scripts/deploy-to-personal.sh dev

# 驗證遷移成功
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev
# 查找: "Prisma migrate" 相關日誌
```

---

## 📊 監控和日誌

### 查看即時日誌
```bash
# 串流即時日誌
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 過濾錯誤
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev | grep -i error
```

### 下載日誌文件
```bash
# 下載最近日誌
az webapp log download \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --log-file app-logs.zip

# 解壓查看
unzip app-logs.zip
```

### 查看資源使用
```bash
# CPU 和記憶體使用率
az monitor metrics list \
  --resource /subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-itpm-dev/providers/Microsoft.Web/sites/app-itpm-dev-001 \
  --metric "CpuPercentage" "MemoryPercentage" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)
```

---

## 🛡️ 安全最佳實踐（個人環境）

### Key Vault 使用
```yaml
best_practices:
  - ✅ 所有密鑰存放在 Key Vault
  - ✅ 使用 Managed Identity 訪問
  - ✅ App Service 環境變數使用 Key Vault 引用格式
  - ℹ️  開發環境可以使用較簡單的密鑰輪換策略

key_vault_reference_format:
  DATABASE_URL: "@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-DATABASE-URL)"
  NEXTAUTH_SECRET: "@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-NEXTAUTH-SECRET)"
```

### 防火牆配置（開發導向）
```bash
# PostgreSQL - 允許 Azure 服務訪問
az postgres flexible-server firewall-rule create \
  --resource-group rg-itpm-dev \
  --name psql-itpm-dev-001 \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 允許本地開發機器訪問（可選）
az postgres flexible-server firewall-rule create \
  --resource-group rg-itpm-dev \
  --name psql-itpm-dev-001 \
  --rule-name AllowLocalDev \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

---

## 💰 成本優化建議

### 資源層級選擇
```yaml
cost_optimization:
  App_Service_Plan:
    推薦: B1 Basic ($13.14/月)
    理由: 足夠開發測試使用

  PostgreSQL:
    推薦: Burstable B1ms ($12.41/月)
    理由: 開發環境流量低

  Storage_Account:
    推薦: Standard LRS
    理由: 本地冗余足夠

  Container_Registry:
    推薦: Basic ($5/月)
    理由: 開發環境鏡像數量少

總計預估: ~$30-40/月（個人開發環境）
```

### 省錢技巧
```bash
# 1. 不使用時停止 App Service
az webapp stop --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 2. 啟動時再開啟
az webapp start --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 3. 定期清理未使用資源
az resource list --resource-group rg-itpm-dev --query "[?tags.environment=='temp']"
```

---

## 🎓 學習資源

### 內部文檔
- `azure/environments/personal/README.md` - 個人環境配置詳解
- `docs/deployment/01-first-time-setup.md` - 首次部署完整指南
- `claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` - 目錄結構指引

### Azure 官方文檔
- [Azure App Service 文檔](https://docs.microsoft.com/azure/app-service/)
- [Azure PostgreSQL Flexible Server](https://docs.microsoft.com/azure/postgresql/flexible-server/)
- [Azure Key Vault 最佳實踐](https://docs.microsoft.com/azure/key-vault/general/best-practices)

### 歷史部署記錄（學習參考）
- `claudedocs/AZURE-PRISMA-FIX-DEPLOYMENT-SUCCESS.md` - v8 Prisma 修復記錄
- `claudedocs/AZURE-LOGIN-I18N-FIX-DEPLOYMENT.md` - v7 I18N 修復記錄

---

## 🔄 回滾程序（個人環境）

### 快速回滾
```bash
# 1. 部署舊版本鏡像
OLD_VERSION="v1.0.0"  # 替換為之前的版本
az webapp config container set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --docker-custom-image-name acritpmdev.azurecr.io/itpm-web:$OLD_VERSION

# 2. 重啟應用程式
az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 3. 驗證回滾成功
bash azure/tests/smoke-test.sh dev
```

### Git 回滾
```bash
# 1. 回滾代碼
git revert <commit-hash>
git push origin main

# 2. 重新部署
bash azure/scripts/deploy-to-personal.sh dev
```

---

## 📞 問題排查

### 常見問題快速解決
```yaml
問題1_應用無法訪問:
  症狀: 502/503 錯誤
  快速檢查:
    - az webapp show --name app-itpm-dev-001 --resource-group rg-itpm-dev
    - az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev
  參考: SITUATION-8-AZURE-TROUBLESHOOT-PERSONAL.md

問題2_資料庫連接失敗:
  症狀: "Can't reach database server"
  快速檢查:
    - 檢查 DATABASE_URL 格式
    - 確認防火牆規則
  參考: SITUATION-8-AZURE-TROUBLESHOOT-PERSONAL.md

問題3_容器啟動失敗:
  症狀: 容器持續重啟
  快速檢查:
    - 查看環境變數是否完整
    - 檢查 Docker 映像是否成功推送
  參考: SITUATION-8-AZURE-TROUBLESHOOT-PERSONAL.md
```

### 自助診斷工具
```bash
# 完整連接性測試
bash azure/tests/test-azure-connectivity.sh dev

# 環境配置驗證
bash azure/tests/test-environment-config.sh dev

# 部署健康檢查
bash azure/scripts/helper/verify-deployment.sh
```

---

## ✅ 部署檢查清單

### 首次部署前
- [ ] 已登入正確的個人 Azure 訂閱
- [ ] Node.js >= 20.0.0
- [ ] Docker daemon 運行中
- [ ] pnpm >= 8.0.0
- [ ] 已準備好環境配置（可選）

### 部署中
- [ ] 資源群組創建成功
- [ ] PostgreSQL 資料庫啟動
- [ ] Storage Account 容器創建
- [ ] ACR 可訪問
- [ ] App Service 運行中
- [ ] Docker 映像推送成功

### 部署後
- [ ] 應用程式可訪問
- [ ] 登入功能正常
- [ ] 資料庫連接正常
- [ ] 文件上傳功能正常
- [ ] 日誌無嚴重錯誤

---

**版本**: 1.0.0
**最後更新**: 2025-11-23
**維護者**: 開發團隊
**適用環境**: 個人 Azure 訂閱（開發、測試、學習）
