# Story 1.3: 核心認證與用戶管理服務 - 註冊與登入功能

> **🔴 MVP Priority: Phase 1** - 核心基礎功能，所有其他功能的先決條件
> **⏱️ 預估工作量**: 2-3 天
> **👥 需要角色**: 後端開發者, 前端開發者

## User Story

身為一位新使用者，
我想要能夠註冊一個帳號並登入系統，
以便我可以開始使用平台。

## 背景說明
使用者認證是整個平台的安全入口。此功能是 Epic 1 的核心交付成果。

## 技術規格 (初步建議)
*   **前端:** 使用 React 建立註冊/登入頁面，使用 `React Hook Form` + `zod` 進行客戶端驗證，`axios` 發起請求，使用 `HttpOnly cookie` 或 `localStorage` 儲存 JWT。
*   **後端:** 建立 `POST /api/auth/register` 和 `POST /api/auth/login` 端點。使用 `bcrypt` 進行密碼雜湊。使用 `@nestjs/jwt` 生成 JWT。
*   **資料庫:** 使用 Prisma Client 進行使用者資料的創建和查詢。

## 驗收標準
**1. 註冊功能：**
- 提供 `/register` 路由及表單。
- 前後端都會驗證輸入（email 格式、密碼長度、密碼一致性）。
- Email 已存在時返回 `409 Conflict`。
- 註冊成功後，雜湊後的密碼存入資料庫，返回 `201 Created`。
**2. 登入功能：**
- 提供 `/login` 路由及表單。
- 憑證不正確時返回 `401 Unauthorized`。
- 登入成功後返回包含 JWT 的 `200 OK` 回應。
- 前端儲存 JWT 並在後續請求的 `Authorization` 標頭中攜帶。
**3. 安全性：**
- 密碼使用 `bcrypt` 雜湊。
- 登入驗證使用 `bcrypt.compare`。
- API 強制使用 HTTPS。
**4. 使用者體驗：**
- 成功後自動重新導向到儀表板。
- 錯誤訊息對使用者友好。

## 技術債務考量
- **暫不包含：** 第三方登入、忘記密碼、記住我、Email 驗證。這些將在後續迭代。
