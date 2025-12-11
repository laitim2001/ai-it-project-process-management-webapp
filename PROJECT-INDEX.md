# 📂 IT Project Process Management Platform - 完整專案索引

> **目的**: 提供項目所有重要文件的完整導航地圖
> **更新頻率**: 每次新增/移除重要文件時立即更新
> **維護指南**: 參考 `INDEX-MAINTENANCE-GUIDE.md`

**最後更新**: 2025-12-11 (CHANGE-010/011 Data Import 增強 + isOngoing 欄位支援)

---

## 📋 索引使用說明

### 🎯 如何使用此索引

1. **按類別查找**: 文件按功能類別組織（文檔、代碼、配置等）
2. **按重要性篩選**: 每個文件標註重要程度（🔴極高、🟡高、🟢中）
3. **快速跳轉**: 使用目錄快速定位到所需類別
4. **路徑準確**: 所有路徑都是相對於項目根目錄的準確路徑

### 🏷️ 重要性標籤說明

| 標籤 | 說明 | 使用場景 |
|------|------|----------|
| 🔴 極高 | 核心業務文檔、主要配置 | 理解項目必讀 |
| 🟡 高 | 功能模組、API 文檔、測試 | 日常開發常用 |
| 🟢 中 | 工具腳本、輔助文檔 | 特定場景參考 |

---

## 📑 目錄

