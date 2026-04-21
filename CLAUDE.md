# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Last Updated**: 2026-04-21
> **Project Status**: Post-MVP Enhancement Phase (FEAT-012 + FIX-101~137 Complete)
> **Total Code**: ~73,500 lines of core code (258 core source files)
> **Epic Status**: Epic 1-8 ✅ Complete | Epic 9-10 📋 Planned
> **Azure Deployment**: ✅ 個人環境 + ✅ 公司環境 已部署
> **Language Preference**: 繁體中文 (Traditional Chinese) - AI assistants should communicate in Traditional Chinese by default

---

## 📚 Codebase 深度分析參考文件（權威資料來源）

> **重要**：`docs/codebase-analyze/` 目錄包含 **2026-04-09 完成的全面 Codebase 掃描與驗證**（77 份文件，790 個驗證點，準確率 94.3%）。當需要**精確的統計數據、架構細節、已知問題清單**時，**AI 助手應優先參考此目錄**，而非本 CLAUDE.md 的摘要數字。

**關鍵索引檔**：

| 查詢目的 | 參考文件 |
|---------|---------|
| 整體統計、最嚴重發現 | `docs/codebase-analyze/SUMMARY.md` |
| 分析方法與驗證流程 | `docs/codebase-analyze/00-analysis-plan.md` |
| 技術棧完整清單 (53 deps + 34 devDeps) | `docs/codebase-analyze/01-project-overview/tech-stack.md` |
| 架構模式（tRPC 4 層、JWT、Provider 鏈） | `docs/codebase-analyze/01-project-overview/architecture-patterns.md` |
| Docker 構建 + 6 個 GitHub Actions | `docs/codebase-analyze/01-project-overview/build-and-deploy.md` |
| Azure 基礎設施完整規格 | `docs/codebase-analyze/01-project-overview/azure-infrastructure.md` |
| **17 Routers + 200 Procedures 詳解** | `docs/codebase-analyze/02-api-layer/` |
| **23 路由模組、60 頁面詳解** | `docs/codebase-analyze/03-frontend-pages/` |
| **51 業務 + 43 UI 組件詳解** | `docs/codebase-analyze/04-components/` |
| **32 Models + 94 索引 + ER 圖** | `docs/codebase-analyze/05-database/` |
| 認證、Middleware、環境變數 | `docs/codebase-analyze/06-auth-and-config/` |
| 40 個腳本分類索引 | `docs/codebase-analyze/07-scripts-and-tools/` |
| **2,706 翻譯 keys、29 namespaces** | `docs/codebase-analyze/08-i18n/` |
| 30 個 Mermaid 系統/流程圖 | `docs/codebase-analyze/09-diagrams/` |
| **🔴 安全問題、技術債務、死碼清單** | `docs/codebase-analyze/10-issues-and-debt/` |
| 驗證報告（R1–R10） | `docs/codebase-analyze/11-verification/` |

**典型使用情境**：
- 被問到「總共幾個 procedures？」→ 查 `02-api-layer/router-index.md`，答 200 個
- 要修某個 Router → 先看 `02-api-layer/detail/{router}.md` 了解完整介面
- 碰到安全 / 權限問題 → 查 `10-issues-and-debt/security-review.md`
- 新增 i18n key 前 → 查 `08-i18n/translation-analysis.md` 確認命名空間

---

## 🌐 Language and Communication

**Primary Language**: 繁體中文 (Traditional Chinese)

All AI assistants working with this codebase should:
- **Communicate in Traditional Chinese** by default for all interactions
- Use Chinese for explanations, documentation, and technical discussions
- Keep code comments and technical terms in English when appropriate (e.g., variable names, function names)
- Translate technical concepts into clear Chinese explanations
- Use Chinese for commit messages, documentation updates, and development logs

**Code Language Standards**:
- **Code**: English (variable names, function names, class names)
- **Comments**: Traditional Chinese for business logic explanations
- **Documentation**: Traditional Chinese for user-facing docs, English for technical specs when needed
- **Commit Messages**: Traditional Chinese with conventional commit format

**Examples**:
```typescript
// ✅ Good: English code with Chinese comments
function calculateBudgetUtilization(budgetPool: BudgetPool): number {
  // 計算預算池使用率：已使用金額 / 總金額
  return (budgetPool.usedAmount / budgetPool.totalAmount) * 100;
}

// ❌ Avoid: Chinese variable names
function 計算預算使用率(預算池: BudgetPool): number {
  return (預算池.已使用金額 / 預算池.總金額) * 100;
}
```

---

## 📋 Code Standards & Rules

專案代碼規範位於 `.claude/rules/` 目錄，為 AI 助手提供詳細的編碼指引：

| 規則文件 | 適用路徑 | 主要內容 |
|----------|----------|----------|
| `frontend.md` | `apps/web/src/app/**` | Next.js 頁面、路由、Metadata |
| `components.md` | `apps/web/src/components/**` | React 組件模式、Props、狀態管理 |
| `ui-design-system.md` | `apps/web/src/components/ui/**` | shadcn/ui 組件使用規範 |
| `backend-api.md` | `packages/api/src/**` | tRPC Router、Zod Schema、權限控制 |
| `database.md` | `packages/db/prisma/**` | Prisma Schema、遷移、查詢模式 |
| `i18n.md` | `apps/web/src/messages/**` | 翻譯 Key 命名、驗證流程 |
| `typescript.md` | `**/*.ts`, `**/*.tsx` | 類型定義、命名約定、泛型使用 |
| `scripts.md` | `scripts/**` | 腳本命名、輸出格式、錯誤處理 |
| `documentation.md` | `claudedocs/**`, `docs/**` | 文檔結構、格式範本 |

