# 系統架構圖

本文件描述 IT 專案流程管理平台的整體系統架構，包含 Monorepo 結構、各層之間的通訊方式、以及外部服務整合。

---

## 1. 高層系統架構

此圖展示整個平台的 Monorepo 組織與內部套件依賴。apps/web 是 Next.js 前端應用，透過 tRPC 呼叫 packages/api 的業務邏輯層，api 層再透過 Prisma ORM 存取 PostgreSQL 資料庫。packages/auth 提供 NextAuth.js 認證服務，被 web 和 api 同時使用。

```mermaid
graph TB
    subgraph "Turborepo Monorepo"
        subgraph "apps/"
            WEB["apps/web<br/>@itpm/web<br/>Next.js 14 App Router<br/>React 18 + Tailwind CSS<br/>shadcn/ui + Radix UI"]
        end

        subgraph "packages/"
            API["packages/api<br/>@itpm/api<br/>tRPC 10.x Routers<br/>17 個業務 Router<br/>Zod 輸入驗證"]
            DB["packages/db<br/>@itpm/db<br/>Prisma 5.x ORM<br/>31 個 Model<br/>PostgreSQL"]
            AUTH["packages/auth<br/>@itpm/auth<br/>NextAuth.js v5<br/>JWT Session<br/>Azure AD + Credentials"]
            TSCONFIG["packages/tsconfig<br/>@itpm/tsconfig<br/>共享 TypeScript 配置"]
            ESLINT["packages/eslint-config<br/>共享 ESLint 配置"]
        end
    end

    WEB -->|"tRPC Client<br/>@trpc/react-query"| API
    WEB -->|"auth()<br/>Session 檢查"| AUTH
    API -->|"ctx.prisma<br/>資料庫操作"| DB
    API -->|"ctx.session<br/>認證中介層"| AUTH
    AUTH -->|"prisma<br/>User 查詢/同步"| DB

    WEB -.->|"workspace:*"| TSCONFIG
    API -.->|"workspace:*"| TSCONFIG
    DB -.->|"workspace:*"| TSCONFIG

    classDef appNode fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef pkgNode fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef configNode fill:#6b7280,stroke:#4b5563,color:#fff

    class WEB appNode
    class API,DB,AUTH pkgNode
    class TSCONFIG,ESLINT configNode
```

---

## 2. 請求處理流程

此圖展示一個典型的 API 請求如何從瀏覽器經過各層最終到達資料庫，以及認證是如何在其中運作的。

```mermaid
sequenceDiagram
    participant Browser as 瀏覽器
    participant Next as Next.js<br/>App Router
    participant Middleware as middleware.ts<br/>路由保護
    participant RouteHandler as API Route Handler<br/>/api/trpc/[trpc]
    participant tRPC as tRPC Server<br/>Router + Procedure
    participant Prisma as Prisma Client
    participant PG as PostgreSQL

    Browser->>Next: HTTP Request
    Next->>Middleware: 路由檢查
    Middleware-->>Next: Session Cookie 驗證

    alt 未認證
        Middleware-->>Browser: 302 Redirect /login
    end

    Next->>RouteHandler: tRPC 請求
    RouteHandler->>RouteHandler: auth() 取得 Session
    RouteHandler->>tRPC: createInnerTRPCContext({ session })

    tRPC->>tRPC: protectedProcedure<br/>檢查 session.user
    tRPC->>tRPC: Zod 輸入驗證

    alt 驗證失敗
        tRPC-->>Browser: TRPCError UNAUTHORIZED / BAD_REQUEST
    end

    tRPC->>Prisma: ctx.prisma.entity.findMany()
    Prisma->>PG: SQL Query
    PG-->>Prisma: Result Set
    Prisma-->>tRPC: TypeScript 物件
    tRPC-->>RouteHandler: superjson 序列化
    RouteHandler-->>Browser: JSON Response
```

---

## 3. 外部服務整合

此圖展示平台與外部服務的整合方式。包含 Azure AD B2C 用於企業 SSO 登入、Azure Blob Storage 用於檔案上傳、SendGrid 用於生產環境郵件發送等。

```mermaid
graph LR
    subgraph "IT 專案管理平台"
        WEB["Next.js<br/>前端應用"]
        API["tRPC<br/>API 層"]
        AUTH["NextAuth.js<br/>認證層"]
    end

    subgraph "Azure 雲端服務"
        AAD["Azure AD B2C<br/>企業 SSO"]
        APGSQL["Azure PostgreSQL<br/>生產資料庫"]
        BLOB["Azure Blob Storage<br/>檔案儲存<br/>(quotes, invoices)"]
        REDIS_AZ["Azure Cache for Redis<br/>Session / 快取"]
        APPINS["Azure App Insights<br/>監控 + 日誌"]
    end

    subgraph "第三方服務"
        SG["SendGrid<br/>Email 服務<br/>(生產環境)"]
    end

    AUTH -->|"OAuth 2.0 / OIDC"| AAD
    API -->|"Prisma<br/>SSL 連線"| APGSQL
    WEB -->|"@azure/storage-blob<br/>檔案上傳"| BLOB
    API -->|"nodemailer<br/>SMTP"| SG
    WEB -.->|"Redis URL"| REDIS_AZ
    WEB -.->|"Telemetry"| APPINS

    classDef azure fill:#0078d4,stroke:#005a9e,color:#fff
    classDef thirdParty fill:#10b981,stroke:#059669,color:#fff
    classDef internal fill:#6366f1,stroke:#4f46e5,color:#fff

    class AAD,APGSQL,BLOB,REDIS_AZ,APPINS azure
    class SG thirdParty
    class WEB,API,AUTH internal
```

