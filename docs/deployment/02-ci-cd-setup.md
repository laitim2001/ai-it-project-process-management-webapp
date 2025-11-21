# CI/CD 配置指南

**最後更新**: 2025-11-20
**工具**: GitHub Actions
**預計時間**: 30-45 分鐘

---

## 📋 目錄

- [概覽](#概覽)
- [前置條件](#前置條件)
- [階段 1: 配置 GitHub Secrets](#階段-1-配置-github-secrets)
- [階段 2: 配置 Workflow 文件](#階段-2-配置-workflow-文件)
- [階段 3: 測試 CI/CD Pipeline](#階段-3-測試-cicd-pipeline)
- [階段 4: 部署策略](#階段-4-部署策略)
- [故障排除](#故障排除)

---

## 🎯 概覽

### CI/CD 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow                                         │
│                                                                  │
│  1. Checkout Code                                               │
│  2. Setup Node.js 20                                            │
│  3. Install Dependencies (pnpm)                                 │
│  4. Run Tests & Lint                                            │
│  5. Build Docker Image                                          │
│  6. Push to Azure Container Registry                            │
│  7. Deploy to Azure App Service                                 │
│  8. Run Health Checks                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Azure App Service                          │
│                    (Dev / Staging / Prod)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 部署觸發條件

| 環境 | 觸發條件 | 分支 | 審批要求 |
|------|----------|------|---------|
| **Dev** | Push 到 `develop` 分支 | `develop` | ❌ 無需審批 |
| **Staging** | Push 到 `main` 分支 | `main` | ❌ 無需審批（自動） |
| **Prod** | 創建 Release Tag | `v*.*.*` | ✅ 需要手動審批 |

---

## ✅ 前置條件

確認以下條件已滿足：

- [ ] 首次手動部署已成功（參考 [01-first-time-setup.md](./01-first-time-setup.md)）
- [ ] 所有環境的 Azure 資源已創建
- [ ] Service Principal 已創建（Dev, Staging, Prod）
- [ ] GitHub Repository 已創建
- [ ] 擁有 GitHub Repository Admin 權限

---

## 🔐 階段 1: 配置 GitHub Secrets

### 1.1 獲取 Service Principal 憑證

對於每個環境（Dev, Staging, Prod），執行：

```bash
# 設置環境
ENVIRONMENT="dev"  # 或 staging, prod

# 創建 Service Principal（如果尚未創建）
az ad sp create-for-rbac \
  --name "ITPM-Deploy-${ENVIRONMENT^}-SP" \
  --role "Contributor" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-itpm-$ENVIRONMENT" \
  --sdk-auth
```

**輸出範例**（JSON 格式）:
```json
{
  "clientId": "xxx-xxx-xxx",
  "clientSecret": "xxx-xxx-xxx",
  "subscriptionId": "xxx-xxx-xxx",
  "tenantId": "xxx-xxx-xxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**保存整個 JSON 輸出**（稍後需要添加到 GitHub Secrets）

### 1.2 獲取 ACR 憑證

```bash
# 對每個環境執行
ENVIRONMENT="dev"
ACR_NAME="acritpm${ENVIRONMENT}"

# 獲取 ACR 登入伺服器
ACR_REGISTRY=$(az acr show --name $ACR_NAME --query "loginServer" -o tsv)

# 獲取 ACR 用戶名
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)

# 獲取 ACR 密碼
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "ACR_REGISTRY: $ACR_REGISTRY"
echo "ACR_USERNAME: $ACR_USERNAME"
echo "ACR_PASSWORD: $ACR_PASSWORD"
```

### 1.3 添加 Secrets 到 GitHub

前往 GitHub Repository:
```
https://github.com/your-org/it-project-management-platform/settings/secrets/actions
```

點擊 **"New repository secret"** 並添加以下 Secrets：

#### Dev 環境

| Secret 名稱 | 值 | 來源 |
|-------------|---|------|
| `AZURE_CREDENTIALS_DEV` | Service Principal JSON (完整) | 步驟 1.1 |
| `ACR_REGISTRY_DEV` | `acritpmdev.azurecr.io` | 步驟 1.2 |
| `ACR_USERNAME_DEV` | ACR 用戶名 | 步驟 1.2 |
| `ACR_PASSWORD_DEV` | ACR 密碼 | 步驟 1.2 |

#### Staging 環境

| Secret 名稱 | 值 | 來源 |
|-------------|---|------|
| `AZURE_CREDENTIALS_STAGING` | Service Principal JSON (完整) | 步驟 1.1 |
| `ACR_REGISTRY_STAGING` | `acritpmstaging.azurecr.io` | 步驟 1.2 |
| `ACR_USERNAME_STAGING` | ACR 用戶名 | 步驟 1.2 |
| `ACR_PASSWORD_STAGING` | ACR 密碼 | 步驟 1.2 |

#### Prod 環境

| Secret 名稱 | 值 | 來源 |
|-------------|---|------|
| `AZURE_CREDENTIALS_PROD` | Service Principal JSON (完整) | 步驟 1.1 |
| `ACR_REGISTRY_PROD` | `acritpmprod.azurecr.io` | 步驟 1.2 |
| `ACR_USERNAME_PROD` | ACR 用戶名 | 步驟 1.2 |
| `ACR_PASSWORD_PROD` | ACR 密碼 | 步驟 1.2 |

### 1.4 驗證 Secrets

所有 Secrets 添加後，應該有 **12 個 Secrets**：

```
✅ AZURE_CREDENTIALS_DEV
✅ ACR_REGISTRY_DEV
✅ ACR_USERNAME_DEV
✅ ACR_PASSWORD_DEV

✅ AZURE_CREDENTIALS_STAGING
✅ ACR_REGISTRY_STAGING
✅ ACR_USERNAME_STAGING
✅ ACR_PASSWORD_STAGING

✅ AZURE_CREDENTIALS_PROD
✅ ACR_REGISTRY_PROD
✅ ACR_USERNAME_PROD
✅ ACR_PASSWORD_PROD
```

---

## 🔧 階段 2: 配置 Workflow 文件

### 2.1 創建 Workflow 目錄

```bash
mkdir -p .github/workflows
```

### 2.2 Workflow 文件

專案已包含 3 個 Workflow 文件：

```
.github/workflows/
├── azure-deploy-dev.yml       # Dev 環境自動部署
├── azure-deploy-staging.yml   # Staging 環境自動部署
└── azure-deploy-prod.yml      # Prod 環境（需手動審批）
```

這些文件將在階段 6 創建。

### 2.3 設置分支保護規則

#### 保護 `main` 分支

前往: `Settings` → `Branches` → `Add rule`

配置：
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - 選擇: `Test and Lint`
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

#### 保護 `develop` 分支

配置：
- Branch name pattern: `develop`
- ✅ Require status checks to pass before merging
  - 選擇: `Test and Lint`

---

## 🧪 階段 3: 測試 CI/CD Pipeline

### 3.1 測試 Dev 環境部署

```bash
# 切換到 develop 分支
git checkout develop

# 進行小改動（觸發部署）
echo "# Test CI/CD" >> README.md

# 提交並推送
git add README.md
git commit -m "test: trigger dev deployment"
git push origin develop
```

**前往 GitHub Actions** 查看工作流程執行：
```
https://github.com/your-org/it-project-management-platform/actions
```

**預期流程**:
1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Run tests & lint
5. ✅ Build Docker image
6. ✅ Push to ACR
7. ✅ Deploy to App Service
8. ✅ Health check

### 3.2 測試 Staging 環境部署

```bash
# 合併到 main 分支
git checkout main
git merge develop
git push origin main
```

觀察 GitHub Actions 執行 Staging 部署。

### 3.3 測試 Prod 環境部署

```bash
# 創建 Release Tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**重要**: Prod 部署需要手動審批

前往 GitHub Actions，找到 Prod 部署工作流程，點擊 **"Review deployments"** 並批准。

---

## 🚀 階段 4: 部署策略

### 4.1 Dev 環境策略

- **觸發**: 每次推送到 `develop`
- **審批**: 無需審批
- **回滾**: 自動（部署失敗時）
- **通知**: GitHub 通知

### 4.2 Staging 環境策略

- **觸發**: 每次推送到 `main`
- **審批**: 無需審批（自動部署）
- **回滾**: 手動
- **通知**: GitHub 通知 + Email（可選）
- **部署槽位**: 使用 `staging` 槽位進行藍綠部署

### 4.3 Prod 環境策略

- **觸發**: 創建 Release Tag (`v*.*.*`)
- **審批**: ✅ **需要手動審批**
- **回滾**: 使用部署槽位交換
- **通知**: Email + Slack（可選）
- **部署時間**: 建議在低峰時段（例如：週末或晚上）

### 4.4 藍綠部署（Staging/Prod）

```bash
# 1. 部署到 staging 槽位
# （GitHub Actions 會自動執行）

# 2. 驗證 staging 槽位
curl https://app-itpm-prod-001-staging.azurewebsites.net

# 3. 如果驗證通過，交換槽位
az webapp deployment slot swap \
  --name app-itpm-prod-001 \
  --resource-group rg-itpm-prod \
  --slot staging \
  --target-slot production
```

---

## 🔔 通知配置（可選）

### Slack 通知

在 Workflow 中添加 Slack 步驟：

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    text: 'Deployment to ${{ env.ENVIRONMENT }} ${{ job.status }}'
```

需要添加 GitHub Secret:
- `SLACK_WEBHOOK`: Slack Webhook URL

### Email 通知

GitHub Actions 默認會發送 Email 通知給 Workflow 失敗。

---

## 📊 監控與日誌

### 查看部署歷史

```bash
# GitHub Actions
https://github.com/your-org/it-project-management-platform/actions

# Azure Portal
https://portal.azure.com → App Service → Deployment Center → Logs
```

### 查看應用日誌

```bash
# 即時日誌
az webapp log tail \
  --name app-itpm-prod-001 \
  --resource-group rg-itpm-prod

# 下載日誌
az webapp log download \
  --name app-itpm-prod-001 \
  --resource-group rg-itpm-prod \
  --log-file prod-logs.zip
```

---

## 🛠️ 故障排除

### 問題 1: Service Principal 驗證失敗

**錯誤訊息**: `Error: Login failed with Error: ...`

**解決方案**:
1. 驗證 Service Principal JSON 格式正確
2. 確認 Service Principal 有足夠權限
3. 重新生成 Service Principal

### 問題 2: Docker 構建失敗

**錯誤訊息**: `Error response from daemon: ...`

**解決方案**:
1. 檢查 `docker/Dockerfile` 語法
2. 驗證 `pnpm-lock.yaml` 是否已提交
3. 檢查 `.dockerignore` 配置

### 問題 3: ACR 推送失敗

**錯誤訊息**: `unauthorized: authentication required`

**解決方案**:
1. 驗證 ACR 憑證正確
2. 確認 ACR 管理員帳號已啟用
3. 檢查網路連接

### 問題 4: App Service 部署失敗

**錯誤訊息**: `Container didn't respond to HTTP pings on port: 3000`

**解決方案**:
1. 檢查應用是否監聽 `PORT` 環境變數
2. 驗證 `WEBSITES_PORT=3000` 已設置
3. 查看應用日誌找出啟動錯誤

---

## 📚 相關文檔

- [首次部署設置](./01-first-time-setup.md)
- [故障排除](./03-troubleshooting.md)
- [回滾指南](./04-rollback.md)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Azure App Service 部署](https://docs.microsoft.com/azure/app-service/deploy-github-actions)

---

**下一步**: [故障排除 →](./03-troubleshooting.md)