**AI 助手使用指南**：
1. 處理特定路徑檔案時，參考對應的規則文件
2. 遵循規則中的代碼模式和約定
3. 避免「禁止事項」中列出的做法

詳細索引：`.claude/rules/index.md`

---

## Project Overview

This is an **IT Project Process Management Platform** - a **production-ready** full-stack web application built with the **T3 Stack** (Next.js + tRPC + Prisma + TypeScript). The platform centralizes and streamlines IT department project workflows from budget allocation to expense charge-out, replacing fragmented manual processes (PPT/Excel/Email) with a unified, role-based system.

### 🎯 Current Development Stage

**✅ MVP Phase 1: 100% Complete** (Epic 1-8)
- All 8 core Epics delivered and tested
- **60 頁面實作**（**23 個路由模組**，含 `project-data-import`）
- **94 個組件**（**43 個 UI** + **51 個業務組件**）
- ~73,500 lines of production code (258 core source files)
- **17 Routers / 200 Procedures**
- **32 Prisma Models / 94 索引 / 16 級聯策略**
- **2,706 翻譯 keys**（29 namespaces，en + zh-TW 完全同步）

**✅ Post-MVP Enhancements: Complete**
- Design system migration (shadcn/ui + Radix UI)
- 4 new pages (Quotes, Settings, Register, Forgot Password)
- Environment deployment optimization
- **Quality fixes (FIX-009 ~ FIX-137, 共 70+ bug fixes)**
  - FIX-009 ~ FIX-099: MVP 階段品質修復
  - **FIX-101 ~ FIX-137**: Codebase 分析驗證修復（34 項安全、品質、UX 修正，commit `5017bd0`）
    - FIX-101: User Router 權限修復（改 protectedProcedure / adminProcedure）
    - FIX-102: Health Router Schema 修改端點改 adminProcedure
    - FIX-103: 檔案上傳 API 加認證中間件
- **FEAT-007**: OM Expense 表頭-明細架構重構 (OMExpense → OMExpenseItem → OMExpenseMonthly)
- **FEAT-008**: OM Expense Data Import (Excel 數據導入 v1.0 → v1.3)
- **FEAT-009**: OpCo 數據權限管理
- **FEAT-010**: Project Data Import（前端模組 `project-data-import/`）
- **FEAT-011**: Permission Management（Sidebar 權限過濾）
- **FEAT-012**: 統一載入特效系統（Spinner, LoadingButton, LoadingOverlay, GlobalProgress）
- **CHANGE-001~041**: 41 項功能改進 (OM Summary、Dashboard、Delete Enhancement、User Password 等)

**📋 Next Phase: Epic 9-10** (AI Assistant + External Integration)

### ⚠️ 已知未完成 / 技術債務（節選，完整清單見 `docs/codebase-analyze/10-issues-and-debt/`）

- **未完成功能**：Settings Save 全為 TODO；Forgot Password 使用 setTimeout 模擬
- **超大檔案**：29 個 > 500 行，11 個 > 1000 行（`data-import` 1,606 行、`omExpense` router 2,762 行）
- **兩套 Toast 系統共存**（MVP Context 版 + Post-MVP Pub/Sub 版，待統一）
- **表單處理不一致**：6 個用 react-hook-form + Zod，9 個用 useState（待統一）
- **代碼 Bug**：
  - `expense.getStats` 引用不存在的 `'PendingApproval'` 狀態
  - `expense.reject` 發送未註冊的通知類型 `'EXPENSE_REJECTED'`
  - `project.chargeOut` 使用 `throw new Error` 而非 `TRPCError`

---

## Tech Stack

**Core Framework:**
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5.3.3
- **API Layer**: tRPC 10.45.1 (type-safe RPC)
- **Database ORM**: Prisma 5.9.1
- **Database**: PostgreSQL 16 (Azure Database for PostgreSQL)
- **Auth**: NextAuth.js 5.0.0-beta.30 + Azure AD (Entra ID)
- **Styling**: Tailwind CSS 3.x
- **Components**: shadcn/ui + Radix UI (React 18)
- **State**: React Query (tRPC), useState, React Hook Form
- **i18n**: next-intl v4
- **Testing**: Playwright (E2E); unit tests not yet implemented
- **Monorepo**: Turborepo (pnpm 8.15.3)
- **Deployment**: Azure App Service (Docker Multi-stage)
- **CI/CD**: GitHub Actions (6 workflows)

> 完整依賴清單見 `docs/codebase-analyze/01-project-overview/tech-stack.md`

**Development Requirements:**
- **Node.js**: >= 20.0.0 (fixed at 20.11.0 via .nvmrc)
- **pnpm**: >= 8.0.0 (current: 8.15.3)
- **Docker**: Required for local PostgreSQL, Redis, Mailhog

