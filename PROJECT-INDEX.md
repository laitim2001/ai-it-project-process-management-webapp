# 📂 IT Project Process Management Platform - 完整專案索引

> **目的**: 提供項目所有重要文件的完整導航地圖
> **更新頻率**: 每次新增/移除重要文件時立即更新
> **維護指南**: 參考 `INDEX-MAINTENANCE-GUIDE.md`

**最後更新**: 2025-10-03 17:00

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
| **索引維護指南** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護策略、分類標準、更新流程 | 🔴 極高 |
| **AI 助手快速參考** | `AI-ASSISTANT-GUIDE.md` | AI 助手工作流程、快速參考、開發進度 | 🔴 極高 |
| **開發記錄** | `DEVELOPMENT-LOG.md` | 所有開發決策、里程碑、重要變更記錄 | 🔴 極高 |
| **問題修復記錄** | `FIXLOG.md` | Bug 修復記錄、問題解決方案 | 🟡 高 |
| **安裝命令參考** | `INSTALL-COMMANDS.md` | 常用安裝命令快速參考 | 🟡 高 |
| **認證系統摘要** | `認證系統實現摘要.md` | 認證系統實現總結（中文版） | 🟢 中 |

---

## 2. 項目文檔

### 總覽文檔

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **README** | `README.md` | 項目總覽、快速開始指南 | 🔴 極高 |
| **專案簡報** | `docs/brief.md` | 項目背景、目標與價值主張 | 🔴 極高 |
| **MVP 開發計劃** | `mvp-development-plan.md` | MVP 完整開發路線圖和 Sprint 規劃 | 🔴 極高 |
| **MVP 實施檢查清單** | `mvp-implementation-checklist.md` | MVP 詳細實施檢查清單和進度追蹤 | 🔴 極高 |
| **環境設置指南** | `SETUP-COMPLETE.md` | 完整的環境設置步驟 | 🟡 高 |
| **貢獻指南** | `CONTRIBUTING.md` | 如何為項目做貢獻 | 🟡 高 |
| **Claude Code 指南** | `CLAUDE.md` | Claude Code AI 助手使用規則 | 🟢 中 |
| **導航系統指南** | `NAVIGATION-SYSTEM-GUIDE.md` | 項目導航系統使用指南 | 🟢 中 |
| **服務管理指南** | `DEVELOPMENT-SERVICE-MANAGEMENT.md` | 開發服務管理文檔 | 🟢 中 |

### 設計系統文檔

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **設計系統快速指南** | `DESIGN-SYSTEM-GUIDE.md` | 日常開發快速參考，確保一致風格 | 🔴 極高 |
| **設計系統導航** | `docs/README-DESIGN-SYSTEM.md` | 設計系統文檔導航中心 | 🔴 極高 |
| **UI/UX 重設計規範** | `docs/ui-ux-redesign.md` | 完整的設計系統規範（顏色、字體、間距等） | 🔴 極高 |
| **設計系統遷移計劃** | `docs/design-system-migration-plan.md` | 完整的遷移策略和時間表 | 🔴 極高 |
| **實作進度總結** | `docs/IMPLEMENTATION-SUMMARY.md` | 設計系統實作進度總結 | 🔴 極高 |
| **原型使用指南** | `docs/prototype-guide.md` | Dashboard 原型使用說明 | 🟡 高 |

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

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **本地開發設置** | `docs/infrastructure/local-dev-setup.md` | 本地開發環境設置指南 | 🟡 高 |
| **Azure 基礎設施** | `docs/infrastructure/azure-infrastructure-setup.md` | Azure 雲端基礎設施設置 | 🟡 高 |
| **專案設置檢查清單** | `docs/infrastructure/project-setup-checklist.md` | 完整的設置檢查清單 | 🟢 中 |

### 研究與發現

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **用戶研究提示** | `docs/user-research-prompt.md` | 用戶研究方法論 | 🟢 中 |
| **用戶研究結果** | `docs/user-research-result.md` | 用戶研究原始數據 | 🟢 中 |
| **用戶研究洞察** | `docs/user-research-insights.md` | 用戶研究分析與洞察 | 🟢 中 |
| **腦力激盪結果** | `docs/brainstorming-session-results.md` | 需求探索會議記錄 | 🟢 中 |

---

## 3. 核心代碼

### 前端應用 (apps/web)

#### Next.js 配置

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Next.js 配置** | `apps/web/next.config.mjs` | Next.js 應用配置 | 🔴 極高 |
| **Tailwind 配置** | `apps/web/tailwind.config.ts` | Tailwind CSS 配置 | 🟡 高 |
| **PostCSS 配置** | `apps/web/postcss.config.js` | PostCSS 處理配置 | 🟡 高 |
| **TypeScript 配置** | `apps/web/tsconfig.json` | TypeScript 編譯配置 | 🟡 高 |
| **Package 配置** | `apps/web/package.json` | 前端應用依賴配置 | 🟡 高 |

