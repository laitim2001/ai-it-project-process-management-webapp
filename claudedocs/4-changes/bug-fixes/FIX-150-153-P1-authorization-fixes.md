# FIX-150~153: P1 越權 / 物件級授權修復批次（源自 2026-06-11 安全審計）

> **建立日期**: 2026-06-11
> **狀態**: ✅ 設計已核准（D1~D4 決議完成 2026-06-11）→ 🚧 實作中，順序 FIX-150 → 152 → 151；SR-07/FIX-153 拆獨立批次後排
> **優先級**: High（P1）
> **來源**: `claudedocs/5-analysis/security-review/SECURITY-AUDIT-2026-06-11.md` §1–§2，修復路線圖第 4–7 項
> **前置**: P0（FIX-145~147）已於 PR #1 處理；本批為下一階段，與 P0 無程式碼相依

---

## 0. 批次總覽

P1 是審計報告中**最大的系統性缺口**：核心業務資源全面缺乏「物件級授權（object-level authorization）」。目前所有受影響 procedure 只驗「**有沒有登入**」，不驗「**這筆資料是不是你的**」。配合**可自助註冊**（任一外部人可變成已登入內部使用者）與**無 rate limit**，水平越權的可達性被放大。

| FIX | SR | 摘要 | 嚴重度 | 性質 |
|-----|----|------|--------|------|
| **FIX-150** | SR-04 | 核心 router 的 `update/submit/getById` 加資源所有權檢查（抽共用 helper） | High | 改碼，低風險（複用既有 delete 範本） |
| **FIX-151** | SR-08 + SR-09 | `/api/download` 改「資源 ID + 後端授權」；3 個上傳端點加業務授權 + `amount` 驗證 | High | 改碼 + 改前端呼叫介面，中風險 |
| **FIX-152** | SR-05 + SR-06 | Health 9 個公開診斷端點 + User 讀取端點收斂權限 | High | 改碼，低風險（前端相容性已查證，見 §5.3） |
| **FIX-153** | SR-07 | 對 login / register / forgot-password 加 rate limit | High | **需新基礎設施（Redis client）**，較重 → 見決策 D4 |

> **報告交叉確認信心**：SR-04/05/06/08/09 由多個獨立掃描交叉確認，信心：高。

---

## 1. 關鍵決策（✅ 2026-06-11 使用者已決議）

> **決議摘要**：D1 = owner + Admin（對齊 delete）｜D2 = owner + Supervisor + Admin（讀放寬）｜D3 = SR-09 與 SR-08 一起修（FIX-151）｜D4 = SR-07 拆獨立批次（FIX-153 後排），**本批先做 FIX-150/151/152 三項授權**。
>
> 下方保留各決策的選項與理由供追溯；helper 與各 FIX 內容已依此定稿。

### D1 — 寫入操作的權限集：對齊 delete（owner + Admin）還是放寬給 Supervisor？

現況**不一致**：既有 `project.delete`、`budgetProposal.delete` 只允許「**擁有者 OR Admin**」（**不含 Supervisor**，見 `project.ts:1001-1008`、`budgetProposal.ts:1248-1259`）；但審計報告建議的 helper 寫的是「owner OR **Supervisor**/Admin」。兩者衝突。

- **方案 A（推薦，對齊既有 delete）**：`update/submit/delete` 等寫入 = 擁有者 OR Admin。Supervisor 的角色定位是「審批 + 監督檢視」，不直接代編他人專案 → 與 delete 一致、語意最清楚。
- **方案 B（依報告原文）**：寫入也允許 Supervisor。好處是主管可代下屬修正，但與既有 delete 不一致，且擴大寫入面。

> 建議 **A**。請確認。

### D2 — `getById` 讀取的範圍：是否放寬給 Supervisor / 其他角色？

讀取與寫入語意不同。Supervisor 依 RBAC 要「監督所有專案」、Dashboard 也需跨專案讀。

- **建議**：`getById` = 擁有者 OR Supervisor OR Admin（讀取放寬一級），**但寫入仍依 D1**。即 helper 需區分「讀」與「寫」兩種權限集，而非一個 helper 打天下。

### D3 — SR-09 是否納入本批？

報告路線圖把 **SR-08（download 越權）與 SR-09（upload 無業務授權）綁在同一項**。只修 download-IDOR 卻留 upload-IDOR 不合理（兩者都是檔案物件級授權）。

- **建議**：FIX-151 同時涵蓋 SR-08 + SR-09。請確認。

### D4 — SR-07（rate limit）本批做還是拆出獨立批次？

