# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **IT Project Process Management Platform** - a greenfield full-stack web application built with the **T3 Stack** (Next.js + tRPC + Prisma + TypeScript). The platform aims to centralize and streamline IT department project workflows from budget allocation to expense charge-out, replacing fragmented manual processes (PPT/Excel/Email) with a unified, role-based system.

**Tech Stack:**
- **Framework**: Next.js 14+ (App Router)
- **API Layer**: tRPC 10.x (type-safe RPC)
- **Database ORM**: Prisma 5.x
- **Database**: Azure Database for PostgreSQL 16
- **Auth**: Azure AD B2C
- **Styling**: Tailwind CSS 3.x
- **Components**: Radix UI / Headless UI
- **State**: Zustand / Jotai
- **Testing**: Jest + React Testing Library, Playwright
- **Monorepo**: Turborepo (pnpm)
- **Deployment**: Azure App Service
- **CI/CD**: GitHub Actions

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   ├── app/      # App Router pages and routes
│       │   ├── components/   # Reusable UI components
│       │   ├── features/     # Business-specific components
│       │   ├── hooks/        # Custom React hooks
│       │   └── lib/          # Frontend utilities (tRPC client)
│       └── package.json
│
├── packages/
│   ├── api/              # tRPC backend routers and business logic
│   │   └── src/routers/  # tRPC route definitions
│   ├── db/               # Prisma schema and database client
│   │   └── prisma/schema.prisma
│   ├── auth/             # Azure AD B2C authentication logic
│   ├── eslint-config/    # Shared ESLint configuration
│   └── tsconfig/         # Shared TypeScript configuration
│
└── turbo.json            # Turborepo configuration
```

**Key Architecture Patterns:**
- **packages/db**: Single source of truth for data models (Prisma schema)
- **packages/api**: All business logic and tRPC procedures live here
- **packages/auth**: Centralized authentication with Azure AD B2C
- **apps/web**: Consumes `packages/api` via tRPC, handles UI/UX

## Core Data Model

The application manages a 6-step workflow:

1. **BudgetPool** - Financial year budget allocation
2. **Project** - Project entity with manager/supervisor assignment
3. **BudgetProposal** - Proposal with approval workflow (Draft → PendingApproval → Approved/Rejected/MoreInfoRequired)
4. **Vendor** + **Quote** - Vendor management and quote uploads
5. **PurchaseOrder** - Generated PO linking project, vendor, and selected quote
6. **Expense** - Invoice recording against PO with approval status

**Key Relationships:**
- User has roleId (ProjectManager/Supervisor/Admin)
- Project belongs to BudgetPool, has manager and supervisor (both User)
- BudgetProposal belongs to Project, has comments and audit history
- PurchaseOrder links Project and Vendor, has one Quote and many Expenses

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AZURE credentials, NEXTAUTH_SECRET, etc.

# Start local PostgreSQL (Docker)
docker-compose up -d

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm prisma db seed
```

### Daily Development
```bash
# Start all services (web app)
pnpm dev

# Start only Next.js app
pnpm dev --filter=web

# Run all tests
pnpm test

# Run specific workspace tests
pnpm test --filter=api

# Database operations
pnpm prisma studio          # Open Prisma Studio GUI
pnpm prisma migrate dev     # Create and apply migration
pnpm prisma generate        # Regenerate Prisma Client
pnpm prisma db push         # Push schema changes without migration (dev only)
```

### Building and Linting
```bash
# Build all packages
pnpm build

# Lint all code
pnpm lint

# Type-check all packages
pnpm typecheck
```

## Key Development Principles

### API Development (tRPC)
- **All API logic goes in `packages/api/src/routers/`**
- Create modular routers per domain (e.g., `project.ts`, `budgetPool.ts`, `proposal.ts`)
- Merge all routers into `_app.ts` (the root `appRouter`)
- Use **Zod** for strict input validation on all procedures
- Use `protectedProcedure` for authenticated routes (enforces `ctx.session.user`)
- Example procedure structure:
  ```typescript
  export const projectRouter = createTRPCRouter({
    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) => {
        return ctx.prisma.project.findUnique({ where: { id: input.id } });
      }),
  });
  ```

### Database Schema (Prisma)
- **Schema is in `packages/db/prisma/schema.prisma`** - single source of truth
- After schema changes: run `pnpm prisma migrate dev` to create migration
- Always regenerate Prisma Client: `pnpm prisma generate`
- Use `@default(uuid())` for IDs, `@default(now())` for timestamps
- Leverage PostgreSQL features (e.g., JSONB) when needed

