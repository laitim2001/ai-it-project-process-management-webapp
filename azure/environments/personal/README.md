# 個人 Azure 環境配置

本目錄包含個人 Azure 訂閱的環境配置文件。

## 📋 當前使用的 Azure 資源

### 訂閱信息
- **Azure 訂閱**: 個人 Azure 訂閱
- **區域**: East Asia

### 已部署資源 (Dev 環境)
- **資源群組**: `rg-itpm-dev`
- **App Service**: `app-itpm-dev-001`
- **App Service Plan**: `asp-itpm-dev`
- **PostgreSQL**: `psql-itpm-dev-001`
- **Container Registry**: `acritpmdev`
- **Storage Account**: `stitpmdev001`
- **Key Vault**: `kv-itpm-dev`

## 🚀 部署方式

### 快速部署到 Dev 環境
```bash
# 從項目根目錄執行
bash azure/scripts/deploy-to-personal.sh dev
```

### 部署到 Staging/Prod 環境
```bash
# Staging
bash azure/scripts/deploy-to-personal.sh staging

# Production
bash azure/scripts/deploy-to-personal.sh prod
```

## 📝 環境配置文件

- `dev.env.example` - 開發環境配置範例
- `staging.env.example` - Staging 環境配置範例
- `prod.env.example` - 生產環境配置範例

### 配置說明

所有敏感信息使用 **Key Vault 引用格式**：
```bash
DATABASE_URL=@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-DATABASE-URL)
```

## 🔑 Key Vault 密鑰管理

### 查看所有密鑰
```bash
bash azure/scripts/helper/list-secrets.sh
```

### 添加新密鑰
```bash
bash azure/scripts/helper/add-secret.sh SECRET_NAME "secret_value"
```

### 輪換密鑰
```bash
bash azure/scripts/helper/rotate-secret.sh SECRET_NAME "new_value"
```

## ✅ 部署驗證

### 驗證部署成功
```bash
bash azure/scripts/helper/verify-deployment.sh
```

### 手動測試
1. 訪問 App Service URL: https://app-itpm-dev-001.azurewebsites.net
2. 測試登入功能
3. 檢查數據庫連接
4. 驗證文件上傳功能

## 🔍 故障排除

### 查看應用日誌
```bash
az webapp log tail \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev
```

### 重啟應用
```bash
az webapp restart \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev
```

### 檢查 PostgreSQL 連接
```bash
# 使用測試腳本
bash azure/tests/test-azure-connectivity.sh
```

## 📚 相關文檔

- [Azure 部署主文檔](../../README.md)
- [部署腳本說明](../../scripts/README.md)
- [Service Principal 設置](../../docs/service-principal-setup.md)

## ⚠️ 注意事項

1. **不要提交 .env 文件**: 所有 `.env` 文件都在 `.gitignore` 中
2. **密鑰安全**: 敏感信息僅存儲在 Key Vault
3. **資源命名**: 避免與公司環境資源衝突
4. **成本控制**: 個人訂閱使用基本層級服務 (Basic tier)
