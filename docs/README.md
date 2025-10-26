# 📚 專案文檔總覽

> **IT Project Process Management Platform - 完整文檔索引**
> **最後更新**: 2025-10-26
> **專案狀態**: Post-MVP 100% 完成

---

## 🎯 文檔架構

本目錄包含專案的完整文檔，按功能和用途組織成 8 個主要類別：

| 目錄 | 說明 | 文件數 | 用途 |
|------|------|--------|------|
| **[brief.md](./brief.md)** | 專案簡介 | 1 | 專案概覽和問題陳述 |
| **[front-end-spec.md](./front-end-spec.md)** | 前端規格 | 1 | 前端技術規格和 UI/UX 指南 |
| **[fullstack-architecture/](./fullstack-architecture/)** | 完整技術架構 | 14 | 系統架構、技術棧、資料模型 |
| **[prd/](./prd/)** | 產品需求文檔 | 5 | PRD 和 Epic 需求定義 |
| **[stories/](./stories/)** | 用戶故事 | 33 | 10 個 Epic 的詳細 User Stories |
| **[infrastructure/](./infrastructure/)** | 基礎設施 | 3 | Azure 設置和本地開發環境 |
| **[design-system/](./design-system/)** | 設計系統 | 4 | 設計系統遷移和 UI/UX 設計 |
| **[research/](./research/)** | 研究與發現 | 4 | 用戶研究和頭腦風暴記錄 |
| **[development/](./development/)** | 開發指南 | 3 | 開發環境管理和命令參考 |
| **[implementation/](./implementation/)** | 實施記錄 | 2 | 實施總結和原型開發指南 |

**總計**: 70+ 文檔文件

---

## 📖 文檔導航指南

### 🚀 新開發者快速開始
**建議閱讀順序**:
1. [brief.md](./brief.md) - 了解專案背景和目標
2. [fullstack-architecture/](./fullstack-architecture/) - 理解技術架構
3. [infrastructure/local-dev-setup.md](./infrastructure/local-dev-setup.md) - 設置本地開發環境
4. [development/](./development/) - 學習開發工作流程
5. [stories/](./stories/) - 查看功能需求和用戶故事

### 🎨 UI/UX 設計師
**建議閱讀**:
1. [front-end-spec.md](./front-end-spec.md) - 前端規格和組件庫
2. [design-system/](./design-system/) - 設計系統指南
3. [design-system/ui-ux-redesign.md](./design-system/ui-ux-redesign.md) - UI/UX 重新設計

### 📝 產品經理
**建議閱讀**:
1. [brief.md](./brief.md) - 專案簡介
2. [research/](./research/) - 用戶研究和需求發現
3. [prd/](./prd/) - 產品需求文檔
4. [stories/](./stories/) - 詳細用戶故事

### 🏗️ 架構師 / Tech Lead
**建議閱讀**:
1. [fullstack-architecture/](./fullstack-architecture/) - 完整技術架構
2. [infrastructure/](./infrastructure/) - 基礎設施和部署
3. [fullstack-architecture/3-tech-stack.md](./fullstack-architecture/3-tech-stack.md) - 技術棧選擇
4. [fullstack-architecture/10-deployment-architecture.md](./fullstack-architecture/10-deployment-architecture.md) - 部署架構

### 🔧 DevOps 工程師
**建議閱讀**:
1. [infrastructure/](./infrastructure/) - 基礎設施設置
2. [infrastructure/azure-infrastructure-setup.md](./infrastructure/azure-infrastructure-setup.md) - Azure 設置
3. [development/DEVELOPMENT-SERVICE-MANAGEMENT.md](./development/DEVELOPMENT-SERVICE-MANAGEMENT.md) - 服務管理

---

## 📂 詳細目錄說明

### 📄 brief.md
**用途**: 專案簡介和問題陳述
**內容**:
- 專案背景和動機
- 核心問題定義
- 解決方案概述
- 專案目標和成功指標

