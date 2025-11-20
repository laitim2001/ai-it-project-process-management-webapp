# Azure 部署執行日誌 - Dev 環境

> **創建日期**: 2025-11-20
> **最後更新**: 2025-11-20 18:00
> **狀態**: 階段 2.9 完成，準備進入階段 2.10 首次部署
> **執行人**: AI Assistant + Chris

---

## 📊 整體進度概覽

### ✅ 已完成階段 (0-2.9)
- **階段 0.1**: Azure 訂閱和權限檢查
- **階段 1.1**: 本地環境檢查 (13/14 項通過)
- **階段 1.2**: Dockerfile 修復
- **階段 2.1-2.6**: 所有 Azure 資源創建完成
- **階段 2.7**: Key Vault 密鑰配置 (12 個密鑰)
- **階段 2.8**: App Service 環境變數配置
- **階段 2.9**: Dev 環境配置驗證

### ⏳ 待執行階段 (2.10-2.11)
- **階段 2.10**: Dev 環境首次手動部署
- **階段 2.11**: 部署後驗證和煙霧測試

---

## 🔐 重大變更：Azure AD B2C → Azure AD 遷移

### 背景
在階段 2.7 配置 Key Vault 之前，收到新需求：需要使用 **Azure AD (Microsoft Entra ID) SSO** 而非原計劃的 **Azure AD B2C**。

### 決策
採用 **方案 A（立即遷移）** 以避免未來返工：
- ✅ 代碼影響最小（3-4 個檔案）
- ✅ Azure 資源可重用
- ✅ 最佳時機（配置階段前）

### 遷移執行記錄

#### 1. Azure AD 應用註冊
```bash
# 創建時間: 2025-11-20 17:45
az ad app create --display-name itpm-web-dev
```

**結果**:
- App Name: `itpm-web-dev`
- Tenant ID: `d669e5ca-6325-48ee-a72e-656a87ad559d`
- Client ID: `f0d8a3fe-158c-4791-8606-536230e4f8ac`
- Client Secret: 已儲存至 Key Vault（2 年有效期）
- Redirect URIs:
  - `http://localhost:3000/api/auth/callback/azure-ad`
  - `https://app-itpm-dev-001.azurewebsites.net/api/auth/callback/azure-ad`

#### 2. 代碼修改

**packages/auth/src/index.ts**:
- ✅ 切換到 `AzureADProvider`
- ✅ 更新 scope: `'openid profile email User.Read'`
- ✅ 更新 profile mapping (支援 `preferred_username`, `upn`)
- ✅ JWT callback provider check: `'azure-ad-b2c'` → `'azure-ad'`
- ✅ 更新文檔註釋

**apps/web/src/app/[locale]/login/page.tsx**:
- ✅ 更新文檔註釋（Azure AD B2C → Azure AD）
- ✅ 更新 `signIn('azure-ad-b2c')` → `signIn('azure-ad')`
- ✅ 更新環境變數檢查邏輯
- ✅ 更新 UI 註釋

**apps/web/src/app/api/upload/invoice/route.ts**:
- ✅ 移除 deprecated `export const config` (Next.js 14 compatibility)

**apps/web/src/app/api/upload/quote/route.ts**:
- ✅ 移除 deprecated `export const config` (Next.js 14 compatibility)

**.env (本地配置)**:
- ✅ 替換 Azure AD B2C 變數為 Azure AD 變數
- ⚠️ 未提交（已在 .gitignore 中）

#### 3. Git 提交
```bash
# Commit Hash: 116c4bf
# Commit Time: 2025-11-20 18:05
# Message: fix(auth): 從 Azure AD B2C 遷移到 Azure AD (Microsoft Entra ID)
```

**變更統計**:
- 修改文件: 4 個
- 新增行數: +89
- 刪除行數: -110

---

## 🏗️ Azure 資源創建詳情

### 資源群組
```yaml
Name: rg-itpm-dev
Location: eastasia
Provisioning State: Succeeded
Creation Time: 2025-11-20 17:00
```

### Key Vault
```yaml
Name: kv-itpm-dev
Location: eastasia
SKU: Standard
Provisioning State: Succeeded
Secrets Count: 12
Access Policies: 2 (User + App Service Managed Identity)
```

