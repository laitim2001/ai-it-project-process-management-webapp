# Azure 部署規劃總覽

**項目**: IT Project Process Management Platform
**部署目標**: Azure App Service (Container Deployment)
**文檔版本**: 1.0
**最後更新**: 2025-11-20

---

## 📋 執行摘要

本文檔提供 IT Project Management Platform 部署到 Azure 的完整規劃，包括：
- **部署架構**: Docker Container + Azure App Service
- **密鑰管理**: 使用公司現有 Azure Key Vault
- **CI/CD**: GitHub Actions + Service Principal
- **環境**: Dev → Staging → Production

---

## 🎯 部署目標

### 技術目標
- ✅ 環境一致性（本地、Dev、Staging、Prod）
- ✅ 快速回滾能力（Docker 鏡像版本控制）
- ✅ 安全密鑰管理（Key Vault 集中管理）
- ✅ 自動化部署（GitHub Actions CI/CD）
- ✅ 高可用性（生產環境）

### 業務目標
- ✅ 支持 Azure AD B2C 企業 SSO
- ✅ 文件存儲使用 Azure Blob（解決本地文件系統問題）
- ✅ 生產級監控和日誌（Application Insights）
- ✅ 符合公司安全政策（使用公司 Key Vault）

---

## 🏗️ 部署架構

### 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Resource Group: rg-itpm-{env}                       │  │
│  │                                                       │  │
│  │  ┌──────────────┐    ┌──────────────┐               │  │
│  │  │              │    │              │               │  │
│  │  │  App Service │───▶│   ACR        │               │  │
│  │  │              │    │  (Docker)    │               │  │
│  │  │              │    │              │               │  │
│  │  └──────┬───────┘    └──────────────┘               │  │
│  │         │                                            │  │
│  │         │                                            │  │
│  │         ├────▶ PostgreSQL Database                  │  │
│  │         │                                            │  │
│  │         ├────▶ Blob Storage (Quotes/Invoices)       │  │
│  │         │                                            │  │
│  │         ├────▶ SendGrid (Email)                     │  │
│  │         │                                            │  │
│  │         ├────▶ Application Insights (Monitoring)    │  │
│  │         │                                            │  │
│  │         └────▶ Company Key Vault (Secrets)          │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Azure AD B2C                                        │  │
│  │  (Enterprise SSO)                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

          ▲
          │
          │  GitHub Actions
          │  (CI/CD Pipeline)
          │
