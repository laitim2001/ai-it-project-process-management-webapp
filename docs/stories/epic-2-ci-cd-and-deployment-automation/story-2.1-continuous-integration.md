# Story 2.1: 持續整合 (Continuous Integration)

> **🔴 MVP Priority: Phase 1** - 開發品質的基石，自動化第一步
> **⏱️ 預估工作量**: 1-2 天
> **👥 需要角色**: DevOps 工程師, 全端開發者

## User Story

身為開發團隊，
我想要每當有新的程式碼提交到版本控制系統時，系統能自動執行程式碼風格檢查和單元測試，
以便及早發現潛在的錯誤，確保程式碼庫的品質與穩定性。

## 背景說明

持續整合 (CI) 是現代軟體開發的核心實踐。透過自動化檢查與測試，我們可以在開發週期的最早階段捕捉到問題，避免 bug 進入主要分支。這不僅能提升程式碼品質，也能增強開發團隊的信心，讓大家可以更快速、更安全地進行重構和功能開發。

## 技術規格 (初步建議)

*   **CI 平台選型:** 使用 **GitHub Actions**。它與 GitHub 儲存庫原生整合，配置簡單（透過 YAML 檔案），且提供大量可重用的開源 Actions。
*   **觸發機制:**
    *   在 `main` 和 `develop` 分支上，每當有 `push` 事件時觸發。
    *   在所有分支上，每當有 `pull_request` 事件（開啟、同步）時觸發。
*   **工作流 (Workflow) 設計:**
    *   在 `.github/workflows/ci.yml` 中定義工作流。
    *   **作業 (Job) 1: Linting & Formatting:**
        *   使用 `pnpm lint`（假設在根 `package.json` 中定義了此腳本）來檢查整個 Monorepo 的程式碼風格。
        *   可以加入一個格式檢查步驟，例如 `pnpm format:check`。
    *   **作業 (Job) 2: Unit Testing:**
        *   使用 `pnpm test:unit`（假設定義了此腳本）來運行所有單元測試。
        *   此作業應依賴 (needs) `Linting & Formatting` 作業，確保只有在程式碼風格正確時才運行測試。
*   **快取 (Caching):**
    *   使用 `actions/cache` 來快取 `node_modules` 目錄，可以大幅縮短後續 CI 運行的時間。

## 驗收標準

### 1. 工作流配置：
*   在專案的 `.github/workflows/` 目錄下，存在一個名為 `ci.yml` (或類似名稱) 的工作流設定檔。
*   該設定檔的語法是有效的 YAML。

### 2. 自動觸發：
*   當開發者向一個 Pull Request 推送新的 commit 時，GitHub Actions 中會自動啟動一個對應的 CI 檢查。
*   當一個 Pull Request 被合併到 `main` 或 `develop` 分支時，會再次觸發 CI 流程。

### 3. 流程執行：
*   CI 流程能成功地 `checkout` 程式碼並安裝所有 `pnpm` 依賴。
*   流程會自動執行程式碼風格檢查 (Linting)。如果檢查失敗，整個工作流會被標記為「失敗」。
*   流程會自動執行所有單元測試。如果任何一個測試案例失敗，整個工作流會被標記為「失敗」。
*   只有當所有步驟都成功時，工作流才會被標記為「成功」。

### 4. 結果通知：
*   開發者可以在 GitHub 的 Pull Request 頁面直接看到 CI 檢查的狀態（進行中、成功或失敗）。
*   如果 CI 失敗，開發者應該能夠輕易地點擊進入日誌 (logs)，查看是哪個具體的步驟（例如哪個 linting 規則或哪個測試）導致了失敗。

## 技術債務考量
*   **測試覆蓋率報告:** MVP 階段的 CI 暫不包含測試覆蓋率的計算與報告。未來可以整合 `Codecov` 或 `Coveralls` 等工具來追蹤覆蓋率的變化。
*   **建置與整合測試:** 此故事專注於 Linting 和單元測試。將應用程式建置 (Build) 和運行更耗時的整合測試 (Integration Tests) 的步驟，可以放在 **Story 2.2 (持續部署)** 中，或在未來建立一個獨立的、更全面的測試工作流。