**適用對象**: 所有團隊成員、利益相關者

---

### 📄 front-end-spec.md
**用途**: 前端技術規格和 UI/UX 指南
**內容**:
- 前端技術棧（Next.js 14, React, Tailwind CSS）
- 組件庫（shadcn/ui + Radix UI）
- 樣式規範和主題系統
- 前端開發最佳實踐

**適用對象**: 前端開發者、UI/UX 設計師

---

### 📁 fullstack-architecture/
**用途**: 完整的技術架構文檔（14 章節）
**內容**:
- 系統架構概覽
- 技術棧選擇和理由
- 資料模型和 Prisma Schema
- API 設計（tRPC）
- 核心組件和工作流程
- 部署架構
- 安全性、性能和可觀測性

**主要文件**:
- [index.md](./fullstack-architecture/index.md) - 架構文檔索引
- [2-high-level-architecture.md](./fullstack-architecture/2-high-level-architecture.md) - 高層架構圖
- [3-tech-stack.md](./fullstack-architecture/3-tech-stack.md) - 技術棧詳解
- [5-data-model-and-prisma-schema.md](./fullstack-architecture/5-data-model-and-prisma-schema.md) - 資料模型

**適用對象**: 架構師、全端開發者、Tech Lead

---

### 📁 prd/
**用途**: Product Requirements Documents（產品需求文檔）
**內容**:
- 專案目標和背景
- 功能性和非功能性需求
- Epic 列表（Epic 1-10）
- Epic 和 User Story 詳細說明

**主要文件**:
- [index.md](./prd/index.md) - PRD 索引
- [1-goals-and-background-context.md](./prd/1-goals-and-background-context.md) - 目標和背景
- [2-functional-and-non-functional-requirements.md](./prd/2-functional-and-non-functional-requirements.md) - 需求規格
- [3-epic-list.md](./prd/3-epic-list.md) - Epic 列表
- [4-epic-and-user-story-details.md](./prd/4-epic-and-user-story-details.md) - Epic 詳細說明

**適用對象**: 產品經理、開發者、QA 工程師

---

### 📁 stories/
**用途**: 詳細的用戶故事，按 Epic 組織（10 個 Epic，33 個 Story）
**內容**:
- Epic 1-8: ✅ 已完成（MVP Phase）
- Epic 9-10: 📋 規劃中（Post-MVP）

**Epic 目錄**:
1. [epic-1-platform-foundation-and-user-authentication/](./stories/epic-1-platform-foundation-and-user-authentication/) - 平台基礎和用戶認證（4 stories）
2. [epic-2-ci-cd-and-deployment-automation/](./stories/epic-2-ci-cd-and-deployment-automation/) - CI/CD 和部署自動化（3 stories）
3. [epic-3-budget-and-project-setup/](./stories/epic-3-budget-and-project-setup/) - 預算和專案設置（3 stories）
4. [epic-4-proposal-and-approval-workflow/](./stories/epic-4-proposal-and-approval-workflow/) - 提案和審批工作流程（4 stories）
5. [epic-5-procurement-and-vendor-management/](./stories/epic-5-procurement-and-vendor-management/) - 採購和供應商管理（3 stories）
6. [epic-6-expense-recording-and-financial-integration/](./stories/epic-6-expense-recording-and-financial-integration/) - 費用記錄和財務整合（4 stories）
7. [epic-7-dashboard-and-basic-reporting/](./stories/epic-7-dashboard-and-basic-reporting/) - 儀表板和基本報表（3 stories）
8. [epic-8-notification-system/](./stories/epic-8-notification-system/) - 通知系統（3 stories）
9. [epic-9-ai-assistant/](./stories/epic-9-ai-assistant/) - AI 助理（3 stories, 規劃中）
10. [epic-10-external-system-integration/](./stories/epic-10-external-system-integration/) - 外部系統整合（3 stories, 規劃中）

**適用對象**: 開發者、QA 工程師、產品經理