#### App Router 頁面

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **根布局** | `apps/web/src/app/layout.tsx` | 應用程式根布局 | 🔴 極高 |
| **首頁** | `apps/web/src/app/page.tsx` | 應用程式首頁 | 🔴 極高 |
| **Dashboard 頁面** | `apps/web/src/app/dashboard/page.tsx` | Dashboard 主頁面（使用新設計系統） | 🔴 極高 |
| **Login 頁面** | `apps/web/src/app/login/page.tsx` | 登入頁面 | 🔴 極高 |
| **全局樣式** | `apps/web/src/app/globals.css` | 全局 CSS 樣式（含 CSS 變數） | 🟡 高 |
| **Budget Pool 列表** | `apps/web/src/app/budget-pools/page.tsx` | 預算池列表頁面 | 🔴 極高 |
| **Budget Pool 詳情** | `apps/web/src/app/budget-pools/[id]/page.tsx` | 預算池詳情頁面 | 🟡 高 |
| **Budget Pool 編輯** | `apps/web/src/app/budget-pools/[id]/edit/page.tsx` | 預算池編輯頁面 | 🟡 高 |
| **Budget Pool 新增** | `apps/web/src/app/budget-pools/new/page.tsx` | 預算池新增頁面 | 🟡 高 |
| **Project 列表** | `apps/web/src/app/projects/page.tsx` | 專案列表頁面 | 🔴 極高 |
| **Project 詳情** | `apps/web/src/app/projects/[id]/page.tsx` | 專案詳情頁面 | 🟡 高 |
| **Project 編輯** | `apps/web/src/app/projects/[id]/edit/page.tsx` | 專案編輯頁面 | 🟡 高 |
| **Project 新增** | `apps/web/src/app/projects/new/page.tsx` | 專案新增頁面 | 🟡 高 |
| **User 列表** | `apps/web/src/app/users/page.tsx` | 使用者列表頁面 | 🔴 極高 |
| **User 詳情** | `apps/web/src/app/users/[id]/page.tsx` | 使用者詳情頁面 | 🟡 高 |
| **User 編輯** | `apps/web/src/app/users/[id]/edit/page.tsx` | 使用者編輯頁面 | 🟡 高 |
| **User 新增** | `apps/web/src/app/users/new/page.tsx` | 使用者新增頁面 | 🟡 高 |
| **BudgetProposal 列表** | `apps/web/src/app/proposals/page.tsx` | 預算提案列表頁面 | 🔴 極高 |
| **BudgetProposal 詳情** | `apps/web/src/app/proposals/[id]/page.tsx` | 預算提案詳情頁面 | 🟡 高 |
| **BudgetProposal 編輯** | `apps/web/src/app/proposals/[id]/edit/page.tsx` | 預算提案編輯頁面 | 🟡 高 |
| **BudgetProposal 新增** | `apps/web/src/app/proposals/new/page.tsx` | 預算提案新增頁面 | 🟡 高 |

#### API 路由

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **tRPC Route Handler** | `apps/web/src/app/api/trpc/[trpc]/route.ts` | tRPC API 路由處理器 | 🔴 極高 |
| **NextAuth API** | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth 認證 API 路由處理器 | 🔴 極高 |

#### 中間件

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **認證中間件** | `apps/web/src/middleware.ts` | Next.js 認證中間件，保護所有受保護路由 | 🔴 極高 |
| **TypeScript 環境** | `apps/web/next-env.d.ts` | Next.js TypeScript 類型定義（自動生成） | 🟡 高 |

#### UI 元件庫（shadcn/ui 風格）

**基礎元件:**

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Button 元件** | `apps/web/src/components/ui/button.tsx` | 按鈕元件（使用 CVA，6 種變體） | 🟡 高 |
| **Input 元件** | `apps/web/src/components/ui/input.tsx` | 輸入框元件（新設計系統） | 🟡 高 |
| **Select 元件** | `apps/web/src/components/ui/select.tsx` | 下拉選單複合元件（新設計系統） | 🟡 高 |
| **Textarea 元件** | `apps/web/src/components/ui/textarea.tsx` | 多行文本輸入元件 | 🟡 高 |
| **Label 元件** | `apps/web/src/components/ui/label.tsx` | 表單標籤元件 | 🟡 高 |
| **Badge 元件** | `apps/web/src/components/ui/badge.tsx` | 徽章元件（8 種狀態變體） | 🟡 高 |
| **Card 元件** | `apps/web/src/components/ui/card.tsx` | 卡片複合元件 (CardHeader, CardTitle, CardContent, CardFooter) | 🟡 高 |
| **Avatar 元件** | `apps/web/src/components/ui/avatar.tsx` | 頭像元件 (Avatar, AvatarImage, AvatarFallback) | 🟡 高 |
| **Dialog 元件** | `apps/web/src/components/ui/dialog.tsx` | 對話框/模態框元件 | 🟡 高 |
| **DropdownMenu 元件** | `apps/web/src/components/ui/dropdown-menu.tsx` | 下拉選單元件 | 🟡 高 |
| **Tabs 元件** | `apps/web/src/components/ui/tabs.tsx` | 選項卡元件 (Tabs, TabsList, TabsTrigger, TabsContent) | 🟡 高 |
| **Table 元件** | `apps/web/src/components/ui/table.tsx` | 表格複合元件 | 🟡 高 |
| **Progress 元件** | `apps/web/src/components/ui/progress.tsx` | 進度條元件 | 🟡 高 |
| **Skeleton 元件** | `apps/web/src/components/ui/skeleton.tsx` | 骨架屏載入元件（多種預設樣式） | 🟡 高 |
| **Breadcrumb 元件** | `apps/web/src/components/ui/breadcrumb.tsx` | 麵包屑導航元件 | 🟡 高 |
| **Pagination 元件** | `apps/web/src/components/ui/pagination.tsx` | 分頁元件 | 🟡 高 |
| **Toast 元件** | `apps/web/src/components/ui/Toast.tsx` | 提示訊息元件 | 🟡 高 |
| **LoadingSkeleton** | `apps/web/src/components/ui/LoadingSkeleton.tsx` | 載入骨架元件（舊版） | 🟡 高 |
| **元件索引** | `apps/web/src/components/ui/index.ts` | 元件統一導出 | 🟡 高 |
| **UI 元件 README** | `apps/web/src/components/ui/README.md` | UI 元件庫使用說明 | 🟢 中 |