---

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   │   ├── app/  # App Router pages (60 pages, 23 route modules)
│       │   │   ├── dashboard/              ✅ PM + Supervisor
│       │   │   ├── projects/               ✅ Full CRUD
│       │   │   ├── proposals/              ✅ Full CRUD + Approval
│       │   │   ├── budget-pools/           ✅ Full CRUD
│       │   │   ├── vendors/                ✅ Full CRUD
│       │   │   ├── quotes/                 ✅ List View (Post-MVP)
│       │   │   ├── purchase-orders/        ✅ Full CRUD
│       │   │   ├── expenses/               ✅ Full CRUD + Approval
│       │   │   ├── charge-outs/            ✅ Full CRUD (FEAT-005)
│       │   │   ├── data-import/            ✅ OM Excel Import (FEAT-008)
│       │   │   ├── project-data-import/    ✅ Project Excel Import (FEAT-010)
│       │   │   ├── om-expenses/            ✅ Full CRUD (FEAT-007 重構)
│       │   │   ├── om-expense-categories/  ✅ Full CRUD (FEAT-007)
│       │   │   ├── om-summary/             ✅ Report (CHANGE-004)
│       │   │   ├── operating-companies/    ✅ Full CRUD
│       │   │   ├── users/                  ✅ Full CRUD
│       │   │   ├── notifications/          ✅ List View (Epic 8)
│       │   │   ├── settings/               ✅ User Settings (Post-MVP)
│       │   │   ├── login/                  ✅ Azure AD + Local
│       │   │   ├── register/               ✅ Sign Up (Post-MVP)
│       │   │   └── forgot-password/        ✅ Password Reset (Post-MVP)
│       │   ├── components/           # 94 components (43 UI + 51 business)
│       │   │   ├── ui/               # 43 shadcn/ui components
│       │   │   ├── layout/           # Sidebar, TopBar, DashboardLayout
│       │   │   ├── dashboard/        # StatsCard, BudgetPoolOverview
│       │   │   ├── project/          # ProjectForm
│       │   │   ├── proposal/         # ProposalActions, CommentSection
│       │   │   ├── notification/     # NotificationBell, NotificationDropdown
│       │   │   ├── om-expense/       # OMExpenseForm, OMExpenseItemList (FEAT-007)
│       │   │   ├── om-summary/       # OMSummaryTable (CHANGE-004)
│       │   │   └── theme/            # ThemeToggle (Light/Dark/System)
│       │   ├── hooks/                # useTheme, useDebounce
│       │   └── lib/                  # tRPC client, utils (cn)
│       └── package.json
│
├── packages/
│   ├── api/              # tRPC backend routers (17 routers)
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── budgetPool.ts
│   │       │   ├── budgetProposal.ts
│   │       │   ├── chargeOut.ts          # FEAT-005
│   │       │   ├── currency.ts           # FEAT-001
│   │       │   ├── dashboard.ts
│   │       │   ├── expense.ts
│   │       │   ├── expenseCategory.ts    # FEAT-007
│   │       │   ├── health.ts             # Health Check API
│   │       │   ├── notification.ts       # Epic 8
│   │       │   ├── omExpense.ts          # FEAT-007 重構
│   │       │   ├── operatingCompany.ts
│   │       │   ├── project.ts
│   │       │   ├── purchaseOrder.ts
│   │       │   ├── quote.ts
│   │       │   ├── user.ts
│   │       │   ├── vendor.ts
│   │       │   └── permission.ts         # FEAT-011
│   │       └── lib/
│   │           └── email.ts          # EmailService (Epic 8)
│   ├── db/               # Prisma schema (32 models)
│   │   └── prisma/schema.prisma
│   ├── auth/             # NextAuth.js + Azure AD (Entra ID)
│   ├── eslint-config/    # Shared ESLint configuration
│   └── tsconfig/         # Shared TypeScript configuration
│
├── scripts/
│   ├── check-environment.js      # Automated env check (404 lines)
│   └── check-index-sync.js       # Index maintenance tool
│
├── docs/                          # Comprehensive documentation
├── claudedocs/                    # AI-generated analysis
├── .nvmrc                         # Node.js version: 20.11.0
├── DEVELOPMENT-SETUP.md           # Cross-platform setup guide (711 lines)
└── turbo.json                     # Turborepo configuration
```

**Key Architecture Patterns:**
- **packages/db**: Single source of truth for data models (Prisma schema)
- **packages/api**: All business logic and tRPC procedures live here
- **packages/auth**: Centralized authentication with NextAuth.js + Azure AD (Entra ID)
- **apps/web**: Consumes `packages/api` via tRPC, handles UI/UX

---

## Core Data Model

The application manages a 6-step workflow with 10+ Prisma models:

### 1. Authentication & User Management (Epic 1)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?   // bcrypt hash, null for Azure AD SSO users
  roleId        Int       @default(1)

  role          Role
  projects      Project[]  @relation("ProjectManager")
  approvals     Project[]  @relation("Supervisor")
  notifications Notification[]  // Epic 8
  accounts      Account[]       // NextAuth OAuth
  sessions      Session[]       // NextAuth sessions
}

model Account {
  // NextAuth.js OAuth accounts (Azure AD)
  provider          String  // "azure-ad"
  providerAccountId String
  // ... OAuth tokens
}

model Session {
  // NextAuth.js session management
  sessionToken String   @unique
  expires      DateTime
}

model VerificationToken {
  // NextAuth.js email verification
  identifier String
  token      String   @unique
  expires    DateTime
}

model Role {
  id    Int    @id
  name  String @unique  // "ProjectManager", "Supervisor", "Admin"
}
```

