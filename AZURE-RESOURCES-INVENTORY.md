# Azure 公司環境資源清單

**掃描日期**: 2025-11-26  
**資源群組**: RG-RCITest-RAPO-N8N  
**訂閱 ID**: 30dac177-6dcb-412e-94f6-da9308fd1d09  
**環境**: 公司 Azure（開發環境）

---

## 📊 資源概覽

| 資源類型 | 資源名稱 | 狀態 | SKU/配置 |
|---------|---------|------|---------|
| 🌐 Web App Service | app-itpm-company-dev-001 | ✅ Running | - |
| 📦 App Service Plan | plan-itpm-company-dev | ✅ Succeeded | B1 (Basic) |
| 🗄️ PostgreSQL Database | psql-itpm-company-dev-001 | ✅ Ready | Flexible Server, v14, Burstable |
| 💾 Storage Account | stitpmcompanydev001 | ✅ Succeeded | Standard LRS, Hot Tier |
| 📦 Container Registry | acritpmcompany | ✅ Succeeded | Basic SKU |

---

## 🌐 Web App Service (app-itpm-company-dev-001)

```
名稱:              app-itpm-company-dev-001
URL:              https://app-itpm-company-dev-001.azurewebsites.net
狀態:             Running ✅
訪問區域:          East Asia
建立日期:          2025-11-25
資源群組:         RG-RCITest-RAPO-N8N
應用服務計劃:      plan-itpm-company-dev (B1)
運行時:           Docker Container (Linux)
```

### 環境變數配置
```
資料庫連接:        @Microsoft.KeyVault(VaultName=...;SecretName=ITPM-COMPANY-DATABASE-URL)
認證密鑰:         @Microsoft.KeyVault(VaultName=...;SecretName=ITPM-COMPANY-NEXTAUTH-SECRET)
應用 URL:        https://app-itpm-company-dev-001.azurewebsites.net
語言/架構:        Node.js 20 (via Docker)
```

### 容器配置
```
鏡像來源:         acritpmcompany.azurecr.io/itpm-web:latest
啟動命令:         docker/startup.sh
健康檢查路徑:      /api/health
```

---

## 📦 App Service Plan (plan-itpm-company-dev)

```
名稱:              plan-itpm-company-dev
SKU:              B1 (Basic) - 共享計算資源
層級:             Standard
核心/記憶體:       1 vCPU, 1.75 GB RAM
作業系統:         Linux
```

**成本估算**: ~$13.14/月

---

## 🗄️ PostgreSQL Flexible Server (psql-itpm-company-dev-001)

```
名稱:              psql-itpm-company-dev-001
狀態:             Ready ✅
版本:             PostgreSQL 14
層級:             Burstable (B1ms)
區域:             East Asia (同 Web App)
管理員帳戶:        itpmadmin
資料庫:           itpm_dev
```

### 連接信息
```
主機名:           psql-itpm-company-dev-001.postgres.database.azure.com
埠:              5432
SSL 模式:        require
連接字串格式:     postgresql://itpmadmin:PASSWORD@psql-itpm-company-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require
```

### 防火牆規則
```
✅ 允許 Azure 服務訪問 (0.0.0.0 - 0.0.0.0)
✅ 本地開發機器（如已配置）
```

### 資料庫內容
```
表統計:           20+ tables (Role, User, Project, BudgetPool, Currency, ...)
Migrations:       3 個已應用
  - 20251024082756_init
  - 20251111065801_new
  - 20251126100000_add_currency
Seed 數據:        
  - Roles: 3 個 (ProjectManager, TeamMember, Stakeholder)
  - Currencies: 6 個 (TWD, USD, EUR, JPY, CNY, GBP)
```

**成本估算**: ~$12.41/月

---

## 💾 Storage Account (stitpmcompanydev001)

```
名稱:              stitpmcompanydev001
狀態:             Succeeded ✅
SKU:              Standard_LRS (本地冗余)
訪問層級:         Hot
區域:             East Asia
```

### 容器清單
| 容器名稱 | 用途 | 訪問級別 |
|---------|------|---------|
| **quotes** | 報價單存儲 | Private |
| **proposals** | 提案文檔存儲 | Private |
| **invoices** | 發票存儲 | Private |

### 訪問方式
```
連接字串:         DefaultEndpointsProtocol=https;AccountName=stitpmcompanydev001;AccountKey=***;EndpointSuffix=core.windows.net
Blob 端點:        https://stitpmcompanydev001.blob.core.windows.net
存取方式:         Managed Identity (App Service)
```

