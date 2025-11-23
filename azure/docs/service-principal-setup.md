# Azure Service Principal 設置指南

本文檔說明如何創建和管理 IT Project Management Platform 所需的 Service Principals。

## 📋 目錄

- [為什麼需要 Service Principal](#為什麼需要-service-principal)
- [Service Principal 清單](#service-principal-清單)
- [創建步驟](#創建步驟)
- [配置 GitHub Secrets](#配置-github-secrets)
- [配置 AI 工具](#配置-ai-工具)
- [權限管理](#權限管理)
- [安全最佳實踐](#安全最佳實踐)

---

## 為什麼需要 Service Principal

Service Principal 是 Azure 中的應用程序身份，用於：

1. **CI/CD 自動化**: GitHub Actions 無需手動登入即可部署
2. **權限隔離**: 每個環境使用獨立的 SP，最小權限原則
3. **AI 工具集成**: Claude Code/Copilot 可以查詢 Azure 資源
4. **審計追蹤**: 記錄所有自動化操作的執行者

---

## Service Principal 清單

### CI/CD Service Principals

| Name | 環境 | 角色 | 範圍 | 用途 |
|------|------|------|------|------|
| `sp-itpm-github-dev` | Dev | Contributor | `rg-itpm-dev` | GitHub Actions 部署到開發環境 |
| `sp-itpm-github-staging` | Staging | Contributor | `rg-itpm-staging` | GitHub Actions 部署到 Staging |
| `sp-itpm-github-prod` | Production | Website Contributor | `rg-itpm-prod` | GitHub Actions 部署到生產環境（僅部署，不能刪除資源） |

### AI 工具 Service Principal

| Name | 環境 | 角色 | 範圍 | 用途 |
|------|------|------|------|------|
| `sp-itpm-ai-dev` | Dev | Reader | `rg-itpm-dev` | Claude Code/Copilot 只讀訪問，查詢日誌和資源狀態 |

---

## 創建步驟

### 前置需求

```bash
# 1. 安裝 Azure CLI
# Windows: https://aka.ms/installazurecliwindows
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. 登入 Azure
az login

# 3. 確認訂閱
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# 4. 獲取訂閱 ID（後續使用）
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Subscription ID: $SUBSCRIPTION_ID"
```

---

### 創建 CI/CD Service Principals

#### 1. Dev 環境 SP

```bash
# 設置變數
SP_NAME="sp-itpm-github-dev"
RG_NAME="rg-itpm-dev"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# 創建 Service Principal
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME \
  --sdk-auth > sp-github-dev.json

# 輸出範例
# {
#   "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "clientSecret": "your-client-secret",
#   "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   ...
# }

echo "✅ Dev SP 創建完成"
echo "⚠️  請將 sp-github-dev.json 的內容添加到 GitHub Secrets"
echo "⚠️  完成後立即刪除此文件: rm sp-github-dev.json"
```

#### 2. Staging 環境 SP

```bash
SP_NAME="sp-itpm-github-staging"
RG_NAME="rg-itpm-staging"

az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME \
  --sdk-auth > sp-github-staging.json

echo "✅ Staging SP 創建完成"
```

#### 3. Production 環境 SP（最小權限）

```bash
SP_NAME="sp-itpm-github-prod"
RG_NAME="rg-itpm-prod"

# 使用 Website Contributor 角色（只能部署，不能刪除資源）
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role "Website Contributor" \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME \
  --sdk-auth > sp-github-prod.json

echo "✅ Production SP 創建完成（最小權限）"
```

---

### 創建 AI 工具 Service Principal

```bash
SP_NAME="sp-itpm-ai-dev"
RG_NAME="rg-itpm-dev"

# 創建只讀 SP
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Reader \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME \
  --sdk-auth > sp-ai-dev.json

# 可選：添加查看日誌的權限
CLIENT_ID=$(cat sp-ai-dev.json | jq -r .clientId)

az role assignment create \
  --assignee $CLIENT_ID \
  --role "Log Analytics Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME

echo "✅ AI 工具 SP 創建完成（只讀權限）"
```

---

## 配置 GitHub Secrets

### 步驟

1. **前往 GitHub Repository**
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

2. **添加以下 Secrets**

#### Dev 環境

```
Name: AZURE_CREDENTIALS_DEV
Value: <sp-github-dev.json 的完整內容>

Name: AZURE_SUBSCRIPTION_ID
Value: <your-subscription-id>

Name: AZURE_TENANT_ID
Value: <your-tenant-id>
```

#### Staging 環境

```
Name: AZURE_CREDENTIALS_STAGING
Value: <sp-github-staging.json 的完整內容>
```

#### Production 環境（使用 Environment Secrets）

```
1. 創建 Production Environment
   Settings > Environments > New environment > "production"

2. 配置保護規則
   ✅ Required reviewers: 至少 1 人審批
   ✅ Wait timer: 5 分鐘

3. 添加 Environment Secret
   Name: AZURE_CREDENTIALS_PROD
   Value: <sp-github-prod.json 的完整內容>
```

3. **刪除本地 JSON 文件**

```bash
# ⚠️ 重要：上傳到 GitHub Secrets 後立即刪除
rm sp-github-dev.json
rm sp-github-staging.json
rm sp-github-prod.json
rm sp-ai-dev.json
```

---

## 配置 AI 工具

### Claude Code / Copilot 使用 SP

```bash
# 1. 創建本地配置文件（不提交到 Git）
mkdir -p ~/.azure
cat > ~/.azure/ai-sp-config.json <<EOF
{
  "clientId": "...",
  "clientSecret": "...",
  "tenantId": "...",
  "subscriptionId": "..."
}
EOF

# 2. 設置權限（僅當前用戶可讀）
chmod 600 ~/.azure/ai-sp-config.json

# 3. 使用 SP 登入 Azure CLI
az login --service-principal \
  --username $(cat ~/.azure/ai-sp-config.json | jq -r .clientId) \
  --password $(cat ~/.azure/ai-sp-config.json | jq -r .clientSecret) \
  --tenant $(cat ~/.azure/ai-sp-config.json | jq -r .tenantId)

# 4. 驗證權限（只能讀取，不能修改）
az webapp list --resource-group rg-itpm-dev  # ✅ 成功
az webapp delete --name xxx --resource-group rg-itpm-dev  # ❌ 權限不足
```

---

## 權限管理

### 查看 SP 權限

```bash
# 列出 SP 的所有角色分配
az role assignment list \
  --assignee <client-id> \
  --all \
  --output table
```

### 更新 SP 權限

```bash
# 添加新權限
az role assignment create \
  --assignee <client-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-itpm-dev

# 移除權限
az role assignment delete \
  --assignee <client-id> \
  --role Reader
```

### 輪換 SP 密鑰

```bash
# 重置密鑰（建議每 90 天執行）
az ad sp credential reset \
  --id <client-id> \
  --output json > sp-new-credentials.json

# 更新 GitHub Secrets 中的密鑰
# 更新 AI 工具配置文件
# 刪除舊憑證文件
```

---

## 安全最佳實踐

### ✅ 推薦做法

1. **最小權限原則**
   - Production SP 使用 "Website Contributor"，不給 "Contributor"
   - AI 工具 SP 只給 "Reader" 權限

2. **環境隔離**
   - 每個環境使用獨立的 SP
   - Dev/Staging/Prod 完全分離

3. **定期輪換密鑰**
   - 每 90 天輪換一次 SP 密鑰
   - 設置日曆提醒

4. **審計日誌**
   - 啟用 Azure Activity Log
   - 監控 SP 的所有操作

5. **GitHub Environment Secrets**
   - Production 使用 Environment Secrets + Required Reviewers
   - 防止意外部署到生產環境

### ❌ 避免做法

1. ❌ 不要將 SP 憑證提交到 Git
2. ❌ 不要在多個環境共用同一個 SP
3. ❌ 不要給 SP 超過必要的權限
4. ❌ 不要長期不輪換密鑰
5. ❌ 不要在公共渠道分享 SP 憑證

---

## 驗證 SP 配置

### 測試 CI/CD SP

```bash
# 使用 SP 登入
az login --service-principal \
  --username <client-id> \
  --password <client-secret> \
  --tenant <tenant-id>

# 測試部署權限
az webapp list --resource-group rg-itpm-dev  # ✅ 應該成功

# 測試是否有過多權限
az group delete --name rg-itpm-dev --yes  # ❌ 應該失敗（Dev/Staging）
                                          # ✅ 應該失敗（Prod - Website Contributor）
```

### 測試 AI 工具 SP

```bash
# 登入
az login --service-principal \
  --username <ai-sp-client-id> \
  --password <ai-sp-client-secret> \
  --tenant <tenant-id>

# 測試只讀權限
az webapp show --name app-itpm-dev-001 --resource-group rg-itpm-dev  # ✅ 成功
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev  # ✅ 成功
az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev  # ❌ 應該失敗
```

---

## 故障排查

### 問題: SP 無法訪問資源

**解決方案**:
```bash
# 檢查角色分配
az role assignment list --assignee <client-id> --all

# 檢查資源群組是否存在
az group exists --name rg-itpm-dev
```

### 問題: GitHub Actions 部署失敗

**解決方案**:
```bash
# 驗證 GitHub Secret 格式正確
# JSON 格式應該完整，包含所有必要欄位

# 測試 SP 是否有權限
az login --service-principal --username <client-id> --password <client-secret> --tenant <tenant-id>
az webapp list --resource-group rg-itpm-dev
```

### 問題: SP 密鑰過期

**解決方案**:
```bash
# 重置密鑰
az ad sp credential reset --id <client-id>

# 更新所有使用此 SP 的地方
# - GitHub Secrets
# - AI 工具配置
# - 本地腳本
```

---

## 相關文檔

- [Azure Service Principal 官方文檔](https://learn.microsoft.com/en-us/cli/azure/ad/sp)
- [GitHub Actions Azure Login](https://github.com/Azure/login)
- [Azure RBAC 角色](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)