### 2. Budget & Project Workflow
```prisma
model BudgetPool {
  id            String   @id @default(uuid())
  name          String
  totalAmount   Float
  usedAmount    Float    @default(0)  // Real-time tracking (Epic 6.5)
  financialYear Int

  projects Project[]
}

model Project {
  id            String   @id @default(uuid())
  name          String
  budgetPoolId  String
  managerId     String
  supervisorId  String
  startDate     DateTime?
  endDate       DateTime?

  budgetPool  BudgetPool
  manager     User       @relation("ProjectManager")
  supervisor  User       @relation("Supervisor")
  proposals   BudgetProposal[]
}

model BudgetProposal {
  id          String   @id
  projectId   String
  amount      Float
  status      String   // Draft, PendingApproval, Approved, Rejected, MoreInfoRequired

  project  Project
  comments Comment[]
  history  History[]
}

model Comment {
  // Proposal discussion thread
  content String
}

model History {
  // Audit trail for proposals
  action String
}
```

### 3. Procurement & Vendor Management (Epic 5)
```prisma
model Vendor {
  id          String @id @default(uuid())
  name        String
  contactName String?
  email       String?
  phone       String?

  quotes         Quote[]
  purchaseOrders PurchaseOrder[]
}

model Quote {
  id        String @id @default(uuid())
  vendorId  String
  projectId String
  amount    Float
  filePath  String?  // Azure Blob Storage path

  vendor         Vendor
  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id        String @id
  projectId String
  vendorId  String
  quoteId   String?
  totalAmount Float
  poDate    DateTime

  project  Project
  vendor   Vendor
  quote    Quote?
  expenses Expense[]
}
```

### 4. Expense & Financial Tracking (Epic 6)
```prisma
model Expense {
  id              String @id @default(uuid())
  purchaseOrderId String
  amount          Float
  status          String  // Draft, PendingApproval, Approved, Paid
  expenseDate     DateTime
  invoiceNumber   String?
  invoiceFilePath String?

  purchaseOrder PurchaseOrder
}
```

### 5. Notification System (Epic 8)
```prisma
model Notification {
  id         String   @id @default(uuid())
  userId     String
  type       String   // PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, etc.
  title      String
  message    String
  link       String?
  isRead     Boolean  @default(false)
  emailSent  Boolean  @default(false)
  entityType String?  // PROPOSAL, EXPENSE, PROJECT
  entityId   String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Key Relationships:**
- User has roleId (ProjectManager/Supervisor/Admin)
- Project belongs to BudgetPool, has manager and supervisor (both User)
- BudgetProposal belongs to Project, has comments and audit history
- PurchaseOrder links Project, Vendor, and Quote
- Expense belongs to PurchaseOrder
- Notification belongs to User (Epic 8)

**Status Flows:**
- **BudgetProposal**: Draft → PendingApproval → Approved/Rejected/MoreInfoRequired
- **Expense**: Draft → PendingApproval → Approved → Paid

---

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AZURE credentials, NEXTAUTH_SECRET, etc.

# Start local services (Docker)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# (Optional) Seed database
pnpm db:seed

# Run environment check
pnpm check:env
```

### Daily Development
```bash
# Start all services (web app + Turborepo)
pnpm dev

# Start only Next.js app
pnpm dev --filter=web

# Run all tests
pnpm test

# Run specific workspace tests
pnpm test --filter=api

# Database operations
pnpm db:studio          # Open Prisma Studio GUI
pnpm db:migrate         # Create and apply migration
pnpm db:generate        # Regenerate Prisma Client
pnpm db:push            # Push schema changes (dev only)
pnpm db:seed            # Seed database with test data
```

### Building and Quality Checks
```bash
# Build all packages
pnpm build

# Lint all code
pnpm lint

# Type-check all packages
pnpm typecheck

# Format code
pnpm format
pnpm format:check
```

### Environment & Index Management (Post-MVP)
```bash
# One-click setup: install + generate + check
pnpm setup

# Check environment configuration
pnpm check:env

# Index maintenance (AI Assistant navigation)
pnpm index:check             # Basic sync check
pnpm index:check:incremental # Only check changed files
pnpm index:fix               # Auto-fix (use with caution)
pnpm index:health            # Complete health check
```

---

## Environment Variables

### Required Configuration

**Database** (⚠️ Note: Local Docker uses port **5434**, not 5432):
```bash
# Local Development (Docker Compose)
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"

# Azure Database for PostgreSQL
DATABASE_URL="postgresql://[user]:[pass]@[host].postgres.database.azure.com:5432/[db]?sslmode=require"
```

**NextAuth.js Authentication**:
```bash
NEXTAUTH_SECRET="..."  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SESSION_MAX_AGE=86400  # 24 hours
```

**Azure AD (Entra ID)** (Epic 1):
```bash
AZURE_AD_TENANT_ID="your-tenant-id-guid"
AZURE_AD_CLIENT_ID="your-client-id-guid"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_SCOPE="openid profile email User.Read"
```

**Email Service** (Epic 8):
```bash
# Production: SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="IT Project Management"

# Development: Mailhog (SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""
```

**Redis** (Session & Caching):
```bash
# Local Development
REDIS_URL="redis://localhost:6381"

# Azure Cache for Redis
REDIS_URL="rediss://[password]@[hostname]:6380"
```

**Azure Services**:
```bash
# Blob Storage (for file uploads)
AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccountname"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-account-key"
AZURE_STORAGE_CONTAINER_QUOTES="quotes"
AZURE_STORAGE_CONTAINER_INVOICES="invoices"
```