**成本估算**: ~$0.50-1.00/月 (開發用量)

---

## 📦 Container Registry (acritpmcompany)

```
名稱:              acritpmcompany
狀態:             Succeeded ✅
SKU:              Basic
區域:             East Asia
登入伺服器:       acritpmcompany.azurecr.io
```

### 鏡像儲存庫
| 倉庫名稱 | 說明 | 標籤 | 大小 |
|---------|------|------|------|
| **itpm-web** | ITPM 應用主鏡像 | latest, v1.x.x | ~400-500 MB |
| **itpm-migrate** | 資料庫遷移鏡像（可選） | latest | ~300 MB |

### 訪問配置
```
管理員啟用:        Yes (登入用戶名: acritpmcompany)
認證密碼:         *** (儲存在 Azure Key Vault)
```

**成本估算**: ~$5/月

---

## 🔐 安全性配置

### Managed Identity
```
App Service Managed Identity:
  - 類型: System Assigned
  - 用途: 訪問 Key Vault, Storage, Database
  - 權限: 
    - Storage Blob Data Contributor (stitpmcompanydev001)
    - Key Vault Secrets User (需要配置)
```

### Key Vault（假定存在）
```
可能位置: Azure Key Vault (名稱未確認)
存儲密鑰:
  - ITPM-COMPANY-DATABASE-URL (PostgreSQL 連接字串)
  - ITPM-COMPANY-NEXTAUTH-SECRET (認證密鑰)
  - ITPM-COMPANY-STORAGE-ACCOUNT-KEY (可選)
```

---

## 📊 成本估算

| 服務 | 層級 | 月度成本 |
|------|------|---------|
| App Service Plan (B1) | Basic | $13.14 |
| PostgreSQL (Burstable B1ms) | Flexible Server | $12.41 |
| Storage Account | Standard LRS | $0.50-1.00 |
| Container Registry | Basic | $5.00 |
| 其他 (Data Transfer, etc) | - | $5-10 |
| **總計** | - | **~$36-41/月** |

---

## 🚀 部署架構

```
GitHub Repository
        ↓
   [git push]
        ↓
Azure Container Registry (acritpmcompany)
        ↓
App Service Plan (B1)
        ├─→ App Service (app-itpm-company-dev-001)
        │       ├─→ Docker Container (itpm-web:latest)
        │       ├─→ startup.sh (migration on startup)
        │       └─→ Node.js Next.js App
        │
PostgreSQL (psql-itpm-company-dev-001)
        ├─→ Database: itpm_dev
        ├─→ Schema: 20+ tables
        └─→ Migrations: 3/3 applied
        
Storage Account (stitpmcompanydev001)
        ├─→ quotes container
        ├─→ proposals container
        └─→ invoices container
```

---

## ✅ 健康檢查

### 部署驗證命令

```bash
# 1. 檢查 Web App 狀態
az webapp show --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N --query state

# 2. 檢查資料庫連接
az postgres flexible-server connect --name psql-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N

# 3. 檢查 Storage 容器
az storage container list --account-name stitpmcompanydev001 --auth-mode login

# 4. 檢查 ACR 鏡像
az acr repository list --name acritpmcompany

# 5. 檢查應用程式日誌
az webapp log tail --name app-itpm-company-dev-001 --resource-group RG-RCITest-RAPO-N8N
```

---

## 📝 部署日誌

### 2025-11-25 首次部署
- ✅ 資源群組創建
- ✅ PostgreSQL 部署
- ✅ Storage Account 創建
- ✅ Container Registry 配置
- ✅ App Service 部署
- ⚠️ 初始 .dockerignore 問題 → 2025-11-26 修復

### 2025-11-26 修復部署
- ✅ .dockerignore 修復（排除 migrations 規則）
- ✅ Currency migration 創建
- ✅ startup.sh 創建
- ✅ Seed API 實施
- ✅ 應用程式重新部署
- ✅ 驗證成功

---

## 🔗 相關文檔

- `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md` - 故障排除指南
- `SITUATION-7-AZURE-DEPLOY-COMPANY.md` - 公司環境部署指引
- `SITUATION-9-AZURE-TROUBLESHOOT-COMPANY.md` - 公司環境故障排查
- `AZURE-DEPLOYMENT-CHECKLIST.md` - 部署檢查清單

---

**最後更新**: 2025-11-26 by GitHub Copilot  
**維護者**: 開發團隊  
**下次檢查建議**: 2025-12-01
