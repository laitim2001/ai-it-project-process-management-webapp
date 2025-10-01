# Story 2.2: 持續部署 (Continuous Deployment)

> **🔴 MVP Priority: Phase 1** - 實現快速交付與驗證的關鍵
> **⏱️ 預估工作量**: 2-3 天
> **👥 需要角色**: DevOps 工程師, 全端開發者

## User Story

身為開發團隊，
我想要當程式碼成功合併到 `main` 分支後，系統能自動將應用程式部署到一個測試環境 (Staging Environment)，
以便我們可以快速地向利害關係人展示最新功能，並在一個接近生產的環境中進行驗證。

## 背景說明

持續部署 (CD) 是 CI/CD 流程的自然延伸。它的核心價值在於將「程式碼完成」到「功能上線可供測試」之間的延遲降至最低。一個可靠的自動化部署流程，可以極大地加速回饋循環，讓我們能更快地迭代產品。

## 技術規格 (初步建議)

*   **部署目標平台:** 選擇一個易於部署和管理的平台。**Vercel** 對於 Next.js 前端是絕佳選擇，它原生支持自動部署。後端 API 可以部署到 **Vercel Serverless Functions** 或另一個 PaaS 平台如 **Render** 或 **Heroku**。
*   **觸發機制:**
    *   在 GitHub Actions 中，設定一個新的工作流 `cd.yml` (或在 `ci.yml` 中新增一個 job)，使其在程式碼成功 `push` 到 `main` 分支後觸發。
*   **工作流 (Workflow) 設計:**
    *   **依賴:** 此 CD 流程必須依賴 (needs) CI 流程（Linting 和 Unit Testing）的成功。
    *   **作業 1: Build:**
        *   執行 `pnpm build` 來建置前端和後端的生產版本 (production build)。
    *   **作業 2: Deploy:**
        *   使用平台對應的 CLI 工具或 Action 來進行部署（例如 `Vercel CLI` 或 `vercel-action`）。
        *   需要安全地設定 `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 和 `VERCEL_TOKEN` 等 secrets。
        *   後端部署可能需要類似的 secrets 設定。
*   **環境變數管理:**
    *   測試環境 (Staging) 的環境變數（如 `DATABASE_URL`）應儲存在部署平台（如 Vercel）的環境變數設定中，而不是版本控制系統中。

## 驗收標準

### 1. 工作流配置：
*   在專案的 `.github/workflows/` 目錄下，存在一個用於部署的 YAML 設定檔。
*   部署所需的 secrets (如平台 token) 已安全地設定在 GitHub 儲存庫的 `Settings > Secrets and variables > Actions` 中。

### 2. 自動部署：
*   當一個 Pull Request 成功合併到 `main` 分支後，部署工作流會自動啟動。
*   工作流會先等待 CI 流程（Linting 和測試）成功完成。
*   工作流能成功地建置前端和後端的生產版本。
*   工作流能成功地將應用程式部署到指定的測試環境 URL。

### 3. 部署結果：
*   部署完成後，可以在一個公開的 URL 上訪問到最新版本的前端應用程式。
*   部署到測試環境的後端 API 可以被前端成功呼叫。
*   整個部署過程的日誌都可以在 GitHub Actions 中查看。

## 技術債務考量
*   **生產環境部署 (Deployment to Production):** MVP 階段的自動化部署只針對測試環境 (Staging)。部署到正式生產環境 (Production) 的流程，在初期可以暫時採用手動觸發（例如，在 GitHub 上建立一個 release tag），以增加一層控制和保障。
*   **資料庫遷移 (Database Migration):** 此故事的部署流程暫不包含資料庫結構的自動遷移。在部署新版本時，如果包含了資料庫變更，目前需要手動在對應的環境中執行 `prisma migrate deploy`。未來可以將此步驟整合到 CD 流程中，但需要謹慎處理以防出錯。
*   **零停機部署 (Zero-Downtime Deployment):** 目前的部署方式可能會導致短暫的服務中斷。實現藍綠部署 (Blue-Green Deployment) 或金絲雀發布 (Canary Releases) 等更高級的零停機策略，可以在後續進行優化。