**Feature Flags** (Post-MVP):
```bash
NEXT_PUBLIC_FEATURE_AI_ASSISTANT=false          # Epic 9
NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION=false  # Epic 10
```

### Docker Service Ports (Local Development)
```bash
PostgreSQL:   localhost:5434 (mapped from 5432)
Redis:        localhost:6381 (mapped from 6379)
Mailhog SMTP: localhost:1025
Mailhog UI:   localhost:8025
```

**⚠️ Important**: All local Docker services use **non-standard ports** to avoid conflicts.

---

## Key Development Principles

### API Development (tRPC)
- **All API logic goes in `packages/api/src/routers/`**
- Create modular routers per domain (e.g., `project.ts`, `budgetPool.ts`, `notification.ts`)
- Merge all routers into `root.ts` (the root `appRouter`)
- Use **Zod** for strict input validation on all procedures
- Use `protectedProcedure` for authenticated routes (enforces `ctx.session.user`)
- Use `supervisorProcedure` for supervisor-only routes (Epic 1 RBAC)
- Example procedure structure:
  ```typescript
  export const projectRouter = createTRPCRouter({
    getById: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.project.findUnique({
          where: { id: input.id },
          include: { budgetPool: true, manager: true, supervisor: true }
        });
      }),
  });
  ```

### Database Schema (Prisma)
- **Schema is in `packages/db/prisma/schema.prisma`** - single source of truth
- After schema changes: run `pnpm db:migrate` to create migration
- Always regenerate Prisma Client: `pnpm db:generate`
- Use `@default(uuid())` for IDs, `@default(now())` for timestamps
- Leverage PostgreSQL features (e.g., JSONB) when needed

### Frontend Development
- **App Router structure** in `apps/web/src/app/` (Next.js 14+)
- Call backend via tRPC client from `lib/trpc.ts`:
  ```typescript
  const { data } = api.project.getById.useQuery({ id: "..." });
  ```
- **Component organization:**
  - `components/ui/` - shadcn/ui design system components (26 components)
  - `components/layout/` - Sidebar, TopBar, DashboardLayout
  - `components/dashboard/` - Business-specific dashboard components
  - `components/[feature]/` - Feature-specific business components
- Use **Tailwind CSS** for styling, **shadcn/ui + Radix UI** for accessible components
- Use **cn()** utility for className merging (from `lib/utils.ts`)
- State management: **React Query** (via tRPC) for server state, **useState** for local state, **React Hook Form** for forms
- Theme: Support Light/Dark/System modes via `useTheme()` hook

### Authentication (Epic 1)
- NextAuth.js + Azure AD (Entra ID) integration in `packages/auth`
- Dual authentication support:
  - **Azure AD SSO** (production)
  - **Email/Password** (local development)
- Access current user in tRPC context: `ctx.session.user`
- Protect routes using `protectedProcedure` middleware
- RBAC enforcement via `supervisorProcedure` and `adminProcedure`
- Session duration: 24 hours (configurable)

### Testing
- **E2E Tests**: Playwright
- **Unit/Component Tests**: Not yet implemented (Jest + React Testing Library planned)
- Focus on user behavior, not implementation details
- Test files colocate with source: `*.test.ts`, `*.spec.ts`

### Internationalization (I18N)
- **Framework**: next-intl with App Router
- **Supported Locales**: English (`en`), Traditional Chinese (`zh-TW`)
- **Translation Files**: `apps/web/src/messages/en.json`, `apps/web/src/messages/zh-TW.json`
- **Key Naming Convention**: `namespace.category.subcategory.field.property` (camelCase)
- **Component Usage**:
  ```typescript
  import { useTranslations } from 'next-intl';

  const t = useTranslations('namespace');
  <label>{t('form.name.label')}</label>
  ```

#### I18N Best Practices (CRITICAL - Prevents Duplicate Key Issues)

**🚨 Common Issues to Avoid:**
1. **Duplicate Keys**: JSON does not allow duplicate keys - later keys silently overwrite earlier ones
   - Always check for existing keys before adding new ones
   - Use line-by-line search, not just JSON.parse()
   - Example: Two "form" objects in same namespace will cause the first one to disappear

2. **Missing Keys in One Locale**: Both `en.json` and `zh-TW.json` must have identical structure
   - Same key paths in both files
   - Only translation values should differ
   - Use validation script to catch inconsistencies

3. **Hardcoded Chinese in Components**: Never hardcode Chinese text directly in JSX
   - Always use translation keys via `useTranslations()`
   - Hardcoded text breaks when switching locales

4. **Using Translation Keys Before They Exist**: When creating new components or using AI agents
   - Always verify translation keys exist before using them in code
   - Check both `en.json` and `zh-TW.json` for the key path
   - If key doesn't exist, add it to both files first, then use in code
   - Example: Using `t('messages.search')` when only `t('searchPlaceholder')` exists will cause IntlError

**Validation Workflow:**
```bash
# Always run validation before committing translation changes
pnpm validate:i18n

# What it checks:
# ✅ JSON syntax correctness
# ✅ Duplicate key detection (line-by-line parsing)
# ✅ Empty value detection
# ✅ Multi-locale key consistency
```

**Adding New Translation Keys:**
1. Check existing keys in both `en.json` and `zh-TW.json`
2. Add keys to both files with identical paths
3. Run `pnpm validate:i18n` to verify
4. Clear `.next/` cache if changes don't appear
5. Test in both English and Chinese modes

