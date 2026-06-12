# 全面安全與風險評估報告（Security & Risk Audit）

> **審查日期**: 2026-06-11
> **審查方式**: 靜態唯讀（實際讀碼 + `pnpm audit` + 多領域並行深掃 + 人工複查關鍵證據）
> **審查範圍**: 認證/授權、API Routes、檔案上傳下載、注入/XSS、敏感資料、密碼學、機密外洩、依賴漏洞、Docker、CI/CD、基礎設施
> **基準對照**: `docs/codebase-analyze/10-issues-and-debt/security-review.md`（2026-04-09，SEC-001~017）
> **嚴重程度**: Critical / High / Medium / Low
> **目標分支 HEAD**: main（含 FIX-101~144、FEAT-012、公司 Docker 部署變更）

---

## 0. 執行摘要（Executive Summary）

本次評估在 2026-04-09 舊報告之後重新全面掃描，重點驗證 FIX-101/102/103 宣稱修復的三個 Critical（SEC-001/002/006）的**實際現況**，並發掘 2 個月來新代碼引入的風險。

**總體研判**：
- ✅ **縱向 RBAC（三層 procedure）實作正確**：`protectedProcedure` / `supervisorProcedure` / `adminProcedure` 以 `role.name` 判斷，邏輯無誤（`trpc.ts:323-453`）。FIX-101/102/103 確實堵住了原本最嚴重的「公開寫入 / 上傳無認證」。
- ⚠️ **但修復普遍「只做了一半」**：該改 `adminProcedure` 的**寫入**端點改了，但**讀取/診斷端點**、**密碼欄位過濾**、**資源所有權檢查**都沒跟上。
- 🔴 **最大的系統性缺口是「水平越權」(IDOR / BOLA)**：幾乎所有 `update / submit / getById` 只驗登入 + 狀態機，**任何 ProjectManager 可操作他人資源**。
- 🔴 **一個真實的 `NEXTAUTH_SECRET` 已外洩進 git**（6 處），若與任何部署環境相同，可偽造任意使用者 session（含 Admin）。
- 🔴 **依賴鏈含 1 個 Critical + 5 個 High CVE**，其中 `fast-xml-parser`（經 Azure Blob SDK）與 `xlsx`（解析使用者上傳 Excel）為可被外部輸入觸發的路徑。

**風險統計**：

| 嚴重程度 | 數量 | 編號 |
|----------|------|------|
| **Critical** | 3 | SR-01, SR-02, SR-03 |
| **High** | 12 | SR-04 ~ SR-15 |
| **Medium** | 14 | SR-16 ~ SR-29 |
| **Low** | 9 | SR-30 ~ SR-38 |
| **總計** | **38** | |

---

## 🚨 P0 — 需立即行動（24~48 小時內）

| 項目 | 為何緊急 | 動作 |
|------|---------|------|
| **SR-01 輪換 `NEXTAUTH_SECRET`** | 真實密鑰已在 git 公開（含程式碼檔），持有者可偽造任意 JWT 冒充 Admin | ① 確認 Azure 各環境（個人/公司 dev）的 `NEXTAUTH_SECRET` 是否等於 `GN29F…⟨已於2026-06-11輪換，見Key Vault⟩`；②**無論是否相同，一律在 Key Vault 重新生成並輪換**；③ 從程式碼與文件移除該值 |
| **SR-02 修補 Critical/High 依賴** | `fast-xml-parser` Critical 經 Azure Blob SDK（每次上傳/下載都走）；`xlsx` 解析使用者上傳檔 | 升級 `@azure/storage-blob`、`@azure/identity`、`next`→14.2.35+、`@trpc/server`→10.45.3+；`xlsx` 改官方 CDN 0.20.3+ |
| **SR-03 + SR-04 關閉水平越權主路徑** | 任一登入者（可自助註冊）即可讀/改/刪他人專案、提案、費用、下載他人發票 | 對 `update/submit/getById` 加資源所有權檢查；`download` 改以資源 ID 反查 + 授權 |

> **2026-06-11 P0 處理進度**：
> - **SR-01** ✅ 明文已從版控移除（FIX-145）；⏳ Azure Key Vault 輪換待執行。
> - **SR-02** ⚠️ 已修 `fast-xml-parser`(Critical→消除)/`jws`/`@trpc/server`(FIX-146)；`next` 升至 14.2.x 終版 14.2.35，**剩餘 Next CVE 需 Next 15/16 major 升級 → 另開 FIX-149**。
> - **SR-10**（=本表未列、屬 §3）✅ 已修 `user.getAll/getById` password 外洩（FIX-147）。
> - **SR-03/SR-04**（IDOR/越權）仍待 **P1** 處理。
> 詳見 `claudedocs/4-changes/bug-fixes/FIX-145-147-P0-security-fixes.md`。

---

## 1. 認證與授權（Authentication & Authorization）

### SR-01 — 真實 `NEXTAUTH_SECRET` 外洩進版控（含程式碼檔）
- **嚴重程度**: **Critical**（若與任一部署環境共用）／ High（即使僅測試用，仍屬密鑰入庫且永存 git 歷史）
- **證據（已人工複查，6 處皆被 git 追蹤）**:
  - `apps/web/playwright.config.ts:77-78` ← **程式碼**，硬編碼 `NEXTAUTH_SECRET=GN29F…⟨已於2026-06-11輪換，見Key Vault⟩`
  - `archive/epic-records/認證系統實現摘要.md:193`
  - `claudedocs/7-archive/mvp-phase/COMPLETE-IMPLEMENTATION-PROGRESS.md:940`
  - `claudedocs/5-status/testing/e2e/E2E-TESTING-FINAL-REPORT.md:131, 360`
  - `claudedocs/5-status/testing/e2e/E2E-TESTING-ENHANCEMENT-PLAN.md:1068`