---

## 4. 本機開發環境 (Docker Compose)

此圖展示本機開發時由 docker-compose.yml 啟動的五個容器服務及其連接埠映射。所有服務使用非標準埠以避免衝突。

```mermaid
graph TB
    subgraph "開發者機器"
        DEV["Next.js Dev Server<br/>localhost:3000"]
    end

    subgraph "Docker Compose - itpm-network"
        PG["PostgreSQL 16 Alpine<br/>itpm-postgres-dev<br/>Port: 5434 → 5432<br/>DB: itpm_dev"]
        PGA["pgAdmin 4<br/>itpm-pgadmin<br/>Port: 5050 → 80"]
        RD["Redis 7 Alpine<br/>itpm-redis-dev<br/>Port: 6381 → 6379"]
        MH["Mailhog<br/>itpm-mailhog<br/>SMTP: 1025 → 1025<br/>Web UI: 8025 → 8025"]
        AZ["Azurite<br/>itpm-azurite-dev<br/>Blob: 10000 → 10000<br/>Queue: 10001<br/>Table: 10002"]
    end

    DEV -->|"DATABASE_URL<br/>postgresql://postgres:localdev123<br/>@localhost:5434/itpm_dev"| PG
    DEV -->|"REDIS_URL<br/>redis://localhost:6381"| RD
    DEV -->|"SMTP_HOST:SMTP_PORT<br/>localhost:1025"| MH
    DEV -->|"Azure Storage Emulator<br/>localhost:10000"| AZ
    PGA -->|"postgres:5432"| PG

    classDef docker fill:#2496ed,stroke:#1a6db3,color:#fff
    classDef dev fill:#f59e0b,stroke:#d97706,color:#fff

    class PG,PGA,RD,MH,AZ docker
    class DEV dev
```

---

## 5. 部署架構 (Azure App Service)

此圖展示生產環境的 Azure 部署架構，以及 CI/CD 流程。

```mermaid
graph TB
    subgraph "開發者"
        GIT["GitHub Repository"]
    end

    subgraph "CI/CD"
        GHA["GitHub Actions<br/>Build + Test + Deploy"]
    end

    subgraph "Azure 生產環境"
        subgraph "App Service"
            STAGING["Staging Slot"]
            PROD["Production Slot<br/>Next.js + tRPC"]
        end

        APGSQL["Azure Database<br/>for PostgreSQL 16"]
        BLOB["Azure Blob Storage"]
        REDIS_AZ["Azure Cache<br/>for Redis"]
        SG["SendGrid"]
        AAD["Azure AD B2C"]
        AI["Application Insights<br/>+ Log Analytics"]
    end

    GIT -->|"push / PR merge"| GHA
    GHA -->|"pnpm build"| STAGING
    STAGING -->|"slot swap"| PROD

    PROD -->|"Prisma"| APGSQL
    PROD -->|"File Upload"| BLOB
    PROD -->|"Session Cache"| REDIS_AZ
    PROD -->|"Email"| SG
    PROD -->|"OAuth SSO"| AAD
    PROD -->|"Telemetry"| AI

    classDef cicd fill:#f97316,stroke:#ea580c,color:#fff
    classDef azure fill:#0078d4,stroke:#005a9e,color:#fff
    classDef git fill:#24292e,stroke:#1b1f23,color:#fff

    class GIT git
    class GHA cicd
    class STAGING,PROD,APGSQL,BLOB,REDIS_AZ,SG,AAD,AI azure
```

---

## 6. Turborepo 建構管線

此圖展示 turbo.json 中定義的建構任務依賴關係。build 任務具有 `^build` 依賴，意味著子套件必須先建構完成。

```mermaid
graph LR
    subgraph "turbo.json pipeline"
        BUILD["build<br/>dependsOn: ^build<br/>outputs: .next/**, dist/**"]
        DEV["dev<br/>cache: false<br/>persistent: true"]
        LINT["lint<br/>dependsOn: ^lint"]
        TC["typecheck<br/>dependsOn: ^typecheck"]
        TEST["test<br/>dependsOn: ^build<br/>outputs: coverage/**"]
        DBGEN["db:generate<br/>cache: false"]
        DBMIG["db:migrate<br/>cache: false"]
    end

    DBGEN --> BUILD
    BUILD --> TEST

    classDef task fill:#a855f7,stroke:#7e22ce,color:#fff
    class BUILD,DEV,LINT,TC,TEST,DBGEN,DBMIG task
```

建構順序：
1. `packages/tsconfig` (無依賴)
2. `packages/db` → `db:generate` (Prisma Client)
3. `packages/auth` (依賴 db)
4. `packages/api` (依賴 db, auth)
5. `apps/web` (依賴 api, auth, db)
