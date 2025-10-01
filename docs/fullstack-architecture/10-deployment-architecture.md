# 10. 部署架構 (Deployment Architecture)

### 10.1. 部署策略
*   **全端应用 (Next.js):** 整个 `apps/web` 应用将被容器化为 Docker 镜像，并部署到 **Azure App Service**。
*   **数据库 (PostgreSQL):** 使用 **Azure Database for PostgreSQL** 作为我们的数据库即服务 (DBaaS)。
*   **身份验证:** 使用 **Azure AD B2C** 提供的服务。
*   **文件存储:** 使用 **Azure Blob Storage**。
*   **CI/CD:** 使用 **GitHub Actions** 构建完整的 CI/CD 管道，将 Docker 镜像推送到 Azure Container Registry (ACR)，并触发 App Service 的更新。

### 10.2. CI/CD 管道
1.  **开发分支 (Feature Branch):** 当开发者推送一个新的分支到 GitHub 时，可以手动触发一个工作流，将其部署到一个临时的 "开发槽位" (Staging Slot) 中，用于测试和预览。
2.  **合并到主分支 (main):** 当一个 Pull Request 被合并到 `main` 分支时，GitHub Actions 会自动执行以下操作：
    a. 建置并测试整个 Monorepo。
    b. 将 Next.js 应用构建为一个优化的 Docker 镜像。
    c. 将该镜像推送到 Azure Container Registry (ACR)。
    d. 触发 Azure App Service 更新，从 ACR 拉取最新的镜像并部署到生产槽位中，实现零停机部署。

### 10.3. 環境
| 環境 | 應用 URL | 資料庫 | 身份验证 | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `localhost:3000` | 本地 Docker | Azure AD B2C (開發租戶) | 本地開發 |
| **Staging** | `(app-staging-url)` | Azure DB (Staging) | Azure AD B2C (開發租戶) | PR 審核與測試 |
| **Production** | `(app-production-url)` | Azure DB (Production) | Azure AD B2C (生產租戶) | 正式生產環境 |
