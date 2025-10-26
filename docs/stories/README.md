# 📖 用戶故事文檔

> **目的**: 詳細的用戶故事（User Stories）按 Epic 組織
> **最後更新**: 2025-10-26

---

## 📋 Epic 索引

本目錄包含 **10 個 Epic** 的詳細用戶故事，共 **33 個 Story 文件**。

| Epic | 目錄 | Story 數量 | 狀態 |
|------|------|-----------|------|
| **Epic 1** | [epic-1-platform-foundation-and-user-authentication](./epic-1-platform-foundation-and-user-authentication/) | 4 | ✅ 完成 |
| **Epic 2** | [epic-2-ci-cd-and-deployment-automation](./epic-2-ci-cd-and-deployment-automation/) | 3 | ✅ 完成 |
| **Epic 3** | [epic-3-budget-and-project-setup](./epic-3-budget-and-project-setup/) | 3 | ✅ 完成 |
| **Epic 4** | [epic-4-proposal-and-approval-workflow](./epic-4-proposal-and-approval-workflow/) | 4 | ✅ 完成 |
| **Epic 5** | [epic-5-procurement-and-vendor-management](./epic-5-procurement-and-vendor-management/) | 3 | ✅ 完成 |
| **Epic 6** | [epic-6-expense-recording-and-financial-integration](./epic-6-expense-recording-and-financial-integration/) | 4 | ✅ 完成 |
| **Epic 7** | [epic-7-dashboard-and-basic-reporting](./epic-7-dashboard-and-basic-reporting/) | 3 | ✅ 完成 |
| **Epic 8** | [epic-8-notification-system](./epic-8-notification-system/) | 3 | ✅ 完成 |
| **Epic 9** | [epic-9-ai-assistant](./epic-9-ai-assistant/) | 3 | 📋 計劃中 |
| **Epic 10** | [epic-10-external-system-integration](./epic-10-external-system-integration/) | 3 | 📋 計劃中 |

---

## 🎯 Epic 概覽

### Epic 1: Platform Foundation and User Authentication
**目標**: 建立平台基礎和用戶認證系統
**關鍵功能**:
- 專案初始化和基礎設施設置
- 核心認證服務和資料庫模型
- 註冊和登入功能
- 角色型存取控制（RBAC）

**Story 列表**:
- Story 1.1: Project Initialization and Infrastructure Setup
- Story 1.2: Core Authentication and User Management Service - Database Model
- Story 1.3: Core Authentication and User Management Service - Registration and Login Functionality
- Story 1.4: Core Authentication and User Management Service - Role-Based Access Control

---

### Epic 2: CI/CD and Deployment Automation
**目標**: 自動化部署流程和持續整合
**關鍵功能**:
- GitHub Actions CI/CD 管線
- Azure App Service 部署
- 環境配置和健康檢查

**Story 列表**:
- Story 2.1: CI/CD Pipeline Setup
- Story 2.2: Azure Deployment Configuration
- Story 2.3: Environment Management

---

### Epic 3: Budget and Project Setup
**目標**: 預算池和專案設置管理
**關鍵功能**:
- 預算池 CRUD 操作
- 專案 CRUD 操作
- 預算分配和追蹤

**Story 列表**:
- Story 3.1: Budget Pool Management
- Story 3.2: Project Management
- Story 3.3: Budget Allocation Tracking

---

### Epic 4: Proposal and Approval Workflow
**目標**: 提案和審批工作流程
**關鍵功能**:
- 提案建立和提交
- 審批工作流程狀態機
- 評論和審核歷史

**Story 列表**:
- Story 4.1: Proposal Creation and Submission
- Story 4.2: Approval Workflow State Machine
- Story 4.3: Comment System
- Story 4.4: Audit History

---

### Epic 5: Procurement and Vendor Management
**目標**: 採購和供應商管理
**關鍵功能**:
- 供應商 CRUD 操作
- 報價上傳和比較
- 採購訂單生成