**詳細索引**: 參見 [stories/README.md](./stories/README.md)

---

### 📁 infrastructure/
**用途**: 基礎設施設置和環境配置（3 個文件）
**內容**:
- Azure 雲端基礎設施設置
- 本地開發環境設置
- 專案設置檢查清單

**主要文件**:
- [azure-infrastructure-setup.md](./infrastructure/azure-infrastructure-setup.md) - Azure 設置指南
- [local-dev-setup.md](./infrastructure/local-dev-setup.md) - 本地開發環境
- [project-setup-checklist.md](./infrastructure/project-setup-checklist.md) - 設置驗證清單

**適用對象**: DevOps 工程師、新開發者

**詳細索引**: 參見 [infrastructure/README.md](./infrastructure/README.md)

---

### 📁 design-system/
**用途**: 設計系統文檔和 UI/UX 設計（4 個文件）
**內容**:
- shadcn/ui 設計系統使用指南
- 設計系統遷移計劃和進度
- UI/UX 重新設計文檔（64KB 大型文檔）

**主要文件**:
- [DESIGN-SYSTEM-GUIDE.md](./design-system/DESIGN-SYSTEM-GUIDE.md) - 設計系統使用指南
- [design-system-migration-plan.md](./design-system/design-system-migration-plan.md) - 遷移計劃
- [ui-ux-redesign.md](./design-system/ui-ux-redesign.md) - UI/UX 重新設計（64KB）
- [README-DESIGN-SYSTEM.md](./design-system/README-DESIGN-SYSTEM.md) - 設計系統 README

**設計系統狀態**: ✅ 遷移完成（v4.0）
- 26 個 shadcn/ui 組件
- Light/Dark/System 主題系統
- WCAG 2.1 AA 無障礙性

**適用對象**: UI/UX 設計師、前端開發者

**詳細索引**: 參見 [design-system/README.md](./design-system/README.md)

---

### 📁 research/
**用途**: 用戶研究、需求發現和頭腦風暴記錄（4 個文件）
**內容**:
- 頭腦風暴會議結果
- 用戶研究提示和問題設計
- 用戶研究結果和原始數據
- 用戶研究洞察和發現

**主要文件**:
- [brainstorming-session-results.md](./research/brainstorming-session-results.md) - 頭腦風暴結果
- [user-research-prompt.md](./research/user-research-prompt.md) - 研究提示設計
- [user-research-result.md](./research/user-research-result.md) - 研究結果數據
- [user-research-insights.md](./research/user-research-insights.md) - 研究洞察

**主要發現**:
- 核心痛點: 流程分散、手動追蹤、缺乏透明、重複工作
- 關鍵需求: 統一平台、自動化、可見性、審批流程

**適用對象**: 產品經理、UX 研究員

**詳細索引**: 參見 [research/README.md](./research/README.md)

---

### 📁 development/
**用途**: 開發環境設置和服務管理（3 個文件）
**內容**:
- 開發服務管理指南（Docker, PostgreSQL, Redis, Mailhog）
- 常用安裝命令快速參考
- 環境設置完成檢查清單

**主要文件**:
- [DEVELOPMENT-SERVICE-MANAGEMENT.md](./development/DEVELOPMENT-SERVICE-MANAGEMENT.md) - 服務管理
- [INSTALL-COMMANDS.md](./development/INSTALL-COMMANDS.md) - 安裝命令
- [SETUP-COMPLETE.md](./development/SETUP-COMPLETE.md) - 設置驗證

**快速命令**:
```bash
# 啟動所有服務
docker-compose up -d && pnpm dev

# 環境檢查
pnpm check:env
```

**適用對象**: 開發者、DevOps 工程師

**詳細索引**: 參見 [development/README.md](./development/README.md)

---

### 📁 implementation/
**用途**: 實施總結和原型開發指南（2 個文件）
**內容**:
- 完整實施總結報告（MVP Phase 1-2）
- 原型開發和快速驗證指南

