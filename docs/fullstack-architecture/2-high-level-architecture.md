# 2. 高層次架構 (High-Level Architecture)

### 2.1. 技術摘要

本平台將是一個基於 **Next.js** 的全端 Web 應用，部署在 **Microsoft Azure** 平台上。後端邏輯將透過 **tRPC** API 實現，直接與部署在 **Azure Database for PostgreSQL** 上的資料庫進行互動。前端將使用 **Tailwind CSS** 進行樣式設計。整個專案將採用 **Turborepo** 管理的 **Monorepo** 結構，確保前後端程式碼和共享類型的統一管理。

### 2.2. 架構圖

```mermaid
graph TD
    subgraph "使用者瀏覽器"
        A[Next.js 前端應用]
    end

    subgraph "Azure 平台"
        A -- HTTPS --> F[Azure Front Door / CDN]
        F -- tRPC --> B[Next.js 全端應用 on Azure App Service]
        B -- SQL (Prisma Client) --> C[Azure Database for PostgreSQL]
        B -- OAuth 2.0 --> D[Azure AD B2C 身份驗證]
        B -- API --> E[郵件發送服務 (e.g., SendGrid)]
        B -- SAS Token --> G[Azure Blob Storage (文件上傳)]
    end

    style A fill:#BDEBFF
    style B fill:#BDEBFF
    style C fill:#D5E8D4
    style D fill:#D5E8D4
    style E fill:#F8CECC
    style F fill:#FFE6CC
    style G fill:#D5E8D4
```

### 2.3. 核心技術決策

*   **部署平台 (Azure App Service):** 提供了一个强大、可扩展且与 Azure 生态系统深度集成的环境来托管我们的 Next.js 应用。它支持自定义域名、SSL、自动扩展和便捷的部署槽位 (Deployment Slots) 功能。
*   **数据库 (Azure Database for PostgreSQL):** Azure 的官方 PostgreSQL 托管服务，提供了企业级的安全性、高可用性和自动备份功能，是我们在 Azure 环境中最可靠的选择。
*   **身份验证 (Azure AD B2C):** 为我们的应用提供了强大、安全且可高度自定义的身份即服务 (Identity as a Service)。它使我们能够轻松实现电子邮件/密码注册登录，并为未来集成社交登录或企业联合身份验证（SAML/SSO）奠定了基础。
*   **Monorepo 工具 (Turborepo):** Vercel 开发的 Turborepo 是一個高性能的 Monorepo 管理工具，它可以顯著提升我們的建置和測試速度，特別適合管理包含前後端和共享套件的複雜專案。
