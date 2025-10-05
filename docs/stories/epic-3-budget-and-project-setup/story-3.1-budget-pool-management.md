# Story 3.1: 資金池 (Budget Pool) 管理

> **🔴 MVP Priority: Phase 1** - 核心業務數據的起點
> **⏱️ 預估工作量**: 2-3 天
> **👥 需要角色**: 後端開發者, 前端開發者

## User Story

身為部門主管，
我想要一個管理介面來建立和查看每一財政年度 (Fiscal Year) 的資金池分類，
以便我可以設定好年度的總體預算結構，為所有專案的資金來源打下基礎。

## 背景說明

資金池 (Budget Pool) 是整個預算管理流程的頂層結構。在任何專案可以被建立或提案之前，必須先有明確的資金來源分類。此功能旨在為高層管理者提供一個簡單、清晰的介面來定義這些分類，確保所有後續的財務活動都有據可循。

## 技術規格 (初步建議)

*   **資料庫模型 (Prisma Schema):**
    *   在 `schema.prisma` 中新增一個 `BudgetPool` 模型。
    *   `BudgetPool` 模型至少應包含：
        *   `id`: `Int` (主鍵)
        *   `fiscalYear`: `String` (例如 "FY-25")
        *   `categoryName`: `String`
        *   `categoryBudgetAmount`: `Decimal` (或 `Float`)
        *   `categoryBudgetRemain`: `Decimal` (或 `Float`)
*   **後端 (NestJS):**
    *   建立一個新的模組 `BudgetPoolModule`。
    *   建立 `BudgetPoolController`，並設定 API 端點，需受 **角色權限 (RolesGuard)** 保護，僅限 `SUPERVISOR` 角色訪問。
        *   `POST /api/budget-pools`: 建立一個新的預算分類。
        *   `GET /api/budget-pools`: 獲取所有預算分類的列表。
    *   建立 `BudgetPoolService` 來處理業務邏輯，使用 Prisma Client 與資料庫互動。
    *   建立 DTOs (Data Transfer Objects) 來驗證傳入的請求數據。
*   **前端 (Next.js):**
    *   建立一個新的頁面，路由為 `/supervisor/budget-pools`，此路由需受**前端角色權限**保護。
    *   頁面包含一個表單，用於新增預算分類。
    *   頁面包含一個表格，用於顯示所有已建立的預算分類列表。
    *   建立對應的 API 服務函數，用於呼叫後端的 `POST` 和 `GET` 端點。

## 驗收標準

### 1. 資料庫與後端：
*   成功執行 `prisma migrate dev` 後，資料庫中已建立 `BudgetPool` 資料表。
*   `POST /api/budget-pools` 端點：
    *   只有 `SUPERVISOR` 角色的使用者可以成功呼叫。
    *   `MANAGER` 角色的使用者呼叫時會返回 `403 Forbidden`。
    *   成功建立後，`categoryBudgetRemain` 的值必須等於 `categoryBudgetAmount`。
*   `GET /api/budget-pools` 端點：
    *   只有 `SUPERVISOR` 角色的使用者可以成功呼叫並獲取列表。
    *   返回的數據應包含所有 `BudgetPool` 模型中定義的欄位。

### 2. 前端介面：
*   只有 `SUPERVISOR` 角色的使用者登入後，才能在導航欄中看到並訪問「Budget Pool 管理」頁面。
*   在頁面上，主管可以成功填寫表單並建立一個新的預算分類。
*   建立成功後，頁面上的表格會自動更新，顯示新建立的項目。
*   表格應清晰地展示 `財年`、`分類名稱`、`總預算` 和 `剩餘預算` 等關鍵資訊。

## 技術債務考量
*   **編輯與刪除功能:** MVP 階段，為了簡化流程和確保數據完整性，我們暫不提供預算分類的「編輯」和「刪除」功能。一旦建立，就不能修改。這是一個強約束，可以促使在建立時更加謹慎。相關的修改功能可以在後續版本中，根據實際需求再增加更複雜的權限控制。
*   **貨幣與精度:** MVP 階段預設所有金額為單一貨幣，並使用標準浮點數。未來如果需要支援多幣種或更高的財務精度，需要對資料庫模型 (`Decimal`) 和後端處理邏輯進行升級。

