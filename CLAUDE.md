# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Last Updated**: 2025-10-26
> **Project Status**: Post-MVP Enhancement Phase (MVP 100% Complete)
> **Total Code**: ~30,000+ lines of core code
> **Epic Status**: Epic 1-8 ✅ Complete | Epic 9-10 📋 Planned
> **Language Preference**: 繁體中文 (Traditional Chinese) - AI assistants should communicate in Traditional Chinese by default

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

## Project Overview

This is an **IT Project Process Management Platform** - a **production-ready** full-stack web application built with the **T3 Stack** (Next.js + tRPC + Prisma + TypeScript). The platform centralizes and streamlines IT department project workflows from budget allocation to expense charge-out, replacing fragmented manual processes (PPT/Excel/Email) with a unified, role-based system.

### 🎯 Current Development Stage

**✅ MVP Phase 1: 100% Complete** (Epic 1-8)
- All 8 core Epics delivered and tested
- 18 full-featured pages implemented
- 46 UI components (26 design system + 20 business)
- ~30,000+ lines of production code

**✅ Post-MVP Enhancements: Complete**
- Design system migration (shadcn/ui + Radix UI)
- 4 new pages (Quotes, Settings, Register, Forgot Password)
- Environment deployment optimization
- Quality fixes (FIX-003, FIX-004, FIX-005)

**📋 Next Phase: Epic 9-10** (AI Assistant + External Integration)

---

## Tech Stack

**Core Framework:**
- **Framework**: Next.js 14.1.0 (App Router)
- **API Layer**: tRPC 10.x (type-safe RPC)
- **Database ORM**: Prisma 5.22.0
- **Database**: PostgreSQL 16 (Azure Database for PostgreSQL)
- **Auth**: NextAuth.js + Azure AD B2C
- **Styling**: Tailwind CSS 3.x
- **Components**: shadcn/ui + Radix UI
- **State**: Zustand / Jotai
- **Testing**: Jest + React Testing Library, Playwright
- **Monorepo**: Turborepo (pnpm 8.15.3)
- **Deployment**: Azure App Service
- **CI/CD**: GitHub Actions

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
│       │   ├── app/      # App Router pages (18 pages)
│       │   │   ├── dashboard/        ✅ PM + Supervisor
│       │   │   ├── projects/         ✅ Full CRUD
│       │   │   ├── proposals/        ✅ Full CRUD + Approval
│       │   │   ├── budget-pools/     ✅ Full CRUD
│       │   │   ├── vendors/          ✅ Full CRUD
│       │   │   ├── quotes/           ✅ List View (Post-MVP)
│       │   │   ├── purchase-orders/  ✅ List + Detail
│       │   │   ├── expenses/         ✅ Full CRUD + Approval
│       │   │   ├── users/            ✅ Full CRUD
│       │   │   ├── notifications/    ✅ List View (Epic 8)
│       │   │   ├── settings/         ✅ User Settings (Post-MVP)
│       │   │   ├── login/            ✅ Azure AD B2C + Local
│       │   │   ├── register/         ✅ Sign Up (Post-MVP)
│       │   │   └── forgot-password/  ✅ Password Reset (Post-MVP)
│       │   ├── components/
│       │   │   ├── ui/               # 26 shadcn/ui components
│       │   │   ├── layout/           # Sidebar, TopBar, DashboardLayout
│       │   │   ├── dashboard/        # StatsCard, BudgetPoolOverview
│       │   │   ├── project/          # ProjectForm
│       │   │   ├── proposal/         # ProposalActions, CommentSection
│       │   │   ├── notification/     # NotificationBell, NotificationDropdown
│       │   │   └── theme/            # ThemeToggle (Light/Dark/System)
│       │   ├── hooks/                # useTheme, useDebounce
│       │   └── lib/                  # tRPC client, utils (cn)
│       └── package.json
│
├── packages/
│   ├── api/              # tRPC backend routers (8 routers)
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── budgetPool.ts
│   │       │   ├── project.ts
│   │       │   ├── user.ts
│   │       │   ├── budgetProposal.ts
│   │       │   ├── vendor.ts
│   │       │   ├── quote.ts
│   │       │   ├── purchaseOrder.ts
│   │       │   ├── expense.ts
│   │       │   ├── dashboard.ts
│   │       │   └── notification.ts   # Epic 8
│   │       └── lib/
│   │           └── email.ts          # EmailService (Epic 8)
│   ├── db/               # Prisma schema (10+ models)
│   │   └── prisma/schema.prisma
│   ├── auth/             # NextAuth.js + Azure AD B2C
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
- **packages/auth**: Centralized authentication with NextAuth.js + Azure AD B2C
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
  password      String?   // bcrypt hash, null for Azure AD B2C users
  roleId        Int       @default(1)

  role          Role
  projects      Project[]  @relation("ProjectManager")
  approvals     Project[]  @relation("Supervisor")
  notifications Notification[]  // Epic 8
  accounts      Account[]       // NextAuth OAuth
  sessions      Session[]       // NextAuth sessions
}

