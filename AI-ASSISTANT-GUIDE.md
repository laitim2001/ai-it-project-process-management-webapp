# 🤖 IT 專案流程管理平台 - AI 助手快速參考指南

> **目的**: 為 AI 助手提供最清晰、最高效的專案導航和開發指引
> **重要**: ⚠️ AI 助手每次進入專案時必讀此文件
> **更新頻率**: 每個 Sprint 完成時更新狀態和進度

---

## 📋 快速導航

- [🚨 立即執行區 - AI 助手必讀](#-立即執行區---ai-助手必讀)
- [📊 專案當前狀態 (MVP Phase 1 - 5%)](#-專案當前狀態-mvp-phase-1---5)
- [🎯 專案核心信息](#-專案核心信息)
- [🔄 AI 助手標準工作流程](#-ai-助手標準工作流程)
- [📁 重要文件快速索引](#-重要文件快速索引)
- [🔍 常見查詢快速指南](#-常見查詢快速指南)
- [🚀 開發指令快速參考](#-開發指令快速參考)

---

## 🚨 立即執行區 - AI 助手必讀

> **🤖 如果你是 AI 助手，正在閱讀此文件，請立即停止其他處理並執行以下指令：**

### ✅ **第一優先級：立即完成的 3 個核心動作**

```bash
🟦 第1步：切換到中文對答模式（如果還沒有）
🟦 第2步：讀取 PROJECT-INDEX.md 了解完整專案結構
🟦 第3步：制定或更新 todos list（每次必須）
```

### 🔴 **強制執行規則（不可妥協）**

- **🇨🇳 語言**: 永遠保持用中文對答，即使在 conversation compact 之後
- **📋 上下文**: 每次都先檢查主要項目索引，理解未完成事項
- **📝 規劃**: 永遠先制定 todos list 才開始開發動作
- **💬 註釋**: 所有檔案都要加入完整中文註釋說明功能和用途
- **📊 記錄**: 每個 todos 完成後更新 DEVELOPMENT-LOG.md（最新記錄放最上面）

### 🔄 **完整工作流程（每次必須遵循）**

#### **📥 開發前準備（每次必須）**
1. ✅ 檢查 `AI-ASSISTANT-GUIDE.md`（當前文件）- 重讀執行指令
2. ✅ 檢查 `PROJECT-INDEX.md` - 理解項目結構和重要文件
3. ✅ 檢查 `DEVELOPMENT-LOG.md` 開頭部分 - 了解最新開發狀況
4. ✅ 制定或更新 todos list

#### **🛠️ 開發過程中（持續遵循）**
1. ✅ 每個檔案都加入完整中文註釋
2. ✅ 留意報錯和超時事件，確保處理完成
3. ✅ 使用 `npm run index:check` 檢查索引健康狀態

#### **📋 每個 todo 完成後（強制執行）**
1. ✅ 更新 `DEVELOPMENT-LOG.md`（最新記錄放文件最上面）
2. ✅ 如有 bug fix，更新 `FIXLOG.md`（最新記錄放最上面）
3. ✅ 執行索引維護（如有新增重要文件）
4. ✅ 與用戶確認改動是否接受
5. ✅ 確認後同步到 GitHub

---

## 📊 專案當前狀態 (MVP Phase 1 - 100% ✅)

### **🎯 Phase 1: 專案初始化** - ✅ 100% 完成 (2025-10-02)

| 功能模組 | 完成度 | 代碼行數 | 狀態 |
|---------|-------|----------|------|
| Monorepo 架構設置 | 100% | ~500行 | ✅ 完成 |
| Next.js 14 應用初始化 | 100% | ~800行 | ✅ 完成 |
| Prisma 資料庫架構 | 100% | ~400行 | ✅ 完成 |
| tRPC API 層建立 | 100% | ~600行 | ✅ 完成 |
| Budget Pool CRUD | 100% | ~1,200行 | ✅ 完成 |
| UI 元件庫（Radix UI） | 100% | ~1,500行 | ✅ 完成 |
| Docker 開發環境 | 100% | ~300行 | ✅ 完成 |

**總代碼量**: ~5,300行核心代碼

### **🎯 Phase 1.5: 核心業務功能** - ✅ 100% 完成 (2025-10-03)

| 功能模組 | 完成度 | 代碼行數 | 狀態 |
|---------|-------|----------|------|
| User 管理系統 | 100% | ~1,500行 | ✅ 完成 |
| Project CRUD (Epic 2) | 100% | ~1,850行 | ✅ 完成並測試 |
| BudgetProposal 審批工作流 | 100% | ~2,000行 | ✅ 完成 |

**總代碼量**: ~5,350行核心業務代碼 (+650行 Epic 2 修復與完善)

### **🔄 Phase 2: MVP 功能開發** - ✅ 100% 完成

| Epic | 功能模組 | 完成度 | 狀態 | 實際時間 |
|------|---------|-------|------|----------|
| **Epic 1** | **Azure AD B2C 認證** | **100%** | **✅ 完成** | 0.5 週 |
| **Epic 2** | **專案管理功能** | **100%** | **✅ 完成並測試** | 2 週 |
| **Epic 3** | **提案審批工作流** | **100%** | **✅ 完成並修復** | 2 週 |
| **Epic 5** | **採購與供應商管理** | **100%** | **✅ 完成並測試** | 1.5 週 |
| **Epic 6** | **費用記錄與審批** | **100%** | **✅ 完成** | 1 週 |
| **Epic 6.5** | **預算池實時追蹤** | **100%** | **✅ 完成** | 1 週 |
| **Epic 7** | **儀表板與基礎報表** | **100%** | **✅ 完成並修復** | 1 週 |
| **Epic 8** | **通知系統** | **100%** | **✅ 完成** | 0.5 週 |

**預計總時程**: 9 週
**實際總時程**: 8.5 週
**當前進度**: 🎉 **所有 8 個 Epic 全部完成，達成 100% MVP 目標！**

### **📅 最近更新** (2025-10-07 00:00)

#### **🎉 MVP 100% 完成 - Epic 1 認證系統實現** ✅ (2025-10-07)
- ✅ **Prisma Schema 更新** (~80行)
  - 新增 NextAuth 模型：Account, Session, VerificationToken
  - User 模型擴展：emailVerified, image, accounts, sessions 關聯
  - 完整支援 Azure AD B2C 和本地認證雙模式

- ✅ **NextAuth.js 配置** (~200行)
  - Azure AD B2C Provider 完整整合
  - Credentials Provider（本地開發測試）
  - JWT 策略 Session 管理
  - 自動用戶同步（Azure AD B2C → 本地資料庫）
  - 完整的 TypeScript 型別擴展

- ✅ **NextAuth API 路由** (~20行)
  - `/api/auth/[...nextauth]/route.ts` - Next.js 14 App Router 適配
  - 完整的認證流程處理（登入、登出、session）

- ✅ **登入頁面 UI** (~180行)
  - `/login` 頁面 - 雙重認證選項
  - Azure AD B2C SSO 登入按鈕
  - Email/Password 本地認證表單
  - 完整的表單驗證和錯誤處理
  - 登入成功後自動重定向

- ✅ **SessionProvider 整合** (~20行)
  - 客戶端 SessionProvider 包裝器
  - 已整合到 RootLayout（全局可用）
  - 完整的 Session 上下文支援

- ✅ **tRPC Context 更新**
  - 已支援 NextAuth Session（無需修改，已完成）
  - protectedProcedure 完整驗證
  - Session user 型別安全保證

- ✅ **RBAC 權限控制中間件** (~50行)
  - `supervisorProcedure` - Supervisor/Admin 權限
  - `adminProcedure` - Admin 專屬權限
  - 完整的權限檢查和錯誤處理
  - 中文錯誤訊息

**Epic 1 代碼統計**:
- Prisma Schema: +80行
- Auth 配置: ~200行
- 登入頁面: ~180行
- API 路由: ~20行
- SessionProvider: ~20行
- RBAC 中間件: ~50行
- **總計**: ~550行

**功能特性**:
- 🔐 Azure AD B2C SSO 企業級認證
- 🔑 本地 Email/Password 認證（開發測試）
- 🛡️ RBAC 角色權限控制（3 種角色）
- ✅ JWT Session 管理（24小時過期）
- 🔄 自動用戶同步和創建
- 🎯 完整的型別安全

---

#### **Epic 8 - 通知系統完整實現** ✅ (2025-10-06)
- ✅ **Notification 數據模型** (~80行 Prisma Schema)
  - Notification 模型設計：userId, type, title, message, link, isRead, emailSent
  - 實體類型支援：PROPOSAL, EXPENSE, PROJECT
  - 通知類型：PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, PROPOSAL_REJECTED, PROPOSAL_MORE_INFO, EXPENSE_SUBMITTED, EXPENSE_APPROVED
  - 完整索引設計：userId, isRead, createdAt, entityType+entityId

- ✅ **EmailService 郵件服務** (~400行)
  - Singleton 模式實現，環境自適應配置
  - **開發環境**：Ethereal Email 自動生成測試賬號
  - **生產環境**：SMTP/SendGrid 支援
  - 5 個郵件模板方法（完整 HTML 模板）
    - sendProposalSubmittedEmail - 提案提交通知
    - sendProposalStatusEmail - 提案審批結果（批准/駁回/需補充）
    - sendExpenseSubmittedEmail - 費用提交通知
    - sendExpenseApprovedEmail - 費用批准通知
    - sendWelcomeEmail - 歡迎郵件（保留給未來使用）

- ✅ **Notification API 路由** (~450行)
  - **getAll** - 無限滾動分頁（cursor-based），支援已讀/未讀篩選
  - **getUnreadCount** - 獲取未讀通知數量（用於實時更新 Badge）
  - **markAsRead** - 標記單個通知為已讀
  - **markAllAsRead** - 批量標記所有通知為已讀
  - **delete** - 刪除通知（權限檢查：僅本人可刪除）
  - **create** - 創建通知（內部 API，支援可選郵件發送）
  - **getById** - 獲取單個通知詳情

- ✅ **前端通知組件** (~700行)
  - **NotificationBell** (~150行) - 通知圖標組件
    - 顯示未讀數量 Badge（99+ 上限）
    - 30秒自動刷新機制
    - Click-outside 關閉下拉選單
  - **NotificationDropdown** (~280行) - 通知下拉選單
    - 顯示最近 10 條通知
    - 支援標記為已讀
    - 標記全部已讀功能
    - 連結到完整通知頁面
    - 不同通知類型顯示不同圖標
  - **NotificationsPage** (~270行) - 完整通知列表頁面
    - 全部/未讀/已讀 篩選 Tabs
    - 無限滾動加載（每頁 20 條）
    - 刪除通知功能
    - 時間格式化（date-fns + zhTW locale）

- ✅ **集成到現有工作流** (~120行修改)
  - **BudgetProposal 工作流**
    - submit 提交時 → 通知 Supervisor（新的提案待審批）
    - approve 審批時 → 通知 Project Manager（審批結果）
      - 批准：「預算提案已批准」
      - 駁回：「預算提案已駁回」+ 原因
      - 需補充：「預算提案需要補充資訊」+ 說明
  - **Expense 工作流**
    - submit 提交時 → 通知 Supervisor（新的費用待審批）
    - approve 批准時 → 通知 Project Manager（費用已批准並扣款）

- ✅ **TopBar 整合** (~10行修改)
  - 移除舊的靜態 Bell 圖標
  - 集成 NotificationBell 組件
  - 實時顯示未讀通知數量

- ✅ **依賴安裝**
  - nodemailer@7.0.7 - 郵件發送核心庫
  - @types/nodemailer@7.0.2 - TypeScript 類型定義
  - date-fns@4.1.0 - 日期格式化庫（已安裝）

**Epic 8 總代碼**: ~2,200行（數據模型 + 郵件服務 + API + 前端組件 + 集成）
**累計代碼量**: ~27,000行
**Epic 8 狀態**: ✅ 100% 完成（無編譯錯誤，開發服務器運行正常）

---

### **📅 歷史更新** (2025-10-05 20:00)

#### **Epic 5 - 採購與供應商管理功能完整測試與修復** ✅ (2025-10-05)
- ✅ **Vendor CRUD 功能** - 全部測試通過 (Story 5.1)
  - 列表頁面載入正常
  - 新增供應商功能正常
  - 查看供應商詳情功能正常
  - 編輯供應商功能正常
  - 刪除供應商功能正常

- ✅ **Quote 報價管理功能** - 完整實現 (Story 5.2, 5.3)
  - Quote 頁面位於 `/projects/[id]/quotes`
  - 在專案詳情頁面添加「報價管理」區塊連結
  - 報價上傳表單 (QuoteUploadForm)
  - 報價比較功能（最低價、最高價、平均價）
  - 選擇供應商並生成採購單功能

- ✅ **PurchaseOrder 採購單功能** - 完整實現 (Story 5.4)
  - 從 Quote 自動生成 PO
  - PO 列表頁面和詳情頁面
  - PO 與 Expense 的關聯顯示

- ✅ **代碼修復與完善**
  - 修復所有 `limit: 1000` 超過 API 限制的錯誤（共 5 處）
    - `apps/web/src/app/expenses/page.tsx`
    - `apps/web/src/app/purchase-orders/page.tsx` (2 處)
    - `apps/web/src/components/quote/QuoteUploadForm.tsx`
    - `apps/web/src/components/expense/ExpenseForm.tsx`
  - 所有文件都有完整的中文註釋
  - API 路由、前端頁面、UI 組件全部完整實現

**Epic 5 總結**: 供應商管理、報價上傳比較、採購單生成流程完整實現並測試通過

---

### **📅 歷史更新** (2025-10-05 14:30)

#### **Epic 7 - 儀表板與基礎報表功能完整實現與修復** ✅ (2025-10-05)
- ✅ **Dashboard API 完整實現** (~450行)
  - **專案經理儀表板 API** (getProjectManagerDashboard)
    - 我負責的專案列表（含預算池、提案、採購單資訊）
    - 待處理任務（需補充資訊的提案、草稿費用）
    - 統計數據（專案數、進行中、待審批、預算使用情況）
  - **主管儀表板 API** (getSupervisorDashboard)
    - 所有專案總覽（分頁、篩選）
    - 預算池概覽（財務摘要）
    - 權限控制（僅主管可訪問）
  - **數據導出 API** (exportProjects) - CSV 格式
  - **專案經理列表 API** (getProjectManagers) - 用於篩選

- ✅ **專案經理儀表板頁面** (~390行)
  - 統計卡片（總專案、進行中、待審批、待處理任務）
  - 預算概覽（總額、已用、剩餘）
  - 我負責的專案列表（最多顯示 5 個）
  - 等待我處理的任務 Tabs（提案、費用）
  - 響應式設計與完整錯誤處理

- ✅ **主管儀表板頁面** (~400行)
  - 統計卡片與預算池概覽區塊
  - 專案列表（分頁，每頁 10 個）
  - 篩選功能（按狀態、按專案經理）
  - CSV 導出功能（前端生成，UTF-8 BOM）
  - 詳細專案資訊展示

- ✅ **可復用組件**
  - StatCard (~50行) - 統計卡片組件
  - BudgetPoolOverview (~180行) - 預算池概覽組件
    - 財務數據展示（總額、已用、剩餘）
    - 使用率進度條（綠 <70%, 橙 70-90%, 紅 >90%）
    - 健康狀態警告提示

- ✅ **運行時錯誤修復**
  - **字段名稱修正**: `fiscalYear` → `financialYear` (5處修復)
  - **移除不存在字段**: 刪除 `code` 字段引用 (3處修復)
  - **狀態值修正**: `Active`→`InProgress`, `Cancelled`→`Archived` (5處修復)
  - **提案頁面修復**: 添加 undefined 條件檢查

**Epic 7 代碼量**: ~1,470行
**累計代碼量**: ~24,800行
**Epic 7 狀態**: ✅ 100% 完成（功能實現與錯誤修復完畢）

---

#### **Epic 3 - 提案審批工作流代碼審查與修復** ✅ (2025-10-05)
- ✅ **API 層修復** (~100行修改)
  - **認證修復**: 所有 budgetProposal 端點從 `publicProcedure` 改為 `protectedProcedure`
    - getAll, getById, create, update, submit, approve, addComment, delete
  - **Schema 驗證更新**: 所有 ID 驗證從 `uuid()` 改為 `min(1)`
    - 支援自定義 ID 格式（如 'bp-2025-it'）
    - budgetProposalId, userId, projectId 欄位全部更新

- ✅ **前端組件修復** (~80行修改)
  - **Server Component → Client Component 轉換**:
    - proposals/page.tsx: 添加 `'use client';`, 使用 useQuery
    - proposals/[id]/page.tsx: 添加 `'use client';`, 使用 useParams + useQuery
    - proposals/[id]/edit/page.tsx: 添加 `'use client';`, 使用 useParams + useQuery
  - **錯誤修復**: 解決 "createContext is not a function" 錯誤
  - **Loading 狀態**: 所有頁面添加適當的載入中狀態

- ✅ **審批工作流驗證**
  - ProposalActions 組件功能完整（提交、審批、拒絕、需更多資訊）
  - CommentSection 組件評論系統完整
  - 狀態機流程正確（Draft → PendingApproval → Approved/Rejected/MoreInfoRequired）

**Epic 3 代碼修復**: ~180行修改
**累計代碼量**: ~23,330行
**Epic 3 狀態**: ✅ 100% 完成（代碼審查與修復完畢）

---

#### **Epic 2 - 專案管理 CRUD 完成與測試** ✅ (2025-10-04)
- ✅ **Project CRUD 完整實現** (~1,850行)
  - Project API 路由完整實現（~660行）
    - getAll, getById, getByBudgetPool, create, update, delete
    - getStats, export (CSV)
  - 前端 4 個頁面開發（~1,146行）
    - 列表頁、詳情頁、新增頁、編輯頁
  - ProjectForm 業務組件（~283行）
    - 創建/編輯模式支援
    - Budget Pool、Manager、Supervisor 下拉選單
    - 日期選擇器和完整驗證

- ✅ **關鍵問題修復**
  - **Session 認證**: 修復 App Router tRPC context 返回 null session
    - 正確實現 `getServerSession(authOptions)`
    - 解決 401 UNAUTHORIZED 問題
  - **數據結構處理**: 修復 `budgetPools.map is not a function`
    - 正確處理分頁響應 `{ items: [], pagination: {} }`
  - **Schema 驗證**: budgetPoolId 從 uuid() 改為 min(1)
    - 支援自定義 ID 格式（bp-2025-it）
  - **Zod Optional 欄位**: 使用 undefined 而非 null
  - **完整中文化**: 所有 UI 文字、驗證消息、Toast 提示

- ✅ **完整測試通過**
  - 用戶可正常登入並訪問 /projects
  - 專案列表正常載入
  - 創建新專案功能完整可用
  - 表單驗證正確運作
  - 所有下拉選單正常
  - 所有 UI 顯示中文

**Epic 2 總代碼**: ~1,850行核心代碼
**累計代碼量**: ~23,150行
**Epic 2 狀態**: ✅ 100% 完成並測試通過

---

#### **Sprint 0 Week 1 Day 2.5 - 索引系統完整修復** ✅
- ✅ **索引悖論問題解決** (~120行索引更新)
  - 修復「索引系統元文件未被索引」的根本性缺陷
  - 新增「索引系統與元文件」章節（第1章）
  - 索引系統現在能夠索引自己，形成完整自我引用循環
  - 解決 AI 助手無法通過索引找到維護指南的問題

- ✅ **47 個重要文件補充到索引** (完整修復)
  - 7個索引元文件：PROJECT-INDEX.md、INDEX-MAINTENANCE-GUIDE.md、AI-ASSISTANT-GUIDE.md、DEVELOPMENT-LOG.md、FIXLOG.md等
  - 35個 User Story 文件：從簡單列表改為完整表格格式（含完整路徑和中文說明）
  - 2個核心系統文件：middleware.ts（認證中間件）、NextAuth API route
  - 3個開發工具文件：check-index-sync.js、seed.ts、報告文件

- ✅ **索引結構優化**
  - 章節重組：新增第1章「索引系統與元文件」
  - 所有後續章節編號 +1（項目文檔→2、核心代碼→3等）
  - User Story 索引格式完全重構（簡單列表 → 完整表格）
  - 更新索引統計：從 179+ 增加到 226+ 文件

- ✅ **根本原因分析完成**
  - 發現並記錄「索引悖論」問題
  - 建立索引系統自包含性原則
  - 制定改進建議和長期優化方案

**總索引更新**: ~120行結構優化 + 47個文件補充
**累計代碼量**: ~21,300行核心代碼
**索引文件數**: 從 179+ 增加到 226+ (完整)

#### **Sprint 0 Week 1 Day 1.75 - 設計系統遷移完成** ✅
- ✅ **16+ 頁面完整遷移** (~3,000行重構)
  - Dashboard、Projects、Proposals、Budget Pools、Users、Login
  - 所有頁面遷移至新設計系統
  - 統一命名規範（小寫 kebab-case）
  - 舊代碼完全清理（-new 後綴文件已刪除）

- ✅ **12 個 UI 組件創建** (~2,500行新代碼)
  - 基礎組件：Button、Input、Select、Textarea、Label
  - 進階組件：Card、Dialog、DropdownMenu、Table、Tabs
  - UI 增強：Badge、Avatar、Progress、Skeleton、Breadcrumb、Pagination

- ✅ **設計系統文檔建立** (~5,000行文檔)
  - docs/ui-ux-redesign.md（70+ 頁完整規範）
  - docs/design-system-migration-plan.md（40+ 頁遷移計劃）
  - DESIGN-SYSTEM-GUIDE.md（快速參考）
  - .eslintrc.design-system.js（規則配置）
  - PR 模板更新（設計系統檢查清單）

- ✅ **技術架構建立**
  - CSS 變數系統（HSL 格式，支援 Light/Dark 主題）
  - cn() 工具函數（clsx + tailwind-merge）
  - CVA 組件變體管理
  - forwardRef + displayName 統一模式

- ✅ **問題解決記錄**
  - ✅ 問題一：舊頁面處理策略（直接遷移，不保留舊版本）
  - ✅ 問題二：未來開發一致性機制（ESLint + PR 模板 + 文檔）
  - ✅ 設計系統遷移已完全完成

**總代碼變更**: ~10,500行（重構 + 新增 + 文檔）
**累計代碼量**: ~21,300行核心代碼

#### **Sprint 0 Week 1 Day 2 - 性能優化與代碼分割** ✅
- ✅ **依賴優化** (~50行變更)
  - 移除未使用的 @heroicons/react 依賴（節省 ~500KB）
  - 統一使用 lucide-react 圖標庫
  - StatsCard 組件圖標遷移（TrendingUp/TrendingDown）

- ✅ **代碼分割與懶加載** (~200行優化)
  - 8個表單頁面實現動態導入
  - 使用 next/dynamic 進行組件懶加載
  - 添加 Skeleton loading states
  - 禁用表單組件 SSR（ssr: false）

- ✅ **優化頁面列表**
  - projects/new + projects/[id]/edit
  - proposals/new + proposals/[id]/edit
  - budget-pools/new + budget-pools/[id]/edit
  - users/new + users/[id]/edit

- ✅ **性能提升預估**
  - Bundle size 減少: 25-30% (~300-350KB)
  - First Contentful Paint (FCP) 提升: 25-30%
  - Time to Interactive (TTI) 提升: 30-35%
  - 表單頁面首次加載優化: 40%

**總代碼優化**: ~250行性能優化代碼
**累計代碼量**: ~11,050行核心代碼

#### **Sprint 0 Week 1 Day 1.5 - UI 響應式設計與用戶體驗優化** ✅
- ✅ **響應式設計完整實現** (~800行)
  - Mobile 端側邊欄滑出式設計
  - TopBar 響應式適配（mobile/tablet/desktop）
  - Dashboard 頁面全面響應式優化
  - 所有斷點適配（sm/md/lg/xl）

- ✅ **UI/UX 優化**
  - Sidebar 寬度調整（w-56 desktop, w-64 mobile）
  - 字體大小統一放大（提升可讀性）
  - 間距和 padding 響應式調整
  - Mobile 菜單按鈕與 overlay 交互

- ✅ **組件更新**
  - Sidebar 支持 mobile 狀態管理
  - TopBar 添加 mobile 菜單按鈕
  - DashboardLayout 整合 mobile 狀態
  - StatsCard 響應式字體和間距
  - Dashboard 所有卡片響應式適配

**總代碼更新**: ~800行 UI 優化代碼

#### **Sprint 0 Week 1 Day 1 - User 管理與 BudgetProposal 完成** ✅
- ✅ **User 管理系統完整實現** (~1,500行)
  - User API 路由（CRUD + 角色專用端點）
  - User 前端頁面（列表、詳情、新增、編輯）
  - UserForm 業務元件
  - ProjectForm 整合真實 User 數據

- ✅ **BudgetProposal 審批工作流** (~2,000行)
  - BudgetProposal API 路由（CRUD + 審批工作流）
  - 審批工作流狀態機（Draft → PendingApproval → Approved/Rejected/MoreInfoRequired）
  - 評論系統與歷史記錄追蹤
  - Proposal 前端頁面（列表、詳情、新增、編輯）
  - ProposalActions 審批操作組件
  - CommentSection 評論組件

- ✅ **資料庫 Schema 更新**
  - Project 模型新增 startDate 和 endDate 欄位

**總代碼新增**: ~3,500行核心代碼

#### **Sprint 0 Week 0 Day 1 - Project CRUD 完成** ✅
- ✅ **Project 管理 API 路由實現** (~400行)
- ✅ **Project 前端完整實現** (~800行)
- ✅ **索引維護更新**

**總代碼新增**: ~1,200行核心代碼

#### **Sprint 0 Week 0 - 專案初始化完成** ✅
- ✅ **Turborepo Monorepo 架構建立** (~500行)
  - 工作區配置（apps/* + packages/*）
  - 共享 TypeScript 配置
  - 統一構建管道

- ✅ **資料庫架構設計完成** (~400行 Prisma Schema)
  - 6 個核心數據模型（BudgetPool, Project, Proposal, Vendor, PurchaseOrder, Expense）
  - 完整關聯關係設計
  - 審計字段（createdAt, updatedAt）

- ✅ **Budget Pool CRUD 完整實現** (~1,200行)
  - tRPC API 端點（list, getById, create, update, delete）
  - Next.js 頁面組件
  - 表單驗證與錯誤處理

- ✅ **UI 元件庫建立** (~1,500行)
  - Radix UI 基礎組件
  - Tailwind CSS 樣式系統
  - 響應式設計支持

---

## 🎯 專案核心信息

### **專案身份**
- **名稱**: IT Project Process Management Platform
- **類型**: 企業級 IT 專案管理 SaaS 平台
- **目標**: 統一化 IT 部門專案管理流程 - 從預算分配到費用報銷的單一事實來源

### **技術棧**
```yaml
前端框架: Next.js 14 (App Router)
後端框架: tRPC
資料庫: PostgreSQL + Prisma ORM
認證系統: Azure AD B2C
部署架構: Turborepo Monorepo
樣式系統: Tailwind CSS + Radix UI
開發工具: TypeScript + ESLint + Prettier
容器化: Docker + Docker Compose
```

### **核心業務流程（6 步工作流）**
```
1. Budget Pool (預算池)
   → 年度預算分配與管理

2. Project (專案)
   → 專案立項與基本信息

3. Budget Proposal (預算提案)
   → 專案預算申請與審批

4. Vendor/Quote (供應商/報價)
   → 供應商選擇與報價比較

5. Purchase Order (採購單)
   → 正式採購訂單管理

6. Expense → Charge Out (費用報銷)
   → 費用記錄與成本分攤
```

### **專案架構**
```
ai-it-project-process-management-webapp/
├── apps/
│   └── web/                    # Next.js 14 主應用
│       ├── src/
│       │   ├── app/           # App Router 頁面
│       │   ├── components/    # React 組件
│       │   ├── lib/          # 工具函數
│       │   └── styles/       # 全局樣式
│       └── package.json
│
├── packages/
│   ├── api/                   # tRPC API 定義
│   │   └── src/routers/      # API 路由
│   ├── db/                    # Prisma 資料庫
│   │   └── prisma/           # Schema + Migrations
│   ├── ui/                    # 共享 UI 組件
│   └── tsconfig/             # 共享 TS 配置
│
├── docs/                      # 專案文檔
│   ├── prd/                  # 產品需求文件
│   ├── fullstack-architecture/  # 架構文件
│   └── infrastructure/       # 基礎設施文檔
│
├── AI-ASSISTANT-GUIDE.md     # AI 助手指南（本文件）
├── PROJECT-INDEX.md          # 完整專案索引
├── DEVELOPMENT-LOG.md        # 開發記錄
├── FIXLOG.md                # 問題修復記錄
└── INDEX-MAINTENANCE-GUIDE.md # 索引維護指南
```

---

## 🔄 AI 助手標準工作流程

### **1. 首次進入專案（必須執行）**

```bash
# Step 1: 快速載入專案上下文
1️⃣ 讀取 .ai-context                    # 30秒極簡上下文
2️⃣ 閱讀 AI-ASSISTANT-GUIDE.md (本文件)  # 5分鐘了解全局
3️⃣ 查看 PROJECT-INDEX.md               # 完整文件地圖

# Step 2: 了解專案狀態
4️⃣ 檢查 DEVELOPMENT-LOG.md 最頂部      # 最新開發記錄
5️⃣ 檢查 FIXLOG.md 索引表              # 已知問題和修復

# Step 3: 開始工作
6️⃣ 制定 todos list                    # 規劃工作任務
```

### **2. 日常開發流程**

```bash
# 開發前
1. 檢查 AI-ASSISTANT-GUIDE.md 最上面的指引
2. 檢查 DEVELOPMENT-LOG.md 了解最新狀況
3. 制定或更新 todos list

# 開發中
- 每個檔案加入完整中文註釋
- 參考 PROJECT-INDEX.md 查找需要的文件
- 使用 npm run index:check 檢查索引狀態

# 開發後（每個 todo 完成）
1. 更新 DEVELOPMENT-LOG.md（最新記錄放最上面）
2. 如有 bug fix，更新 FIXLOG.md
3. 執行索引維護（如有新增文件）
4. 與用戶確認
5. 同步到 GitHub
```

### **3. 索引系統使用策略**

#### **4 層索引架構**
```
L0: .ai-context                    # ⚡ 極簡上下文載入 (30秒)
L1: AI-ASSISTANT-GUIDE.md          # 📋 AI 助手快速參考 (5分鐘)
L2: PROJECT-INDEX.md               # 🗂️ 完整專案索引 (詳細查找)
L3: INDEX-MAINTENANCE-GUIDE.md     # 🔧 索引維護指南 (維護規範)
```

#### **查找策略**
```
查詢類型 → 建議路徑
├─ 快速了解專案 → L0 (.ai-context)
├─ 常用文件位置 → L1 (AI-ASSISTANT-GUIDE.md)
├─ 詳細文件查找 → L2 (PROJECT-INDEX.md)
└─ 索引維護方法 → L3 (INDEX-MAINTENANCE-GUIDE.md)
```

#### **索引健康檢查**
```bash
npm run index:check              # 基本同步檢查
npm run index:check:incremental  # 增量檢查（只檢查變更文件）
npm run index:fix               # 自動修復（謹慎使用）
npm run index:health            # 完整健康檢查
```

---

## 📁 重要文件快速索引

> **📋 分類標準說明**：
> - **🔴 極高重要性**: 理解項目核心業務和技術架構的關鍵文件，AI 助手必須熟悉
> - **🟡 高重要性**: 日常開發和功能實現經常需要參考的文件
> - **🟢 中重要性**: 特定場景或深入配置時才需要的專門文件

### 🔴 極高重要性（必看）

| 文件路徑 | 用途說明 | 代碼行數 |
|---------|---------|----------|
| `README.md` | 專案總覽與快速開始指南 | ~200行 |
| `docs/brief.md` | 專案簡報（背景與目標） | ~150行 |
| `mvp-development-plan.md` ⭐ | MVP 完整開發路線圖和 Sprint 規劃 | ~600行 |
| `mvp-implementation-checklist.md` ⭐ | MVP 詳細實施檢查清單和進度追蹤 | ~800行 |
| `docs/prd/index.md` | 產品需求文件（PRD）總覽 | ~300行 |
| `docs/prd/4-epic-and-user-story-details.md` | Epic 與 User Story 詳細說明 | ~800行 |
| `docs/fullstack-architecture/index.md` | 全端架構文件總覽 | ~200行 |
| `docs/fullstack-architecture/4-unified-project-structure.md` | 統一專案結構設計 | ~500行 |
| `packages/db/prisma/schema.prisma` | 資料庫設計（Prisma Schema） | ~400行 |
| `package.json` | 根目錄依賴與腳本配置 | ~60行 |
| `turbo.json` | Turborepo 構建配置 | ~50行 |

### 🟡 高重要性（常用）

#### **架構與設計文檔**
| 文件路徑 | 用途說明 | 代碼行數 |
|---------|---------|----------|
| `docs/fullstack-architecture/5-data-model-and-prisma-schema.md` | 資料模型設計詳解 | ~600行 |
| `docs/fullstack-architecture/6-api-design-trpc.md` | tRPC API 設計規範 | ~500行 |
| `docs/front-end-spec.md` | 前端規格（UI/UX） | ~400行 |

#### **Next.js 應用核心**
| 文件路徑 | 用途說明 | 代碼行數 |
|---------|---------|----------|
| `apps/web/next.config.mjs` | Next.js 配置文件 | ~50行 |
| `apps/web/tailwind.config.ts` | Tailwind CSS 配置 | ~80行 |
| `apps/web/src/app/layout.tsx` | 根布局組件 | ~100行 |
| `apps/web/src/app/page.tsx` | 首頁組件 | ~80行 |

#### **Budget Pool 功能（已完成）**
| 文件路徑 | 用途說明 | 代碼行數 |
|---------|---------|----------|
| `packages/api/src/routers/budgetPool.ts` | Budget Pool API 路由 | ~200行 |
| `apps/web/src/app/budget-pools/page.tsx` | Budget Pool 列表頁面 | ~300行 |
| `apps/web/src/app/budget-pools/[id]/page.tsx` | Budget Pool 詳情頁面 | ~250行 |
| `apps/web/src/app/budget-pools/new/page.tsx` | 新增 Budget Pool 頁面 | ~200行 |

#### **UI 元件庫**
| 文件路徑 | 用途說明 | 代碼行數 |
|---------|---------|----------|
| `apps/web/src/components/ui/button.tsx` | Button 組件 | ~100行 |
| `apps/web/src/components/ui/input.tsx` | Input 組件 | ~80行 |
| `apps/web/src/components/ui/form.tsx` | Form 組件 | ~150行 |
| `apps/web/src/components/ui/table.tsx` | Table 組件 | ~200行 |
| `apps/web/src/components/ui/dialog.tsx` | Dialog 組件 | ~120行 |

### 🟢 中重要性（需要時查看）

#### **開發配置**
| 文件路徑 | 用途說明 |
|---------|---------|
| `.env.example` | 環境變數範本 |
| `.eslintrc.json` | ESLint 配置 |
| `.prettierrc.json` | Prettier 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `.vscode/settings.json` | VS Code 設定 |

#### **基礎設施與部署**
| 文件路徑 | 用途說明 |
|---------|---------|
| `docker-compose.yml` | Docker 容器設定 |
| `docs/infrastructure/` | 基礎設施文檔目錄 |
| `SETUP-COMPLETE.md` | 環境設置完成指南 |
| `CONTRIBUTING.md` | 貢獻指南 |

---

## 🚫 避免查找的目錄

**以下目錄包含工具框架或系統文件，不是專案業務內容：**

```
.bmad-core/                    # BMad 開發工具框架
.bmad-infrastructure-devops/   # DevOps 工具
.bmad-creative-writing/        # 創意寫作工具
web-bundles/                   # 前端工具擴展
.claude/ .cursor/              # IDE 配置
.git/                          # Git 內部文件
node_modules/                  # 依賴套件
.next/                         # Next.js 構建輸出
dist/ build/                   # 構建產物
```

---

## 🔍 常見查詢快速指南

| 想了解什麼？ | 直接查看這個文件 | 層級 |
|-------------|-----------------|------|
| **專案是什麼？** | `README.md` | L1 |
| **業務需求？** | `docs/prd/index.md` | L1 |
| **技術架構？** | `docs/fullstack-architecture/index.md` | L1 |
| **專案結構？** | `docs/fullstack-architecture/4-unified-project-structure.md` | L1 |
| **資料庫設計？** | `packages/db/prisma/schema.prisma` | L1 |
| **API 設計？** | `docs/fullstack-architecture/6-api-design-trpc.md` | L1 |
| **MVP 開發計劃？** | `mvp-development-plan.md` ⭐ | L1 |
| **MVP 實施檢查清單？** | `mvp-implementation-checklist.md` ⭐ | L1 |
| **環境設置？** | `.env.example`, `SETUP-COMPLETE.md` | L2 |
| **開發記錄？** | `DEVELOPMENT-LOG.md` | L1 |
| **問題修復記錄？** | `FIXLOG.md` | L1 |
| **完整文件索引？** | `PROJECT-INDEX.md` | L2 |
| **索引維護方法？** | `INDEX-MAINTENANCE-GUIDE.md` | L3 |
| **檢查索引狀態？** | 執行 `npm run index:check` | CLI |

---

## 🚀 開發指令快速參考

### **常用開發指令**

```bash
# 開發服務器
pnpm dev                        # 啟動所有應用開發服務器
pnpm --filter web dev          # 只啟動 web 應用

# 構建與測試
pnpm build                      # 構建所有應用
pnpm lint                       # 執行 ESLint 檢查
pnpm typecheck                  # 執行 TypeScript 類型檢查
pnpm test                       # 執行測試

# 資料庫操作
pnpm db:studio                  # 啟動 Prisma Studio
pnpm db:generate                # 生成 Prisma Client
pnpm db:migrate                 # 執行資料庫遷移
pnpm db:push                    # 推送 schema 到資料庫
pnpm db:seed                    # 執行種子數據

# 索引維護
pnpm index:check                # 檢查索引同步狀態
pnpm index:check:incremental    # 增量檢查（只檢查變更）
pnpm index:fix                  # 自動修復索引（謹慎使用）
pnpm index:health               # 完整健康檢查

# Docker 操作
docker-compose up -d            # 啟動資料庫容器
docker-compose down             # 停止容器
docker-compose logs -f          # 查看容器日誌
```

### **Git 工作流程**

```bash
# 每次開發前
git status                      # 檢查當前狀態
git branch                      # 確認當前分支
git pull origin main            # 拉取最新代碼

# 開發過程中
git add .                       # 添加變更文件
git commit -m "feat: 功能描述"   # 提交變更（包含索引更新）
git push origin feature-branch  # 推送到遠程

# Git Hook 會自動檢查
# - 新增重要文件是否更新索引
# - 索引文件是否包含在提交中
```

---

## 📝 維護檢查清單

### **每日檢查（開發時）**
- [ ] 新增文件是否更新索引
- [ ] 完成的 todo 是否更新 `DEVELOPMENT-LOG.md`
- [ ] Bug 修復是否記錄到 `FIXLOG.md`
- [ ] 所有代碼是否包含中文註釋

### **每週檢查**
- [ ] 運行 `npm run index:check` 檢查同步狀態
- [ ] 檢查索引文件的時間戳是否更新
- [ ] 清理過期的臨時文件
- [ ] 更新專案狀態百分比

### **每 Sprint 檢查**
- [ ] 運行 `npm run index:health` 完整健康檢查
- [ ] 評估文件重要性是否需要調整
- [ ] 優化索引結構
- [ ] 更新專案進度總結
- [ ] 檢查記錄文件是否需要歸檔

---

## 🎯 成功指標

### **索引系統健康指標**
- ✅ **索引準確率** > 98%（索引中的引用都存在）
- ✅ **覆蓋率** > 95%（重要文件都在索引中）
- ✅ **同步延遲** < 1天（新文件24小時內加入索引）
- ✅ **記錄完整度** > 90%（重要變更都有記錄）

### **開發效率指標**
- ✅ AI 助手文件查找時間 < 30秒
- ✅ 新成員入職理解時間 < 30分鐘
- ✅ 索引維護時間 < 5分鐘/週

---

## 💡 最佳實踐總結

### ✅ DO（推薦做法）
1. **提交時同步更新索引** - 養成習慣，避免遺漏
2. **使用分層索引系統** - 按層級查找，提升效率
3. **定期運行檢查工具** - 每週至少一次
4. **詳細記錄開發過程** - 方便追溯和分享
5. **信任並維護索引** - 索引是最可靠的導航

### ❌ DON'T（避免做法）
1. **跳過索引直接搜索** - 浪費時間且可能找錯
2. **批次累積後才更新** - 容易遺漏和錯誤
3. **忽略 Git Hook 提示** - 失去自動保護
4. **不記錄重要決策** - 重複踩坑
5. **過度或不足索引** - 保持適度平衡

---

## 🔗 相關資源

### **核心文檔**
- [.ai-context](./.ai-context) - 極簡上下文
- [AI-ASSISTANT-GUIDE.md](./AI-ASSISTANT-GUIDE.md) - AI 助手快速參考（本文件）
- [PROJECT-INDEX.md](./PROJECT-INDEX.md) - 完整專案索引
- [INDEX-MAINTENANCE-GUIDE.md](./INDEX-MAINTENANCE-GUIDE.md) - 索引維護指南

### **記錄文檔**
- [DEVELOPMENT-LOG.md](./DEVELOPMENT-LOG.md) - 開發記錄
- [FIXLOG.md](./FIXLOG.md) - 問題修復記錄

### **工具**
- [scripts/check-index-sync.js](./scripts/check-index-sync.js) - 索引同步檢查工具
- [.husky/pre-commit](./.husky/pre-commit) - Git Hook

---

**🎯 記住：良好的導航系統是團隊效率的倍增器！**

**最後更新**: 2025-10-06 22:00