**Best Practices When Using AI Agents/Automated Tools:**
1. **Pre-check Before Using Keys**: AI agents should always verify key existence before using in code
   ```bash
   # Example: Check if key exists before using
   node -e "const data = require('./apps/web/src/messages/zh-TW.json'); console.log('Key exists:', !!data.common?.actions?.search);"
   ```
2. **Add Keys First, Use Second**: When creating new components:
   - Step 1: Add translation keys to both `en.json` and `zh-TW.json`
   - Step 2: Run `pnpm validate:i18n` to confirm
   - Step 3: Use the keys in component code
   - Never assume keys exist based on naming patterns
3. **Understand Translation Namespace Hierarchy**:
   - `useTranslations('common.actions')` → Access as `t('search')`
   - `useTranslations('common')` → Access as `t('actions.search')`
   - Using wrong namespace path causes "MISSING_MESSAGE" errors
4. **After Agent-Generated Code**: Always manually test pages that use new translation keys
   - Visit the actual page in browser
   - Check for IntlError in console
   - Test both language modes (en and zh-TW)

**Documentation:**
- Complete guide: `claudedocs/I18N-TRANSLATION-KEY-GUIDE.md`
- Validation script: `scripts/validate-i18n.js`
- Related fixes: FIX-074, FIX-075 (duplicate key issues)

---

## Epic Status & Feature Completion

### ✅ Epic 1: Azure AD (Entra ID) Authentication (100%)
- Azure AD SSO integration
- Email/Password local authentication
- NextAuth.js session management
- RBAC middleware (ProjectManager, Supervisor, Admin)
- Login, Register, Forgot Password pages

### ✅ Epic 2: Project Management (100%)
- Full CRUD for Projects
- Budget Pool assignment
- Manager & Supervisor assignment
- Project lifecycle tracking

### ✅ Epic 3: Budget Proposal Workflow (100%)
- Proposal creation and submission
- Approval workflow state machine
- Comment system
- Audit history tracking

### ✅ Epic 5: Procurement & Vendor Management (100%)
- Vendor CRUD
- Quote upload and comparison
- Purchase Order generation
- Vendor-Quote-PO linking

### ✅ Epic 6: Expense Recording & Financial Integration (100%)
- Expense CRUD with PO linking
- Approval workflow
- Invoice file upload
- Budget pool charge-out

### ✅ Epic 6.5: Budget Pool Real-time Tracking (100%)
- Real-time usedAmount updates
- Budget utilization monitoring
- Health status indicators

### ✅ Epic 7: Dashboard & Basic Reporting (100%)
- Project Manager dashboard (operational view)
- Supervisor dashboard (strategic overview)
- Budget Pool overview cards
- Data export (CSV)

### ✅ Epic 8: Notification System (100%)
- In-app notification center
- Email notifications (SendGrid + Mailhog)
- Notification types: Proposal & Expense status changes
- Read/Unread tracking
- Auto-refresh mechanism

### ✅ Post-MVP Enhancements (100%)
- Design system migration (shadcn/ui)
- 26 new UI components (Alert, Toast, Accordion, Form, Checkbox, etc.)
- Theme system (Light/Dark/System)
- 4 new pages (Quotes, Settings, Register, Forgot Password)
- Environment setup automation (DEVELOPMENT-SETUP.md, check-environment.js)
- Cross-platform deployment optimization
- Quality fixes (FIX-009 ~ FIX-099, 共 40+ bug fixes)
- **FEAT-007**: OM Expense 表頭-明細架構重構
  - 新增 OMExpenseItem 模型 (支援多明細項目)
  - 新增 6 個 API procedures (createWithItems, addItem, updateItem, removeItem, reorderItems, updateItemMonthlyRecords)
  - 新增 3 個前端組件 (OMExpenseItemForm, OMExpenseItemList, OMExpenseItemMonthlyGrid)
  - 支援拖曳排序 (@dnd-kit 整合)
- **FEAT-008**: OM Expense Data Import (Excel 數據導入)
  - 新增 data-import 頁面 (Excel 解析、預覽、批量導入)
  - 支援 xlsx/xls 格式解析 (xlsx 庫)
  - 表頭-明細關聯建立
  - 版本歷程: v1.0 → v1.1 (欄位映射優化) → v1.2 (驗證強化) → v1.3 (Bug 修復)
- **FEAT-009 ~ FEAT-012**: 後續功能增強
  - FEAT-009: OpCo 數據權限管理
  - FEAT-010: Project 數據導入
  - FEAT-011: Permission Management (Sidebar 權限過濾)
  - FEAT-012: 統一載入特效系統 (Spinner, LoadingButton, LoadingOverlay, GlobalProgress)
- **CHANGE-001 ~ CHANGE-041**: 41 項功能改進
  - CHANGE-001~004: OM Expense 來源追蹤、費用類別統一、OM Summary 顯示
  - CHANGE-005~011: i18n、Budget Pool 分類、Schema 同步、isOngoing 增強
  - CHANGE-012~019: Dashboard 改進、OM Summary 欄位優化、刪除功能增強
  - CHANGE-021~024: 各模組刪除確認對話框優化
  - CHANGE-028~032: OM Summary 預設 FY、搜尋功能、用戶密碼管理
  - CHANGE-033~036: UI 優化系列、登入頁簡化、專案詳情頁欄位增強

