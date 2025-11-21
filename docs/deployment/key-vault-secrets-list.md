# Azure Key Vault 密鑰列表

**最後更新**: 2025-11-20
**用途**: 完整的 Azure Key Vault 密鑰清單，適用於所有環境

---

## 📋 目錄

- [概覽](#概覽)
- [密鑰命名規範](#密鑰命名規範)
- [Dev 環境密鑰](#dev-環境密鑰)
- [Staging 環境密鑰](#staging-環境密鑰)
- [Production 環境密鑰](#production-環境密鑰)
- [共享密鑰](#共享密鑰)
- [密鑰管理指南](#密鑰管理指南)
- [安全最佳實踐](#安全最佳實踐)

---

## 🎯 概覽

### Key Vault 資源

| 環境 | Key Vault 名稱 | 資源組 | 區域 |
|------|---------------|--------|------|
| **Dev** | `kv-itpm-dev` | `rg-itpm-dev` | East Asia |
| **Staging** | `kv-itpm-staging` | `rg-itpm-staging` | East Asia |
| **Production** | `kv-itpm-prod` | `rg-itpm-prod` | East Asia |

### 密鑰總數

| 環境 | 密鑰數量 | 必需 | 可選 |
|------|---------|------|------|
| **Dev** | 15 | 12 | 3 |
| **Staging** | 16 | 13 | 3 |
| **Production** | 17 | 14 | 3 |

---

## 📏 密鑰命名規範

### 格式
```
ITPM-{ENVIRONMENT}-{CATEGORY}-{NAME}
```

### 範例
- `ITPM-DEV-DATABASE-URL` - Dev 環境資料庫連接字串
- `ITPM-PROD-NEXTAUTH-SECRET` - Production 環境 NextAuth 密鑰
- `ITPM-STAGING-SENDGRID-API-KEY` - Staging 環境 SendGrid API 密鑰

### 分類代碼
| 代碼 | 分類 | 用途 |
|------|------|------|
| `DATABASE` | 資料庫 | PostgreSQL 連接字串 |
| `NEXTAUTH` | 身份驗證 | NextAuth.js 配置 |
| `AZUREADB2C` | Azure AD B2C | 企業身份驗證 |
| `STORAGE` | 存儲 | Azure Blob Storage |
| `SENDGRID` | Email | SendGrid 郵件服務 |
| `REDIS` | 緩存 | Redis 連接字串 |
| `APP` | 應用 | 其他應用配置 |

---

## 🔵 Dev 環境密鑰

### Key Vault: `kv-itpm-dev`

| 密鑰名稱 | 類型 | 必需 | 範例值 | 用途 |
|---------|------|------|--------|------|
| `ITPM-DEV-DATABASE-URL` | String | ✅ | `postgresql://user:pass@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require` | PostgreSQL 連接字串 |
| `ITPM-DEV-NEXTAUTH-SECRET` | String | ✅ | `[32-character-random-string]` | NextAuth.js 加密密鑰 |
| `ITPM-DEV-NEXTAUTH-URL` | String | ✅ | `https://app-itpm-dev-001.azurewebsites.net` | NextAuth.js 應用 URL |
| `ITPM-DEV-AZUREADB2C-TENANT-NAME` | String | ✅ | `yourtenantname` | Azure AD B2C 租戶名稱 |
| `ITPM-DEV-AZUREADB2C-TENANT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 租戶 ID |
| `ITPM-DEV-AZUREADB2C-CLIENT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 應用 ID |
| `ITPM-DEV-AZUREADB2C-CLIENT-SECRET` | String | ✅ | `[client-secret-value]` | Azure AD B2C 客戶端密鑰 |
| `ITPM-DEV-AZUREADB2C-USER-FLOW` | String | ✅ | `B2C_1_signupsignin` | Azure AD B2C User Flow |
| `ITPM-DEV-STORAGE-ACCOUNT-NAME` | String | ✅ | `stgitpmdev001` | Storage Account 名稱 |
| `ITPM-DEV-STORAGE-ACCOUNT-KEY` | String | ✅ | `[storage-account-key]` | Storage Account 存取密鑰 |
| `ITPM-DEV-SENDGRID-API-KEY` | String | ✅ | `SG.xxxxxxxxxxxxxxxx` | SendGrid API 密鑰 |
| `ITPM-DEV-SENDGRID-FROM-EMAIL` | String | ✅ | `noreply@dev.yourdomain.com` | SendGrid 寄件人郵箱 |
| `ITPM-DEV-REDIS-URL` | String | ❌ | `rediss://password@redis-itpm-dev.redis.cache.windows.net:6380` | Redis 連接字串（可選）|
| `ITPM-DEV-AI-API-KEY` | String | ❌ | `[ai-service-api-key]` | AI Assistant API 密鑰（Epic 9）|
| `ITPM-DEV-ERP-API-KEY` | String | ❌ | `[erp-api-key]` | ERP 系統 API 密鑰（Epic 10）|

**總計**: 15 個密鑰（12 必需 + 3 可選）

---

## 🟡 Staging 環境密鑰

### Key Vault: `kv-itpm-staging`

| 密鑰名稱 | 類型 | 必需 | 範例值 | 用途 |
|---------|------|------|--------|------|
| `ITPM-STAGING-DATABASE-URL` | String | ✅ | `postgresql://user:pass@psql-itpm-staging-001.postgres.database.azure.com:5432/itpm_staging?sslmode=require` | PostgreSQL 連接字串 |
| `ITPM-STAGING-NEXTAUTH-SECRET` | String | ✅ | `[32-character-random-string]` | NextAuth.js 加密密鑰 |
| `ITPM-STAGING-NEXTAUTH-URL` | String | ✅ | `https://app-itpm-staging-001.azurewebsites.net` | NextAuth.js 應用 URL |
| `ITPM-STAGING-AZUREADB2C-TENANT-NAME` | String | ✅ | `yourtenantname` | Azure AD B2C 租戶名稱 |
| `ITPM-STAGING-AZUREADB2C-TENANT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 租戶 ID |
| `ITPM-STAGING-AZUREADB2C-CLIENT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 應用 ID |
| `ITPM-STAGING-AZUREADB2C-CLIENT-SECRET` | String | ✅ | `[client-secret-value]` | Azure AD B2C 客戶端密鑰 |
| `ITPM-STAGING-AZUREADB2C-USER-FLOW` | String | ✅ | `B2C_1_signupsignin` | Azure AD B2C User Flow |
| `ITPM-STAGING-STORAGE-ACCOUNT-NAME` | String | ✅ | `stgitpmstaging001` | Storage Account 名稱 |
| `ITPM-STAGING-STORAGE-ACCOUNT-KEY` | String | ✅ | `[storage-account-key]` | Storage Account 存取密鑰 |
| `ITPM-STAGING-SENDGRID-API-KEY` | String | ✅ | `SG.xxxxxxxxxxxxxxxx` | SendGrid API 密鑰 |
| `ITPM-STAGING-SENDGRID-FROM-EMAIL` | String | ✅ | `noreply@staging.yourdomain.com` | SendGrid 寄件人郵箱 |
| `ITPM-STAGING-REDIS-URL` | String | ✅ | `rediss://password@redis-itpm-staging.redis.cache.windows.net:6380` | Redis 連接字串 |
| `ITPM-STAGING-SENDGRID-FROM-NAME` | String | ❌ | `IT Project Management (Staging)` | SendGrid 寄件人名稱 |
| `ITPM-STAGING-AI-API-KEY` | String | ❌ | `[ai-service-api-key]` | AI Assistant API 密鑰（Epic 9）|
| `ITPM-STAGING-ERP-API-KEY` | String | ❌ | `[erp-api-key]` | ERP 系統 API 密鑰（Epic 10）|

**總計**: 16 個密鑰（13 必需 + 3 可選）

---

## 🔴 Production 環境密鑰

### Key Vault: `kv-itpm-prod`

| 密鑰名稱 | 類型 | 必需 | 範例值 | 用途 |
|---------|------|------|--------|------|
| `ITPM-PROD-DATABASE-URL` | String | ✅ | `postgresql://user:pass@psql-itpm-prod-001.postgres.database.azure.com:5432/itpm_prod?sslmode=require` | PostgreSQL 連接字串 |
| `ITPM-PROD-NEXTAUTH-SECRET` | String | ✅ | `[32-character-random-string]` | NextAuth.js 加密密鑰 |
| `ITPM-PROD-NEXTAUTH-URL` | String | ✅ | `https://app-itpm-prod-001.azurewebsites.net` | NextAuth.js 應用 URL |
| `ITPM-PROD-AZUREADB2C-TENANT-NAME` | String | ✅ | `yourtenantname` | Azure AD B2C 租戶名稱 |
| `ITPM-PROD-AZUREADB2C-TENANT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 租戶 ID |
| `ITPM-PROD-AZUREADB2C-CLIENT-ID` | String | ✅ | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Azure AD B2C 應用 ID |
| `ITPM-PROD-AZUREADB2C-CLIENT-SECRET` | String | ✅ | `[client-secret-value]` | Azure AD B2C 客戶端密鑰 |
| `ITPM-PROD-AZUREADB2C-USER-FLOW` | String | ✅ | `B2C_1_signupsignin` | Azure AD B2C User Flow |
| `ITPM-PROD-STORAGE-ACCOUNT-NAME` | String | ✅ | `stgitpmprod001` | Storage Account 名稱 |
| `ITPM-PROD-STORAGE-ACCOUNT-KEY` | String | ✅ | `[storage-account-key]` | Storage Account 存取密鑰 |
| `ITPM-PROD-SENDGRID-API-KEY` | String | ✅ | `SG.xxxxxxxxxxxxxxxx` | SendGrid API 密鑰 |
| `ITPM-PROD-SENDGRID-FROM-EMAIL` | String | ✅ | `noreply@yourdomain.com` | SendGrid 寄件人郵箱 |
| `ITPM-PROD-SENDGRID-FROM-NAME` | String | ✅ | `IT Project Management` | SendGrid 寄件人名稱 |
| `ITPM-PROD-REDIS-URL` | String | ✅ | `rediss://password@redis-itpm-prod.redis.cache.windows.net:6380` | Redis 連接字串 |
| `ITPM-PROD-APP-INSIGHTS-CONNECTION-STRING` | String | ❌ | `InstrumentationKey=xxx;IngestionEndpoint=https://...` | Application Insights 連接字串 |
| `ITPM-PROD-AI-API-KEY` | String | ❌ | `[ai-service-api-key]` | AI Assistant API 密鑰（Epic 9）|
| `ITPM-PROD-ERP-API-KEY` | String | ❌ | `[erp-api-key]` | ERP 系統 API 密鑰（Epic 10）|

**總計**: 17 個密鑰（14 必需 + 3 可選）

---

## 🔄 共享密鑰

以下密鑰在所有環境中使用相同的值（但存儲在各自的 Key Vault）：

### Azure AD B2C (如果共用租戶)
- `AZUREADB2C-TENANT-NAME`
- `AZUREADB2C-TENANT-ID`
- `AZUREADB2C-USER-FLOW`

### SendGrid (如果共用帳號)
- `SENDGRID-API-KEY` (可使用相同 API Key 或各環境獨立)

---

## 🛠️ 密鑰管理指南

### 添加新密鑰

#### 使用 Azure CLI
```bash
# 設置環境變數
ENVIRONMENT="dev"  # 或 staging, prod
KV_NAME="kv-itpm-${ENVIRONMENT}"

# 添加密鑰
az keyvault secret set \
  --vault-name "$KV_NAME" \
  --name "ITPM-${ENVIRONMENT^^}-CATEGORY-NAME" \
  --value "your-secret-value"

# 範例：添加資料庫 URL
az keyvault secret set \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-DATABASE-URL" \
  --value "postgresql://user:pass@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"
```

#### 使用輔助腳本
```bash
# 使用 .azure/scripts/helper/add-secret.sh
./.azure/scripts/helper/add-secret.sh dev DATABASE-URL "postgresql://..."
```

### 更新現有密鑰

```bash
# 更新密鑰（會創建新版本，舊版本保留）
az keyvault secret set \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-NEXTAUTH-SECRET" \
  --value "new-secret-value"
```

### 讀取密鑰

```bash
# 讀取最新版本
az keyvault secret show \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-DATABASE-URL" \
  --query "value" -o tsv

# 讀取特定版本
az keyvault secret show \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-DATABASE-URL" \
  --version "xxxxx" \
  --query "value" -o tsv
```

### 刪除密鑰

```bash
# 軟刪除（可恢復）
az keyvault secret delete \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-OLD-SECRET"

# 永久清除（不可恢復）
az keyvault secret purge \
  --vault-name "kv-itpm-dev" \
  --name "ITPM-DEV-OLD-SECRET"
```

### 列出所有密鑰

```bash
# 列出密鑰名稱
az keyvault secret list \
  --vault-name "kv-itpm-dev" \
  --query "[].name" -o table

# 列出密鑰及最後更新時間
az keyvault secret list \
  --vault-name "kv-itpm-dev" \
  --query "[].{Name:name, Updated:attributes.updated}" -o table
```

---

## 🔐 安全最佳實踐

### 1. 存取控制

#### 使用 RBAC 而非存取策略
```bash
# 授予 Managed Identity 存取權限
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <MANAGED_IDENTITY_PRINCIPAL_ID> \
  --scope /subscriptions/<SUB_ID>/resourceGroups/<RG>/providers/Microsoft.KeyVault/vaults/<KV_NAME>
```

#### 最小權限原則
- **Dev**: 開發團隊 - `Key Vault Secrets Officer`
- **Staging**: 部署 Service Principal - `Key Vault Secrets User`
- **Production**: 僅部署 SP + 緊急存取帳號 - `Key Vault Secrets User`

### 2. 密鑰輪換

#### 定期輪換計劃
| 密鑰類型 | 輪換頻率 | 負責人 |
|---------|---------|--------|
| `NEXTAUTH-SECRET` | 每 90 天 | DevOps Team |
| `STORAGE-ACCOUNT-KEY` | 每 180 天 | DevOps Team |
| `SENDGRID-API-KEY` | 每年或洩露時 | DevOps Team |
| `AZUREADB2C-CLIENT-SECRET` | 每年 | Security Team |
| `DATABASE` 密碼 | 每 90 天 | DBA Team |

#### 輪換流程
1. 創建新密鑰（保留舊密鑰）
2. 更新 Key Vault
3. 重啟應用（或等待自動刷新）
4. 驗證新密鑰運作正常
5. 停用舊密鑰

### 3. 審計與監控

#### 啟用診斷日誌
```bash
az monitor diagnostic-settings create \
  --resource "/subscriptions/<SUB_ID>/resourceGroups/<RG>/providers/Microsoft.KeyVault/vaults/<KV_NAME>" \
  --name "KeyVault-Diagnostics" \
  --logs '[{"category": "AuditEvent", "enabled": true}]' \
  --workspace "/subscriptions/<SUB_ID>/resourceGroups/<RG>/providers/Microsoft.OperationalInsights/workspaces/<WORKSPACE_NAME>"
```

#### 監控關鍵事件
- 密鑰存取失敗（可能的攻擊）
- 密鑰刪除操作（需要審批）
- 權限變更（RBAC 修改）

### 4. 災難恢復

#### 啟用軟刪除和清除保護
```bash
az keyvault update \
  --name "kv-itpm-prod" \
  --enable-soft-delete true \
  --enable-purge-protection true
```

#### 備份關鍵密鑰
```bash
# 備份單個密鑰
az keyvault secret backup \
  --vault-name "kv-itpm-prod" \
  --name "ITPM-PROD-DATABASE-URL" \
  --file "backup-database-url.blob"

# 恢復密鑰
az keyvault secret restore \
  --vault-name "kv-itpm-prod" \
  --file "backup-database-url.blob"
```

### 5. 密鑰格式規範

#### ✅ 良好實踐
- 使用 HTTPS 連接字串
- 啟用 SSL/TLS (`sslmode=require`)
- 使用強密碼（至少 20 個字符，包含大小寫、數字、符號）
- NextAuth Secret 使用 `openssl rand -base64 32` 生成

#### ❌ 避免
- 硬編碼密鑰在代碼中
- 在 Git 提交中包含密鑰
- 在日誌中輸出密鑰
- 共享生產環境密鑰給非授權人員

---

## 📚 相關文檔

- [首次部署設置](./01-first-time-setup.md) - 階段 3: 配置 Key Vault
- [環境變數輔助腳本](./../.azure/scripts/helper/README.md)
- [Azure Key Vault 官方文檔](https://docs.microsoft.com/azure/key-vault/)

---

**重要提醒**:
- 🔴 **切勿將密鑰提交到 Git**
- 🔒 **生產環境密鑰僅限授權人員存取**
- 🔄 **定期輪換密鑰以提高安全性**
- 📋 **記錄所有密鑰變更操作**

---

**最後更新**: 2025-11-20
**維護者**: DevOps Team