- **問題**: 該值為 base64 32-byte 隨機字串（非佔位符），是可用的 NextAuth JWT 簽章密鑰。`NEXTAUTH_SECRET` 是 session token 的簽章根密鑰。
- **攻擊情境**: 任何能讀此 repo（或其 git 歷史、fork、CI 快取）者，若該密鑰與線上環境相同，可自行簽發合法 JWT，`role.name = 'Admin'`，直接冒充管理員，繞過所有 RBAC。
- **修復**: 見 P0。輪換後將 `playwright.config.ts` 改為明顯假值（如 `test-only-not-a-real-secret`）。

### SR-04 — 核心業務資源全面缺乏所有權檢查（IDOR / 水平越權）｜舊 SEC-008 未修
- **嚴重程度**: **High**
- **證據（皆 `protectedProcedure` + `where: { id }`，無 owner 綁定）**:
  - `project.update` — `project.ts:808`（內部 `:866` 僅驗 budgetCategory，無 managerId 檢查）
  - `budgetProposal.update` — `budgetProposal.ts:484`；`budgetProposal.submit` — `:541`（僅查狀態）
  - `expense.update` — `expense.ts:455`；`purchaseOrder.update` — `purchaseOrder.ts:359`
  - `quote.update/delete` — `quote.ts:373/427`；`omExpense.update` — `omExpense.ts:1764`
  - `getById` 系列亦無範圍限制：`project.getById:389`、`budgetProposal.getById:373`、`expense.getById:223`
- **問題**: 這些只保證「有登入」，內部 `findUnique({ where: { id } })` 後直接 update，從不比對 `managerId === ctx.session.user.id`。對照 `project.delete:1001-1008` 與 `budgetProposal.delete:1248-1259` **有**正確做 `isManager || isAdmin` 檢查——**同一 router 的 delete 修了、update/submit 卻沒修**，屬不一致修復。
- **攻擊情境**: ProjectManager A 登入後將 `project.update` 的 `id` 換成 B 的專案 id，即可竄改 B 的專案（改 managerId/supervisorId/預算）；或把 B 的草稿提案直接 `submit` 進審批、改金額。
- **修復**: 複用 delete 既有模式，建議抽 `assertOwnershipOrPrivileged(resource, ctx)` helper：
  ```ts
  const isOwner = resource.managerId === ctx.session.user.id;
  const isPrivileged = ['Supervisor','Admin'].includes(ctx.session.user.role.name);
  if (!isOwner && !isPrivileged) throw new TRPCError({ code: 'FORBIDDEN' });
  ```

### SR-05 — Health Router 9 個公開診斷端點洩漏 schema + 任意 email 角色枚舉｜舊 SEC-002 部分修
- **嚴重程度**: **High**
- **證據**: `health.ts` 仍有 9 個 `publicProcedure`（`:44,51,72,229,288,380,712,1306,1865`），特別是：
  - `debugUserPermissions`（`health.ts:2315`，public）— **未登入**即可查任意 email 的 `userId/roleId/role/isAdmin/OpCo 權限`
  - `schemaCheck`（`:229`）回傳每張表 row count + migration 名稱；`schemaCompare`/`fullSchemaCompare`/`diagOmExpense`（`:712/1865/288`）回傳完整欄位清單與 `information_schema`
  - catch 區塊直接把 `error.message` 回傳前端（`:253,369,795`）
- **現況**: FIX-102 已正確把所有 `fix*/sync*/createTable` **寫入型** mutation 改 `adminProcedure`（Critical 寫入已堵）；**但公開資訊洩漏端點未堵**。middleware 排除 `/api/*`，故對網際網路完全公開。
- **攻擊情境**: 攻擊者無憑證即可 `GET /api/trpc/health.debugUserPermissions?input={"email":"ceo@company.com"}` 確認帳號存在性與是否 Admin，再用 `schemaCheck` 取得資料表結構與資料量，為釣魚/撞庫/注入偵察鋪路。
- **修復**: `debugUserPermissions` 改 `adminProcedure` 或刪除；所有 `schema*/diag*/fullSchema*` 改 `adminProcedure`；catch 不回傳 `error.message`（細節只進 server log）；僅保留 `ping`/`dbCheck` 為 public。

### SR-06 — 任一登入者可讀全體使用者清單並探測任意帳號密碼狀態｜舊 SEC-001 部分修
- **嚴重程度**: **High**
- **證據**: FIX-101 已把 `create/update/delete/setPassword` 正確改 `adminProcedure`（`user.ts:217,270,320,375`）。**但讀取端點仍是 `protectedProcedure`**：
  - `getAll`（`user.ts:94`）回傳全部使用者；`getById`（`:110`）還 include 其所有專案與審批
  - `hasPassword`（`:412`）接受**任意** `userId`，回傳該帳號是否設密碼 → 可枚舉哪些帳號是 SSO-only / 有本地密碼