#### 佈局元件

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Dashboard Layout** | `apps/web/src/components/layout/dashboard-layout.tsx` | Dashboard 主佈局元件（響應式設計） | 🔴 極高 |
| **Sidebar** | `apps/web/src/components/layout/sidebar.tsx` | 側邊欄導航元件（支援摺疊、Mobile 適配） | 🔴 極高 |
| **TopBar** | `apps/web/src/components/layout/topbar.tsx` | 頂部工具欄元件（用戶信息、搜索、通知） | 🔴 極高 |

#### 業務元件

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **StatsCard** | `apps/web/src/components/dashboard/StatsCard.tsx` | Dashboard 統計卡片元件（支援趨勢指標） | 🟡 高 |
| **Budget Pool 表單** | `apps/web/src/components/budget-pool/BudgetPoolForm.tsx` | 預算池表單元件 | 🟡 高 |
| **Budget Pool 過濾器** | `apps/web/src/components/budget-pool/BudgetPoolFilters.tsx` | 預算池篩選器元件 | 🟡 高 |
| **Project 表單** | `apps/web/src/components/project/ProjectForm.tsx` | 專案表單元件 | 🟡 高 |
| **User 表單** | `apps/web/src/components/user/UserForm.tsx` | 使用者表單元件 | 🟡 高 |
| **BudgetProposal 表單** | `apps/web/src/components/proposal/BudgetProposalForm.tsx` | 預算提案表單元件 | 🟡 高 |
| **ProposalActions** | `apps/web/src/components/proposal/ProposalActions.tsx` | 提案審批操作元件 | 🔴 極高 |
| **CommentSection** | `apps/web/src/components/proposal/CommentSection.tsx` | 提案評論元件 | 🟡 高 |

#### Hooks 與工具

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
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
| **健康檢查路由** | `packages/api/src/routers/health.ts` | 健康檢查 API | 🟡 高 |
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
| **索引同步檢查** | `scripts/check-index-sync.js` | 索引完整性檢查工具 | 🟢 中 |
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

**文件總數**: 226+ 個重要文件（完整索引更新）
**最後更新**: 2025-10-03 18:30
**維護者**: AI 助手 + 開發團隊

**本次更新變更**（2025-10-03 18:30）:
- ✅ 修復「索引悖論」：新增索引系統與元文件章節（7個核心元文件）
- ✅ 修復 User Story 索引格式：35個story從簡單列表改為完整表格（含完整路徑）
- ✅ 新增核心系統文件：middleware.ts、NextAuth API route（2個🔴極高重要性文件）
- ✅ 新增開發工具：索引檢查工具、種子數據腳本、報告文件（5個文件）
- ✅ 章節編號調整：配合新增章節調整目錄結構

**累積變更**（設計系統遷移）:
- 設計系統完整遷移（shadcn/ui 風格）
- 新增 12 個 UI 元件（avatar, badge, breadcrumb, card, dialog, dropdown-menu, label, progress, skeleton, table, tabs, textarea）
- 更新 3 個核心元件（button, input, select）為新設計系統
- 新增 3 個佈局元件（dashboard-layout, sidebar, topbar）
- 新增 6 個設計系統文檔
- 新增 cn() 工具函數
- 新增 Dashboard 和 Login 頁面
- 新增 StatsCard 業務元件

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

以下目錄**不包含在索引中**，因為它們是工具或系統文件：

- `.bmad-core/` - BMad 開發工具框架
- `.bmad-infrastructure-devops/` - DevOps 工具
- `.bmad-creative-writing/` - 創意寫作工具
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