SR-07 性質與其他三項不同：**目前 codebase 無任何 Redis client 相依**（docker-compose 有 Redis:6381，但程式未接），需新增基礎設施、可能還涉及 CAPTCHA（Turnstile）與「是否改為僅 Admin 邀請註冊」的產品決策。工作量與風險都比 FIX-150/152 大。

- **方案 A（推薦）**：FIX-150/151/152（物件級授權三項）先做、先合併；**SR-07 拆為獨立批次 FIX-153**，待前三項落地後再排，避免 rate-limit 的基礎設施工程拖慢越權主路徑的修補。
- **方案 B**：四項一起做。

> 建議 **A（先授權、後限流）**。請確認是否拆分。

---

## 2. FIX-150 — SR-04 資源所有權檢查（核心）

### 問題
所有以下 procedure 皆為 `protectedProcedure` + `findUnique({ where: { id } })`，**從不比對 owner**：

| Router | 寫入 procedures（缺檢查） | 讀取 getById（缺範圍） |
|--------|--------------------------|------------------------|
| project | `update`（`project.ts:808`，內部 `:866` 僅驗 budgetCategory） | `getById`（`:389`） |
| budgetProposal | `update`（`:484`）、`submit`（`:541`，僅查狀態） | `getById`（`:373`） |
| expense | `update`（`expense.ts:455`） | `getById`（`:223`） |
| purchaseOrder | `update`（`purchaseOrder.ts:359`） | — |
| quote | `update`（`quote.ts:373`）、`delete`（`:427`） | — |
| ~~omExpense~~ | ~~`update`（`omExpense.ts:1764`）~~ → **排除，見下方註 2** | — |

> 註 1：`quote.delete` 與 `project.delete`/`budgetProposal.delete` 不同，**沒有**所有權檢查 —— 一併納入。
>
> 註 2（實作時發現）：**`OMExpense` model 無任何擁有者欄位**（無 `managerId`/`createdById`/`projectId`/`userId`；只關聯 category/OpCo/vendor，`sourceExpenseId` 亦 nullable）。owner-based 的 `assertCanMutate` **無法套用**。OMExpense 是組織級 O&M 費用，其存取應由 **FEAT-009「OpCo 數據權限」或角色閘**控管 —— 屬不同設計，**不在 FIX-150 owner pass 範圍**，另立追蹤（見 §7 新增列）。`omExpense.update` 暫維持現狀（僅 `protectedProcedure`）。

### 解決方案：抽共用 helper（新檔 `packages/api/src/lib/authorization.ts`）

複用既有 delete 範本，統一成兩個 helper（呼應 D1/D2 的讀/寫分離）：

```ts
// packages/api/src/lib/authorization.ts（提案，最終以 review 決策為準）
import { TRPCError } from '@trpc/server';

type AuthzCtx = { session: { user: { id: string; role: { name: string } } } };

/** 寫入授權：擁有者 OR Admin（D1 方案 A）。傳入「已查出的擁有者 userId」。 */
export function assertCanMutate(ownerId: string, ctx: AuthzCtx, label = '此資源') {
  const { id, role } = ctx.session.user;
  if (ownerId === id || role.name === 'Admin') return;
  throw new TRPCError({ code: 'FORBIDDEN', message: `您沒有權限修改${label}` });
}

/** 讀取授權：擁有者 OR Supervisor OR Admin（D2）。 */
export function assertCanRead(ownerId: string, ctx: AuthzCtx, label = '此資源') {
  const { id, role } = ctx.session.user;
  if (ownerId === id || role.name === 'Supervisor' || role.name === 'Admin') return;
  throw new TRPCError({ code: 'FORBIDDEN', message: `您沒有權限檢視${label}` });
}
```

### 套用模式（以 project.update 為例）
```ts
// 取出資源後、執行 update 前插入一行：
const project = await ctx.prisma.project.findUnique({ where: { id: input.id } });
if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到專案' });
assertCanMutate(project.managerId, ctx, '此專案');   // ← 新增
// ... 既有 update 邏輯不動
```
- proposal / expense 的擁有者要透過關聯取：`proposal.project.managerId`、`expense → project.managerId`（`include` 既有關聯，必要時補 `select`）。
- **外科手術原則**：只插入授權檢查行 + 必要的 `include`/`select`，不重排、不改既有業務邏輯。

### 驗證標準
- [ ] PM-A 對 PM-B 的資源呼叫 `update/submit/delete` → 收到 `FORBIDDEN`（手動或 E2E）。
- [ ] PM 對自己的資源、Admin 對任意資源 → 正常成功。
- [ ] `getById`：PM-A 讀 PM-B 資源 → FORBIDDEN；Supervisor/Admin 讀任意 → 成功（依 D2）。
- [ ] `pnpm typecheck` + `pnpm --filter web lint --file <改動檔>` 通過。