1. [索引系統與元文件](#1-索引系統與元文件)
2. [項目文檔](#2-項目文檔)
   - [總覽文檔](#總覽文檔)
   - [設計系統文檔](#設計系統文檔)
   - [產品需求 (PRD)](#產品需求-prd)
   - [技術架構](#技術架構)
   - [使用者故事](#使用者故事)
   - [基礎設施](#基礎設施)
   - [研究與發現](#研究與發現)
3. [核心代碼](#3-核心代碼)
   - [前端應用 (apps/web)](#前端應用-appsweb)
   - [API 層 (packages/api)](#api-層-packagesapi)
   - [資料庫 (packages/db)](#資料庫-packagesdb)
   - [認證 (packages/auth)](#認證-packagesauth)
   - [共享配置 (packages/tsconfig)](#共享配置-packagestsconfig)
4. [配置文件](#4-配置文件)
5. [開發工具](#5-開發工具)
6. [CI/CD](#6-cicd)

---

## 1. 索引系統與元文件

> **重要**: 這些文件定義和維護索引系統本身，是 AI 助手理解項目結構的核心

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **項目完整索引** | `PROJECT-INDEX.md` | 項目所有重要文件的導航地圖（本文件） | 🔴 極高 |
| **索引維護指南** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護策略、分類標準、更新流程、歸檔策略 | 🔴 極高 |
| **AI 助手快速參考** | `AI-ASSISTANT-GUIDE.md` | AI 助手工作流程、快速參考、開發進度、索引系統架構 | 🔴 極高 |
| **Claude 用戶配置** | `.claude.md` | Claude Code 用戶級配置（SuperClaude 框架） | 🟡 高 |
| **Azure 資源清單** | `AZURE-RESOURCES-INVENTORY.md` | Azure 資源完整清單與狀態 | 🟡 高 |
| **快速啟動指南** | `QUICK-START.md` | 場景化 Prompt 模板（冷啟動、溫啟動、維護提醒） | 🔴 極高 |
| **開發記錄** | `DEVELOPMENT-LOG.md` | 所有開發決策、里程碑、重要變更記錄（倒序） | 🔴 極高 |
| **問題修復記錄** | `FIXLOG.md` | Bug 修復記錄、問題解決方案 | 🟡 高 |
| **服務管理指南** | `docs/development/DEVELOPMENT-SERVICE-MANAGEMENT.md` | 開發服務管理文檔 | 🟡 高 |
| **安裝命令參考** | `docs/development/INSTALL-COMMANDS.md` | 常用安裝命令快速參考 | 🟡 高 |

---

## 2. 項目文檔

### 總覽文檔

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **README** | `README.md` | 項目總覽、快速開始指南 | 🔴 極高 |
| **專案簡報** | `docs/brief.md` | 項目背景、目標與價值主張 | 🔴 極高 |
| **MVP 開發計劃** | `claudedocs/planning/mvp-development-plan.md` | MVP 完整開發路線圖和 Sprint 規劃 | 🔴 極高 |
| **MVP 實施檢查清單** | `claudedocs/planning/mvp-implementation-checklist.md` | MVP 詳細實施檢查清單和進度追蹤 | 🔴 極高 |
| **完整環境設置指南** | `DEVELOPMENT-SETUP.md` | 711 行跨平台環境設置完整指南（Windows/Mac/Linux） | 🔴 極高 |
| **環境設置驗證** | `docs/development/SETUP-COMPLETE.md` | 環境設置完成後的驗證清單 | 🟡 高 |
| **貢獻指南** | `CONTRIBUTING.md` | 如何為項目做貢獻的完整指南 | 🟡 高 |
| **Claude Code 指南** | `CLAUDE.md` | Claude Code AI 助手使用規則和項目上下文 | 🟢 中 |

### 設計系統文檔

> **索引說明**: 兩層索引策略 - 核心文件直接列出，完整列表參見 [docs/design-system/README.md](./docs/design-system/README.md)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **設計系統總覽** | `docs/design-system/README.md` | 設計系統文檔導航和狀態總覽（4 個文件索引） | 🔴 極高 |
| **設計系統快速指南** | `docs/design-system/DESIGN-SYSTEM-GUIDE.md` | 日常開發快速參考，確保一致風格 | 🔴 極高 |
| **UI/UX 重設計規範** | `docs/design-system/ui-ux-redesign.md` | 完整的設計系統規範（顏色、字體、間距等，64KB） | 🔴 極高 |
| **設計系統遷移計劃** | `docs/design-system/design-system-migration-plan.md` | 完整的遷移策略和時間表 | 🟡 高 |
| **設計系統導航** | `docs/design-system/README-DESIGN-SYSTEM.md` | 設計系統文檔導航中心 | 🟡 高 |
| **設計系統遷移進度** | `claudedocs/design-system/DESIGN-SYSTEM-MIGRATION-PROGRESS.md` | 設計系統遷移完整進度追蹤（v4.0 - Phase 2 完成） | 🔴 極高 |

### 產品需求 (PRD)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **PRD 總覽** | `docs/prd/index.md` | 產品需求文件總覽 | 🔴 極高 |
| **目標與背景** | `docs/prd/1-goals-and-background-context.md` | 項目目標和背景上下文 | 🔴 極高 |
| **功能需求** | `docs/prd/2-functional-and-non-functional-requirements.md` | 功能性與非功能性需求 | 🔴 極高 |
| **Epic 列表** | `docs/prd/3-epic-list.md` | 所有 Epic 的概覽 | 🟡 高 |
| **Epic 與 Story 詳情** | `docs/prd/4-epic-and-user-story-details.md` | Epic 和 User Story 的詳細拆分 | 🟡 高 |

### 技術架構

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **架構總覽** | `docs/fullstack-architecture/index.md` | 全端架構文件總覽 | 🔴 極高 |
| **簡介** | `docs/fullstack-architecture/1-introduction.md` | 架構設計簡介 | 🔴 極高 |
| **高層架構** | `docs/fullstack-architecture/2-high-level-architecture.md` | 系統高層架構設計 | 🔴 極高 |
| **技術棧** | `docs/fullstack-architecture/3-tech-stack.md` | 技術選型與理由 | 🔴 極高 |
| **統一專案結構** | `docs/fullstack-architecture/4-unified-project-structure.md` | Monorepo 結構設計 | 🔴 極高 |
| **資料模型** | `docs/fullstack-architecture/5-data-model-and-prisma-schema.md` | 資料庫模型設計 | 🔴 極高 |
| **API 設計** | `docs/fullstack-architecture/6-api-design-trpc.md` | tRPC API 設計規範 | 🔴 極高 |
| **核心元件** | `docs/fullstack-architecture/7-core-components.md` | 核心系統元件說明 | 🟡 高 |
| **核心工作流** | `docs/fullstack-architecture/8-core-workflows.md` | 業務流程設計 | 🟡 高 |
| **開發工作流** | `docs/fullstack-architecture/9-development-workflow.md` | 開發流程與規範 | 🟡 高 |
| **部署架構** | `docs/fullstack-architecture/10-deployment-architecture.md` | Azure 部署架構 | 🟡 高 |
| **安全與效能** | `docs/fullstack-architecture/11-security-performance-and-observability.md` | 安全、效能與可觀測性 | 🟡 高 |
| **成本優化** | `docs/fullstack-architecture/12-cost-optimization-and-management.md` | 成本優化策略 | 🟢 中 |
| **總結與下一步** | `docs/fullstack-architecture/13-conclusion-and-next-steps.md` | 架構總結與未來規劃 | 🟢 中 |
| **前端規格** | `docs/front-end-spec.md` | UI/UX 設計規格 | 🟡 高 |

### 使用者故事

所有使用者故事按 Epic 組織，位於 `docs/stories/` 目錄下：

#### Epic 1: 平台基礎與用戶認證

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 1.1** | `docs/stories/epic-1-platform-foundation-and-user-authentication/story-1.1-project-initialization-and-infrastructure-setup.md` | 專案初始化與基礎設施設置 | 🔴 極高 |
| **Story 1.2** | `docs/stories/epic-1-platform-foundation-and-user-authentication/story-1.2-core-authentication-and-user-management-service-database-model.md` | 核心認證與用戶管理服務 - 資料庫模型 | 🔴 極高 |
| **Story 1.3** | `docs/stories/epic-1-platform-foundation-and-user-authentication/story-1.3-core-authentication-and-user-management-service-registration-and-login-functionality.md` | 核心認證與用戶管理服務 - 註冊與登入功能 | 🔴 極高 |
| **Story 1.4** | `docs/stories/epic-1-platform-foundation-and-user-authentication/story-1.4-core-authentication-and-user-management-service-role-based-access-control.md` | 核心認證與用戶管理服務 - 基於角色的存取控制 | 🔴 極高 |

#### Epic 2: CI/CD 與部署自動化

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 2.1** | `docs/stories/epic-2-ci-cd-and-deployment-automation/story-2.1-continuous-integration.md` | 持續整合 | 🟡 高 |
| **Story 2.2** | `docs/stories/epic-2-ci-cd-and-deployment-automation/story-2.2-continuous-deployment.md` | 持續部署 | 🟡 高 |

#### Epic 3: 預算與專案設置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 3.1** | `docs/stories/epic-3-budget-and-project-setup/story-3.1-budget-pool-management.md` | 預算池管理 | 🔴 極高 |
| **Story 3.2** | `docs/stories/epic-3-budget-and-project-setup/story-3.2-project-management.md` | 專案管理 | 🔴 極高 |

#### Epic 4: 提案與審批工作流

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 4.1** | `docs/stories/epic-4-proposal-and-approval-workflow/story-4.1-project-manager-submits-proposal-for-approval.md` | 專案經理提交提案審批 | 🔴 極高 |
| **Story 4.2** | `docs/stories/epic-4-proposal-and-approval-workflow/story-4.2-supervisor-reviews-and-decides-on-proposal.md` | 主管審核並決定提案 | 🔴 極高 |
| **Story 4.3** | `docs/stories/epic-4-proposal-and-approval-workflow/story-4.3-supervisor-requests-more-information.md` | 主管請求更多資訊 | 🟡 高 |
| **Story 4.4** | `docs/stories/epic-4-proposal-and-approval-workflow/story-4.4-view-proposal-communication-history.md` | 查看提案溝通歷史 | 🟡 高 |

#### Epic 5: 採購與供應商管理

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 5.1** | `docs/stories/epic-5-procurement-and-vendor-management/story-5.1-manage-vendor-basic-information.md` | 管理供應商基本資訊 | 🟡 高 |
| **Story 5.2** | `docs/stories/epic-5-procurement-and-vendor-management/story-5.2-upload-and-associate-quotes.md` | 上傳並關聯報價單 | 🟡 高 |
| **Story 5.3** | `docs/stories/epic-5-procurement-and-vendor-management/story-5.3-select-final-vendor.md` | 選擇最終供應商 | 🟡 高 |
| **Story 5.4** | `docs/stories/epic-5-procurement-and-vendor-management/story-5.4-generate-purchase-order-record.md` | 生成採購訂單記錄 | 🟡 高 |

#### Epic 6: 費用記錄與財務整合

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 6.1** | `docs/stories/epic-6-expense-recording-and-financial-integration/story-6.1-record-invoice-and-expense-against-po.md` | 針對採購訂單記錄發票和費用 | 🟡 高 |
| **Story 6.2** | `docs/stories/epic-6-expense-recording-and-financial-integration/story-6.2-manage-expense-approval-status.md` | 管理費用審批狀態 | 🟡 高 |
| **Story 6.3** | `docs/stories/epic-6-expense-recording-and-financial-integration/story-6.3-associate-expense-to-budget-pool.md` | 將費用關聯到預算池 | 🟡 高 |
| **Story 6.4** | `docs/stories/epic-6-expense-recording-and-financial-integration/story-6.4-perform-charge-out-and-archive-project.md` | 執行費用分攤並歸檔專案 | 🟡 高 |

#### Epic 7: 儀表板與基本報表

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 7.1** | `docs/stories/epic-7-dashboard-and-basic-reporting/story-7.1-project-manager-dashboard-core-view.md` | 專案經理儀表板核心視圖 | 🟡 高 |
| **Story 7.2** | `docs/stories/epic-7-dashboard-and-basic-reporting/story-7.2-supervisor-dashboard-project-overview.md` | 主管儀表板專案總覽 | 🟡 高 |
| **Story 7.3** | `docs/stories/epic-7-dashboard-and-basic-reporting/story-7.3-dashboard-basic-data-export.md` | 儀表板基本數據匯出 | 🟢 中 |
| **Story 7.4** | `docs/stories/epic-7-dashboard-and-basic-reporting/story-7.4-budget-pool-overview-view.md` | 預算池總覽視圖 | 🟢 中 |

#### Epic 8: 通知系統

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 8.1** | `docs/stories/epic-8-notification-system/story-8.1-set-up-email-notification-service.md` | 設置電子郵件通知服務 | 🟡 高 |
| **Story 8.2** | `docs/stories/epic-8-notification-system/story-8.2-implement-automated-notifications-on-status-change.md` | 實現狀態變更自動通知 | 🟡 高 |

#### Epic 9: AI 助理

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 9.1** | `docs/stories/epic-9-ai-assistant/story-9.1-provide-intelligent-suggestions-during-proposal-phase.md` | 在提案階段提供智能建議 | 🟢 中 |
| **Story 9.2** | `docs/stories/epic-9-ai-assistant/story-9.2-intelligent-budget-and-expense-categorization.md` | 智能預算和費用分類 | 🟢 中 |
| **Story 9.3** | `docs/stories/epic-9-ai-assistant/story-9.3-predictive-budget-risk-alerting.md` | 預測性預算風險警報 | 🟢 中 |
| **Story 9.4** | `docs/stories/epic-9-ai-assistant/story-9.4-auto-generate-report-summary.md` | 自動生成報告摘要 | 🟢 中 |

#### Epic 10: 外部系統整合

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Story 10.1** | `docs/stories/epic-10-external-system-integration/story-10.1-sync-expense-data-to-erp.md` | 同步費用數據到 ERP | 🟢 中 |
| **Story 10.2** | `docs/stories/epic-10-external-system-integration/story-10.2-sync-user-data-from-hr-system.md` | 從 HR 系統同步用戶數據 | 🟢 中 |
| **Story 10.3** | `docs/stories/epic-10-external-system-integration/story-10.3-build-data-pipeline-to-data-warehouse.md` | 建立數據管道到數據倉庫 | 🟢 中 |

### 基礎設施

> **索引說明**: 兩層索引策略 - 核心文件直接列出，完整列表參見 [docs/infrastructure/README.md](./docs/infrastructure/README.md)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **基礎設施總覽** | `docs/infrastructure/README.md` | 基礎設施文檔導航和環境對比（3 個文件索引） | 🟡 高 |
| **本地開發設置** | `docs/infrastructure/local-dev-setup.md` | 本地開發環境設置指南（Docker Compose, PostgreSQL:5434, Redis:6381） | 🟡 高 |
| **Azure 基礎設施** | `docs/infrastructure/azure-infrastructure-setup.md` | Azure 雲端基礎設施設置（App Service, Database, Blob Storage） | 🟡 高 |
| **專案設置檢查清單** | `docs/infrastructure/project-setup-checklist.md` | 完整的設置檢查清單 | 🟢 中 |

### Azure 部署與運維

> **重大更新**: 2025-11-24 完成 Azure 部署架構重組
> **結構**: 4 層架構 - 執行層 (azure/) | 文檔層 (docs/deployment/) | 記錄層 (claudedocs/) | AI 助手指引
> **說明**: 完整的 Azure 部署自動化系統和故障排查指引
> **完整索引**: 參見 [AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md](./claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md)

#### 📂 執行層 - Azure 部署腳本與配置 (⭐⭐⭐⭐⭐ 最高優先級)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Azure 部署主入口** | `azure/README.md` | Azure 部署完整說明文檔（~250行） | 🔴 極高 |
| **個人環境部署腳本** | `azure/scripts/deploy-to-personal.sh` | 個人 Azure 訂閱自動化部署入口（~150行） | 🔴 極高 |
| **公司環境部署腳本** | `azure/scripts/deploy-to-company.sh` | 公司 Azure 訂閱自動化部署入口（~180行，含安全確認） | 🔴 極高 |
| **01-資源設置腳本** | `azure/scripts/01-setup-resources.sh` | Azure Resource Group 和 App Service 資源建立 | 🟡 高 |
| **02-數據庫設置腳本** | `azure/scripts/02-setup-database.sh` | Azure PostgreSQL 資料庫配置 | 🟡 高 |
| **03-存儲設置腳本** | `azure/scripts/03-setup-storage.sh` | Azure Blob Storage 設置 | 🟡 高 |
| **04-容器註冊表設置** | `azure/scripts/04-setup-acr.sh` | Azure Container Registry 配置 | 🟡 高 |
| **05-Docker 建置腳本** | `azure/scripts/05-build-docker.sh` | Docker 映像建置自動化 | 🟡 高 |
| **06-應用部署腳本** | `azure/scripts/06-deploy-app.sh` | App Service 應用部署和健康檢查 | 🟡 高 |
| **個人環境配置範本** | `azure/environments/personal/dev.env.example` | 個人開發環境環境變數範本（~80行） | 🔴 極高 |
| **個人環境說明** | `azure/environments/personal/README.md` | 個人環境配置指南 | 🟡 高 |
| **公司環境配置範本** | `azure/environments/company/dev.env.example` | 公司開發環境環境變數範本 | 🔴 極高 |
| **公司環境說明** | `azure/environments/company/README.md` | 公司環境配置指南 | 🟡 高 |
| **App Service Bicep** | `azure/templates/app-service.bicep` | App Service Infrastructure as Code 模板 | 🟡 高 |
| **Database Bicep** | `azure/templates/database.bicep` | Database Infrastructure as Code 模板 | 🟡 高 |
| **Storage Bicep** | `azure/templates/storage.bicep` | Storage Infrastructure as Code 模板 | 🟡 高 |
| **Azure 連線測試腳本** | `azure/tests/test-azure-connectivity.sh` | Azure 資源連線診斷工具 | 🟡 高 |
| **部署驗證腳本** | `azure/scripts/helper/verify-deployment.sh` | 部署後驗證工具 | 🟡 高 |
| **Helper 腳本說明** | `azure/scripts/helper/README.md` | Helper 腳本使用說明 | 🟡 高 |
| **模板說明** | `azure/templates/README.md` | Azure IaC 模板使用說明 | 🟡 高 |
| **Smoke 測試腳本** | `azure/tests/smoke-test.sh` | 應用程式基本功能測試 | 🟡 高 |
| **部署故障排查** | `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md` | Azure 部署常見問題排查指南 | 🟡 高 |
| **Service Principal 設置** | `azure/docs/service-principal-setup.md` | Azure Service Principal 配置指南 | 🟡 高 |
| **Docker 建置配置** | `docker/Dockerfile` | 生產環境 Docker 建置配置（Multi-stage build，Alpine 3.17，Prisma 自動生成）（~150行） | 🔴 極高 |
| **GitHub Actions 範例** | `.github/workflows/azure-deploy-example.yml` | CI/CD 自動化部署範例配置（~360行） | 🟡 高 |

#### 📚 文檔層 - Azure 部署指南 (⭐⭐⭐⭐ 高優先級)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Azure 部署完整指南** | `docs/deployment/AZURE-DEPLOYMENT-GUIDE.md` | 完整的 Azure 部署操作手冊 | 🔴 極高 |
| **Azure 部署計劃** | `docs/deployment/azure-deployment-plan.md` | Azure 部署整體規劃與策略 | 🟡 高 |
| **部署前置需求** | `docs/deployment/00-prerequisites.md` | Azure 訂閱、工具、權限需求 | 🔴 極高 |
| **首次部署指南** | `docs/deployment/01-first-time-setup.md` | 首次部署完整步驟 | 🔴 極高 |
| **CI/CD 配置指南** | `docs/deployment/02-ci-cd-setup.md` | GitHub Actions 自動化部署配置 | 🟡 高 |
| **故障排查指南** | `docs/deployment/03-troubleshooting.md` | 常見問題和解決方案 | 🔴 極高 |
| **回滾程序** | `docs/deployment/04-rollback.md` | 部署失敗回滾流程 | 🟡 高 |
| **環境變數對照表** | `docs/deployment/environment-variables-map.md` | 所有環境變數完整說明 | 🔴 極高 |
| **Key Vault 密鑰清單** | `docs/deployment/key-vault-secrets-list.md` | Azure Key Vault 密鑰管理 | 🟡 高 |

#### 📋 記錄層 - Azure 部署歷史記錄 (⭐⭐⭐ 參考價值)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **部署文件結構指引** | `claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` | Azure 文件 4 層架構和查閱優先級（~308行）⭐ | 🔴 極高 |
| **部署檢查清單** | `claudedocs/AZURE-DEPLOYMENT-CHECKLIST.md` | 部署前檢查清單 | 🟡 高 |
| **v7 I18N 修復部署** | `claudedocs/AZURE-LOGIN-I18N-FIX-DEPLOYMENT.md` | v7 登入頁 I18N 問題修復記錄 | 🟡 高 |
| **NextAuth 根因分析** | `claudedocs/AZURE-NEXTAUTH-CONFIGURATION-ERROR-ROOT-CAUSE.md` | NextAuth 配置錯誤深度分析 | 🟡 高 |
| **v8 Prisma 修復成功** | `claudedocs/AZURE-PRISMA-FIX-DEPLOYMENT-SUCCESS.md` | v8 Prisma Client 修復部署成功記錄（~400行） | 🔴 極高 |
| **種子數據實施總結** | `claudedocs/AZURE-SEED-DATA-IMPLEMENTATION-SUMMARY.md` | 數據庫種子數據策略和實施 | 🟡 高 |
| **完整診斷和修復** | `claudedocs/COMPLETE-DEPLOYMENT-DIAGNOSIS-AND-FIX.md` | 完整部署問題診斷和修復過程（~500行） | 🔴 極高 |
| **Prisma 遷移指南** | `claudedocs/PRISMA-MIGRATION-GUIDE-FOR-AZURE.md` | Azure 環境 Prisma 遷移最佳實踐 | 🟡 高 |

#### 🤖 AI 助手指引 - 場景化部署和排查 (⭐⭐⭐⭐ 高優先級)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **SITUATION-6: 個人部署** | `claudedocs/6-ai-assistant/prompts/SITUATION-6-AZURE-DEPLOY-PERSONAL.md` | 個人 Azure 環境完整部署指引（~564行）⭐ | 🔴 極高 |
| **SITUATION-7: 公司部署** | `claudedocs/6-ai-assistant/prompts/SITUATION-7-AZURE-DEPLOY-COMPANY.md` | 公司 Azure 環境完整部署指引（~706行）⭐ | 🔴 極高 |
| **SITUATION-8: 個人排查** | `claudedocs/6-ai-assistant/prompts/SITUATION-8-AZURE-TROUBLESHOOT-PERSONAL.md` | 個人環境故障排查指引（~400行） | 🔴 極高 |
| **SITUATION-9: 公司排查** | `claudedocs/6-ai-assistant/prompts/SITUATION-9-AZURE-TROUBLESHOOT-COMPANY.md` | 公司環境故障排查指引（~400行） | 🔴 極高 |

### 實施記錄

> **索引說明**: 兩層索引策略 - 核心文件直接列出，完整列表參見 [docs/implementation/README.md](./docs/implementation/README.md)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **實施總覽** | `docs/implementation/README.md` | 實施階段回顧和成果總結（2 個文件索引） | 🔴 極高 |
| **實施總結報告** | `docs/implementation/IMPLEMENTATION-SUMMARY.md` | Phase 1-2 完整實施總結（MVP + Post-MVP，~30,000+ 行代碼） | 🔴 極高 |
| **原型開發指南** | `docs/implementation/prototype-guide.md` | 原型開發和快速驗證方法論 | 🟡 高 |

### 研究與發現

> **索引說明**: 兩層索引策略 - 核心文件直接列出，完整列表參見 [docs/research/README.md](./docs/research/README.md)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **研究總覽** | `docs/research/README.md` | 用戶研究文檔導航和主要發現摘要（4 個文件索引） | 🟡 高 |
| **用戶研究洞察** | `docs/research/user-research-insights.md` | 用戶研究分析與洞察（核心痛點和關鍵需求） | 🟡 高 |
| **用戶研究結果** | `docs/research/user-research-result.md` | 用戶研究原始數據 | 🟢 中 |
| **用戶研究提示** | `docs/research/user-research-prompt.md` | 用戶研究方法論和問題設計 | 🟢 中 |
| **腦力激盪結果** | `docs/research/brainstorming-session-results.md` | 需求探索會議記錄 | 🟢 中 |

### 開發指南

> **索引說明**: 兩層索引策略 - 核心文件直接列出，完整列表參見 [docs/development/README.md](./docs/development/README.md)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **開發指南總覽** | `docs/development/README.md` | 開發環境設置和服務管理導航（3 個文件索引） | 🟡 高 |
| **服務管理指南** | `docs/development/DEVELOPMENT-SERVICE-MANAGEMENT.md` | Docker 服務管理和常用命令（PostgreSQL, Redis, Mailhog） | 🟡 高 |
| **環境設置驗證** | `docs/development/SETUP-COMPLETE.md` | 環境設置完成檢查清單（配合 DEVELOPMENT-SETUP.md 使用） | 🟡 高 |
| **安裝命令參考** | `docs/development/INSTALL-COMMANDS.md` | 常用安裝命令快速參考 | 🟢 中 |

### 使用者故事總覽

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **故事總覽** | `docs/stories/README.md` | 10 個 Epic 用戶故事導航和完成統計 | 🔴 極高 |

### Sample-Docs 範例文檔庫

> **說明**: Sample-Docs 目錄作為**範例文檔庫**保留，用於項目演示和參考用途。這些文件不會影響項目索引系統（已在索引配置中排除）。

| 文件名稱 | 路徑 | 用途 | 重要性 |
|---------|------|------|--------|
| **AI 助手指南範例** | `Sample-Docs/AI-ASSISTANT-GUIDE.md` | 範例參考文檔 | 🟢 參考 |
| **項目索引範例** | `Sample-Docs/PROJECT-INDEX.md` | 範例參考文檔 | 🟢 參考 |
| **索引維護指南範例** | `Sample-Docs/INDEX-MAINTENANCE-GUIDE.md` | 範例參考文檔 | 🟢 參考 |
| **開發記錄範例** | `Sample-Docs/DEVELOPMENT-LOG.md` | 範例參考文檔 | 🟢 參考 |
| **修復記錄範例** | `Sample-Docs/FIXLOG.md` | 範例參考文檔 | 🟢 參考 |
| **服務管理範例** | `Sample-Docs/DEVELOPMENT-SERVICE-MANAGEMENT.md` | 範例參考文檔 | 🟢 參考 |
| **前端規格範例** | `Sample-Docs/front-end-spec.md` | 範例參考文檔 | 🟢 參考 |
| **MVP 計劃範例** | `Sample-Docs/mvp-development-plan.md` | 範例參考文檔 | 🟢 參考 |
| **MVP 檢查清單範例** | `Sample-Docs/mvp-implementation-checklist.md` | 範例參考文檔 | 🟢 參考 |
| **MVP2 計劃** | `Sample-Docs/mvp2-development-plan.md` | 未來規劃參考文檔 | 🟢 參考 |
| **MVP2 檢查清單** | `Sample-Docs/mvp2-implementation-checklist.md` | 未來規劃參考文檔 | 🟢 參考 |
| **服務啟動指南** | `Sample-Docs/START-SERVICES.md` | 服務啟動參考文檔 | 🟢 參考 |
| **啟動指南** | `Sample-Docs/STARTUP-GUIDE.md` | 啟動流程參考文檔 | 🟢 參考 |
| **架構文檔範例** | `Sample-Docs/architecture.md` | 架構參考文檔 | 🟢 參考 |

### Claude 專用文檔 (claudedocs/)

> **重大更新**: 2025-11-08 完成 V2.0 流程導向重組
> **結構**: 📂 1-planning/ | 2-sprints/ | 3-progress/ | 4-changes/ | 5-status/ | 6-ai-assistant/ | 7-archive/
> **說明**: AI 助手生成的分析、規劃和實施文檔，按開發流程組織
> **完整索引**: 參見 [claudedocs/README.md](./claudedocs/README.md) 完整說明

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Claude 文檔索引** | `claudedocs/README.md` | claudedocs V2.0 完整索引與使用說明 | 🔴 極高 |

#### 📋 1. 總體規劃 (1-planning/)

> **用途**: Epic 規劃、路線圖、架構文檔、功能開發計劃
> **狀態**: Epic 9 規劃 100% 完成 | FEAT-001 開發 100% 完成

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **主路線圖** | `claudedocs/1-planning/roadmap/MASTER-ROADMAP.md` | Epic 1-10 完整路線圖（Epic 9-10 詳細規劃） | 🔴 極高 |
| **Epic 9 概覽** | `claudedocs/1-planning/epics/epic-9/epic-9-overview.md` | Epic 9 (AI Assistant) 概覽、架構、時間線、成本 | 🔴 極高 |
| **Epic 9 需求** | `claudedocs/1-planning/epics/epic-9/epic-9-requirements.md` | Epic 9 完整功能需求、驗收標準、優先級 | 🔴 極高 |
| **Epic 9 架構** | `claudedocs/1-planning/epics/epic-9/epic-9-architecture.md` | Epic 9 技術架構、核心組件、API 設計 | 🔴 極高 |
| **Epic 9 風險** | `claudedocs/1-planning/epics/epic-9/epic-9-risks.md` | Epic 9 風險矩陣、緩解措施、應變計畫 | 🔴 極高 |
| **FEAT-001 需求** | `claudedocs/1-planning/features/FEAT-001-project-fields-enhancement/01-requirements.md` | FEAT-001 專案欄位擴展功能需求 (100% 完成) | 🔴 極高 |
| **FEAT-001 架構** | `claudedocs/1-planning/features/FEAT-001-project-fields-enhancement/02-architecture.md` | FEAT-001 技術架構設計 | 🟡 高 |
| **FEAT-001 開發** | `claudedocs/1-planning/features/FEAT-001-project-fields-enhancement/03-development.md` | FEAT-001 開發指南 (Phase 1-6) | 🟡 高 |
| **FEAT-001 進度** | `claudedocs/1-planning/features/FEAT-001-project-fields-enhancement/04-progress.md` | FEAT-001 開發進度追蹤 (100% 完成) | 🟡 高 |

#### 🏃 2. Sprint 執行 (2-sprints/)

> **用途**: Sprint 計劃、任務清單、執行記錄
> **狀態**: 待 Epic 9 Sprint 1 開始

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Sprint 模板** | `claudedocs/2-sprints/templates/` | Sprint 計劃模板 | 🟡 高 |

#### 📈 3. 進度追蹤 (3-progress/)

> **用途**: 每週報告、每日日誌、里程碑記錄
> **頻率**: 每週更新
> **最新**: 2025-W50 (CHANGE-010/011 完成 - Data Import + isOngoing 增強)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **本週進度** | `claudedocs/3-progress/weekly/2025-W50.md` | 2025-W50 每週進度報告（CHANGE-010/011 Data Import + isOngoing） | 🔴 極高 |
| **W49 進度** | `claudedocs/3-progress/weekly/2025-W49.md` | 2025-W49 每週進度報告（FEAT-007 OM Expense 重構 + Bug Fixes） | 🟡 高 |
| **W48 進度** | `claudedocs/3-progress/weekly/2025-W48.md` | 2025-W48 每週進度報告（FEAT-007 Phase 1-5） | 🟢 中 |
| **上次進度摘要** | `claudedocs/3-progress/daily/2025-11/2025-11-14-progress-summary.md` | 2025-11-14 進度保存摘要（SITUATION-5 完整報告） | 🟡 高 |

#### 🔄 4. 變更記錄 (4-changes/)

> **用途**: Bug 修復、功能變更、重構記錄
> **狀態**: 包含 FIX-009 至 FIX-090+（持續更新）

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Bug 修復記錄** | `claudedocs/4-changes/bug-fixes/` | 29 個 FIX 文檔（FIX-009 至 FIX-087） | 🔴 極高 |
| **I18N 記錄** | `claudedocs/4-changes/i18n/` | 14 個 I18N 相關文檔 | 🔴 極高 |

#### 📊 5. 狀態報告 (5-status/)

> **用途**: 階段報告、測試報告、品質報告
> **狀態**: E2E 測試、I18N 完成報告

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **E2E 測試報告** | `claudedocs/5-status/testing/e2e/` | 12 個 E2E 測試文檔 | 🔴 極高 |

#### 🤖 6. AI 助手指引 (6-ai-assistant/)

> **用途**: AI 助手 Prompt 系統、Session Guides、JSDoc 遷移文檔
> **狀態**: 5 個情境 Prompt + 3 個 Session Guide + JSDoc 遷移完成

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **SITUATION-1** | `claudedocs/6-ai-assistant/prompts/SITUATION-1-PROJECT-ONBOARDING.md` | 專案入門 Prompt (5 分鐘快速理解) | 🔴 極高 |
| **SITUATION-2** | `claudedocs/6-ai-assistant/prompts/SITUATION-2-FEATURE-DEV-PREP.md` | 開發前準備 Prompt (架構驗證) | 🔴 極高 |
| **SITUATION-3** | `claudedocs/6-ai-assistant/prompts/SITUATION-3-FEATURE-ENHANCEMENT.md` | 舊功能進階 Prompt (Bug/增強) | 🔴 極高 |
| **SITUATION-4** | `claudedocs/6-ai-assistant/prompts/SITUATION-4-NEW-FEATURE-DEV.md` | 新功能開發 Prompt (系統化流程) | 🔴 極高 |
| **SITUATION-5** | `claudedocs/6-ai-assistant/prompts/SITUATION-5-SAVE-PROGRESS.md` | 保存進度 Prompt (完整 6 步驟) ⭐ | 🔴 極高 |
| **START-NEW-EPIC** | `claudedocs/6-ai-assistant/session-guides/START-NEW-EPIC.md` | 開始新 Epic 開發指引 | 🔴 極高 |
| **CONTINUE-DEVELOPMENT** | `claudedocs/6-ai-assistant/session-guides/CONTINUE-DEVELOPMENT.md` | 繼續開發工作指引 | 🔴 極高 |
| **DEBUG-ISSUES** | `claudedocs/6-ai-assistant/session-guides/DEBUG-ISSUES.md` | Debug 問題排查指引 | 🔴 極高 |
| **JSDoc 遷移索引** | `claudedocs/6-ai-assistant/jsdoc-migration/README.md` | JSDoc 遷移專案完整索引 | 🔴 極高 |
| **JSDoc 主計劃** | `claudedocs/6-ai-assistant/jsdoc-migration/JSDOC-MIGRATION-MASTER-PLAN.md` | JSDoc 遷移總體規劃（3 階段策略） | 🔴 極高 |
| **JSDoc 模板** | `claudedocs/6-ai-assistant/jsdoc-migration/JSDOC-TEMPLATES.md` | JSDoc 標準模板和最佳實踐 | 🔴 極高 |
| **JSDoc 進度報告** | `claudedocs/6-ai-assistant/jsdoc-migration/JSDOC-MIGRATION-PROGRESS.md` | JSDoc 遷移進度追蹤（156/156 完成） | 🔴 極高 |
| **JSDoc 驗證報告** | `claudedocs/6-ai-assistant/jsdoc-migration/JSDOC-ACCURACY-VALIDATION-REPORT.md` | JSDoc 準確性驗證報告（40KB，完整分析） | 🔴 極高 |
| **JSDoc 最終報告** | `claudedocs/6-ai-assistant/jsdoc-migration/JSDOC-FINAL-VERIFICATION-REPORT.md` | JSDoc 遷移最終驗證報告（100% 完成） | 🔴 極高 |

#### 📂 7. 歷史歸檔 (7-archive/)

> **用途**: 已完成階段的歷史記錄歸檔
> **狀態**: Epic 1-8、設計系統、MVP 階段已歸檔

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Epic 1-8 歸檔** | `claudedocs/7-archive/epic-1-8/` | Epic 1-8 規劃文檔歸檔 | 🟡 高 |
| **設計系統歸檔** | `claudedocs/7-archive/design-system/` | 設計系統遷移文檔歸檔 | 🟡 高 |
| **MVP 階段歸檔** | `claudedocs/7-archive/mvp-phase/` | MVP 階段文檔歸檔 | 🟡 高 |

### 文檔總覽

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **文檔總索引** | `docs/README.md` | docs/ 目錄完整導航（8 個主要類別，70+ 文檔） | 🔴 極高 |

### 歷史歸檔 (archive/)

> **說明**: 已完成階段的歷史記錄歸檔，保留完整可追溯性同時優化當前文檔大小
> **歸檔策略**: 季度歸檔（每年 1/4/7/10 月 1 日），詳見 [INDEX-MAINTENANCE-GUIDE.md](./INDEX-MAINTENANCE-GUIDE.md#📂-檔案歸檔策略)
> **當前狀態**: 目錄已創建，Epic 記錄已歸檔（2025-10-26）

| 文件名稱 | 路徑 | 說明 | 狀態 |
|---------|------|------|------|
| **Epic 記錄歸檔** | `archive/epic-records/` | 已完成 Epic 詳細開發記錄歸檔 | 📂 已歸檔 3 個文件 |
| **Epic 1 記錄** | `archive/epic-records/EPIC1-RECORD.md` | Epic 1 詳細開發記錄（認證系統） | ✅ 已歸檔 |
| **Epic 2 記錄** | `archive/epic-records/EPIC2-RECORD.md` | Epic 2 詳細開發記錄（CI/CD） | ✅ 已歸檔 |
| **認證系統摘要** | `archive/epic-records/認證系統實現摘要.md` | 認證系統實現總結（中文版） | ✅ 已歸檔 |
| **開發記錄歸檔** | `archive/development-logs/` | 季度開發記錄歸檔目錄（待季度結束） | 📂 已創建 |
| **問題修復記錄歸檔** | `archive/fix-logs/` | 季度問題修復記錄歸檔目錄（待季度結束） | 📂 已創建 |

**歸檔時機**：
- ✅ **Epic 記錄**: MVP 完成後立即歸檔（已完成 2025-10-26）
- ✅ **季度記錄**: 每季度末（2026-01-01 將歸檔 2025-Q4 記錄）
- ✅ **大小觸發**: DEVELOPMENT-LOG.md 超過 5,000 行，FIXLOG.md 超過 2,000 行時

**預期效果**：
- Token 使用減少 80-85%
- AI 助手載入速度提升 5-10 倍
- 保留 100% 歷史可追溯性

---

## 3. 核心代碼

### 前端應用 (apps/web)

#### Next.js 配置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Next.js 配置** | `apps/web/next.config.mjs` | Next.js 應用配置 | 🔴 極高 |
| **認證配置** | `apps/web/src/auth.config.ts` | NextAuth.js 認證配置（providers, callbacks） | 🔴 極高 |
| **Playwright 配置** | `apps/web/playwright.config.ts` | Playwright E2E 測試配置 | 🟡 高 |
| **Tailwind 配置** | `apps/web/tailwind.config.ts` | Tailwind CSS 配置 | 🟡 高 |
| **PostCSS 配置** | `apps/web/postcss.config.js` | PostCSS 處理配置 | 🟡 高 |
| **TypeScript 配置** | `apps/web/tsconfig.json` | TypeScript 編譯配置 | 🟡 高 |
| **Package 配置** | `apps/web/package.json` | 前端應用依賴配置 | 🟡 高 |

#### App Router 頁面

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **根布局** | `apps/web/src/app/layout.tsx` | 應用程式根布局 | 🔴 極高 |
| **首頁** | `apps/web/src/app/page.tsx` | 應用程式首頁 | 🔴 極高 |
| **Locale 布局** | `apps/web/src/app/[locale]/layout.tsx` | 國際化布局（Next-intl 整合） | 🔴 極高 |
| **Locale 首頁** | `apps/web/src/app/[locale]/page.tsx` | 國際化首頁重定向 | 🟡 高 |
| **Dashboard 頁面** | `apps/web/src/app/[locale]/dashboard/page.tsx` | Dashboard 主頁面（使用新設計系統） | 🔴 極高 |
| **Login 頁面** | `apps/web/src/app/[locale]/login/page.tsx` | 登入頁面 | 🔴 極高 |
| **全局樣式** | `apps/web/src/app/globals.css` | 全局 CSS 樣式（含 CSS 變數） | 🟡 高 |
| **Budget Pool 列表** | `apps/web/src/app/[locale]/budget-pools/page.tsx` | 預算池列表頁面 | 🔴 極高 |
| **Budget Pool 詳情** | `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx` | 預算池詳情頁面 | 🟡 高 |
| **Budget Pool 編輯** | `apps/web/src/app/[locale]/budget-pools/[id]/edit/page.tsx` | 預算池編輯頁面 | 🟡 高 |
| **Budget Pool 新增** | `apps/web/src/app/[locale]/budget-pools/new/page.tsx` | 預算池新增頁面 | 🟡 高 |
| **Project 列表** | `apps/web/src/app/[locale]/projects/page.tsx` | 專案列表頁面 | 🔴 極高 |
| **Project 詳情** | `apps/web/src/app/[locale]/projects/[id]/page.tsx` | 專案詳情頁面 | 🟡 高 |
| **Project 編輯** | `apps/web/src/app/[locale]/projects/[id]/edit/page.tsx` | 專案編輯頁面 | 🟡 高 |
| **Project 新增** | `apps/web/src/app/[locale]/projects/new/page.tsx` | 專案新增頁面 | 🟡 高 |
| **User 列表** | `apps/web/src/app/[locale]/users/page.tsx` | 使用者列表頁面 | 🔴 極高 |
| **User 詳情** | `apps/web/src/app/[locale]/users/[id]/page.tsx` | 使用者詳情頁面 | 🟡 高 |
| **User 編輯** | `apps/web/src/app/[locale]/users/[id]/edit/page.tsx` | 使用者編輯頁面 | 🟡 高 |
| **User 新增** | `apps/web/src/app/[locale]/users/new/page.tsx` | 使用者新增頁面 | 🟡 高 |
| **BudgetProposal 列表** | `apps/web/src/app/[locale]/proposals/page.tsx` | 預算提案列表頁面 | 🔴 極高 |
| **BudgetProposal 詳情** | `apps/web/src/app/[locale]/proposals/[id]/page.tsx` | 預算提案詳情頁面 | 🟡 高 |
| **BudgetProposal 編輯** | `apps/web/src/app/[locale]/proposals/[id]/edit/page.tsx` | 預算提案編輯頁面 | 🟡 高 |
| **BudgetProposal 新增** | `apps/web/src/app/[locale]/proposals/new/page.tsx` | 預算提案新增頁面 | 🟡 高 |
| **PM Dashboard** | `apps/web/src/app/[locale]/dashboard/pm/page.tsx` | 專案經理儀表板頁面 | 🔴 極高 |
| **Supervisor Dashboard** | `apps/web/src/app/[locale]/dashboard/supervisor/page.tsx` | 主管儀表板頁面 | 🔴 極高 |
| **Notifications 頁面** | `apps/web/src/app/[locale]/notifications/page.tsx` | 通知中心完整列表頁面（Epic 8） | 🔴 極高 |
| **Quotes 頁面** | `apps/web/src/app/[locale]/quotes/page.tsx` | 報價單列表頁面（卡片/列表視圖切換）| 🔴 極高 |
| **Quotes 新增** | `apps/web/src/app/[locale]/quotes/new/page.tsx` | 報價單新增頁面 | 🟡 高 |
| **Quotes 編輯** | `apps/web/src/app/[locale]/quotes/[id]/edit/page.tsx` | 報價單編輯頁面 | 🟡 高 |
| **Project Quotes** | `apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx` | 專案報價單頁面 | 🟡 高 |
| **Settings 頁面** | `apps/web/src/app/[locale]/settings/page.tsx` | 系統設定頁面（個人資料、通知、偏好、安全） | 🔴 極高 |
| **ChargeOut 列表** | `apps/web/src/app/[locale]/charge-outs/page.tsx` | ChargeOut 費用轉嫁列表頁面（卡片式展示 + 三級過濾器） | 🔴 極高 |
| **ChargeOut 詳情** | `apps/web/src/app/[locale]/charge-outs/[id]/page.tsx` | ChargeOut 詳情頁面（三欄佈局 + 費用明細表格） | 🟡 高 |
| **ChargeOut 編輯** | `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx` | ChargeOut 編輯頁面（僅 Draft 狀態可編輯） | 🟡 高 |
| **ChargeOut 新增** | `apps/web/src/app/[locale]/charge-outs/new/page.tsx` | ChargeOut 新增頁面 | 🟡 高 |
| **OMExpense 列表** | `apps/web/src/app/[locale]/om-expenses/page.tsx` | OM 費用列表頁面（FEAT-007 重構） | 🔴 極高 |
| **OMExpense 詳情** | `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` | OM 費用詳情頁面（表頭-明細架構） | 🟡 高 |
| **OMExpense 編輯** | `apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx` | OM 費用編輯頁面 | 🟡 高 |
| **OMExpense 新增** | `apps/web/src/app/[locale]/om-expenses/new/page.tsx` | OM 費用新增頁面 | 🟡 高 |
| **OMExpenseCategory 列表** | `apps/web/src/app/[locale]/om-expense-categories/page.tsx` | OM 費用類別列表頁面（FEAT-007） | 🟡 高 |
| **OMExpenseCategory 詳情** | `apps/web/src/app/[locale]/om-expense-categories/[id]/page.tsx` | OM 費用類別詳情頁面 | 🟡 高 |
| **OMExpenseCategory 編輯** | `apps/web/src/app/[locale]/om-expense-categories/[id]/edit/page.tsx` | OM 費用類別編輯頁面 | 🟡 高 |
| **OMExpenseCategory 新增** | `apps/web/src/app/[locale]/om-expense-categories/new/page.tsx` | OM 費用類別新增頁面 | 🟡 高 |
| **OM Summary** | `apps/web/src/app/[locale]/om-summary/page.tsx` | OM Summary 報表頁面（CHANGE-004 三層階層顯示） | 🔴 極高 |
| **Data Import** | `apps/web/src/app/[locale]/data-import/page.tsx` | 資料導入頁面（FEAT-008 Excel/JSON 導入支援） | 🔴 極高 |
| **Operating Companies 列表** | `apps/web/src/app/[locale]/operating-companies/page.tsx` | 營運公司列表頁面 | 🟡 高 |
| **Operating Companies 詳情** | `apps/web/src/app/[locale]/operating-companies/[id]/page.tsx` | 營運公司詳情頁面 | 🟡 高 |
| **Operating Companies 編輯** | `apps/web/src/app/[locale]/operating-companies/[id]/edit/page.tsx` | 營運公司編輯頁面 | 🟡 高 |
| **Operating Companies 新增** | `apps/web/src/app/[locale]/operating-companies/new/page.tsx` | 營運公司新增頁面 | 🟡 高 |
| **Project Summary** | `apps/web/src/app/[locale]/projects/[id]/summary/page.tsx` | 專案 Summary 頁面（FEAT-006） | 🟡 高 |
| **Expenses 列表** | `apps/web/src/app/[locale]/expenses/page.tsx` | 費用列表頁面 | 🟡 高 |
| **Expenses 詳情** | `apps/web/src/app/[locale]/expenses/[id]/page.tsx` | 費用詳情頁面 | 🟡 高 |
| **Expenses 編輯** | `apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx` | 費用編輯頁面 | 🟡 高 |
| **Expenses 新增** | `apps/web/src/app/[locale]/expenses/new/page.tsx` | 費用新增頁面 | 🟡 高 |
| **Vendors 列表** | `apps/web/src/app/[locale]/vendors/page.tsx` | 供應商列表頁面 | 🟡 高 |
| **Vendors 詳情** | `apps/web/src/app/[locale]/vendors/[id]/page.tsx` | 供應商詳情頁面 | 🟡 高 |
| **Vendors 編輯** | `apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx` | 供應商編輯頁面 | 🟡 高 |
| **Vendors 新增** | `apps/web/src/app/[locale]/vendors/new/page.tsx` | 供應商新增頁面 | 🟡 高 |
| **PurchaseOrders 列表** | `apps/web/src/app/[locale]/purchase-orders/page.tsx` | 採購單列表頁面 | 🟡 高 |
| **PurchaseOrders 詳情** | `apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx` | 採購單詳情頁面 | 🟡 高 |
| **PurchaseOrders 編輯** | `apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx` | 採購單編輯頁面 | 🟡 高 |
| **PurchaseOrders 新增** | `apps/web/src/app/[locale]/purchase-orders/new/page.tsx` | 採購單新增頁面 | 🟡 高 |
| **Register 頁面** | `apps/web/src/app/[locale]/register/page.tsx` | 註冊頁面 | 🟡 高 |
| **Forgot Password 頁面** | `apps/web/src/app/[locale]/forgot-password/page.tsx` | 忘記密碼頁面 | 🟡 高 |
| **Settings Currencies** | `apps/web/src/app/[locale]/settings/currencies/page.tsx` | 幣別管理頁面 | 🟡 高 |

#### API 路由

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **tRPC Route Handler** | `apps/web/src/app/api/trpc/[trpc]/route.ts` | tRPC API 路由處理器 | 🔴 極高 |
| **NextAuth API** | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth 認證 API 路由處理器 | 🔴 極高 |
| **Register API** | `apps/web/src/app/api/auth/register/route.ts` | 用戶註冊 API 路由 | 🟡 高 |
| **Admin Seed API** | `apps/web/src/app/api/admin/seed/route.ts` | 管理員種子數據 API（開發/測試環境） | 🟡 高 |
| **Quote Upload API** | `apps/web/src/app/api/upload/quote/route.ts` | 報價單文件上傳 API（含業務驗證、自動建立記錄）| 🟡 高 |
| **Proposal Upload API** | `apps/web/src/app/api/upload/proposal/route.ts` | 提案文件上傳 API | 🟡 高 |
| **Invoice Upload API** | `apps/web/src/app/api/upload/invoice/route.ts` | 發票文件上傳 API | 🟡 高 |

#### 中間件

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **認證中間件** | `apps/web/src/middleware.ts` | Next.js 認證中間件，保護所有受保護路由 | 🔴 極高 |
| **TypeScript 環境** | `apps/web/next-env.d.ts` | Next.js TypeScript 類型定義（自動生成） | 🟡 高 |

#### UI 元件庫（shadcn/ui 風格）

**P1 核心元件 (Phase 2 完成):**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Button 元件** | `apps/web/src/components/ui/button.tsx` | 按鈕元件（使用 CVA，6 種變體） | 🟡 高 |
| **Input 元件** | `apps/web/src/components/ui/input.tsx` | 輸入框元件（新設計系統） | 🟡 高 |
| **Label 元件** | `apps/web/src/components/ui/label.tsx` | 表單標籤元件 | 🟡 高 |
| **Badge 元件** | `apps/web/src/components/ui/badge.tsx` | 徽章元件（8 種狀態變體） | 🟡 高 |
| **Card 元件** | `apps/web/src/components/ui/card.tsx` | 卡片複合元件 (CardHeader, CardTitle, CardContent, CardFooter) | 🟡 高 |
| **Avatar 元件** | `apps/web/src/components/ui/avatar.tsx` | 頭像元件 (Avatar, AvatarImage, AvatarFallback) | 🟡 高 |
| **Separator 元件** | `apps/web/src/components/ui/separator.tsx` | 分隔線元件（水平/垂直） | 🟡 高 |

**P2 表單元件 (Phase 2 完成):**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Textarea 元件** | `apps/web/src/components/ui/textarea.tsx` | 多行文本輸入元件 | 🟡 高 |
| **Select 元件** | `apps/web/src/components/ui/select.tsx` | 下拉選單複合元件（新設計系統） | 🟡 高 |
| **Checkbox 元件** | `apps/web/src/components/ui/checkbox.tsx` | 複選框元件（支援不確定狀態） | 🟡 高 |
| **RadioGroup 元件** | `apps/web/src/components/ui/radio-group.tsx` | 單選按鈕組元件 | 🟡 高 |
| **Switch 元件** | `apps/web/src/components/ui/switch.tsx` | 開關切換元件 | 🟡 高 |
| **Slider 元件** | `apps/web/src/components/ui/slider.tsx` | 滑桿元件 | 🟡 高 |
| **Form 元件** | `apps/web/src/components/ui/form.tsx` | 表單管理元件（react-hook-form + zod 整合） | 🟡 高 |

**P3 浮層元件 (Phase 2 完成):**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Dialog 元件** | `apps/web/src/components/ui/dialog.tsx` | 對話框/模態框元件 | 🟡 高 |
| **DropdownMenu 元件** | `apps/web/src/components/ui/dropdown-menu.tsx` | 下拉選單元件 | 🟡 高 |
| **Popover 元件** | `apps/web/src/components/ui/popover.tsx` | 彈出框元件 | 🟡 高 |
| **Tooltip 元件** | `apps/web/src/components/ui/tooltip.tsx` | 提示框元件（含 Provider） | 🟡 高 |
| **Sheet 元件** | `apps/web/src/components/ui/sheet.tsx` | 側邊抽屜元件（4 個方向） | 🟡 高 |
| **AlertDialog 元件** | `apps/web/src/components/ui/alert-dialog.tsx` | 警告對話框元件 | 🟡 高 |
| **ContextMenu 元件** | `apps/web/src/components/ui/context-menu.tsx` | 右鍵選單元件 | 🟡 高 |

**P4 回饋元件 (Phase 2 完成):**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Alert 元件** | `apps/web/src/components/ui/alert.tsx` | 警告提示元件（4 種變體 + 圖標） | 🟡 高 |
| **use-toast Hook** | `apps/web/src/components/ui/use-toast.tsx` | Toast 通知狀態管理 Hook | 🟡 高 |
| **Toaster 元件** | `apps/web/src/components/ui/toaster.tsx` | Toast 通知渲染器 | 🟡 高 |
| **Progress 元件** | `apps/web/src/components/ui/progress.tsx` | 進度條元件 | 🟡 高 |
| **Skeleton 元件** | `apps/web/src/components/ui/skeleton.tsx` | 骨架屏載入元件（多種預設樣式） | 🟡 高 |

**P5 進階元件 (Phase 2 完成):**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Tabs 元件** | `apps/web/src/components/ui/tabs.tsx` | 選項卡元件 (Tabs, TabsList, TabsTrigger, TabsContent) | 🟡 高 |
| **Table 元件** | `apps/web/src/components/ui/table.tsx` | 表格複合元件 | 🟡 高 |
| **Breadcrumb 元件** | `apps/web/src/components/ui/breadcrumb.tsx` | 麵包屑導航元件 | 🟡 高 |
| **Pagination 元件** | `apps/web/src/components/ui/pagination.tsx` | 分頁元件 | 🟡 高 |
| **Accordion 元件** | `apps/web/src/components/ui/accordion.tsx` | 折疊面板元件（單選/多選模式） | 🟡 高 |

**其他元件:**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Toast 元件** | `apps/web/src/components/ui/Toast.tsx` | 提示訊息元件（舊版） | 🟡 高 |
| **LoadingSkeleton** | `apps/web/src/components/ui/LoadingSkeleton.tsx` | 載入骨架元件（舊版） | 🟡 高 |
| **元件索引** | `apps/web/src/components/ui/index.ts` | 元件統一導出 | 🟡 高 |
| **UI 元件 README** | `apps/web/src/components/ui/README.md` | UI 元件庫使用說明 | 🟢 中 |

#### 佈局元件（2025-11-08 更新）

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Dashboard Layout** | `apps/web/src/components/layout/dashboard-layout.tsx` | Dashboard 主佈局元件（響應式設計 + 主題適配） | 🔴 極高 |
| **Sidebar** | `apps/web/src/components/layout/Sidebar.tsx` | 側邊欄導航元件（主題適配 + Source 風格） | 🔴 極高 |
| **TopBar** | `apps/web/src/components/layout/TopBar.tsx` | 頂部工具欄元件（主題切換器 + 語言切換器 + 通知中心 + 用戶選單） | 🔴 極高 |
| **LanguageSwitcher** | `apps/web/src/components/layout/LanguageSwitcher.tsx` | 語言切換器組件（繁中/英文切換 + FIX-085） | 🔴 極高 |

#### 主題元件（Phase 4 新增）

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **ThemeToggle** | `apps/web/src/components/theme/ThemeToggle.tsx` | 主題切換組件（Light/Dark/System 模式） | 🔴 極高 |

#### 業務元件

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **StatsCard** | `apps/web/src/components/dashboard/StatsCard.tsx` | Dashboard 統計卡片元件（支援趨勢指標） | 🟡 高 |
| **StatCard** | `apps/web/src/components/dashboard/StatCard.tsx` | 可復用統計卡片元件（Epic 7） | 🟡 高 |
| **BudgetPoolOverview** | `apps/web/src/components/dashboard/BudgetPoolOverview.tsx` | 預算池財務概覽元件（Epic 7） | 🟡 高 |
| **Budget Pool 表單** | `apps/web/src/components/budget-pool/BudgetPoolForm.tsx` | 預算池表單元件（支持 categories CRUD） | 🔴 極高 |
| **Category 表單行** | `apps/web/src/components/budget-pool/CategoryFormRow.tsx` | 預算類別輸入行元件 (Phase A) | 🟡 高 |
| **Budget Pool 過濾器** | `apps/web/src/components/budget-pool/BudgetPoolFilters.tsx` | 預算池篩選器元件 | 🟡 高 |
| **Project 表單** | `apps/web/src/components/project/ProjectForm.tsx` | 專案表單元件 | 🟡 高 |
| **User 表單** | `apps/web/src/components/user/UserForm.tsx` | 使用者表單元件 | 🟡 高 |
| **ChargeOut 表單** | `apps/web/src/components/charge-out/ChargeOutForm.tsx` | ChargeOut 表單元件（表頭-明細設計 + 動態費用列表）| 🔴 極高 |
| **ChargeOut 操作** | `apps/web/src/components/charge-out/ChargeOutActions.tsx` | ChargeOut 狀態機操作元件（submit/confirm/reject/markAsPaid/delete）| 🔴 極高 |
| **BudgetProposal 表單** | `apps/web/src/components/proposal/BudgetProposalForm.tsx` | 預算提案表單元件 | 🟡 高 |
| **ProposalActions** | `apps/web/src/components/proposal/ProposalActions.tsx` | 提案審批操作元件 | 🔴 極高 |
| **CommentSection** | `apps/web/src/components/proposal/CommentSection.tsx` | 提案評論元件 | 🟡 高 |
| **NotificationBell** | `apps/web/src/components/notification/NotificationBell.tsx` | 通知鈴鐺圖標元件（Epic 8） | 🟡 高 |
| **NotificationDropdown** | `apps/web/src/components/notification/NotificationDropdown.tsx` | 通知下拉選單元件（Epic 8） | 🟡 高 |
| **Notification 元件索引** | `apps/web/src/components/notification/index.ts` | 通知元件統一導出（Epic 8） | 🟢 中 |
| **CurrencyDisplay** | `apps/web/src/components/shared/CurrencyDisplay.tsx` | 貨幣格式化顯示組件（支援繼承、符號、代碼）（FEAT-002） | 🟡 高 |
| **CurrencySelect** | `apps/web/src/components/shared/CurrencySelect.tsx` | 貨幣選擇下拉組件（原生 select，載入啟用貨幣）（FEAT-002） | 🟡 高 |
| **QuoteUploadForm** | `apps/web/src/components/quote/QuoteUploadForm.tsx` | 報價單上傳表單組件（文件類型驗證、自動刷新）（Epic 5） | 🟡 高 |

#### Hooks 與工具

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **useTheme Hook** | `apps/web/src/hooks/use-theme.ts` | 主題切換 Hook (Light/Dark/System) | 🔴 極高 |
| **useDebounce Hook** | `apps/web/src/hooks/useDebounce.ts` | 防抖 Hook | 🟡 高 |
| **工具函數** | `apps/web/src/lib/utils.ts` | cn() 函數和其他工具函數（className 合併） | 🔴 極高 |
| **tRPC Client** | `apps/web/src/lib/trpc.ts` | tRPC 客戶端配置 | 🔴 極高 |
| **tRPC Provider** | `apps/web/src/lib/trpc-provider.tsx` | tRPC React Provider | 🔴 極高 |
| **導出工具** | `apps/web/src/lib/exportUtils.ts` | 數據導出工具函數 | 🟢 中 |
| **Session Provider** | `apps/web/src/components/providers/SessionProvider.tsx` | NextAuth Session Provider | 🟡 高 |

### API 層 (packages/api)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **tRPC 初始化** | `packages/api/src/trpc.ts` | tRPC 服務端配置 | 🔴 極高 |
| **根路由** | `packages/api/src/root.ts` | tRPC 根路由定義 | 🔴 極高 |
| **主入口** | `packages/api/src/index.ts` | API 套件主入口 | 🔴 極高 |
| **Budget Pool 路由** | `packages/api/src/routers/budgetPool.ts` | 預算池 API 路由 | 🔴 極高 |
| **Project 路由** | `packages/api/src/routers/project.ts` | 專案管理 API 路由 | 🔴 極高 |
| **User 路由** | `packages/api/src/routers/user.ts` | 使用者管理 API 路由 | 🔴 極高 |
| **BudgetProposal 路由** | `packages/api/src/routers/budgetProposal.ts` | 預算提案審批 API 路由 | 🔴 極高 |
| **Dashboard 路由** | `packages/api/src/routers/dashboard.ts` | 儀表板數據聚合 API 路由（PM/Supervisor） | 🔴 極高 |
| **Notification 路由** | `packages/api/src/routers/notification.ts` | 通知系統 API 路由（Epic 8） | 🔴 極高 |
| **ChargeOut 路由** | `packages/api/src/routers/chargeOut.ts` | ChargeOut 費用轉嫁 API 路由（完整狀態機 + 權限控制）| 🔴 極高 |
| **OMExpense 路由** | `packages/api/src/routers/omExpense.ts` | OM 費用 API 路由（FEAT-007 重構：表頭-明細架構）| 🔴 極高 |
| **ExpenseCategory 路由** | `packages/api/src/routers/expenseCategory.ts` | 費用類別管理 API 路由（FEAT-007）| 🔴 極高 |
| **Vendor 路由** | `packages/api/src/routers/vendor.ts` | 供應商管理 API 路由（Epic 5） | 🟡 高 |
| **Quote 路由** | `packages/api/src/routers/quote.ts` | 報價單管理 API 路由（Epic 5） | 🟡 高 |
| **PurchaseOrder 路由** | `packages/api/src/routers/purchaseOrder.ts` | 採購單管理 API 路由（Epic 5） | 🟡 高 |
| **Expense 路由** | `packages/api/src/routers/expense.ts` | 費用管理 API 路由（Epic 6） | 🟡 高 |
| **Currency 路由** | `packages/api/src/routers/currency.ts` | 幣別管理 API 路由（FEAT-002） | 🟡 高 |
| **OperatingCompany 路由** | `packages/api/src/routers/operatingCompany.ts` | 營運公司管理 API 路由 | 🟡 高 |
| **EmailService 服務** | `packages/api/src/lib/email.ts` | 郵件發送服務模組（Epic 8） | 🔴 極高 |
| **健康檢查路由** | `packages/api/src/routers/health.ts` | 健康檢查 API（含 schemaCompare, fixAllSchemaIssues） | 🟡 高 |
| **Package 配置** | `packages/api/package.json` | API 套件依賴配置 | 🟡 高 |
| **TypeScript 配置** | `packages/api/tsconfig.json` | API TypeScript 配置 | 🟡 高 |

### 資料庫 (packages/db)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Prisma Schema** | `packages/db/prisma/schema.prisma` | 資料庫模型定義 | 🔴 極高 |
| **資料庫客戶端** | `packages/db/src/index.ts` | Prisma Client 導出 | 🔴 極高 |
| **Package 配置** | `packages/db/package.json` | 資料庫套件配置 | 🟡 高 |
| **TypeScript 配置** | `packages/db/tsconfig.json` | 資料庫 TypeScript 配置 | 🟡 高 |

### 認證 (packages/auth)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **認證配置** | `packages/auth/src/index.ts` | Azure AD B2C 認證配置 | 🔴 極高 |
| **Package 配置** | `packages/auth/package.json` | 認證套件配置 | 🟡 高 |
| **TypeScript 配置** | `packages/auth/tsconfig.json` | 認證 TypeScript 配置 | 🟡 高 |

### 共享配置 (packages/)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **基礎 TS 配置** | `packages/tsconfig/base.json` | 共享基礎 TypeScript 配置 | 🟡 高 |
| **Next.js TS 配置** | `packages/tsconfig/nextjs.json` | Next.js TypeScript 配置 | 🟡 高 |
| **React Library 配置** | `packages/tsconfig/react-library.json` | React 函式庫 TS 配置 | 🟡 高 |
| **TSConfig Package** | `packages/tsconfig/package.json` | TypeScript 配置套件 | 🟢 中 |

---

## 4. 配置文件

### 根目錄配置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **根 Package.json** | `package.json` | Monorepo 根依賴與腳本 | 🔴 極高 |
| **Turborepo 配置** | `turbo.json` | Turborepo 建置配置 | 🔴 極高 |
| **pnpm Workspace** | `pnpm-workspace.yaml` | pnpm 工作區配置 | 🔴 極高 |
| **根 TypeScript** | `tsconfig.json` | 根 TypeScript 配置 | 🟡 高 |
| **環境變數範本** | `.env.example` | 環境變數配置範例 | 🔴 極高 |
| **Docker Compose** | `docker-compose.yml` | Docker 容器編排配置 | 🟡 高 |

### 代碼品質

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **ESLint 配置** | `.eslintrc.json` | ESLint 規則配置 | 🟡 高 |
| **設計系統 ESLint** | `.eslintrc.design-system.js` | 設計系統專用 ESLint 規則 | 🟢 中 |
| **Prettier 配置** | `.prettierrc.json` | Prettier 格式化配置 | 🟡 高 |
| **Prettier Ignore** | `.prettierignore` | Prettier 忽略規則 | 🟢 中 |
| **EditorConfig** | `.editorconfig` | 編輯器配置 | 🟢 中 |

### Git 配置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Git Ignore** | `.gitignore` | Git 忽略規則 | 🟡 高 |
| **Docker Ignore** | `.dockerignore` | Docker 忽略規則 | 🟢 中 |

### IDE 配置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **VS Code 設定** | `.vscode/settings.json` | VS Code 編輯器設定 | 🟢 中 |
| **VS Code 擴充** | `.vscode/extensions.json` | 推薦的 VS Code 擴充 | 🟢 中 |

---

## 5. 開發工具

### 腳本

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **資料庫初始化** | `scripts/init-db.sql` | PostgreSQL 初始化腳本 | 🟡 高 |
| **環境檢查腳本** | `scripts/check-environment.js` | 開發環境配置檢查工具（404 行，15+ 檢查項目） | 🔴 極高 |
| **索引同步檢查** | `scripts/check-index-sync.js` | 索引完整性檢查工具（v1.1.0） | 🟡 高 |
| **I18N 驗證腳本** | `scripts/validate-i18n.js` | 國際化翻譯 Key 驗證工具（重複 Key、缺失 Key 檢測） | 🟡 高 |
| **數據庫種子** | `packages/db/prisma/seed.ts` | 數據庫種子數據腳本 | 🟡 高 |

### 報告與日誌

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **索引同步報告** | `index-sync-report.json` | 索引同步檢查報告（自動生成） | 🟢 中 |
| **MVP 進度報告** | `mvp-progress-report.json` | MVP 進度跟踪報告（自動生成） | 🟢 中 |

---

## 6. CI/CD

### GitHub Actions

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Bug 報告範本** | `.github/ISSUE_TEMPLATE/bug_report.yml` | GitHub Issue 範本 - Bug | 🟢 中 |
| **功能請求範本** | `.github/ISSUE_TEMPLATE/feature_request.yml` | GitHub Issue 範本 - 功能 | 🟢 中 |
| **Issue 配置** | `.github/ISSUE_TEMPLATE/config.yml` | Issue 範本配置 | 🟢 中 |
| **PR 範本** | `.github/pull_request_template.md` | Pull Request 範本 | 🟢 中 |

---

## 📊 索引統計

**文件總數**: 360+ 個重要文件（完整索引，已驗證 - 2025-12-08 更新）
**專案總文件**: 410+ 個文件（包含 Azure 部署腳本、Sample-Docs 和 claudedocs）
**Azure 部署文件**: 43+ 個文件（4 層架構：執行層、文檔層、記錄層、AI 助手指引）
**核心項目文件**: ~90 個（不含範例和第三方框架）
**docs/ 文檔**: 70+ 文檔，按 8 個功能類別組織
**索引策略**: 兩層索引（L1: PROJECT-INDEX.md 核心文件 + L2: 子目錄 README.md 完整列表）
**新增 README**: 7 個導航索引文件（docs/README.md + 6 個子目錄索引）
**核心文件索引**: 21 個 docs/ 核心文件直接索引於 PROJECT-INDEX.md
**最後更新**: 2025-12-08
**維護者**: AI 助手 + 開發團隊

**當前專案狀態**（2025-12-08）:
- 🎉 **MVP 100% 完成**: 所有 8 個 Epic 全部實現！
- ✅ **Epic 1-8 完成**: 認證、CI/CD、專案管理、提案審批、採購、費用、儀表板、通知系統
- 🌟 **設計系統遷移完成**: Phase 2-4 全部完成 (29 個頁面 + 15+ 新 UI 組件)
- 🔧 **環境優化完成**: 跨平台設置指引 + 自動化環境檢查
- 📚 **文檔重組完成**: Method C 深度整理，docs/ 按功能完整分類
- ✨ **JSDoc 遷移完成**: 156/156 頁面組件 100% JSDoc 文檔化 + 所有後續改進完成
- 🚀 **Azure 部署架構完成**: 完整的 4 層部署系統 (43+ 文件，6 個自動化腳本，4 個 AI 助手指引)
- 🆕 **FEAT-007 完成**: OM Expense 表頭-明細架構重構（OMExpenseItem 新增、6 個 API procedures）
- 🆕 **CHANGE-004 完成**: OM Summary 表頭-明細階層顯示（按 OpCo → OMExpense → Item 分層展示）
- 📈 **累計代碼**: ~35,000+ 行核心代碼 + 11,153 行 Azure 部署相關代碼
- 🎯 **下一階段**: Epic 9 (AI 助理) 或 Epic 10 (外部系統整合)
- 💼 **開發階段**: Post-MVP 增強階段 - FEAT-007/CHANGE-004 功能重構完成

**本次更新變更**（2025-12-08 - 索引維護機制完整更新）:
- ✅ **索引維護腳本更新 (v1.2.0)**:
  - 新增 claudedocs 細粒度文件排除邏輯（150+ 個模式規則）
  - 新增組件 barrel export (index.ts) 排除
  - 新增子目錄 CLAUDE.md 排除（已作為類別記錄）
  - 修復 Windows/Unix 路徑分隔符兼容問題
  - 建議數從 159 → 0（100% 修復）
- ✅ **PROJECT-INDEX.md 新增索引項目**:
  - 新增 `apps/web/src/auth.config.ts`（認證配置）
  - 新增 `apps/web/playwright.config.ts`（E2E 測試配置）
  - 新增 `apps/web/src/app/[locale]/layout.tsx`、`page.tsx`（國際化布局）
  - 新增 API 路由：register, admin/seed, proposal upload
  - 新增 Azure 文檔：部署計劃、故障排查、Helper README
  - 新增 Quotes 相關頁面：新增、編輯、專案報價單
  - 新增 `.claude.md`、`AZURE-RESOURCES-INVENTORY.md`
- ✅ **腳本目錄更新**:
  - 新增 `check-environment.js`（環境檢查）
  - 新增 `validate-i18n.js`（I18N 驗證）

**歷史更新**（2025-12-08 - FEAT-007 + CHANGE-004 功能重構完成）:
- ✅ **FEAT-007 OM Expense 表頭-明細架構重構**:
  - 📦 **新增 Prisma 模型**: OMExpenseItem（支援多明細項目）、ExpenseCategory（費用類別）
  - 🔌 **新增 API Router**: expenseCategory.ts（完整 CRUD）
  - 🔧 **OMExpense Router 增強**: 新增 6 個 procedures（createWithItems, addItem, updateItem, removeItem, reorderItems, updateItemMonthlyRecords）
  - 🎨 **新增前端組件**: OMExpenseItemForm, OMExpenseItemList, OMExpenseItemMonthlyGrid
  - 🔄 **支援拖曳排序**: @dnd-kit 整合
- ✅ **CHANGE-004 OM Summary 表頭-明細階層顯示**:
  - 📊 **三層階層結構**: OpCo → OMExpense → Item
  - 🎨 **摺疊展開功能**: 可視化層級關係
  - 💰 **匯總計算**: 各層級金額自動匯總
- ✅ **API 層更新**:
  - API Routers 從 8 個增加到 16 個
  - 新增完整的 OM Expense、Vendor、Quote、PurchaseOrder、Currency、OperatingCompany routers
  - Health API 新增 schemaCompare, fixAllSchemaIssues 診斷工具
- ✅ **Prisma Models 更新**:
  - 模型數量從 24 個增加到 27 個
  - 新增: OMExpenseItem, ExpenseCategory, ProjectChargeOutOpCo
- ✅ **核心文檔同步更新**:
  - 更新所有 CLAUDE.md 文件（16 個目錄級文檔）
  - 更新 AI-ASSISTANT-GUIDE.md, INDEX-MAINTENANCE-GUIDE.md
  - 新增 scripts/CLAUDE.md, claudedocs/CLAUDE.md

**歷史更新**（2025-11-24 21:30 - Azure 部署架構重組 + 核心文檔同步更新）:
- ✅ **Azure 部署文件完整索引** (新增「Azure 部署與運維」章節):
  - 📂 **執行層**: 20+ 個文件（部署腳本、環境配置、IaC 模板、測試腳本）
  - 📚 **文檔層**: 8 個文件（完整部署指南、故障排查、環境變數對照表）
  - 📋 **記錄層**: 8 個文件（部署歷史記錄、問題分析、根因診斷）
  - 🤖 **AI 助手指引**: 4 個文件（SITUATION-6 到 SITUATION-9，場景化部署和排查指引）
  - 🐳 **Docker 配置**: Dockerfile、GitHub Actions 範例（CI/CD 自動化）
- ✅ **核心文檔同步更新**:
  - 更新 `AI-ASSISTANT-GUIDE.md`: 新增 Azure 部署最近更新章節（~75行）、更新重要文件索引
  - 更新 `INDEX-MAINTENANCE-GUIDE.md`: 新增 Azure 部署文件維護專項章節（~102行）、4 層架構維護策略
  - 更新 `PROJECT-INDEX.md`: 新增完整 Azure 部署文件索引（43+ 文件），按 4 層架構組織

**歷史更新**（2025-10-15 22:50）:
- ✅ 佈局組件改造：Sidebar 和 TopBar 改造為 Source 項目風格
- ✅ Sidebar 新功能：用戶資訊卡片、底部導航、功能描述 tooltip
- ✅ TopBar 新功能：完整通知中心、增強用戶選單、本地通知管理
- ✅ 視覺優化：shadow 效果、更好的間距、過渡動畫
- ✅ 索引維護：執行完整同步檢查，0 個嚴重問題，154 個改進建議

**歷史更新**（2025-10-15 11:35）:
- ✅ Phase 2 完成：設計系統遷移 - 新增 18 個 UI 組件
- ✅ 組件分類：按 P1-P5 優先級重新組織 UI 組件索引
- ✅ 文檔更新：新增 `DESIGN-SYSTEM-MIGRATION-PROGRESS.md` v4.0

**核心文件統計**:
- Next.js 頁面: 55+ 個（19 個路由模組，完整 CRUD + OM Summary + Operating Companies）
- API 路由: 16 個 (budgetPool, budgetProposal, chargeOut, currency, dashboard, expense, expenseCategory, notification, omExpense, operatingCompany, project, purchaseOrder, quote, seed, user, vendor, health)
- Prisma Models: 27 個（含 OMExpenseItem, ExpenseCategory, ProjectChargeOutOpCo）
- UI 組件: 71 個（35 個設計系統組件 + 36 個業務組件）
  - P1 核心元件: 7 個
  - P2 表單元件: 7 個
  - P3 浮層元件: 7 個
  - P4 回饋元件: 5 個
  - P5 進階元件: 5 個
  - 業務組件: 36 個（含 om-expense, om-summary, operating-company 等）
- 核心文檔: 90+ 個（業務需求、架構設計、用戶故事）
- Sample-Docs: 14 個範例文檔（已排除索引）
- claudedocs: 50+ 個 AI 分析文檔（含 FEAT-007, CHANGE-004 相關記錄）
- CLAUDE.md 文件: 16 個目錄級 AI 助手指引文件

**Epic 8 - 通知系統相關文件**（已驗證索引）- 2025-10-06:
- ✅ packages/api/src/routers/notification.ts (~450行 - Notification API)
- ✅ packages/api/src/lib/email.ts (~400行 - EmailService)
- ✅ apps/web/src/components/notification/NotificationBell.tsx (~150行)
- ✅ apps/web/src/components/notification/NotificationDropdown.tsx (~280行)
- ✅ apps/web/src/app/notifications/page.tsx (~270行 - 完整通知列表頁面)

**Epic 1 - 認證系統相關文件**（已驗證索引）- 2025-10-07:
- ✅ packages/auth/src/index.ts (~200行 - Azure AD B2C 配置)
- ✅ apps/web/src/app/api/auth/[...nextauth]/route.ts (~20行 - NextAuth API)
- ✅ apps/web/src/app/login/page.tsx (~180行 - 登入頁面)
- ✅ apps/web/src/middleware.ts (~50行 - 認證中間件)
- ✅ packages/api/src/trpc.ts (RBAC 權限控制中間件)

**歷史更新**（2025-10-03 18:30）:
- ✅ 修復「索引悖論」：新增索引系統與元文件章節（7個核心元文件）
- ✅ 修復 User Story 索引格式：35個story從簡單列表改為完整表格（含完整路徑）
- ✅ 新增核心系統文件：middleware.ts、NextAuth API route（2個🔴極高重要性文件）
- ✅ 新增開發工具：索引檢查工具、種子數據腳本、報告文件（5個文件）
- ✅ 設計系統完整遷移：12個UI元件、3個佈局元件、6個設計系統文檔

---

## 🔧 索引維護

### 何時更新索引

- ✅ **立即更新**: 新增/移除核心業務文檔、主要配置文件
- ✅ **批次更新**: Sprint 結束時新增的功能模組、測試文件
- ✅ **定期檢查**: 每月檢查一次，清理過期引用

### 如何維護索引

詳細維護指南請參考：[INDEX-MAINTENANCE-GUIDE.md](./INDEX-MAINTENANCE-GUIDE.md)

### 自動化檢查

```bash
# 檢查索引同步狀態
npm run index:check

# 完整健康檢查
npm run index:health
```

---

## 🚫 排除目錄說明

以下目錄**不包含在索引中**，因為它們是工具、範例或系統文件：

### 範例文檔（已記錄但排除索引檢查）
- `Sample-Docs/` - 範例文檔庫（14個參考文件，用於項目演示）

### 第三方框架（約 205 個 MD 文件）
- `.bmad-core/` - BMad 開發工具框架（~50個文件）
- `.bmad-infrastructure-devops/` - DevOps 工具（~10個文件）
- `.bmad-creative-writing/` - 創意寫作工具（~80個文件）
- `.claude/commands/BMad/` - BMad 命令（~30個文件）
- `.claude/commands/bmad-cw/` - 創意寫作命令（~30個文件）
- `.claude/commands/bmadInfraDevOps/` - DevOps 命令（~5個文件）

### 系統和工具目錄
- `web-bundles/` - 前端工具擴展
- `.claude/` `.cursor/` - IDE 配置
- `.git/` - Git 內部文件
- `node_modules/` - 依賴套件
- `pnpm-lock.yaml` - 鎖定文件（自動生成）

---

**📝 注意事項**:
- 所有路徑都是相對於專案根目錄
- 文件重要性會隨專案發展動態調整
- 索引維護是保持 AI 助手效能的關鍵

**🔗 相關索引**:
- [AI 助手快速參考](./AI-ASSISTANT-GUIDE.md)
- [索引維護指南](./INDEX-MAINTENANCE-GUIDE.md)