- **攻擊情境**: 被攻陷的低權帳號呼叫 `user.getAll` 取得全公司 email + 角色，鎖定 Admin/Supervisor；再用 `hasPassword` 找有本地密碼的高權帳號做針對性撞庫。
- **修復**: `getAll/getById/getByRole` 改 `adminProcedure` 或回傳裁剪欄位（僅 id+name）；`hasPassword` 移除 `userId` 入參，只查 `ctx.session.user.id` 自己。

### SR-07 — 全應用無速率限制（登入/註冊/API）｜舊 SEC-003 + SEC-016 未修
- **嚴重程度**: **High**
- **證據**: 全 codebase 程式碼層**無任何 rate limit**（`rateLimit/throttle` 僅出現在 FEAT-013 規劃文件，未落地）。`authorize()`（`auth.ts:103-155`）與 `register/route.ts:125-225` 皆無節流；register 每次請求觸發 `bcrypt.hash`（CPU 密集）。
- **攻擊情境**: ① 對 `authorize` 無限撞庫（搭配 SR-05/06 已枚舉出高權 email）；② 高頻打 register 耗盡 App Service CPU → DoS；③ 無限自助註冊，把外部攻擊者變成「已登入內部使用者」，放大 SR-04/SR-08/SR-09 的可達性。
- **修復**: 對 login/register/forgot-password 加 IP + email 維度 rate limit（專案 docker-compose 已有 Redis:6381，可用 Upstash Ratelimit / 自建 Redis 滑動視窗）；公開註冊加 CAPTCHA（Turnstile）；評估是否改為僅 Admin 邀請建帳號。

### SR-16 — 認證流程在生產環境記錄 PII（無 NODE_ENV 守衛）｜舊 SEC-004 未修
- **嚴重程度**: Medium
- **證據**: `apps/web/src/auth.ts` 共 11 處 `console.log` 印 `email`（`:104`）、`userId`、`roleId`、`hasPassword`（`:126`）、token id/email（`:220,235`），**無 production 守衛**。`register/route.ts:236` 印 `error.stack`。另 `login/page.tsx:114`、`om-summary/page.tsx:108`。
- **風險**: Azure App Service stdout → Application Insights / container log，任何有 log 讀取權者可重建登入軌跡、枚舉哪些 email 已註冊。
- **修復**: 以 `if (process.env.NODE_ENV !== 'production')` 包裹或移除；必要 audit 改結構化 logger 並去除 email/roleId/hasPassword。

### SR-17 — 單階段審批未綁定「指派的審批者」（職責分離 SoD 缺口）
- **嚴重程度**: Medium
- **證據**: `expense.approve`（`expense.ts:1078`）、`budgetProposal.approve`（單階段 fallback，`budgetProposal.ts:683`）用 `supervisorProcedure`，角色對，但**任何** Supervisor/Admin 都能審批**任何**案件，不限指派給自己的。對照 FEAT-014 的步驟審批 `loadCurrentStep`（`budgetProposal.ts:209-220`）有正確比對 `approverUserId/approverRoleId`，做得很好——但舊單階段路徑沒這層。
- **攻擊情境**: 多部門多 Supervisor 時，Supervisor X 可核准本應由 Supervisor Y 負責的費用，繞過部門權責分離。
- **修復**: 在單階段 approve 內加 `project.supervisorId === ctx.session.user.id || isAdmin` 檢查。

### SR-18 — Azure AD 以 email upsert 連結帳號，具接管風險
- **嚴重程度**: Medium（信心：中，取決於 tenant email 驗證政策）
- **證據**: `auth.ts:196-211` SSO 首登以 `email` 為 key `upsert`，`update` 分支保留既有 roleId（`:201` 註解明示）。
- **風險**: 若 DB 已有同 email 的本地密碼高權帳號，能取得相同 email 的 Azure AD 身分者會被連結到該既有帳號並繼承其角色。issuer 已限單一 tenant（`:76`）降低外部風險。
- **正面**: 新建帳號 / register 預設 `ProjectManager`（最小權限），歷史上硬編碼 `roleId` 導致提權的問題**已修復**（信心：高）。
- **修復**: 對「既有本地帳號 ↔ SSO 首登」要求顯式連結流程或 Admin 核准，不靜默以 email 合併。

### SR-19 — 本地憑證登入無帳號鎖定 / 失敗次數限制
- **嚴重程度**: Medium（與 SR-07 相關，獨立列出）
- **正面**: `bcrypt.compare`（`auth.ts:134`）為 timing-safe；「使用者不存在」與「密碼錯誤」回相同訊息（`:123,138`）已防枚舉。**這兩點做對了。**
- **缺口**: 無失敗鎖定、無漸進延遲。
- **修復**: N 次失敗後鎖定/延遲（複用 Redis）。

---

## 2. API Routes、檔案上傳/下載

### SR-03 — `fast-xml-parser` Critical CVE（經 Azure Blob SDK，上傳/下載均觸發）
> 同時屬「依賴」類，因可被外部輸入觸發故升級至 Critical，詳見 §5 SR-02。