---

## 3. FIX-151 — SR-08（download 越權）+ SR-09（upload 無業務授權）

### SR-08：`/api/download` 改「資源 ID + 後端授權」
- **現況**（`apps/web/src/app/api/download/route.ts:33-68`）：已驗登入（FIX-137），但接受 client 完全可控的 `?url=`，只要屬白名單 container（quotes/invoices/proposals）即發 15 分鐘 SAS，**不查 DB、不驗歸屬**。blob 命名可預測 → 可下載他人發票/提案/報價。
- **正面**：`generateSasUrl` 用環境變數 `accountName` 構造，不採 url host → **無 SSRF**，影響限三個已知 container（信心：高）。
- **修復**：改為傳資源 ID（`quoteId`/`expenseId`/`proposalId`），由後端 tRPC procedure 查 DB 取 `filePath` 並做 **RBAC + 所有權**授權（複用 FIX-150 的 `assertCanRead`），download route 僅負責拿「已授權的 blobName」後發 SAS。
- **影響前端**：呼叫 `/api/download` 的元件需改傳資源 ID（非 url）→ 需盤點呼叫點（規劃階段標記為實作前置任務）。

### SR-09：3 個上傳端點加業務授權 + amount 驗證
- **現況**：FIX-103 已加 `auth()`（quote:104 / invoice:88 / proposal:94），但**僅認證、無業務授權**：任一登入者可對任意 projectId/poId/proposalId 上傳；`quote` 上傳後直接 `prisma.quote.create`，`amount: parseFloat(amount)`（client 可控，可 NaN/負數）→ 污染他人專案的報價比較（影響採購選最低價決策）。
- **修復**：
  1. 每個上傳端點驗證 `session.user` 與目標資源的關係（該 project 的 manager / 或 Admin）。
  2. `amount` 改 `z.coerce.number().positive()`。
  3. （建議）拆分「上傳檔案」與「建立 DB 記錄」，記錄走有 RBAC 的 tRPC `quote.create`。

### 驗證標準
- [ ] 低權使用者構造他人資源的下載請求 → FORBIDDEN（非 302 到 SAS）。
- [ ] 低權 PM 對他人專案上傳 quote → FORBIDDEN；`amount` 為負/NaN → 驗證錯誤。
- [ ] 既有「正常擁有者下載/上傳」流程不被打壞（E2E 採購流程）。

---

## 4. FIX-152 — SR-05（Health 診斷端點）+ SR-06（User 讀取端點）

### SR-05：Health Router 公開資訊洩漏
- **現況**：FIX-102 已把寫入型 mutation（`fix*/sync*/createTable`）改 `adminProcedure`（Critical 已堵）；但 9 個 `publicProcedure` 診斷端點仍對網際網路公開（middleware 排除 `/api/*`）。其中 `debugUserPermissions`（`health.ts:2315`）**未登入即可枚舉任意 email 的角色 / isAdmin**；`schemaCheck/schemaCompare/fullSchemaCompare/diagOmExpense` 洩漏資料表結構 + row count；catch 區塊把 `error.message` 直接回前端（`:253,369,795`）。
- **前端相容性（已查證）**：`debugUserPermissions/schemaCheck/...` 在 `apps/web/src` **零呼叫** → 收斂權限**無相容風險**。
- **修復**：`debugUserPermissions` + 所有 `schema*/diag*/fullSchema*` 改 `adminProcedure`（或刪除）；catch 不回 `error.message`（細節只進 server log）；僅保留 `ping`/`dbCheck` 為 public。

### SR-06：User 讀取端點過寬
- **現況**：FIX-101 已把 `create/update/delete/setPassword` 改 `adminProcedure`；但讀取仍 `protectedProcedure`：`getAll`（`user.ts:94`）回全體；`getById`（`:110`）還 include 專案/審批；`hasPassword`（`:412`）接受**任意** userId → 可枚舉帳號密碼狀態。
- **前端相容性（已查證）**：
  - `user.getAll` → 僅 `users/page.tsx:76`（使用者管理頁）+ `approval-workflows/page.tsx:126`（`enabled: isAdmin`）呼叫。
  - `user.getById` → 僅 `users/[id]/page.tsx`、`users/[id]/edit/page.tsx`（admin 頁）。
  - `user.hasPassword` → `UserForm.tsx:100`，**admin 編輯他人時**用 userId 查對方密碼狀態。