model Account {
  // NextAuth.js OAuth accounts (Azure AD B2C)
  provider          String  // "azure-ad-b2c"
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

**Azure AD B2C** (Epic 1):
```bash
AZURE_AD_B2C_TENANT_NAME="yourtenantname"
AZURE_AD_B2C_TENANT_ID="your-tenant-id-guid"
AZURE_AD_B2C_CLIENT_ID="your-client-id-guid"
AZURE_AD_B2C_CLIENT_SECRET="your-client-secret"
AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signupsignin"
AZURE_AD_B2C_SCOPE="openid profile email offline_access"
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
SMTP_PASSWORD=""
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
- State management: Use **Zustand** or **Jotai** for client state (prefer over Redux)
- Theme: Support Light/Dark/System modes via `useTheme()` hook

### Authentication (Epic 1)
- NextAuth.js + Azure AD B2C integration in `packages/auth`
- Dual authentication support:
  - **Azure AD B2C SSO** (production)
  - **Email/Password** (local development)
- Access current user in tRPC context: `ctx.session.user`
- Protect routes using `protectedProcedure` middleware
- RBAC enforcement via `supervisorProcedure` and `adminProcedure`
- Session duration: 24 hours (configurable)

### Testing
- **Unit/Component Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
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

**Documentation:**
- Complete guide: `claudedocs/I18N-TRANSLATION-KEY-GUIDE.md`
- Validation script: `scripts/validate-i18n.js`
- Related fixes: FIX-074, FIX-075 (duplicate key issues)

---

## Epic Status & Feature Completion

### ✅ Epic 1: Azure AD B2C Authentication (100%)
- Azure AD B2C SSO integration
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
- Quality fixes (FIX-003, FIX-004, FIX-005)

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
- `FIXLOG.md` - Bug fix records (FIX-001 to FIX-005)

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
- Azure AD B2C redirect URIs must be configured in Azure portal
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

**Code Statistics** (as of 2025-10-25):
- Total Core Code: ~30,000+ lines
- Indexed Files: 250+ important files
- UI Components: 46 (26 design system + 20 business)
- API Routers: 10 (budgetPool, project, user, budgetProposal, vendor, quote, purchaseOrder, expense, dashboard, notification)
- Prisma Models: 10+ (User, Role, Account, Session, BudgetPool, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, Expense, Notification)
- Pages: 18 full-featured pages
- Epic Completion: 8/8 MVP (100%) + Post-MVP enhancements

**Development Timeline:**
- Sprint 0-8: MVP Phase 1 (Epic 1-8) ✅
- Sprint 9-10: Post-MVP Enhancements ✅
- Sprint 11+: Epic 9-10 (Planned)

---

**Last Updated**: 2025-10-25
**Maintained By**: Development Team + AI Assistant
**Next Review**: After Epic 9-10 completion