### SR-08 — `/api/download` 缺乏物件級授權（任一登入者下載任意檔案，IDOR）｜舊 SEC-006 延伸
- **嚴重程度**: **High**
- **證據**: `apps/web/src/app/api/download/route.ts:33-68`。已驗登入（`:35`，FIX-137 正確），但接受 client 完全可控的 `?url=`，只要 URL 屬白名單 container（`{quotes,invoices,proposals}`，`azure-storage.ts:501`）即發 15 分鐘 SAS（`:65`），**不查 DB、不驗該檔是否屬於當前使用者**。
- **攻擊情境**: blob 命名可預測（`invoice_{purchaseOrderId}_{timestamp}.pdf`、`proposal_{proposalId}_{ext}`）。低權使用者構造他人資源 URL → 端點 302 重定向至 SAS → 下載他人提案/報價/發票（含金額、供應商等商業敏感資料）。
- **正面**: `generateSasUrl` 用環境變數 `config.accountName` 構造 client，**不採用 url 中的 host**，故**無法 SSRF 到外部 storage account**——影響被限制在三個已知 container 內（信心：高）。
- **修復**: 改為傳資源 ID（`quoteId/expenseId/proposalId`），由後端 tRPC procedure 查 DB 拿 `filePath` 並做 RBAC + 所有權授權，download route 僅負責拿已授權的 blobName 後發 SAS。

### SR-09 — 三個上傳端點僅驗登入、無業務授權；`quote` 可偽造 DB 記錄｜舊 SEC-006 部分修
- **嚴重程度**: **High**
- **證據**: FIX-103 確已加 `auth()`（quote:104 / invoice:88 / proposal:94），「未登入擋掉」**已修**。但只到認證，**無業務授權**：任一登入者可對**任意** projectId/purchaseOrderId/proposalId 上傳。`upload/quote/route.ts:150-229` 僅驗 project 存在性，未驗 session.user 是否為該 project 的 manager，且上傳後直接 `prisma.quote.create`，`amount: parseFloat(amount)`（client 可控，可為 NaN/負數）。
- **攻擊情境**: 低權 PM 對他人專案送 `POST /api/upload/quote`，帶任意 vendorId、`amount=1`，污染他人專案的報價比較（Epic 5 選最低價），影響採購決策。
- **修復**: 每個上傳端點驗證 `session.user` 與目標資源關係；`amount` 用 `z.coerce.number().positive()`；建議拆分上傳與建記錄，記錄走有 RBAC 的 tRPC `quote.create`。

### SR-20 — 上傳檔案類型僅信任 client MIME，quote/invoice 副檔名未白名單｜舊 SEC-011 部分修
- **嚴重程度**: Medium
- **證據**: 三端點都只比對 `file.type`（client 可偽造，無 magic-byte）；`upload/quote:181`、`upload/invoice:133` 用 `file.name.split('.').pop()` 取原始副檔名拼 blob 名。`proposal` 端點用 `TYPE_TO_EXTENSION` 映射（`proposal:81-87,139`）**是三者中唯一正確做法**。
- **攻擊情境**: `curl -F 'file=@payload.html;type=application/pdf' .../api/upload/quote` → 通過檢查，blob 存成 `.html`。若任何預覽/下載路徑回 `text/html` 或瀏覽器嗅探，觸發儲存型 XSS。
- **修復**: quote/invoice 比照 proposal 用 MIME→副檔名映射；加 `file-type` magic-byte 驗證；SAS 回應強制 `Content-Disposition: attachment` + 固定安全 content-type。

### SR-21 — `/api/admin/seed` GET 無認證 + POST fallback 用 `NEXTAUTH_SECRET`｜舊 SEC-007 未修
- **嚴重程度**: Medium
- **證據**: GET（`admin/seed/route.ts:49-91`）**完全無 `auth()`**，匿名可讀 Role/Currency 清單與 `seedRequired`。POST（`:102-137`）用 Bearer 比對 `ADMIN_SEED_SECRET || NEXTAUTH_SECRET`（`:104`）——未設前者時，授權密鑰**等於 JWT 簽章密鑰**（密鑰重用反模式）；比對用 `!==`（`:129`）非常數時間。檔案註解自承「生產應移除」但端點仍在。
- **修復**: GET 加 `auth()`+admin；POST 強制獨立 `ADMIN_SEED_SECRET`（缺少即拒絕，不 fallback）；改 `crypto.timingSafeEqual`；生產以 feature flag 停用整個 route。

### SR-22 — register 密碼強度遠弱於系統標準｜舊 SEC-005 未修
- **嚴重程度**: Medium
- **證據**: `register/route.ts:63-67` 僅 `z.string().min(8)` 無複雜度；系統另有權威 `validatePasswordStrength`（`packages/api/src/lib/passwordValidation.ts:45-52`，12 碼 + 6 個大寫/數字/符號）卻未套用。雙重標準。
- **修復**: register 直接 `import` 並套用 `validatePasswordStrength`，統一單一真相來源。

### SR-23 — 上傳/seed 端點將內部錯誤 message 回傳 client
- **嚴重程度**: Low~Medium
- **證據**: `admin/seed/route.ts:86,235`、`upload/quote:205`、`upload/invoice:156`、`upload/proposal:162` 把 `error.message`（Azure SDK / Prisma 細節）串回回應。對照 register（`:254-258`）與 tRPC handler（`trpc/[trpc]/route.ts:97-104`，prod 不暴露 onError）做法正確。
- **修復**: catch 只回泛化訊息，細節僅 `console.error` 到 server log。

### SR-30 — 上傳 blob 名稱注入未清理的 client id
- **嚴重程度**: Low
- **證據**: `upload/quote:182`、`upload/invoice:134` 把 `projectId/purchaseOrderId` 直接內插 blob 名；invoice 端點完全不驗 `purchaseOrderId` 存在性。Azure blob 名允許 `/`，可操控虛擬路徑（受 container 白名單限制，無法跨出）。
- **修復**: id 用 `z.string().uuid()` 驗證 + sanitize（去 `/`、`..`、控制字元）。

