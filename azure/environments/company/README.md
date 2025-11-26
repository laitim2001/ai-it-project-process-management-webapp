# 公司 Azure 環境配置

本目錄用於公司 Azure 訂閱的環境配置。

## 🔴 重要：部署前必讀

**在執行部署前，請務必閱讀以下文檔：**

- ⚠️ [**部署故障排除指南**](../../docs/DEPLOYMENT-TROUBLESHOOTING.md) - 包含已知問題和解決方案

### 已知關鍵問題

| 問題 | 根本原因 | 狀態 |
|------|----------|------|
| 用戶註冊 500 錯誤 | `.dockerignore` 排除了 migrations | ✅ 已修復 |
| Currency 表不存在 | 缺少 migration SQL | ✅ 已修復 |

### 部署前快速檢查

```bash
# 1. 確認 .dockerignore 不排除 migrations
grep -n "migrations" .dockerignore
# ❌ 如果看到 "**/migrations" 未被註解，請先修復！

# 2. 確認 migrations 資料夾存在
ls packages/db/prisma/migrations/
# ✅ 應該看到多個 migration 資料夾
```

## ⚠️ 重要提示

**在配置公司環境前，請先完成以下準備工作：**

1. 與公司 Azure Administrator 確認資源命名規範
2. 確認公司 Azure 訂閱和租戶信息
3. 獲取必要的部署權限
4. 了解公司的 Key Vault 訪問策略

## 📋 需要配置的信息

### 1. Azure 訂閱和租戶
```bash
AZURE_SUBSCRIPTION_ID="<公司訂閱 ID>"
AZURE_TENANT_ID="<公司租戶 ID>"
```

### 2. 資源命名（避免與個人環境衝突）

建議使用不同的命名前綴或後綴：

| 資源類型 | 個人環境 | 公司環境建議 |
|---------|----------|-------------|
| 資源群組 | `rg-itpm-dev` | `rg-itpm-company-dev` |
| App Service | `app-itpm-dev-001` | `app-itpm-company-dev-001` |
| PostgreSQL | `psql-itpm-dev-001` | `psql-itpm-company-dev-001` |
| ACR | `acritpmdev` | `acritpmcompany` |
| Storage | `stitpmdev001` | `stitpmcompany001` |
| Key Vault | `kv-itpm-dev` | `kv-itpm-company-dev` |

### 3. Key Vault 配置

公司環境可能使用：
- **共用 Key Vault**: 多個應用共享
- **訪問策略**: 需要申請訪問權限
- **網路限制**: 可能有 IP 白名單要求

### 4. 網路和安全配置

確認以下要求：
- VNet 配置需求
- NSG (Network Security Group) 規則
- Private Endpoint 要求
- 防火牆規則
- SSL/TLS 證書要求

## 🚀 部署流程

### 準備階段
1. 複製環境配置範例：
   ```bash
   cp dev.env.example dev.env
   ```

2. 根據公司規範修改配置
3. 與 Azure Admin 確認所有配置
4. 測試連接和權限

### 執行部署
```bash
# 部署到公司 Dev 環境（會要求確認）
bash azure/scripts/deploy-to-company.sh dev
```

**注意**: 部署腳本包含安全確認提示，會顯示目標訂閱和資源群組供確認。

### 部署後驗證
```bash
bash azure/scripts/helper/verify-deployment.sh
```

## 📝 環境配置文件

創建以下配置文件（從個人環境複製並修改）：
- `dev.env` - 開發環境配置
- `staging.env` - Staging 環境配置
- `prod.env` - 生產環境配置

## 🔐 Service Principal 配置

公司環境可能需要專用的 Service Principal：

### 創建 Service Principal
```bash
az ad sp create-for-rbac \
  --name "sp-itpm-company-deployment" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>
```

詳細步驟請參考: [Service Principal 設置文檔](../../docs/service-principal-setup.md)

## 🔄 與個人環境的差異

| 項目 | 個人環境 | 公司環境 |
|------|----------|----------|
| 訂閱 | 個人訂閱 | 公司訂閱 |
| 命名前綴 | `itpm` | `itpm-company` |
| Key Vault | 獨立 | 可能共用 |
| 部署權限 | 完全控制 | 受限訪問 |
| 成本控制 | 個人負擔 | 公司預算 |
| 服務層級 | Basic tier | 可能需要更高 tier |
| 網路配置 | 公開訪問 | 可能需要 VNet |
| 合規要求 | 無 | 需遵守公司政策 |

## ⚠️ 安全和合規

### 必須遵守的公司政策
- [ ] 數據加密要求
- [ ] 訪問日誌記錄
- [ ] 備份和災難恢復
- [ ] 網路隔離要求
- [ ] 合規性認證 (如 ISO 27001)

### 部署檢查清單
- [ ] 已獲得部署授權
- [ ] 資源命名符合公司規範
- [ ] Key Vault 訪問權限已配置
- [ ] 網路安全規則已設置
- [ ] 監控和警報已配置
- [ ] 成本標籤已添加
- [ ] 備份策略已啟用

## 📚 相關資源

- [公司 Azure 管理門戶](https://portal.azure.com)
- [公司 DevOps 文檔](待補充)
- [Azure 合規性要求](待補充)
- [公司 Key Vault 訪問申請流程](待補充)

## 📞 支援聯絡

遇到問題時聯繫：
- **Azure Administrator**: (待補充)
- **DevOps Team**: (待補充)
- **Security Team**: (待補充)

---

**最後更新**: 2025-11-26
**狀態**: ✅ 已部署並驗證通過