**主要文件**:
- [IMPLEMENTATION-SUMMARY.md](./implementation/IMPLEMENTATION-SUMMARY.md) - 實施總結
- [prototype-guide.md](./implementation/prototype-guide.md) - 原型開發指南

**實施成果**:
- Phase 1 (MVP): Epic 1-8 ✅ 100% 完成
- Phase 2 (Post-MVP): 設計系統遷移 ✅ 完成
- 總代碼: ~30,000+ 行核心代碼
- 功能頁面: 18 個完整頁面
- UI 組件: 46 個（26 設計系統 + 20 業務）

**適用對象**: Tech Lead、專案經理、開發者

**詳細索引**: 參見 [implementation/README.md](./implementation/README.md)

---

## 🔗 相關文檔資源

### 根目錄核心文檔
- [README.md](../README.md) - 專案總覽和快速開始
- [CLAUDE.md](../CLAUDE.md) - AI 助手開發指南（Post-MVP 完整版）
- [DEVELOPMENT-SETUP.md](../DEVELOPMENT-SETUP.md) - 完整跨平台設置指南（711 行）
- [DEVELOPMENT-LOG.md](../DEVELOPMENT-LOG.md) - 開發歷史記錄
- [FIXLOG.md](../FIXLOG.md) - 問題修復記錄（FIX-001 to FIX-005）
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢獻指南

### AI 助手導航系統
- [AI-ASSISTANT-GUIDE.md](../AI-ASSISTANT-GUIDE.md) - AI 助手快速參考
- [PROJECT-INDEX.md](../PROJECT-INDEX.md) - 完整文件索引（250+ 文件）
- [INDEX-MAINTENANCE-GUIDE.md](../INDEX-MAINTENANCE-GUIDE.md) - 索引維護策略

### 歷史記錄歸檔
- [archive/epic-records/](../archive/epic-records/) - Epic 1-2 實施記錄

### claudedocs/ (AI 生成分析)
- [claudedocs/design-system/](../claudedocs/design-system/) - 設計系統遷移進度
- [claudedocs/implementation/](../claudedocs/implementation/) - Phase 詳細任務記錄
- [claudedocs/planning/](../claudedocs/planning/) - Epic 計劃文檔

---

## 📊 專案統計

**文檔統計** (截至 2025-10-26):
- docs/ 文檔: 70+ 文件
- 索引文件: 10 個 README.md/index.md
- 歷史記錄: 3 個 Epic 記錄（已歸檔）
- AI 分析: 20+ claudedocs 文件

**開發統計**:
- 核心代碼: ~30,000+ 行
- API Routers: 10 個
- Prisma Models: 10+
- UI 組件: 46 個
- 功能頁面: 18 個
- Epic 完成: 8/8 MVP (100%)

**專案狀態**:
- ✅ MVP Phase 1 (Epic 1-8): 100% 完成
- ✅ Post-MVP Enhancements: 100% 完成
- 📋 Epic 9-10: 規劃中

---

## 🎯 文檔維護

### 文檔組織原則
1. **功能分類**: 按文檔用途和受眾組織
2. **清晰索引**: 每個子目錄包含 README.md 或 index.md
3. **一致命名**: kebab-case 或 PascalCase（依文件類型）
4. **及時更新**: 重大變更後更新相關文檔

### 更新流程
1. 修改文檔內容
2. 更新子目錄 README.md（如適用）
3. 更新此主索引（docs/README.md）
4. 運行 `pnpm index:check` 驗證同步

### 維護工具
```bash
# 檢查索引同步
pnpm index:check

# 完整健康檢查
pnpm index:health

# 自動修復（謹慎使用）
pnpm index:fix
```

---

**維護者**: 開發團隊 + AI 助手
**問題回報**: 請更新 DEVELOPMENT-LOG.md 或創建 GitHub Issue
**最後審查**: 2025-10-26 (Post-MVP 完成後)