### 📋 Epic 9: AI Assistant (Planned)
- Intelligent budget suggestions during proposal phase
- Automated expense categorization
- Predictive budget risk alerting
- Auto-generate report summaries

### 📋 Epic 10: External System Integration (Planned)
- Sync expense data to ERP
- Sync user data from HR system
- Build data pipeline to data warehouse

---

## Documentation Structure

Comprehensive documentation exists in multiple locations:

### Primary Documentation
- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file (AI assistant guidance)
- `DEVELOPMENT-SETUP.md` - Complete cross-platform setup guide (711 lines)
- `docs/brief.md` - Project brief and problem statement
- `docs/prd/` - Product Requirements Documents
- `docs/fullstack-architecture/` - Complete technical architecture spec
- `docs/stories/` - Detailed user stories organized by epic
- `docs/front-end-spec.md` - Frontend specifications

### AI Assistant Navigation System
- `AI-ASSISTANT-GUIDE.md` - Quick reference for AI assistants
- `PROJECT-INDEX.md` - Complete file index (250+ files)
- `INDEX-MAINTENANCE-GUIDE.md` - Index maintenance strategy
- `DEVELOPMENT-LOG.md` - Development history and decisions
- `FIXLOG.md` - Bug fix records (FIX-009 ~ FIX-099, 40+ fixes)

### Analysis & Planning (claudedocs/)
- `DESIGN-SYSTEM-MIGRATION-PROGRESS.md` - Design system migration tracking
- `USER-FEEDBACK-ENHANCEMENTS-*.md` - User feedback implementation records
- `CLAUDE-MD-ANALYSIS-REPORT.md` - This file's analysis report

**Important**: Always consult `docs/fullstack-architecture/` for architectural decisions, data model details, and API design patterns before making significant changes.

---

## User Roles and Permissions

The system has role-based access control (RBAC):

| Role | Capabilities |
|------|--------------|
| **ProjectManager** | Create projects, submit proposals, record expenses, view own projects |
| **Supervisor** | Review/approve proposals, approve expenses, oversee all projects, access strategic dashboard |
| **Admin** | Full system access, user management (future) |

Role enforcement happens in:
1. **tRPC middleware**: `protectedProcedure`, `supervisorProcedure`, `adminProcedure`
2. **Frontend**: Role-based UI rendering
3. **Database**: User.roleId foreign key

---

## Code Generation and AI Assistance

This project is designed for AI-assisted development with production-quality code:

### Current AI Integration
- **BMad methodology**: Files in `.bmad-core/`, `.claude/`, `.cursor/`
- **Index navigation system**: 4-layer index for AI context loading
- **Automated checks**: `check-environment.js` for setup validation
- **Session management**: `/sc:load` and `/sc:save` for context persistence
- **ITPM Slash Commands**: `.claude/commands/itpm/` 跨電腦開發工作流指令

### ITPM Slash Commands（跨電腦開發工作流）

本專案支援在**兩台電腦間切換開發**，以下 slash commands 簡化日常操作：

| 指令 | 使用時機 | 功能 |
|------|---------|------|
| `/itpm:sync` | 切換到另一台電腦開始工作時 | 拉取最新代碼、安裝依賴、同步資料庫、啟動服務 |
| `/itpm:status` | 隨時快速檢查 | 一覽 Git / Docker / DB / Dev Server 狀態 |
| `/itpm:pre-commit` | 提交代碼前 | i18n 一致性、TypeScript、Lint 品質檢查 |
| `/itpm:push` | 結束開發離開前 | 提交變更並推送到 GitHub |
| `/itpm:init` | 全新電腦首次設置 | 完整初始化（Docker → 依賴 → DB → 種子資料） |

**典型工作流程**：
```
電腦 A 開始工作 → /itpm:sync
開發中隨時檢查 → /itpm:status
準備提交代碼   → /itpm:pre-commit
離開前推送     → /itpm:push
電腦 B 開始工作 → /itpm:sync
```

**初始化注意事項**（詳見 `docs/deployment/05-local-initialization-checklist.md`）：
- 種子資料 `pnpm --filter db db:seed` **必須執行**，否則 Sidebar 不顯示任何功能
- `.env` 中的 `NEXTAUTH_URL` Port 必須與實際運行 Port 一致
- 跨電腦遷移後須清除瀏覽器 cookies（避免舊 JWT session 錯誤）
- 用 `prisma db push` 同步 Schema 時，勿用 shell 直接更新密碼（`$` 符號會被轉義）

**測試帳號**（由種子資料建立）：

| 角色 | Email | 密碼 | 權限 |
|------|-------|------|------|
| Admin | `admin@itpm.local` | `admin123` | 全部 18 項功能 |
| ProjectManager | `pm@itpm.local` | `pm123` | 11 項核心業務 |
| Supervisor | `supervisor@itpm.local` | `supervisor123` | 17 項（除用戶管理） |

### AI Development Guidelines
- tRPC provides end-to-end type safety with zero API schema maintenance
- Prisma auto-generates types from schema - always regenerate after schema changes
- Use Zod schemas for runtime validation and TypeScript type inference
- All business logic in `packages/api`, not in frontend components
- Follow established patterns for consistency

---

## Critical Constraints

### Security
- **Never commit secrets** to the repository (`.env` is gitignored)
- Azure AD redirect URIs must be configured in Azure portal
- Use `protectedProcedure` for all authenticated routes
- Validate all user inputs with Zod schemas