- **修復**（依相容性調整，**與報告原文略有出入**）：
  - `getAll/getById/getByRole` → `adminProcedure`（合法 UI 都在 admin 頁，不會打壞）。⚠️ 實作前置：確認 `/users/*` 路由本身有 admin gating，避免任何非 admin 路徑觸發 FORBIDDEN error 畫面。
  - `hasPassword` → **改 `adminProcedure` 但保留 `userId` 入參**（報告建議的「移除 userId、只查自己」會打壞 admin `UserForm`）。實作前置：確認沒有「當前使用者自助查自己」的呼叫點；若有，另加 self-only 變體。

### 驗證標準
- [ ] 非 admin 直接呼叫 `user.getAll`/`health.debugUserPermissions` → FORBIDDEN。
- [ ] admin 使用者管理頁、approval-workflows、UserForm 功能照常。
- [ ] health catch 不再回傳原始 `error.message`。

---

## 5. FIX-153 — SR-07 速率限制（建議拆為獨立批次，見 D4）

- **現況**：codebase 程式層**無任何 rate limit**；`authorize()`（`auth.ts:103-155`）與 `register/route.ts` 皆無節流；register 每次觸發 `bcrypt.hash`（CPU 密集）→ 可 DoS。
- **基礎設施缺口**：**無 Redis client 相依**（需新增 `ioredis` 或 `@upstash/ratelimit`）。
- **修復方向**（待 D4 確認後細化）：
  1. 對 login / register / forgot-password 加 IP + email 維度滑動視窗限流（用既有 docker Redis:6381 或 Upstash）。
  2. 公開註冊加 CAPTCHA（Turnstile）。
  3. 產品決策：是否改為「僅 Admin 邀請建帳號」（從源頭縮小 SR-04/08/09 的可達性）。
- **驗證標準**：N 次失敗登入後被限流；register 高頻請求被擋；正常使用者不受影響。

---

## 6. 實作順序與分支建議

建議分支 `fix/p1-authorization`（自 main 或 P0 合併後切出）。內部順序：

```
1. FIX-150 建 authorization.ts helper + 套用 SR-04 各 procedure  → 驗證：typecheck + 越權手測
2. FIX-152 health/user 端點收斂（低風險、無前端相容問題）        → 驗證：非 admin 呼叫被擋 + admin UI 正常
3. FIX-151 download 改資源 ID（含前端呼叫點盤點）+ upload 授權    → 驗證：E2E 採購/下載流程
4. (D4=拆分時) FIX-153 另開分支、另開 PR
```

> 1→2 風險最低先做；3 牽動前端介面放後；4 視 D4 決定。

---

## 7. 不納入本批（留待 P2/P3，僅登記）

| SR | 摘要 | 層級 |
|----|------|------|
| SR-16 | 認證流程生產環境記錄 PII（無 NODE_ENV 守衛） | Medium |
| SR-17 | 單階段審批未綁定「指派的審批者」（SoD） | Medium |
| SR-18 | Azure AD 以 email upsert 連結帳號的接管風險 | Medium |
| SR-19 | 本地登入無帳號鎖定 / 失敗次數限制（與 SR-07 相關） | Medium |
| SR-20 | 上傳僅信任 client MIME，quote/invoice 副檔名未白名單 | Medium |
| SR-21 | `/api/admin/seed` GET 無認證 + POST fallback 用 NEXTAUTH_SECRET | Medium |
| SR-22 | register 密碼強度遠弱於系統 `validatePasswordStrength` | Medium |
| SR-23 | 上傳/seed 端點回傳內部錯誤 message | Low~Medium |
| SR-04b（新） | **OMExpense 系列授權**：無擁有者欄位，owner-based 不適用；`update`（及應一併評估的 `delete`/`createWithItems`/`addItem`/`updateItem`/`removeItem`）需依 FEAT-009 OpCo 數據權限或角色閘設計 | High（與 SR-04 同源，需獨立設計） |

---

## 8. 相關文件
- 審計報告：`claudedocs/5-analysis/security-review/SECURITY-AUDIT-2026-06-11.md`
- P0 批次：`claudedocs/4-changes/bug-fixes/FIX-145-147-P0-security-fixes.md`（PR #1）
- 範本來源：`project.ts:1001-1008`、`budgetProposal.ts:1248-1259`（既有正確 delete 所有權檢查）
- 規則：`.claude/rules/backend-api.md`（權限控制 / 錯誤 code 分類）

---

> **下一步**：請就 §1 的 D1~D4 給出指示並核准本文件。核准後我才開始實作（先 FIX-150 helper）。