**Story 列表**:
- Story 5.1: Vendor Management
- Story 5.2: Quote Management
- Story 5.3: Purchase Order Generation

---

### Epic 6: Expense Recording and Financial Integration
**目標**: 費用記錄和財務整合
**關鍵功能**:
- 費用 CRUD 操作
- 費用審批工作流程
- 發票文件上傳
- 預算池扣款

**Story 列表**:
- Story 6.1: Expense Recording
- Story 6.2: Expense Approval Workflow
- Story 6.3: Invoice File Upload
- Story 6.4: Budget Pool Charge-out

---

### Epic 7: Dashboard and Basic Reporting
**目標**: 儀表板和基本報表
**關鍵功能**:
- 專案經理儀表板（操作視圖）
- 主管儀表板（戰略概覽）
- 預算池概覽卡片
- 資料匯出（CSV）

**Story 列表**:
- Story 7.1: Project Manager Dashboard
- Story 7.2: Supervisor Dashboard
- Story 7.3: Data Export Functionality

---

### Epic 8: Notification System
**目標**: 通知系統
**關鍵功能**:
- 應用內通知中心
- 電子郵件通知（SendGrid + Mailhog）
- 提案和費用狀態變更通知
- 已讀/未讀追蹤

**Story 列表**:
- Story 8.1: In-App Notification Center
- Story 8.2: Email Notification Service
- Story 8.3: Notification Types and Triggers

---

### Epic 9: AI Assistant (規劃中)
**目標**: AI 助理智能功能
**規劃功能**:
- 智能預算建議
- 自動費用分類
- 預測性預算風險警告
- 自動報表生成

**Story 列表**:
- Story 9.1: Intelligent Budget Suggestions
- Story 9.2: Automated Expense Categorization
- Story 9.3: Predictive Risk Alerts

---

### Epic 10: External System Integration (規劃中)
**目標**: 外部系統整合
**規劃功能**:
- 費用數據同步到 ERP
- 用戶數據從 HR 系統同步
- 資料管道到數據倉庫

**Story 列表**:
- Story 10.1: ERP System Integration
- Story 10.2: HR System Integration
- Story 10.3: Data Warehouse Pipeline

---

## 📊 完成統計

**MVP Phase (Epic 1-8)**: ✅ 100% 完成
- 已完成 Story: 27/27
- 已實施功能: 100%
- 測試覆蓋: 持續增長中

**Next Phase (Epic 9-10)**: 📋 規劃中
- 規劃 Story: 6
- 預計開始: 待定
- 優先級: P2（Post-MVP）

---

## 🔗 相關文檔

### 需求文檔
- [docs/prd/](../prd/) - Product Requirements Documents
- [docs/prd/4-epic-and-user-story-details.md](../prd/4-epic-and-user-story-details.md) - Epic 和 Story 詳細說明

### 實施記錄
- [archive/epic-records/](../../archive/epic-records/) - Epic 1-2 實施記錄
- [DEVELOPMENT-LOG.md](../../DEVELOPMENT-LOG.md) - 完整開發記錄
- [docs/implementation/](../implementation/) - 實施總結和原型指南

### 技術架構
- [docs/fullstack-architecture/](../fullstack-architecture/) - 完整技術架構
- [docs/fullstack-architecture/8-core-workflows.md](../fullstack-architecture/8-core-workflows.md) - 核心工作流程

---

## 📖 Story 文件命名規範

所有 Story 文件遵循以下命名格式:
```
story-{epic}.{number}-{descriptive-title}.md
```

**範例**:
- `story-1.1-project-initialization-and-infrastructure-setup.md`
- `story-4.2-approval-workflow-state-machine.md`
- `story-8.1-in-app-notification-center.md`

---

**維護者**: 產品團隊 + 開發團隊
**問題回報**: 請更新 DEVELOPMENT-LOG.md 或創建 GitHub Issue
