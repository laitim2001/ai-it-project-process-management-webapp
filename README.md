# IT Project Process Management Platform

> 統一化 IT 部門專案管理流程 - 從預算分配到費用報銷的單一事實來源平台

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-10.x-2596BE.svg)](https://trpc.io/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-F69220.svg)](https://pnpm.io/)

---

## 📋 目錄

- [專案概述](#專案概述)
- [核心功能](#核心功能)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [專案結構](#專案結構)
- [開發指南](#開發指南)
- [部署](#部署)
- [貢獻指南](#貢獻指南)

---

## 🎯 專案概述

**IT Project Process Management Platform** 旨在解決 IT 部門當前因流程分散、工具不一 (PPT/Excel/Email) 所導致的資訊孤島和決策延遲問題。

### 核心目標

- ✅ 建立**單一事實來源** (Single Source of Truth)
- ✅ 標準化並透明化從預算到費用的完整流程
- ✅ 提供角色導向的儀表板 (專案經理 vs 主管)
- ✅ 支持數據驅動的戰略決策
- ✅ 大幅節省行政工作時間

### 6 步核心工作流程

```mermaid
graph LR
    A[Budget Pool] --> B[Project]
    B --> C[Budget Proposal]
    C --> D[Vendor/Quote]
    D --> E[Purchase Order]
    E --> F[Expense]
    F --> G[Charge Out]
```

---

## ⚡ 核心功能

### MVP (Phase 1)

- 🔐 **Azure AD B2C 企業級認證** - 安全的身份驗證與角色管理
- 💰 **預算池管理** - 財年預算分配與追蹤
- 📊 **專案管理** - 端到端專案生命週期
- ✍️ **提案審批工作流** - Draft → Pending → Approved/Rejected/MoreInfo
- 🏢 **供應商與採購管理** - 報價上傳、比較、PO 生成
- 💵 **費用記錄與審批** - 發票管理、費用轉出
- 📈 **角色儀表板** - PM 操作中心 + Supervisor 戰略駕駛艙
- 📧 **自動通知系統** - SendGrid email 通知

### Post-MVP (Phase 2)

- 🤖 AI 智慧助理 (提案建議、預算風險預測)
- 🔗 外部系統整合 (ERP、HR、Data Warehouse)

---

## 🛠️ 技術棧

### 核心框架

| 類別 | 技術 | 版本 | 用途 |
|------|------|------|------|
| **全端框架** | Next.js | 14+ | App Router、Server Actions |
| **語言** | TypeScript | 5.x | 端到端類型安全 |
| **API** | tRPC | 10.x | 類型安全的 RPC |
| **ORM** | Prisma | 5.x | 資料庫管理 |
| **資料庫** | PostgreSQL | 16 | 主要資料庫 |
| **認證** | Azure AD B2C | - | 企業級認證 |
| **Monorepo** | Turborepo | - | 工作區管理 |

### UI/UX

- **樣式框架**: Tailwind CSS 3.x
- **元件庫**: Radix UI / Headless UI
- **狀態管理**: Zustand / Jotai

### DevOps

- **部署**: Azure App Service
- **CI/CD**: GitHub Actions
- **監控**: Azure Application Insights
- **儲存**: Azure Blob Storage

---

## 🚀 快速開始

### 前置需求

- **Node.js**: v20.x LTS ([下載](https://nodejs.org/))
- **pnpm**: v8+ (執行 `npm install -g pnpm`)
- **Docker Desktop**: ([下載](https://www.docker.com/products/docker-desktop))
- **Git**: ([下載](https://git-scm.com/))

### 安裝步驟

```bash
# 1. 克隆專案
git clone <repository-url>
cd ai-it-project-process-management-webapp

# 2. 安裝相依套件
pnpm install

# 3. 設置環境變數
cp .env.example .env
# 編輯 .env 並填寫必要的值 (詳見下方說明)

# 4. 啟動 Docker 服務 (PostgreSQL, Redis, Mailhog)
docker-compose up -d

# 5. 執行資料庫遷移
pnpm prisma migrate dev

# 6. (可選) 填充種子資料
pnpm prisma db seed

# 7. 啟動開發伺服器
pnpm dev
```

### 環境變數設定

編輯 `.env` 檔案並填寫以下**必要**變數:

```bash
# Database
DATABASE_URL="postgresql://postgres:localdev123@localhost:5432/itpm_dev"

# NextAuth
NEXTAUTH_SECRET="<使用 openssl rand -base64 32 生成>"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD B2C (需在 Azure Portal 創建)
AZURE_AD_B2C_TENANT_NAME="your-tenant-name"
AZURE_AD_B2C_CLIENT_ID="your-client-id"
AZURE_AD_B2C_CLIENT_SECRET="your-client-secret"
AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signupsignin"

# SendGrid (可選, 本地開發使用 Mailhog)
SENDGRID_API_KEY="your-sendgrid-api-key"
```

### 存取應用程式

開發伺服器啟動後:

- **應用程式**: http://localhost:3000
- **Prisma Studio**: 執行 `pnpm prisma studio` → http://localhost:5555
- **pgAdmin**: http://localhost:5050 (帳密: admin@itpm.local / admin123)
- **Mailhog** (Email 測試): http://localhost:8025

---

## 📁 專案結構

```
ai-it-project-process-management-webapp/
├── apps/
│   └── web/                    # Next.js 前端應用
│       ├── src/
│       │   ├── app/            # App Router 頁面
│       │   ├── components/     # 可重用 UI 元件
│       │   ├── features/       # 業務邏輯元件
│       │   ├── hooks/          # 自訂 React Hooks
│       │   └── lib/            # tRPC 客戶端、工具函數
│       └── package.json
│
├── packages/
│   ├── api/                    # tRPC 後端路由
│   │   ├── src/routers/        # API 路由定義
│   │   └── package.json
│   ├── db/                     # Prisma 資料庫
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 資料模型定義
│   │   └── package.json
│   ├── auth/                   # Azure AD B2C 認證
│   ├── eslint-config/          # 共享 ESLint 設定
│   └── tsconfig/               # 共享 TypeScript 設定
│
├── docs/                       # 專案文檔
│   ├── brief.md                # 專案簡報
│   ├── prd/                    # 產品需求文件
│   ├── fullstack-architecture/ # 技術架構文件
│   └── stories/                # 使用者故事
│
├── scripts/                    # 工具腳本
├── .vscode/                    # VS Code 設定
├── docker-compose.yml          # Docker 服務定義
├── .env.example                # 環境變數樣板
├── turbo.json                  # Turborepo 設定
└── package.json                # 根 package.json
```

---

## 💻 開發指南

### 常用指令

```bash
# 開發
pnpm dev                        # 啟動所有服務
pnpm dev --filter=web           # 只啟動 Next.js
pnpm dev --filter=api           # 只啟動 API 層

# 建置
pnpm build                      # 建置所有套件
pnpm build --filter=web         # 只建置前端

# 測試
pnpm test                       # 執行所有測試
pnpm test:watch                 # Watch 模式
pnpm test:e2e                   # E2E 測試 (Playwright)

# Linting & Formatting
pnpm lint                       # 執行 ESLint
pnpm lint:fix                   # 自動修復 ESLint 錯誤
pnpm format                     # Prettier 格式化

# Database
pnpm prisma studio              # 開啟 Prisma Studio
pnpm prisma migrate dev         # 創建並執行遷移
pnpm prisma generate            # 重新生成 Prisma Client
pnpm prisma db push             # 推送 schema 變更 (開發用)
pnpm prisma db seed             # 填充種子資料

# Type Checking
pnpm typecheck                  # 執行 TypeScript 類型檢查

# Clean
pnpm clean                      # 清理所有建置產物
```

### 開發工作流程

1. **創建新分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **開發功能**
   - 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範
   - 範例: `feat(api): add budget proposal endpoint`

3. **提交前檢查**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

4. **創建 Pull Request**
   - 確保 PR 描述清晰
   - 關聯相關的 Issue
   - 等待 Code Review

### 程式碼規範

- **TypeScript**: 使用嚴格模式, 避免 `any`
- **命名**: camelCase (變數/函數), PascalCase (元件/類型)
- **檔案命名**: kebab-case.ts
- **註解**: 複雜邏輯需加註釋
- **測試**: 每個新功能需包含單元測試

---

## 🚢 部署

### Azure 部署架構

```
┌─────────────────┐
│ GitHub Actions  │ (CI/CD Pipeline)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Azure Container │
│    Registry     │ (Docker Image)
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Azure App      │◄────►│ Azure Database   │
│    Service      │      │  for PostgreSQL  │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Azure Blob     │ (File Storage)
│    Storage      │
└─────────────────┘
```

### 部署步驟

詳見 [docs/infrastructure/azure-deployment-guide.md](./docs/infrastructure/azure-deployment-guide.md)

---

## 📚 文檔

- **[專案簡報](./docs/brief.md)** - 專案背景與目標
- **[產品需求文件 (PRD)](./docs/prd/index.md)** - 詳細功能需求
- **[全端架構文件](./docs/fullstack-architecture/index.md)** - 技術架構設計
- **[使用者故事](./docs/stories/)** - Epic 與 Story 拆分
- **[前端規格](./docs/front-end-spec.md)** - UI/UX 設計指南

---

## 🤝 貢獻指南

我們歡迎所有形式的貢獻! 請閱讀 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解詳情。

### 開發團隊

- **Business Analyst**: Mary
- **Product Manager**: Alex
- **UX Designer**: Sally
- **Architect**: Winston
- **Product Owner**: Sarah

---

## 📄 授權

本專案為內部企業專案, 版權所有。

---

## 🆘 常見問題

### Q: Docker 容器無法啟動?

```bash
# 檢查 Docker Desktop 是否運行
docker ps

# 查看日誌
docker-compose logs postgres

# 重新啟動
docker-compose down && docker-compose up -d
```

### Q: Prisma 遷移失敗?

```bash
# 重置資料庫 (開發環境)
pnpm prisma migrate reset

# 重新生成 Client
pnpm prisma generate
```

### Q: TypeScript 類型錯誤?

```bash
# 重啟 TypeScript 伺服器 (VS Code)
Cmd+Shift+P → "TypeScript: Restart TS Server"

# 清理並重建
pnpm clean && pnpm install && pnpm build
```

### Q: 如何連接到 Azure 開發環境資料庫?

參閱 [docs/infrastructure/local-dev-setup.md](./docs/infrastructure/local-dev-setup.md#azure-database-connection)

---

## 📞 支援

遇到問題? 請透過以下方式尋求協助:

- 📧 Email: dev-team@company.com
- 💬 Teams: IT PM Platform 頻道
- 🐛 Issues: [GitHub Issues](./issues)

---

**最後更新**: 2025-10-02