### SR-31 — register 帳號枚舉（email 已存在訊息可區分）
- **嚴重程度**: Low（策略性，需與產品確認）
- **證據**: `register/route.ts:157-165` 對已存在 email 回明確「此 Email 已被註冊」。配合 SR-07 無 rate limit 可批次枚舉。
- **修復**: 若採嚴格防枚舉，改回泛化訊息 + email 驗證流程；至少先補 rate limit。

---

## 3. 注入 / XSS / 敏感資料 / 密碼學

### SR-10 — `user.getAll` / `getById` 回傳 password hash｜舊 SEC-012 未修
- **嚴重程度**: **High**（已人工複查確認）
- **證據**: `user.ts:94-105`（getAll）、`117-141`（getById）用 `include: { role: true }` 而非 `select`/`omit`，回傳**完整 User 物件，含 `password`（bcrypt hash）**。FIX-101 只改了權限層級（改 `protectedProcedure`），**未過濾 password**。
- **攻擊情境**: 任何已登入使用者（含最低權 ProjectManager）呼叫 `user.getAll` 即取得全體 password hash，可離線暴力破解。對照 `register/route.ts:202-208`、`hasPassword:421`、`changeOwnPassword:453` 都正確用 `select`——團隊知道做法，僅這兩處遺漏。
- **修復**: getAll/getById 加 `omit: { password: true }`（或明確 `select` 不含 password）。**修復成本極低、收益極高，建議列入 P0/P1。**

### SR-11 — `xlsx` 0.18.5 原型污染 + ReDoS（解析使用者上傳 Excel）
> 屬「依賴」類，因解析使用者可控輸入故為 High，詳見 §5 SR-02。

### SR-24 — 密碼強度規則缺字元類別多樣性 + 雙重標準
- **嚴重程度**: Medium
- **證據**: `passwordValidation.ts` 要求 12 碼 + 6 個（大寫/數字/符號合計），但**不要求各類別至少存在**——`"AAAAAA000000"` 即通過，無小寫要求。且 register 完全繞過此函式（見 SR-22）。
- **修復**: 要求至少各含一個小寫/大寫/數字；register 套用同函式。