### Frontend Development
- **App Router structure** in `apps/web/src/app/` (Next.js 14+)
- Call backend via tRPC client from `lib/trpc.ts`:
  ```typescript
  const { data } = api.project.getById.useQuery({ id: "..." });
  ```
- **Component organization:**
  - `components/` - Reusable, stateless UI primitives
  - `features/` - Domain-specific, stateful business components
- Use **Tailwind CSS** for styling, **Radix UI/Headless UI** for accessible base components
- State management: Use **Zustand** or **Jotai** for client state (prefer over Redux)

### Authentication
- Azure AD B2C integration handled in `packages/auth`
- Session management via NextAuth.js
- Access current user in tRPC context: `ctx.session.user`
- Protect routes using `protectedProcedure` middleware

### Testing
- **Unit/Component Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- Focus on user behavior, not implementation details
- Test files colocate with source: `*.test.ts`, `*.spec.ts`

## Environment Variables

Required in `.env`:
```bash
# Azure
AZURE_TENANT_ID="..."
AZURE_CLIENT_ID="..."
AZURE_CLIENT_SECRET="..."

# Azure AD B2C
AZURE_AD_B2C_CLIENT_ID="..."
AZURE_AD_B2C_CLIENT_SECRET="..."
AZURE_AD_B2C_TENANT_NAME="..."
AZURE_AD_B2C_PRIMARY_USER_FLOW="..."

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="..."  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Email (SendGrid)
SENDGRID_API_KEY="..."
```

## Documentation Structure

Comprehensive documentation exists in `docs/`:
- `docs/brief.md` - Project brief and problem statement
- `docs/prd/` - Product Requirements Documents
- `docs/fullstack-architecture/` - Complete technical architecture spec
- `docs/stories/` - Detailed user stories organized by epic
- `docs/front-end-spec.md` - Frontend specifications

**Important**: Always consult `docs/fullstack-architecture/` for architectural decisions, data model details, and API design patterns before making significant changes.

## User Roles and Permissions

The system has role-based access:
- **ProjectManager**: Creates projects, submits proposals, records expenses
- **Supervisor**: Reviews/approves proposals, oversees projects
- **Admin**: Full system access (future)

Role enforcement happens in tRPC middleware (`protectedProcedure`) and can check `ctx.session.user.role`.

## Workflow States

**BudgetProposal Status Flow:**
- Draft → PendingApproval → Approved/Rejected/MoreInfoRequired

**Expense Status Flow:**
- Draft → PendingApproval → Approved → Paid

Status transitions must be validated in tRPC procedures to maintain data integrity.

## Code Generation and AI Assistance

This is a greenfield project designed for AI-assisted development:
- BMad methodology files exist in `.bmad-core/`, `.claude/`, `.cursor/` (used by other AI tools)
- tRPC provides end-to-end type safety with zero API schema maintenance
- Prisma auto-generates types from schema - always regenerate after schema changes
- Use Zod schemas for runtime validation and TypeScript type inference

## Critical Constraints

- **Never commit secrets** to the repository (`.env` is gitignored)
- **Always use Turborepo commands** from the root (`pnpm dev`, not `cd apps/web && npm run dev`)
- **Never modify Prisma Client manually** - it's auto-generated
- **Database migrations are immutable** in production - use `prisma migrate` properly
- **tRPC procedures must validate inputs** with Zod schemas
- **All business logic belongs in `packages/api`**, not in frontend components

## Deployment (Azure)

- **Target**: Azure App Service (staging + production slots)
- **CI/CD**: GitHub Actions
- **Database**: Azure Database for PostgreSQL (managed service)
- **Storage**: Azure Blob Storage (for file uploads)
- **Monitoring**: Azure Monitor + Log Analytics

Build command: `pnpm build`
Start command: `pnpm start` (runs Next.js production server)

## Common Gotchas

1. **Turborepo caching**: If builds behave strangely, clear cache with `pnpm turbo clean`
2. **Prisma Client out of sync**: After any schema change, run `pnpm prisma generate`
3. **tRPC type errors**: Restart TypeScript server in IDE after API router changes
4. **Environment variables**: Next.js public vars must be prefixed with `NEXT_PUBLIC_`
5. **Azure B2C redirect URIs**: Must be configured in Azure portal to match `NEXTAUTH_URL`

## Next Steps for New Contributors

1. Read `docs/brief.md` for business context
2. Review `docs/fullstack-architecture/` for technical architecture
3. Understand the Prisma schema in `packages/db/prisma/schema.prisma`
4. Browse `docs/stories/` to see feature requirements
5. Set up local environment using commands above
6. Start with a single feature vertical (e.g., budget pool CRUD) to understand the full stack flow