**密鑰清單** (12 個):
1. `ITPM-DEV-DATABASE-URL` - PostgreSQL 連接字串
2. `ITPM-DEV-AZUREAD-TENANT-ID` - Azure AD Tenant ID
3. `ITPM-DEV-AZUREAD-CLIENT-ID` - Azure AD Client ID
4. `ITPM-DEV-AZUREAD-CLIENT-SECRET` - Azure AD Client Secret
5. `ITPM-DEV-STORAGE-ACCOUNT-NAME` - Blob Storage 名稱
6. `ITPM-DEV-STORAGE-ACCOUNT-KEY` - Blob Storage 金鑰
7. `ITPM-DEV-ACR-USERNAME` - Container Registry 用戶名
8. `ITPM-DEV-ACR-PASSWORD` - Container Registry 密碼
9. `ITPM-DEV-NEXTAUTH-SECRET` - NextAuth JWT 加密金鑰
10. `ITPM-DEV-NEXTAUTH-URL` - NextAuth 回調 URL
11. `ITPM-DEV-SENDGRID-API-KEY` - SendGrid API Key (placeholder)
12. `ITPM-DEV-SENDGRID-FROM-EMAIL` - SendGrid From Email (placeholder)

### PostgreSQL Flexible Server
```yaml
Name: psql-itpm-dev-001
Version: PostgreSQL 16
SKU: Standard_B1ms
Storage: 32 GB
State: Ready
Database: itpm_dev
Admin User: itpmadmin
Connection: 透過 Key Vault 引用
```

### Blob Storage
```yaml
Name: stgitpmdev001
SKU: Standard_LRS (本地冗餘儲存)
Kind: StorageV2
Provisioning State: Succeeded
Containers:
  - quotes (報價單)
  - invoices (發票)
```

### Container Registry (ACR)
```yaml
Name: acritpmdev
Login Server: acritpmdev.azurecr.io
SKU: Basic
Admin Enabled: True
Provisioning State: Succeeded
```

### App Service Plan
```yaml
Name: plan-itpm-dev
SKU: B1 (Basic)
OS: Linux
Kind: linux
Status: Running
```

### App Service (Web App)
```yaml
Name: app-itpm-dev-001
State: Running
Default Host: app-itpm-dev-001.azurewebsites.net
Kind: app,linux,container
Managed Identity: SystemAssigned (Enabled)
Principal ID: 6dc263e9-d316-4e64-b5b4-6e680a507e24
```

**環境變數配置** (19 個):
- `NODE_ENV=production`
- `APP_NAME="IT Project Process Management Platform"`
- `WEBSITES_PORT=3000`
- `WEBSITES_ENABLE_APP_SERVICE_STORAGE=false`
- `DATABASE_URL=@Microsoft.KeyVault(...)`
- `NEXTAUTH_SECRET=@Microsoft.KeyVault(...)`
- `NEXTAUTH_URL=@Microsoft.KeyVault(...)`
- `AZURE_AD_TENANT_ID=@Microsoft.KeyVault(...)`
- `AZURE_AD_CLIENT_ID=@Microsoft.KeyVault(...)`
- `AZURE_AD_CLIENT_SECRET=@Microsoft.KeyVault(...)`
- `AZURE_STORAGE_ACCOUNT_NAME=@Microsoft.KeyVault(...)`
- `AZURE_STORAGE_ACCOUNT_KEY=@Microsoft.KeyVault(...)`
- `AZURE_STORAGE_CONTAINER_QUOTES=quotes`
- `AZURE_STORAGE_CONTAINER_INVOICES=invoices`
- `SENDGRID_API_KEY=@Microsoft.KeyVault(...)`
- `SENDGRID_FROM_EMAIL=@Microsoft.KeyVault(...)`
- `DOCKER_REGISTRY_SERVER_URL=https://acritpmdev.azurecr.io`
- `DOCKER_REGISTRY_SERVER_USERNAME=@Microsoft.KeyVault(...)`
- `DOCKER_CUSTOM_IMAGE_NAME=DOCKER|acritpmdev.azurecr.io/itpm-web:latest`

---

## 🔍 環境配置驗證結果 (階段 2.9)

