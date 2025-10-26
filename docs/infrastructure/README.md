# 🏗️ 基礎設施文檔

> **目的**: Azure 基礎設施設置和本地開發環境配置
> **最後更新**: 2025-10-26

---

## 📋 文件索引

| 文件名稱 | 說明 | 用途 |
|---------|------|------|
| [azure-infrastructure-setup.md](./azure-infrastructure-setup.md) | Azure 雲端基礎設施設置指南 | 生產環境部署 |
| [local-dev-setup.md](./local-dev-setup.md) | 本地開發環境設置指南 | 開發環境配置 |
| [project-setup-checklist.md](./project-setup-checklist.md) | 專案設置檢查清單 | 環境驗證 |

---

## 🎯 文檔概覽

### azure-infrastructure-setup.md
**內容**: Azure 雲端資源的完整設置指南
- Azure App Service 配置
- Azure Database for PostgreSQL 設置
- Azure Blob Storage 配置
- Azure Cache for Redis 設置
- Azure AD B2C 配置
- CI/CD 管線設置

**適用場景**:
- 初次部署到 Azure
- 新環境（staging/production）配置
- Azure 服務升級和維護

---

### local-dev-setup.md
**內容**: 本地開發環境的設置指南
- Docker Compose 本地服務設置
- PostgreSQL 本地數據庫配置
- Redis 本地緩存配置
- Mailhog 郵件測試服務
- 環境變數配置

**適用場景**:
- 新開發者加入團隊
- 本地開發環境故障排除
- 跨平台開發環境一致性

---

### project-setup-checklist.md
**內容**: 環境設置完成驗證清單
- 依賴安裝檢查
- 環境變數驗證
- 服務連接測試
- 資料庫遷移驗證
- 開發工具配置確認

**適用場景**:
- 完成環境設置後的驗證
- 排查環境配置問題
- CI/CD 環境健康檢查

---

## 🔗 相關文檔

### 開發環境設置
- [DEVELOPMENT-SETUP.md](../../DEVELOPMENT-SETUP.md) - 711 行完整跨平台設置指南
- [docs/development/](../development/) - 開發服務管理指南
- [scripts/check-environment.js](../../scripts/check-environment.js) - 自動化環境檢查腳本

### 系統架構
- [docs/fullstack-architecture/](../fullstack-architecture/) - 完整技術架構文檔
- [docs/fullstack-architecture/10-deployment-architecture.md](../fullstack-architecture/10-deployment-architecture.md) - 部署架構詳解

---

## 🚀 快速開始

### 本地開發環境設置
```bash
# 1. 參考本地開發設置指南
# 詳見 local-dev-setup.md

# 2. 啟動 Docker 服務
docker-compose up -d

# 3. 運行環境檢查
pnpm check:env

# 4. 啟動開發服務器
pnpm dev
```

### Azure 生產環境部署
```bash
# 1. 參考 Azure 基礎設施設置指南
# 詳見 azure-infrastructure-setup.md

# 2. 配置 Azure 資源
# 使用 Azure Portal 或 Azure CLI

# 3. 配置 CI/CD 管線
# GitHub Actions workflows

# 4. 部署應用
git push origin main  # 觸發 CI/CD
```

---

## 📊 環境對比

| 環境 | 數據庫 | 緩存 | 郵件 | 存儲 |
|------|--------|------|------|------|
| **本地開發** | PostgreSQL (Docker, :5434) | Redis (Docker, :6381) | Mailhog (:1025) | 本地文件系統 |
| **Azure Staging** | Azure Database for PostgreSQL | Azure Cache for Redis | SendGrid | Azure Blob Storage |
| **Azure Production** | Azure Database for PostgreSQL | Azure Cache for Redis | SendGrid | Azure Blob Storage |

---

## ⚙️ 配置管理

### 環境變數管理
- 本地開發: `.env` 文件（gitignored）
- Azure 環境: Azure App Service 應用程式設定
- CI/CD: GitHub Secrets

### 端口配置
**本地開發** (避免衝突使用非標準端口):
- Next.js: 3000
- PostgreSQL: 5434 (mapped from 5432)
- Redis: 6381 (mapped from 6379)
- Mailhog SMTP: 1025
- Mailhog UI: 8025

**Azure 生產環境**:
- App Service: 443 (HTTPS)
- PostgreSQL: 5432
- Redis: 6380 (SSL)

---

**維護者**: DevOps 團隊 + 開發團隊
**問題回報**: 請更新 FIXLOG.md 或創建 GitHub Issue
