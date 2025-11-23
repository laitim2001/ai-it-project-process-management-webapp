# Azure Helper Scripts

**用途**: 簡化 Azure 資源管理的實用工具腳本

---

## 📋 腳本列表

| 腳本 | 用途 | 使用頻率 |
|------|------|---------|
| `add-secret.sh` | 添加 Key Vault 密鑰 | 🟢 常用 |
| `list-secrets.sh` | 列出 Key Vault 密鑰 | 🟢 常用 |
| `configure-app-settings.sh` | 批量配置 App Service 環境變數 | 🟡 偶爾 |
| `verify-deployment.sh` | 驗證部署健康狀態 | 🟢 常用 |
| `rotate-secret.sh` | 輪換 Key Vault 密鑰 | 🔴 定期（90天） |

---

## 🔐 add-secret.sh

**用途**: 快速添加密鑰到 Key Vault

**語法**:
```bash
./add-secret.sh <environment> <secret-category-name> <secret-value>
```

**範例**:
```bash
# 添加資料庫連接字串
./add-secret.sh dev DATABASE-URL "postgresql://user:pass@host:5432/db"

# 添加 NextAuth Secret
./add-secret.sh prod NEXTAUTH-SECRET "$(openssl rand -base64 32)"

# 添加 SendGrid API 密鑰
./add-secret.sh staging SENDGRID-API-KEY "SG.xxxxxxxx"
```

---

## 📋 list-secrets.sh

**用途**: 列出環境中的所有密鑰

**語法**:
```bash
./list-secrets.sh <environment>
```

**範例**:
```bash
./list-secrets.sh dev
./list-secrets.sh prod
```

**輸出**:
```
Name                               Enabled    Updated
---------------------------------  ---------  -------------------
ITPM-DEV-DATABASE-URL             True       2025-11-20T10:30:00
ITPM-DEV-NEXTAUTH-SECRET          True       2025-11-20T10:31:00
...
```

---

## ⚙️ configure-app-settings.sh

**用途**: 批量配置 App Service 環境變數（包含 Key Vault 引用）

**語法**:
```bash
./configure-app-settings.sh <environment>
```

**範例**:
```bash
./configure-app-settings.sh dev
```

**功能**:
- 設置直接環境變數（NODE_ENV, PORT等）
- 配置 Key Vault 引用
- 自動生成正確的引用格式

---

## ✅ verify-deployment.sh

**用途**: 驗證部署後的應用健康狀態

**語法**:
```bash
./verify-deployment.sh <environment>
```

**範例**:
```bash
./verify-deployment.sh dev
```

**檢查項目**:
1. App Service 狀態
2. HTTP 健康檢查
3. 最近日誌

---

## 🔄 rotate-secret.sh

**用途**: 輪換 Key Vault 密鑰（定期安全更新）

**語法**:
```bash
./rotate-secret.sh <environment> <secret-category-name> <new-value>
```

**範例**:
```bash
# 輪換 NextAuth Secret
./rotate-secret.sh prod NEXTAUTH-SECRET "$(openssl rand -base64 32)"

# 輪換 Storage Account Key
./rotate-secret.sh prod STORAGE-ACCOUNT-KEY "new-storage-key"
```

**流程**:
1. 備份舊版本資訊
2. 創建新版本
3. 重啟 App Service
4. 驗證健康狀態

---

## 🛡️ 安全建議

### 密鑰輪換計劃
| 密鑰 | 輪換頻率 |
|------|---------|
| `NEXTAUTH-SECRET` | 每 90 天 |
| `STORAGE-ACCOUNT-KEY` | 每 180 天 |
| `SENDGRID-API-KEY` | 每年 |
| `AZUREADB2C-CLIENT-SECRET` | 每年 |

### 使用規範
- ✅ 使用 Git Bash 或 Linux Shell 執行
- ✅ 確保已登入 Azure CLI (`az login`)
- ✅ 密鑰值使用引號包裹
- ❌ 切勿在日誌中輸出密鑰值

---

**維護者**: DevOps Team
**最後更新**: 2025-11-20