### ✅ 資源狀態檢查
```bash
# 執行時間: 2025-11-20 18:10
az group show --name rg-itpm-dev
az keyvault show --name kv-itpm-dev
az postgres flexible-server show --name psql-itpm-dev-001
az storage account show --name stgitpmdev001
az acr show --name acritpmdev
az webapp show --name app-itpm-dev-001
```

**結果**: 所有資源狀態為 `Succeeded` 或 `Ready` ✅

### ✅ Key Vault 訪問權限
```bash
az keyvault show --name kv-itpm-dev --query "properties.accessPolicies | length(@)"
# 結果: 2 (User + App Service Managed Identity)
```

### ✅ App Service Managed Identity
```bash
az webapp identity show --name app-itpm-dev-001
# Type: SystemAssigned
# Principal ID: 6dc263e9-d316-4e64-b5b4-6e680a507e24
```

### ✅ Blob Storage Containers
```bash
az storage container list --account-name stgitpmdev001
# 結果:
# - invoices (發票)
# - quotes (報價單)
```

---

## 🐛 遇到的問題與解決方案

### 問題 1: Azure CLI Refresh Token 過期
**現象**:
```
ERROR: V2Error: invalid_grant AADSTS700082: The refresh token has expired
```

**原因**: Azure CLI 會話 90 天未使用

**解決方案**:
```bash
az logout
az login  # 用戶手動執行瀏覽器登入
```

**狀態**: ✅ 已解決

---

### 問題 2: Docker Build - eslint-config 套件不存在
**現象**:
```
ERROR: failed to calculate checksum: "/packages/eslint-config/package.json": not found
```

**原因**: Dockerfile 引用了不存在的 package 目錄

**解決方案**:
```dockerfile
# docker/Dockerfile line 40
# 移除: COPY packages/eslint-config/package.json ./packages/eslint-config/
```

**狀態**: ✅ 已解決

---

### 問題 3: Next.js 14 Deprecated Config Export
**現象**:
```
Error: Page config in /app/apps/web/src/app/api/upload/invoice/route.ts is deprecated.
Replace `export const config=…`
```

**原因**: Next.js 14 App Router 不再支援 `export const config`

**影響檔案**:
- `apps/web/src/app/api/upload/invoice/route.ts`
- `apps/web/src/app/api/upload/quote/route.ts`

**解決方案**:
移除 deprecated config export:
```typescript
// ❌ 移除
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Next.js 14 自動處理 formData()
```

**狀態**: ✅ 已解決並提交

---

### 問題 4: PostgreSQL 創建 - rdbms-connect Extension 權限錯誤
**現象**:
```
ERROR: [Errno 13] Permission denied:
'C:\\Users\\Chris\\.azure\\cliextensions\\rdbms-connect\\azext_metadata.json'
```

**原因**: Extension 文件被某個進程鎖定

**嘗試方案**:
1. ❌ 檢查文件權限 → 權限正常
2. ❌ 檢查運行中進程 → 無 Azure CLI 進程
3. ❌ 自動刪除 → 失敗

**最終解決方案**:
```bash
# 用戶手動刪除鎖定資料夾
rm -rf C:\Users\Chris\.azure\cliextensions\rdbms-connect

# 重新安裝 extension
az extension add --name rdbms-connect
```

**學習**: Windows 文件鎖定可能需要手動干預

**狀態**: ✅ 已解決

---

### 問題 5: App Service 創建 - Microsoft.Web Provider 未註冊
**現象**:
```
ERROR: (MissingSubscriptionRegistration) The subscription is not registered
to use namespace 'Microsoft.Web'.
```

**原因**: 首次使用 App Service 需要註冊 Provider

**解決方案**:
```bash
az provider register --namespace Microsoft.Web
# 等待 ~60 秒直到狀態變為 "Registered"
```

**狀態**: ✅ 已解決

---

### 問題 6: Docker Build 在階段 2.9 失敗
**現象**:
```
Error: Page config in /app/apps/web/src/app/api/upload/invoice/route.ts is deprecated.
```

**原因**: Docker build 使用 Git 倉庫代碼，未包含本地修改

**解決方案**:
1. ✅ 提交代碼修改 (Commit 116c4bf)
2. ⏳ 下一階段重新構建 Docker 映像