### Architecture
- **Always use Turborepo commands** from root (`pnpm dev`, not `cd apps/web && npm run dev`)
- **Never modify Prisma Client manually** - it's auto-generated
- **Database migrations are immutable** in production
- **All business logic belongs in `packages/api`**, not frontend

### Development Workflow
- Clear Turborepo cache if builds behave strangely: `pnpm turbo clean`
- Regenerate Prisma Client after schema changes: `pnpm db:generate`
- Restart TypeScript server after API router changes
- Use `pnpm check:env` before starting development

---

## Deployment (Azure)

**Target Environment:**
- **Platform**: Azure App Service (staging + production slots)
- **CI/CD**: GitHub Actions
- **Database**: Azure Database for PostgreSQL 16 (managed service)
- **Storage**: Azure Blob Storage (file uploads)
- **Cache**: Azure Cache for Redis
- **Email**: SendGrid
- **Monitoring**: Azure Application Insights + Log Analytics

**Build Process:**
```bash
pnpm build    # Builds all packages
pnpm start    # Runs Next.js production server
```

---

## Common Gotchas

1. **Docker port mapping**: Local PostgreSQL uses **5434**, not 5432
2. **Turborepo caching**: Clear cache with `pnpm turbo clean` if builds fail
3. **Prisma Client sync**: Run `pnpm db:generate` after any schema change
4. **tRPC type errors**: Restart TypeScript server in IDE after API changes
5. **Environment variables**: Next.js public vars must be prefixed with `NEXT_PUBLIC_`
6. **Multiple dev servers**: Check `netstat -ano | findstr :300` to avoid port conflicts
7. **Email in dev**: Use Mailhog UI at http://localhost:8025 to view test emails

---

## Development Tools & Scripts

### Automated Environment Check
```bash
pnpm check:env
```
Validates 15+ environment requirements:
- Node.js version (>= 20.0.0)
- pnpm installation
- Docker daemon status
- .env file existence
- Required environment variables
- Dependencies installation
- Prisma Client generation
- Docker services (PostgreSQL, Redis, Mailhog)
- Database connection
- Port availability

### Index Maintenance
```bash
pnpm index:check    # Check index-file sync
pnpm index:health   # Complete health check
```
Maintains AI assistant navigation system (250+ indexed files).

### Quick Setup
```bash
pnpm setup
```
One-click: install dependencies + generate Prisma Client + check environment.

---

## Next Steps for New Contributors

1. **Setup Environment**: Follow `DEVELOPMENT-SETUP.md` (711 lines, cross-platform)
2. **Run Environment Check**: `pnpm check:env` to verify setup
3. **Read Documentation**:
   - `docs/brief.md` for business context
   - `docs/fullstack-architecture/` for technical architecture
   - `packages/db/prisma/schema.prisma` for data model
   - `AI-ASSISTANT-GUIDE.md` for AI assistant workflow
4. **Explore Codebase**:
   - `docs/stories/` for feature requirements
   - `PROJECT-INDEX.md` for file navigation
   - `DEVELOPMENT-LOG.md` for development history
5. **Start Development**: `pnpm dev` and access http://localhost:3000

---

## Project Metrics

**Code Statistics** (as of 2026-04-09, 來源：`docs/codebase-analyze/SUMMARY.md`):
- Total Core Code: ~73,500 lines
- Core Source Files: **258** (81 .ts + 155 .tsx + 22 .js)
- Business Components: **51** (~17,600 行)
- UI Components: **43** (~7,387 行)
- API Routers: **17** / Procedures: **200** (~16,979 行)
  - budgetPool, budgetProposal, chargeOut, currency, dashboard, expense, expenseCategory, health, notification, omExpense, operatingCompany, permission, project, purchaseOrder, quote, user, vendor
- Prisma Models: **32** / Indexes: **94** / Cascade 策略: **16**
  - User, Role, Account, Session, VerificationToken, Permission, RolePermission, UserPermission, BudgetPool, BudgetCategory, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, PurchaseOrderItem, Expense, ExpenseItem, ExpenseCategory, ChargeOut, ChargeOutItem, OMExpense, OMExpenseItem, OMExpenseMonthly, OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, ProjectBudgetCategory, Currency, Comment, History, Notification
- Pages: **60** (**23 route modules**)
- i18n: **2,706 keys** / **29 namespaces** (en + zh-TW 完全同步)
- Scripts: **40** (9 個類別)
- Mermaid Diagrams: **30**
- Documentation: **620** .md files
- Epic Completion: 8/8 MVP (100%) + Post-MVP + FEAT-007~012 + CHANGE-001~041 + FIX-101~137

**Development Timeline:**
- Sprint 0-8: MVP Phase 1 (Epic 1-8) ✅
- Sprint 9-10: Post-MVP Enhancements ✅
- Sprint 11: FEAT-007 OM Expense 表頭-明細重構 ✅
- Sprint 12: FEAT-008 OM Expense Data Import + CHANGE-005~011 ✅
- Sprint 13: FEAT-009~012 (OpCo 權限 / Project Import / Permission / Loading System) ✅
- Sprint 14: CHANGE-012~041 UX 改進系列 ✅
- Sprint 15: Codebase Analysis + FIX-101~137 (34 項安全/品質/UX 修復) ✅
- Sprint 16+: Epic 9-10 (Planned)

---

**Last Updated**: 2026-04-21
**Maintained By**: Development Team + AI Assistant
**Next Review**: After Epic 9-10 completion