### SR-25 — health.ts `$queryRawUnsafe` 字串插值 table 名（目前安全，屬反模式）｜舊 SEC-010 澄清
- **嚴重程度**: Low（無 active SQLi）
- **證據**: `health.ts:246-248` `$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`)`，但 `table` 來自硬編碼陣列（`:230-240`），非使用者輸入，**目前無法注入**。其餘 60+ 處 raw SQL **全為 tagged template 參數化安全**（含 `fullSchemaCompare:1883`、`fixPermissionTables:1788`）；`schemaDefinition.ts:252-292` 字串拼接 DDL 但只回傳預覽不執行。
- **澄清**: 舊 SEC-010「60+ raw SQL」的注入風險被高估，實際**無 active SQLi**。唯一 unsafe 用法屬需標記的反模式。
- **修復**: 改用 tagged template 查 `information_schema`，或加註解警告「table 必須來自白名單常數」。

### SR-32 — `layout.tsx` locale 進 `dangerouslySetInnerHTML`（已緩解）｜舊 SEC-015
- **嚴重程度**: Low
- **證據**: `apps/web/src/app/[locale]/layout.tsx:103-105`，但 `:88` 已先 `if (!routing.locales.includes(locale)) notFound()`（白名單 `['en','zh-TW']`），無法注入任意字串。
- **修復**: 防禦縱深——改用 `<html lang={locale}>` 或 `encodeURIComponent`。

### SR-33 — bcrypt salt rounds 不一致（10 vs 12）
- **嚴重程度**: Low
- **證據**: `user.ts:249,394,488` 用 rounds=12；`register/route.ts:79`、`auth.ts:254` 用 rounds=10。皆 `bcryptjs`，比對 timing-safe。
- **修復**: 全系統統一 12。

### SR-34 — forgot-password 仍為假流程（未實作）
- **嚴重程度**: Low（功能缺陷，非洩漏）
- **證據**: `apps/web/src/app/[locale]/forgot-password/page.tsx:75-81` 仍 `setTimeout(1000)` 模擬，未接真實 API / 無重設 token。
- **修復**: 實作真實重設流程（時效性 token + email），或先隱藏入口避免誤導。

---

## 4. CSRF / XSS 防護（基線）

- **CSRF**: tRPC 走 POST + `application/json`，NextAuth 內建 CSRF token；session cookie 應為 `httpOnly`。基線合格（資訊性）。
- **XSS**: React 預設轉義；全專案僅 2 處 `dangerouslySetInnerHTML`/`innerHTML`，注入源皆受控（SR-32 + `test-login.html` 開發孤檔，建議刪除）。**無 active XSS。** 但**缺 CSP**（見 SR-13）使縱深防禦不足。

---

## 5. 依賴漏洞（`pnpm audit --prod` 實測 + 版本分析）

### SR-02 — 依賴鏈含 1 Critical + 5 High（彙整，列為 P0 修補）
- **嚴重程度**: **Critical**（取最高）

| 套件 | 嚴重度 | 問題 | 路徑 | 修補版本 |
|------|--------|------|------|---------|
| **fast-xml-parser** | **Critical** | DOCTYPE entity 名稱 regex 注入繞過（GHSA-m7jm-9gc2-mpf2） | `@azure/storage-blob@12.29.1 > @azure/core-xml > fast-xml-parser@5.2.5` | ≥5.3.5 |
| **xlsx** (SheetJS) | **High** | 原型污染（GHSA-4r6h-8v6p-xvw6）+ ReDoS（GHSA-5pgg-2g8v-p4x9） | `apps/web > xlsx@0.18.5` | 官方 CDN 0.20.3+（npm 無修補版） |
| **next** | **High** | Server Components DoS（GHSA-mwv6-3258-q52c + 後續修補） | `next@14.2.33`（經 next-auth） | ≥14.2.35 |
| **jws** | **High** | HMAC 簽章驗證不當（GHSA-869p-cjfg-cm3x） | `@azure/identity@4.13.0 > @azure/msal-node > jsonwebtoken@9.0.2 > jws@3.2.2` | ≥3.2.3 |
| **@trpc/server** | **High** | `experimental_nextAppDirCaller` 原型污染（GHSA-43p4-m455-4f4j） | `@trpc/server@10.45.2` | ≥10.45.3 |

- **可外部觸發者優先**: `fast-xml-parser`（每次 Azure Blob 上傳/下載解析 XML 回應都走）與 `xlsx`（`data-import`/`project-data-import` 解析使用者上傳 Excel）是攻擊者輸入可達路徑，最該優先。
- **修復**: 升 `@azure/storage-blob`/`@azure/identity` 至帶修補的 transitive；`next`→14.2.35+；`@trpc/server`/client/next→10.45.3+；`xlsx` 改 `pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` 或改用 `exceljs`。升級後重跑 `pnpm audit` 驗證。

### SR-14 — Next.js 主要授權仍依賴 middleware（縱深防禦提醒）
- **嚴重程度**: High（架構性，非當前可利用）
- **說明**: 14.2.33 **不受** CVE-2025-29927（middleware auth bypass，修補在 14.2.25）影響——這點**已確認安全**。但路由授權主要落在 `middleware.ts:158` + `auth.config.ts` authorized callback；middleware 類 CVE 反覆出現，**真正的資料層授權應落在 tRPC procedure**（與 SR-04 的所有權檢查互補）。

### SR-26 — next-auth 5.0.0-beta.30 用於 production
- **嚴重程度**: Medium
- **證據**: `apps/web/package.json:63` + override `@auth/core:0.41.0`。核心認證依賴為 beta（API/安全行為未凍結）。
- **修復**: 追蹤 upstream advisory，規劃升至 v5 GA。

### SR-27 — `bcrypt` 與 `bcryptjs` 重複安裝｜舊 SEC-017 復現
- **嚴重程度**: Medium
- **證據**: `apps/web/package.json:55-56` 並列 `bcrypt@^6.0.0` + `bcryptjs@^2.4.3`（+ `@types/bcrypt`）；後端實際用 `bcryptjs`。`pnpm-lock.yaml:3858/3867` 確認兩者都進 lockfile。
- **修復**: 統一用 `bcryptjs`，移除 `bcrypt` 與 `@types/bcrypt`（減少 native 編譯面與供應鏈面）。

---

## 6. 安全標頭 / 配置 / Docker / CI/CD / 基礎設施

### SR-13 — 缺少 Content-Security-Policy
- **嚴重程度**: **High**
- **證據**: `apps/web/next.config.mjs:10-24`（**實際生效是 `.mjs` 非 `.js`**）已設 `X-Frame-Options:DENY`、`X-Content-Type-Options:nosniff`、`Referrer-Policy`、HSTS、`Permissions-Policy`（基礎不錯），但**無 CSP**。`.env.example:246` 有 `CSP_DIRECTIVES` 但被註解未接線。
- **風險**: 有檔案上傳 + Blob URL 渲染 + 多處使用者輸入，缺 CSP 則任何 XSS 無兜底。
- **修復**: 至少 `default-src 'self'`，逐步收斂 `script-src`（Next 內聯 script 需 nonce，建議在 `middleware.ts` 動態注入）。

### SR-12 — Dockerfile drift：CI 用的不是本次被修改的那份
- **嚴重程度**: **High**（部署一致性 / 供應鏈）
- **證據**: 6 個 workflow（`azure-deploy-dev.yml:96` 等）都 build `-f docker/Dockerfile`，但本次 git 修改的是**根 `Dockerfile`**（git status 顯示 M）。兩者基底不同（根用 `node:20-alpine` OpenSSL 3.0；`docker/` 用 `node:20-alpine3.17` OpenSSL 1.1）。
- **風險**: 對根 Dockerfile 的修改**不會進入任何 Azure 部署**，維護者可能誤判；兩份 drift 造成「本機 build 成功、CI 用另一份失敗」或安全修補只改一份。
- **修復**: 確認權威檔，刪除/合併另一份；若根 Dockerfile 為新權威，同步更新 6 個 workflow 的 `-f` 路徑。

### SR-15 — GitHub Actions 第三方/官方 action 未釘 commit SHA
- **嚴重程度**: **High**（供應鏈）
- **證據**: 全 workflow 用浮動 tag：`azure/login@v1`、`azure/webapps-deploy@v2`、`pnpm/action-setup@v2`、`cd.yml:44 amondnet/vercel-action@v25`、`actions/cache@v4`。
- **風險**: 第三方 action（尤其 `amondnet/vercel-action`）被植入惡意版本即可竊取所有注入 secrets（`AZURE_CREDENTIALS_*`、ACR 密碼、`VERCEL_TOKEN`）。
- **修復**: 釘 `uses: owner/action@<40-char-sha>` + Dependabot 更新。

### SR-28 — Docker / 部署其他風險（彙整）
- **嚴重程度**: Medium
- **SR-28a** `docker/migrate-baseline.sh:31` 對 `DATABASE_URL`（可能指向 Azure PostgreSQL UAT）執行 `DELETE FROM "_prisma_migrations"` → resolve baseline → `migrate deploy`，**無環境守衛、無二次確認、可逆性僅靠 stdout log**。設計上 STEP 1 先 SELECT 印舊紀錄、runner 預設 CMD 為唯讀 `migrate status`（良好），但若操作者誤傳 prod 連線字串並觸發，且某新 migration 含破壞性 DDL，**業務資料可能丟失**。修復：腳本開頭加環境白名單守衛（要求 `CONFIRM_ENV` 比對 host）；STEP 2 前 `CREATE TABLE _prisma_migrations_backup AS SELECT *`；runbook 強制執行前 `pg_dump`。
- **SR-28b** `next.config.mjs:44-51` `typescript.ignoreBuildErrors:true` + `eslint.ignoreDuringBuilds:true` → production build 忽略所有 TS/ESLint 錯誤，安全 lint gate 失效。修復：至少恢復 `eslint.ignoreDuringBuilds:false`。
- **SR-28c** runner image 攜帶完整 pnpm store / prisma CLI（`docker/Dockerfile:116`），攻擊面與體積增大。
- **SR-28d** 每次容器啟動自動 `migrate deploy` + 內嵌 seed（`docker/startup.sh:34,52-117`、`docker-entrypoint.sh`），多副本並發啟動可能撞鎖；`docker-entrypoint.sh:57-60` migrate 失敗仍繼續啟動 → schema 不一致上線。修復：抽成獨立一次性 migration job + 分散式鎖。
- **SR-28e** workflow 無 `permissions:` 最小化；ACR 用 admin 帳密 + 長期 Service Principal 而非 OIDC/Managed Identity。

### SR-29 — `playwright.config.ts` 硬編碼真實格式密鑰（與 SR-01 同值）
- **嚴重程度**: Medium（已併入 SR-01 處理）
- **修復**: 見 SR-01。

### SR-35~38 — Low 項彙整
- **SR-35** HSTS 未含 `preload`（`next.config.mjs:19`）。
- **SR-36** `CORS_ORIGIN`（`.env.example:243`）程式碼中未被讀取——設定漂移，API 實際靠 same-origin + session cookie（目前無 `*` 過寬，但屬死設定）。建議移除或正式實作白名單。
- **SR-37** base image 用浮動 tag 非 `@sha256`（根 `Dockerfile`、`docker/Dockerfile`、`migrate-runner.Dockerfile`），無法保證可重現建置。
- **SR-38** `docker-compose.yml:9,32` 弱預設密碼 `localdev123`/`admin123` + pgAdmin `SERVER_MODE:False` 入庫（僅本地 dev，勿複製到雲端）；另 `cd.yml` 與 `azure-deploy-staging.yml` 都監聽 push main 會雙重觸發部署（一個 Vercel 一個 Azure），建議移除過時的 `cd.yml`/`azure-deploy-example.yml`。

---

## 7. 舊 SEC-001~017 現況對照（基於實際讀碼）

| 舊編號 | 主題 | 文件宣稱 | **實際現況** | 對應新編號 |
|--------|------|---------|------------|-----------|
| SEC-001 | User Router 用 publicProcedure | FIX-101 已修 | **部分修**：寫入改 admin ✅；讀取 getAll/getById/hasPassword 仍 protected（任一登入者可撈全體 + 探測密碼狀態） | SR-06 |
| SEC-002 | Health Router 公開 DB 操作 | FIX-102 已修 | **部分修**：寫入 mutation 改 admin ✅；9 個 public 診斷端點仍洩漏 schema + 枚舉任意 email 角色 | SR-05 |
| SEC-003 | register 無 rate limit | — | **未修**（程式碼層無任何 rate limit） | SR-07 |
| SEC-004 | 認證日誌含敏感資訊 | 建議移除 | **未修**（auth.ts 生產仍印 PII，無 NODE_ENV 守衛） | SR-16 |
| SEC-005 | register 密碼強度弱 | — | **未修**（仍 min(8)，未套 validatePasswordStrength） | SR-22 |
| SEC-006 | 上傳 API 無認證 | FIX-103 已修 | **部分修**：已加 auth() ✅；但無業務授權，quote 可偽造記錄，download 可越權下載 | SR-08, SR-09 |
| SEC-007 | admin/seed GET 無認證 | — | **未修**（GET 仍匿名）+ POST fallback NEXTAUTH_SECRET | SR-21 |
| SEC-008 | 無資源所有權驗證 | — | **未修（大面積）**：delete 補了、update/submit/getById 全缺 | SR-04 |
| SEC-009 | tRPC 全用 Zod | 合格 | **維持合格** ✅ | — |
| SEC-010 | health.ts 60+ raw SQL | Medium | **澄清：無 active SQLi**，全參數化；唯一 unsafe 用白名單 table（反模式） | SR-25 |
| SEC-011 | 上傳副檔名未白名單 | Medium | **部分修**：proposal 用映射 ✅；quote/invoice 仍取原始副檔名 + 信任 client MIME | SR-20 |
| SEC-012 | user 查詢回傳 password hash | High | **未修**（getAll/getById 仍 include 全欄位含 password） | SR-10 |
| SEC-013 | 上傳 log 記錄 Blob URL | Low | 大致延續（與 SR-16/SR-23 同類） | SR-16/23 |
| SEC-014 | tRPC CSRF | 合格 | **維持合格** ✅ | §4 |
| SEC-015 | layout dangerouslySetInnerHTML | Low | **已被白名單緩解** ✅（建議防禦縱深） | SR-32 |
| SEC-016 | 無全域速率限制 | High | **未修** | SR-07 |
| SEC-017 | bcrypt + bcryptjs 並存 | Low | **復現**（仍並存） | SR-27 |

---

## 8. 修復路線圖（建議優先順序）

### P0（24~48 小時）
1. **SR-01** 輪換 `NEXTAUTH_SECRET` + 確認部署環境是否共用此外洩值 + 從 git 移除
2. **SR-02** 修補 Critical/High 依賴（fast-xml-parser、next、@trpc/server、jws、xlsx）
3. **SR-10** `user.getAll/getById` 加 `omit:{password:true}`（成本極低）

### P1（1~2 週）
4. **SR-04** 對 update/submit/getById 加資源所有權檢查（抽 helper 統一）
5. **SR-08 + SR-09** download 改資源 ID + 授權；上傳端點加業務授權 + amount 驗證
6. **SR-05 + SR-06** health 診斷端點與 user 讀取端點收斂權限
7. **SR-07** 對 login/register/forgot-password 加 rate limit（用既有 Redis）

### P2（1 個月）
8. **SR-13** 加 CSP
9. **SR-12 + SR-15** 解決 Dockerfile drift；GitHub Actions 釘 SHA + 加 `permissions:`
10. **SR-16** 移除生產 PII log
11. **SR-21 + SR-22** admin/seed 認證 + 密鑰隔離；register 套用統一密碼策略
12. **SR-17 + SR-18 + SR-19** 審批綁定指派者；SSO 帳號連結；登入失敗鎖定
13. **SR-28a** migrate-baseline.sh 加環境守衛 + 自動備份

### P3（持續強化）
14. SR-20/23/24/26/27/30~38 等 Medium/Low 項；統一 bcrypt；next-auth 升 GA；移除過時 workflow；釘 base image digest

---

## 9. 值得肯定的正確實作（平衡視角）

- ✅ 縱向 RBAC 三層 procedure 邏輯正確（`trpc.ts:323-453`）
- ✅ FIX-101/102/103 確實堵住原本最嚴重的「公開寫入 / 上傳無認證」三個 Critical
- ✅ Credentials 用 `bcrypt.compare`（timing-safe）+ 防帳號枚舉訊息（`auth.ts:123,134,138`）
- ✅ FEAT-014 步驟審批的 `loadCurrentStep` authz 設計良好（`budgetProposal.ts:209`）
- ✅ SSO/register 預設最小權限角色（歷史硬編碼 roleId 提權問題已修）
- ✅ Next.js 14.2.33 **不受** CVE-2025-29927 影響（middleware auth bypass）
- ✅ download SAS 用環境變數 accountName，**不可 SSRF 到外部** storage account
- ✅ `delete` 系列有正確的所有權檢查（可作為 SR-04 的修復範本）
- ✅ 容器最終以非 root（uid 1001）執行；無 `.env` 提交歷史；CI secrets 全用 `${{ secrets.* }}`
- ✅ 無 active SQLi（raw SQL 全參數化）、無 active XSS、無 axios/jsonwebtoken 直依賴
- ✅ migrate-runner 預設唯讀 `migrate status`，破壞性腳本需明確觸發（設計意識良好）

---

## 附錄 A — 本次新增 / 舊報告未涵蓋的攻擊面
- `apps/web/src/app/api/download/route.ts`（FIX-137 新增的 SAS 代理）— SR-08
- `docker/migrate-baseline.sh` + `docker/migrate-runner.Dockerfile`（公司部署新增）— SR-28a
- 根 `Dockerfile` 變更與 `docker/Dockerfile` 的 drift — SR-12
- `pnpm audit` 依賴鏈 CVE（舊報告未做依賴掃描）— SR-02

## 附錄 B — 驗證方法與信心
- 所有行號基於審查當下（2026-06-11）的檔案內容。
- SR-01（密鑰外洩）、SR-10（password hash）、SR-02（pnpm audit）為**人工複查確認**，信心：高。
- SR-04/05/06/08/09 由多個獨立掃描交叉確認，信心：高。
- SR-18（帳號接管）、SR-28a 的實際危害取決於部署環境設定，信心：中，已標註。
- 本報告全程**唯讀**，未修改任何程式碼。後續修復應依專案 Doc-First 流程，逐項建立 FIX 規劃文件後再實作。

---

**報告產出**: 2026-06-11 ｜ **方法**: 靜態唯讀多領域深掃 + pnpm audit + 人工複查
**後續**: 建議將 P0~P1 項各自建立 FIX 規劃文件（`claudedocs/4-changes/bug-fixes/`），依嚴重度排程修復