**狀態**: ⏳ 待處理（階段 2.10）

---

## 📋 下一步：階段 2.10 - 首次部署

### 待執行任務
1. **構建 Docker 映像**
   ```bash
   docker build -t acritpmdev.azurecr.io/itpm-web:latest -f docker/Dockerfile .
   ```

2. **登入 ACR**
   ```bash
   az acr login --name acritpmdev
   ```

3. **推送映像到 ACR**
   ```bash
   docker push acritpmdev.azurecr.io/itpm-web:latest
   ```

4. **重啟 App Service 拉取新映像**
   ```bash
   az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev
   ```

5. **運行資料庫遷移**
   ```bash
   az webapp ssh --name app-itpm-dev-001 --resource-group rg-itpm-dev
   # 在 SSH 中執行:
   cd /home/site/wwwroot
   pnpm db:migrate
   ```

6. **驗證部署**
   - 檢查 App Service 日誌
   - 訪問 https://app-itpm-dev-001.azurewebsites.net
   - 測試登入功能
   - 測試 Azure AD SSO

---

## ⚠️ 風險提示

### 風險 1: Docker Build 時間較長
- **影響**: 首次 build 可能需要 5-10 分鐘
- **緩解措施**: 已在背景執行 build，可並行處理其他任務

### 風險 2: PostgreSQL 防火牆規則
- **影響**: App Service 可能無法連接資料庫
- **緩解措施**: 需要配置 PostgreSQL 防火牆允許 App Service 的 Outbound IP

### 風險 3: SendGrid 配置為 Placeholder
- **影響**: Email 通知功能無法使用
- **緩解措施**: 暫時不影響核心功能，後續可更新

### 風險 4: 首次部署可能需要多次重試
- **影響**: 部署流程可能不會一次成功
- **緩解措施**: 準備好 troubleshooting 流程和日誌檢查

---

## 📊 統計數據

### 時間統計
- **階段 0-1**: ~30 分鐘（環境檢查和修復）
- **階段 2.1-2.6**: ~40 分鐘（資源創建）
- **Azure AD 遷移**: ~20 分鐘（代碼修改和提交）
- **階段 2.7-2.8**: ~15 分鐘（配置）
- **階段 2.9**: ~10 分鐘（驗證）
- **總計**: ~115 分鐘 (約 2 小時)

### 代碼變更
- **Git Commit**: 1 次 (116c4bf)
- **修改文件**: 4 個
- **新增行數**: +89
- **刪除行數**: -110

### Azure 資源
- **資源群組**: 1 個
- **Key Vault**: 1 個 (12 個密鑰)
- **PostgreSQL Server**: 1 個
- **Storage Account**: 1 個 (2 個 containers)
- **Container Registry**: 1 個
- **App Service Plan**: 1 個
- **App Service**: 1 個

---

## ✅ 驗收標準完成情況

### 階段 2.9 驗收
- ✅ 所有 Azure 資源狀態為 Ready/Succeeded
- ✅ Key Vault 包含所有必要密鑰（12 個）
- ✅ App Service Managed Identity 已啟用
- ✅ Key Vault 訪問策略已配置
- ✅ App Service 環境變數已配置（19 個）
- ✅ ACR 已配置並連接到 App Service
- ✅ Blob Storage Containers 已創建

### 代碼品質
- ⏳ TypeScript 檢查: 待執行
- ⏳ ESLint 檢查: 待執行
- ⏳ 格式檢查: 待執行

### Git 狀態
- ✅ Azure AD 遷移已提交 (116c4bf)
- ✅ Commit message 清晰有意義
- ⏳ 推送到 GitHub: 待執行

---

## 🔗 相關文檔

- [Azure 部署總結](./00-summary.md)
- [檔案結構 Checklist](./01-file-structure-checklist.md)
- [完整 TODO 清單](./02-complete-todo-list.md)
- [架構決策記錄](./03-architecture-decisions.md)
- [風險評估](./04-risk-assessment.md)
- [Azurite 開發環境計劃](./05-azurite-dev-environment-plan.md)

---

**維護者**: AI Assistant + Chris
**創建時間**: 2025-11-20 18:00
**版本**: 1.0