┌─────────┴─────────┐
│   GitHub Repo     │
│                   │
│  ┌──────────────┐ │
│  │ Dockerfile   │ │
│  │ Source Code  │ │
│  │ Env Configs  │ │
│  └──────────────┘ │
└───────────────────┘
```

### 組件說明

| 組件 | 用途 | SKU/Plan | 月成本 (Dev) |
|------|------|----------|-------------|
| **App Service Plan** | 運行 Docker 容器 | Basic B1 (1 vCore, 1.75GB) | ~$13 |
| **Azure Container Registry** | 存儲 Docker 鏡像 | Basic | ~$5 |
| **PostgreSQL Flexible Server** | 數據庫 | Burstable B1ms (1 vCore, 2GB) | ~$12 |
| **Blob Storage** | 文件存儲 | Standard LRS (Hot) | ~$2 |
| **SendGrid** | 郵件服務 | Free (100 封/天) | $0 |
| **Application Insights** | 監控日誌 | Pay-as-you-go (5GB 免費) | ~$0 |
| **Company Key Vault** | 密鑰管理 | 已存在，共用 | $0 |
| **Azure AD B2C** | 企業 SSO | Free (50K MAU) | $0 |
| **總計** | - | - | **~$32/月** |

---

## 🚨 部署阻斷問題

### 問題: 文件上傳使用本地文件系統

**現狀**:
```typescript
// 當前實作 (apps/web/src/app/api/upload/*/route.ts)
const uploadDir = join(process.cwd(), 'public', 'uploads', '...');
await writeFile(filePath, buffer);
```

**問題**:
- ❌ Azure App Service 文件系統是臨時的
- ❌ 重啟後文件會丟失
- ❌ 多實例部署文件不同步

**解決方案**: 實作 Azure Blob Storage 上傳服務

**受影響文件**:
1. `apps/web/src/app/api/upload/quote/route.ts`
2. `apps/web/src/app/api/upload/invoice/route.ts`
3. `apps/web/src/app/api/upload/proposal/route.ts`

**優先級**: 🔴 **關鍵** - 必須在部署前完成

---

## 📅 部署階段規劃

### 階段 1: Docker 配置和測試 ✅

**狀態**: 已完成
**完成日期**: 2025-11-20

**交付物**:
- ✅ `docker/Dockerfile` - 生產環境 Dockerfile
- ✅ `docker/.dockerignore` - Docker build 排除文件
- ✅ `apps/web/next.config.mjs` - 添加 `output: 'standalone'`

---

### 階段 2: 創建部署文件架構 🔄

**狀態**: 進行中
**預計完成**: 2025-11-20

**交付物**:
- ✅ `.azure/README.md` - Azure 部署總覽
- ✅ `.azure/environments/*.env.example` - 環境配置範例
- ✅ `.azure/docs/service-principal-setup.md` - SP 設置指南
- ⏳ `.azure/scripts/*.sh` - Azure CLI 部署腳本
- ✅ `.gitignore` 更新 - 允許 `.azure/` 配置提交

---

### 階段 3: 實作 Azure Blob Storage 上傳服務 ⏳

**狀態**: 待開始
**預計時間**: 6-8 小時

**任務列表**:
1. ⏳ 安裝依賴 `@azure/storage-blob`
2. ⏳ 創建 Blob Storage 服務層 (`apps/web/src/lib/azure-storage.ts`)
3. ⏳ 重構 3 個上傳 API Routes (支持環境檢測)
4. ⏳ 本地測試（使用 Azurite 模擬器）
5. ⏳ 更新文檔和 JSDoc

---

### 階段 4: 創建 AI 助手部署 Prompts ⏳

**狀態**: 待開始
**預計時間**: 2-3 小時

**交付物**:
- ⏳ `claudedocs/6-ai-assistant/prompts/SITUATION-6-AZURE-DEPLOY.md`
- ⏳ `claudedocs/6-ai-assistant/prompts/SITUATION-7-AZURE-TROUBLESHOOT.md`

---

### 階段 5: 準備 Azure 資源配置腳本 ⏳

**狀態**: 待開始
**預計時間**: 4-6 小時

**交付物**:
- ⏳ `.azure/scripts/01-setup-resources.sh`
- ⏳ `.azure/scripts/02-setup-database.sh`
- ⏳ `.azure/scripts/03-setup-storage.sh`
- ⏳ `.azure/scripts/04-setup-acr.sh`
- ⏳ `.azure/scripts/05-setup-appservice.sh`
- ⏳ `.azure/scripts/06-deploy-app.sh`

---

### 階段 6: 配置 CI/CD Pipeline ⏳

**狀態**: 待開始
**預計時間**: 4-5 小時

**交付物**:
- ⏳ `.github/workflows/azure-deploy-dev.yml`
- ⏳ `.github/workflows/azure-deploy-staging.yml`
- ⏳ `.github/workflows/azure-deploy-prod.yml`
- ⏳ GitHub Secrets 配置文檔

---

### 階段 7: 準備部署文檔和檢查清單 ⏳

**狀態**: 待開始
**預計時間**: 3-4 小時

**交付物**:
- ⏳ `docs/deployment/00-prerequisites.md`
- ⏳ `docs/deployment/01-first-time-setup.md`
- ⏳ `docs/deployment/02-ci-cd-setup.md`
- ⏳ `docs/deployment/03-troubleshooting.md`
- ⏳ `docs/deployment/04-rollback.md`

---

### 階段 8: 創建密鑰列表給 Azure Infra Admin ⏳

**狀態**: 待開始
**預計時間**: 1-2 小時

**交付物**:
- ⏳ `docs/deployment/key-vault-secrets-list.md`
- ⏳ `docs/deployment/managed-identity-setup.md`

---

## 🔐 密鑰管理策略

### 使用公司 Azure Key Vault

**決策**: 使用公司現有的 Azure Key Vault，不創建新的 Key Vault

**工作流程**:

```
1. 開發者準備
   ├─ 創建密鑰列表 (docs/deployment/key-vault-secrets-list.md)
   ├─ 創建環境配置範例 (.azure/environments/*.env.example)
   └─ 提交給 Azure Infra Admin

2. Azure Infra Admin
   ├─ 在公司 Key Vault 創建所有密鑰
   ├─ 配置 App Service Managed Identity
   └─ 授予訪問權限

3. 開發者部署
   ├─ 配置 App Service 環境變數（使用 Key Vault 引用）
   ├─ 部署應用
   └─ 驗證密鑰訪問

```

**密鑰命名規範**:
```
格式: ITPM-{ENVIRONMENT}-{SERVICE}-{KEY_NAME}

範例:
- ITPM-DEV-DATABASE-URL
- ITPM-STAGING-NEXTAUTH-SECRET
- ITPM-PROD-SENDGRID-API-KEY
```

---

## 🤖 Service Principal 策略

### 統一使用 Service Principal

**原則**: 所有自動化操作統一使用 Service Principal，不使用個人帳號

**Service Principal 清單**:

1. **CI/CD**:
   - `sp-itpm-github-dev` (Contributor on rg-itpm-dev)
   - `sp-itpm-github-staging` (Contributor on rg-itpm-staging)
   - `sp-itpm-github-prod` (Website Contributor on rg-itpm-prod)

2. **AI 工具**:
   - `sp-itpm-ai-dev` (Reader on rg-itpm-dev)

**安全策略**:
- ✅ 最小權限原則（Production 使用 Website Contributor）
- ✅ 環境隔離（每個環境獨立 SP）
- ✅ 定期輪換密鑰（90 天）
- ✅ 審計日誌（所有操作可追溯）

---

## 📊 環境配置

### Development

```yaml
目的: 開發和測試
配置:
  ResourceGroup: rg-itpm-dev
  AppService: app-itpm-dev-001 (Basic B1)
  Database: psql-itpm-dev-001 (Burstable B1ms)
  Storage: stitpmdev001 (Standard LRS)
  ACR: acritpmdev001 (Basic)
  URL: https://app-itpm-dev-001.azurewebsites.net
部署頻率: 每次 push 到 develop 分支
```

### Staging

```yaml
目的: 預發布測試
配置:
  ResourceGroup: rg-itpm-staging
  AppService: app-itpm-staging-001 (Standard S1)
  Database: psql-itpm-staging-001 (GeneralPurpose D2s_v3)
  Storage: stitpmstaging001 (Standard LRS)
  ACR: acritpmstaging001 (Standard)
  URL: https://app-itpm-staging-001.azurewebsites.net
部署頻率: 每次創建 Release Candidate
```

### Production

```yaml
目的: 生產環境
配置:
  ResourceGroup: rg-itpm-prod
  AppService: app-itpm-prod-001 (Premium P1v3, Auto-scaling)
  Database: psql-itpm-prod-001 (GeneralPurpose D2s_v3, HA)
  Storage: stitpmprod001 (Standard GRS)
  ACR: acritpmprod001 (Standard)
  Redis: itpm-prod-redis (Basic C1)
  URL: https://app-itpm-prod-001.azurewebsites.net
部署頻率: 手動，需要審批
```

---

## 🎬 部署流程

### 首次部署

```bash
# 1. 創建 Azure 資源
bash .azure/scripts/01-setup-resources.sh
bash .azure/scripts/02-setup-database.sh
bash .azure/scripts/03-setup-storage.sh
bash .azure/scripts/04-setup-acr.sh
bash .azure/scripts/05-setup-appservice.sh

# 2. 配置 Service Principal
# 參考: .azure/docs/service-principal-setup.md

# 3. 提交密鑰列表給 Azure Infra Admin
# 參考: docs/deployment/key-vault-secrets-list.md

# 4. 配置 App Service 環境變數
az webapp config appsettings set \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --settings @.azure/environments/dev.env.example

# 5. 構建和推送 Docker 鏡像
docker build -t itpm-web:v1.0.0 -f docker/Dockerfile .
az acr login --name acritpmdev001
docker tag itpm-web:v1.0.0 acritpmdev001.azurecr.io/itpm-web:v1.0.0
docker push acritpmdev001.azurecr.io/itpm-web:v1.0.0

# 6. 部署應用
bash .azure/scripts/06-deploy-app.sh

# 7. 執行數據庫遷移
az webapp ssh --name app-itpm-dev-001 --resource-group rg-itpm-dev
cd /app
node_modules/.bin/prisma migrate deploy

# 8. 驗證部署
curl https://app-itpm-dev-001.azurewebsites.net/api/health
```

### CI/CD 自動部署

```yaml
觸發條件:
  Dev: push to develop
  Staging: create release-*
  Production: manual trigger + approval

流程:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. Generate Prisma Client
  5. Build Docker image
  6. Push to ACR
  7. Deploy to App Service
  8. Run database migrations
  9. Health check
  10. Notify team
```

---

## ⚠️ 風險和緩解措施

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| **文件上傳丟失** | 🔴 嚴重 | ✅ 遷移到 Blob Storage (階段 3) |
| **密鑰洩露** | 🔴 嚴重 | ✅ 使用 Key Vault + SP |
| **部署失敗** | 🟡 中等 | ✅ 使用 Docker 快速回滾 |
| **數據庫遷移錯誤** | 🔴 嚴重 | ✅ 備份 + 測試環境先驗證 |
| **超出預算** | 🟡 中等 | ✅ 設置預算告警 |
| **生產環境誤操作** | 🔴 嚴重 | ✅ Environment Secrets + Required Reviewers |

---

## 📈 成功指標

### 部署成功標準

- ✅ 應用可正常訪問
- ✅ Azure AD B2C 登入成功
- ✅ 文件上傳和下載正常（Blob Storage）
- ✅ 數據庫連接正常
- ✅ 郵件發送正常（SendGrid）
- ✅ Application Insights 有日誌
- ✅ 所有健康檢查通過

### 性能指標

- Response Time: < 500ms (P95)
- Availability: > 99.5%
- Error Rate: < 0.1%

---

## 📚 相關文檔

- [Azure Infrastructure Setup](../infrastructure/azure-infrastructure-setup.md)
- [Service Principal Setup](.azure/docs/service-principal-setup.md)
- [Azure 部署總覽](.azure/README.md)
- [AI 助手部署指引](../claudedocs/6-ai-assistant/prompts/SITUATION-6-AZURE-DEPLOY.md)

---

**下一步**: 開始執行階段 3 - 實作 Azure Blob Storage 上傳服務
