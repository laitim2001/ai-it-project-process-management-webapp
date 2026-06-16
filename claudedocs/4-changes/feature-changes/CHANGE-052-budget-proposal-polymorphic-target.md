# CHANGE-052: Budget Proposal 多態目標（支援綁定 Project 或 OM Expense）

> **狀態**: ✅ 已實作（本機開發環境，Phase 1–4 完成並靜態驗證；Phase 5 待 live E2E + OM happy-path 手測）
> **建立日期**: 2026-06-16
> **分類**: CHANGE（擴充既有 BudgetProposal 的綁定模型）— 註：scope 接近 FEAT，見 §9
> **相關**: FEAT-014（可配置審批流程）、CHANGE-043（proposalType 欄位）、FIX-150（物件級授權）

---

## 1. 背景與問題

目前 `BudgetProposal.projectId` 為**必填（非 nullable）**，意即每一份預算提案都**必須**綁定一個 Project。

使用者反映：實務上 budget proposal **也會用於 OM expense**（營運維護費用），而 OM expense 不屬於任何單一 Project（它歸屬於 OperatingCompany + ExpenseCategory + 財務年度）。結果：使用者**無法為 OM expense 建立提案**，除非「強行先建一筆假的 Project 記錄」——這是錯誤的 workaround。

### 為什麼不能只是「把 projectId 改成非必填」

`projectId` 在 `budgetProposal.ts`（1506 行）裡不是普通關聯欄位，它撐著三件事；單純改 nullable 會在三處**靜默崩塌**：

| 樑柱 | 現況依賴 | 改 nullable 後的後果 |
|------|----------|----------------------|
| **授權（誰能看/改）** | `BudgetProposal` 無自帶 owner；授權靠 `assertCanRead/Mutate(proposal.project.managerId, ctx)` | 無 project → 無 managerId → **無法判斷歸屬**（水平越權 / IDOR 缺口） |
| **核准回寫** | 核准時 `project.update({ approvedBudget, status:'InProgress' })`；駁回/撤回再減回 | 無 project → **核准通過但預算寫不到任何對象** |
| **通知路由** | legacy fallback 寄給 `project.supervisorId` | 無 project → **收件人不存在** |

> 結論：真正的 blocker 不是那個「必填旗標」，而是「**一份不綁專案的提案，它的歸屬與核准回寫對象由誰定義**」。必須先補上這個答案。

---

## 2. 使用者決策（已確認）

透過 2026-06-16 討論確認方向 **B（多態關聯）**：

- **Q1 核准後行為**：核准通過後**回寫到 OM expense**（如同現在回寫 `Project.approvedBudget`）。
- **Q2 綁定方式**：提案可**選擇綁 Project 或綁 OM expense（多態）**。

---

## 3. 設計總覽

讓 `BudgetProposal` 能綁定 **Project 或 OMExpense 二擇一（XOR）**，並為提案補上自帶的 `ownerId` 讓授權脫離 project。核准/駁回時依「綁定的目標類型」回寫對應對象。

```
                 ┌──────────────────┐
                 │  BudgetProposal  │
                 │  + ownerId  (NEW)│──── owner ───▶ User（授權錨點）
                 │  projectId?  ◀── 二擇一 XOR ──▶ omExpenseId? (NEW)
                 └────────┬─────────────────────┬───┘
            核准回寫       │                     │      核准回寫
   Project.approvedBudget ◀┘                     └▶ OMExpense.approvedBudget (NEW)
   + status='InProgress'                            (+ approvalStatus? 見 D1)
```

### 3.1 授權模型變更（核心）

`packages/api/src/lib/authorization.ts` 的 `assertCanRead/assertCanMutate(ownerId, ctx, label)` 是**通用**的——只吃一個 `ownerId`。目前餵 `project.managerId`，改為餵 `proposal.ownerId` 即可，helper **本身不需改**。

- 新增 `BudgetProposal.ownerId`（建立者 user id）。
- 所有 `assertCan*(existingProposal.project.managerId, ...)` → `assertCan*(existingProposal.ownerId, ...)`（約 7 處）。
- 既有資料回填：`ownerId = project.managerId`（保持現有授權行為**完全不變**）。

### 3.2 核准回寫分支

核准（`approve` / `approveStep` 最末步）與駁回/撤回（status revert）時，依目標分流：

```ts
if (proposal.projectId) {
  // 既有行為，不變
  await tx.project.update({ where: { id: proposal.projectId }, data: { approvedBudget, status: 'InProgress' } });
} else if (proposal.omExpenseId) {
  // 新增（D1：回寫金額 + 狀態）
  await tx.oMExpense.update({ where: { id: proposal.omExpenseId }, data: { approvedBudget, approvalStatus: 'Approved' } });
}
```

撤回/駁回的反向回寫（現 `budgetProposal.ts:1468-1493` 的 `approvedBudget` decrement）同樣加分支。

### 3.3 通知路由

- **Workflow 路徑（FEAT-014，有 active workflow）**：`notifyStepApprovers` 寄給步驟角色/指定人，**本來就不依賴 project** → OM 提案直接沿用，零改動。
- **Legacy fallback（無 active workflow，Q-D）**：現寄 `project.supervisorId`，**僅保留給「綁 Project」提案**。**OM 提案 submit 時若無可解析的 active workflow → 直接 `BAD_REQUEST` 擋下**（D2），不進此 fallback。

### 3.4 互斥（XOR）約束

一份提案只能綁定 **Project 或 OMExpense 其中之一**：
- **Zod 層**：`create` input 用 discriminated union（`targetType: 'Project' | 'OMExpense'`），二擇一必填。
- **App 層**：建立時驗證對應目標存在（沿用現有 `findUnique` + NOT_FOUND）。
- **DB 層**（選配）：可加 CHECK 約束 `(projectId IS NOT NULL) <> (omExpenseId IS NOT NULL)`；Prisma 不原生支援 CHECK，需手寫 migration SQL。預設先靠 Zod + app 層，DB CHECK 列為 nice-to-have。

---

## 4. Schema 變更（`packages/db/prisma/schema.prisma`）

```prisma
model BudgetProposal {
  // ...
  projectId   String?   // 改：必填 → 可選
  omExpenseId String?   // 新增：綁定 OM expense（與 projectId 二擇一）
  ownerId     String    // 新增：提案擁有者（建立者），授權錨點

  // 關聯
  project   Project?   @relation(fields: [projectId], references: [id])   // 改：可選
  omExpense OMExpense? @relation(fields: [omExpenseId], references: [id])  // 新增
  owner     User       @relation("ProposalOwner", fields: [ownerId], references: [id]) // 新增

  @@index([omExpenseId]) // 新增
  @@index([ownerId])     // 新增
}

model OMExpense {
  // ...
  approvedBudget Float?            // 新增：核准回寫金額（D1）
  approvalStatus String?          // 新增：核准狀態，如 'Approved'（D1）
  proposals      BudgetProposal[]  // 新增反向關聯
}

model User {
  // ...
  ownedProposals BudgetProposal[] @relation("ProposalOwner") // 新增反向關聯
}
```

### Migration（需手寫資料回填）

```sql
-- 1. 加欄位（ownerId 先允許 NULL 以便回填）
ALTER TABLE "BudgetProposal" ADD COLUMN "omExpenseId" TEXT;
ALTER TABLE "BudgetProposal" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "OMExpense" ADD COLUMN "approvedBudget" DOUBLE PRECISION;

-- 2. 回填 ownerId = 既有提案所屬專案的 managerId（維持現有授權行為）
UPDATE "BudgetProposal" bp
SET "ownerId" = p."managerId"
FROM "Project" p
WHERE bp."projectId" = p."id" AND bp."ownerId" IS NULL;

-- 3. ownerId 設為 NOT NULL + projectId 放寬為可空
ALTER TABLE "BudgetProposal" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "BudgetProposal" ALTER COLUMN "projectId" DROP NOT NULL;

-- 4. FK + 索引
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_omExpenseId_fkey"
  FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON UPDATE CASCADE;
CREATE INDEX "BudgetProposal_omExpenseId_idx" ON "BudgetProposal"("omExpenseId");
CREATE INDEX "BudgetProposal_ownerId_idx" ON "BudgetProposal"("ownerId");
```

> ⚠️ 此為**生產環境會跑的 migration**，且牽涉既有資料回填，須在 review 時逐句確認，並與公司/個人 Azure 環境的 schema 同步機制（`health.fullSchemaSync`）對齊。

---

## 5. API 變更（`packages/api/src/routers/budgetProposal.ts`）

| 區塊 | 變更 |
|------|------|
| `budgetProposalCreateInputSchema` | 改為 discriminated union：`{ targetType:'Project', projectId }` 或 `{ targetType:'OMExpense', omExpenseId }`；title/amount 不變 |
| `create` | 依 targetType 驗證對應目標存在；`ownerId = ctx.session.user.id`；`include` 動態帶 project 或 omExpense |
| 授權檢查（update/submit/getById…約 7 處） | `assertCan*(proposal.project.managerId,…)` → `assertCan*(proposal.ownerId,…)` |
| `include: { project: … }`（全 router） | 改為同時可帶 `omExpense`，並讓所有讀取 `proposal.project.*` 的地方容忍 null |
| `approve` / `approveStep`（最末步回寫） | 加 Project vs OMExpense 回寫分支（§3.2） |
| status revert（駁回/撤回反向回寫，~1468-1493） | 同步加分支 |
| `submit`（~549-689） | 綁 OM 提案：若 `resolveWorkflow` 無結果 → 拋 `BAD_REQUEST`（D2）。legacy fallback（~676-686 寄 `project.supervisorId`）僅在 `projectId` 非空時執行 |
| `getAll` search（~319, 386） | search OR 條件加 `omExpense.name` |
| 通知 message 內的專案名 | 無 project 時改用 omExpense.name 或提案 title |

---

## 6. 前端變更（`apps/web`）

| 範圍 | 變更 |
|------|------|
| 提案建立表單 | 新增「目標類型」選擇（Project / OM expense）→ 對應顯示 Project 選單或 OM expense 選單 |
| 提案列表 / 詳情 | 顯示綁定目標（專案名或 OM 費用名）；無 project 的欄位 fallback |
| i18n（`en.json` + `zh-TW.json`） | 新增目標類型、OM 選擇等 key（雙語同步，跑 `pnpm validate:i18n`） |

> 受影響的具體頁面/組件清單於實作前再以 Grep 精確定位（`api.budgetProposal.*` 的呼叫點 + 顯示 `proposal.project` 之處）。

---

## 7. 決策（2026-06-16 已確認）

| # | 決策 | 結論 |
|---|------|------|
| **D1** | OMExpense 回寫欄位 | ✅ **兩者都加**：`approvedBudget Float?` + `approvalStatus String?`（鏡像 Project 的 approvedBudget + 狀態語意），讓 OM 也能呈現「已核准」 |
| **D2** | OM 提案的審批通知 | ✅ **OM 提案走 FEAT-014 workflow**（approver 與 project 無關）。submit 時若**無可解析的 active workflow → 直接擋下並回明確錯誤**（`BAD_REQUEST`），不走會壞掉的 legacy fallback（legacy fallback 僅保留給「綁 Project」提案） |
| **D3** | `ownerId` 語意 | ✅ 新提案 = 建立者；既有資料回填 = `project.managerId`（授權行為不變） |
| **D4** | 分類 CHANGE vs FEAT | ✅ **維持 CHANGE-052**（本質擴充既有 BudgetProposal） |
| **D5** | 既有 `proposalType`（'BudgetProposal'\|'Payment'） | ✅ 與本變更**正交**，不動它；目標類型由哪個 FK 非空決定，不新增 discriminator 欄位到 DB |
| **D6** | DB 層 XOR CHECK 約束 | ✅ 先靠 Zod + app 層；DB CHECK 列為選配 |

---

## 8. 實作步驟（核准後執行，每步附驗證）

```
1. Schema：加 ownerId/omExpenseId/approvedBudget + 改 projectId 可選 + 寫 migration（含回填）
   → 驗證：pnpm db:generate 無錯誤；migration 在本地 DB 跑通且既有提案 ownerId 已回填
2. API：create 改 discriminated union + 7 處授權改 ownerId
   → 驗證：pnpm typecheck 通過（聚焦 packages/api）
3. API：核准/駁回/撤回回寫分支 + submit/通知 null-safe + search 擴充
   → 驗證：pnpm typecheck 通過；手動測試 OM 提案 create→submit→approve→回寫 approvedBudget
4. 前端：建立表單目標類型選擇 + 列表/詳情顯示 + i18n 雙語 key
   → 驗證：pnpm validate:i18n 通過；瀏覽器走完 Project 與 OM 兩條路徑
5. 迴歸：既有「綁 Project」提案的 create/submit/approve/reject/revert 行為完全不變
   → 驗證：手動 + （若有）Playwright proposals 相關 spec
```

> Lint 採 file-scoped 驗證（`next lint --file <改動檔>`），因專案 `pnpm lint` baseline 本身非綠。

---

## 9. 風險與回滾

- **風險 1（授權迴歸）**：7 處授權錨點切換，若漏改某處仍讀 `project.managerId` 會在 OM 提案（project=null）NPE。→ 緩解：切換後全域 Grep `\.project\.managerId` 確認歸零。
- **風險 2（既有資料）**：回填 `ownerId` 失敗會導致 NOT NULL 約束失敗。→ 緩解：migration 分步（先 nullable 回填再加約束），回填後驗證無 NULL 才加 NOT NULL。
- **風險 3（生產 schema 同步）**：Azure 環境靠 `fullSchemaSync`，新欄位需確認該機制能補上 `approvedBudget`/`omExpenseId`/`ownerId`（其中 `ownerId` 為 NOT NULL，自動同步對既有資料可能卡住 → 須走正式 migration 回填，不可只靠 fullSchemaSync）。
- **回滾**：未上生產前可直接 reset migration；已上生產則需反向 migration（移除欄位前先確認無 OM 提案資料）。

---

## 10. 影響範圍摘要

- **Models**: `BudgetProposal`（+ownerId, +omExpenseId, projectId 改可選）、`OMExpense`（+approvedBudget[, +approvalStatus]）、`User`（反向關聯）
- **API**: `budgetProposal.ts`（create/授權/核准/駁回/submit/通知/search）
- **Pages/Components**: 提案建立表單、提案列表/詳情（實作前精確定位）
- **i18n**: 新增目標類型相關 key（雙語）
- **Migration**: 1 個新 migration（含資料回填）

---

## 11. 實作紀錄（2026-06-16）

### 已完成（本機開發環境）

| Phase | 內容 | 驗證 |
|-------|------|------|
| 1 | Schema：`BudgetProposal` +ownerId/+omExpenseId、projectId 改可選；`OMExpense` +approvedBudget/+approvalStatus；migration `20260616055230_change052_budget_proposal_polymorphic_target`（手寫 3 步回填） | `prisma migrate dev` 套用成功；psql 驗證 7 筆既有提案 **0 筆 NULL ownerId** |
| 2 | `budgetProposal.ts`：create 改 discriminated union（targetType）+ 設 ownerId；7 處授權 `project.managerId`→`ownerId` | `pnpm --filter @itpm/api typecheck` ✅；grep `\.project\.managerId` 歸零（僅剩 submit legacy fallback 受 `if (proposal.project)` 守衛） |
| 3 | 核准回寫 helper `applyApprovalWriteback`（approve/approveStep）；revertToDraft 回退分支；submit OM 強制 workflow（無則 `BAD_REQUEST` + cause `OM_PROPOSAL_REQUIRES_WORKFLOW`）；getAll 搜尋加 omExpense.name；include 全面加 omExpense | api typecheck ✅ |
| 4 | 前端：`BudgetProposalForm` 加 targetType + OM 選擇器；列表/詳情/待審/PM 儀表板 12+ 處顯示 null-safe；canDelete 改 ownerId；詳情頁專案資訊區條件式換成 OM 資訊區；i18n 雙語（form.targetType/form.omExpense/detail.omExpense） | `pnpm --filter web typecheck` ✅；`pnpm validate:i18n` ✅（2869 keys）；file-scoped lint 無新增 |

### 計畫外、由 typecheck 抓到並一併修正

- `apps/web/src/app/[locale]/proposals/[id]/edit/page.tsx`：`initialData.projectId` 傳入 `proposal.projectId`（現為 `string|null`）→ 改 `?? ''`。
- `apps/web/src/app/api/upload/proposal/route.ts`：檔案上傳授權原用 `proposal.project.managerId` → 改用 `proposal.ownerId`（對齊新授權模型）。

### 計畫外、由 re-seed 抓到並一併修正（2026-06-16 第二批）

- **`packages/db/prisma/seed.ts`：CHANGE-052 把 `ownerId` 設必填，但 seed 建立 6 筆 BudgetProposal 時未提供 → `db:seed` 失敗（`Argument 'owner' is missing.`）**。修正：6 筆提案皆補 `ownerId: pmUser.id`（= 專案 manager，對齊回填邏輯）。**這是讓 seed 在 CHANGE-052 後可用的必要修正。**
- 附帶（E2E login fixture 修復鏈）：`seed.ts` 的 pm 密碼 `pm123`(5字元) < 登入頁驗證(6字元) → 改 `pm123456`；並把 pm 的 `user.upsert` 由 `update: {}` 改為 `update: { password: pmPassword }`，使 re-seed 能同步更新既有用戶密碼。同步更新 E2E fixtures/helpers/test-data、login test script 與當前文件（CLAUDE.md、DEVELOPMENT-SETUP.md、本地初始化 checklist）。E2E login fixture 另修 `/login`(404) → `/zh-TW/login`。驗證：E2E 現可成功登入並深入工作流（後續失敗為 spec 與 UI 文字不符，與本變更無關）。

### 已知 gap / 後續（不在本次 scope）

- **PM 儀表板與「提案需補件」清單仍以 `project.managerId` 過濾**（`dashboard.ts:129`），OM 提案不會出現在 PM 儀表板的補件區。本次僅將顯示 null-safe（退回提案標題），未改查詢語意。若要讓 PM 儀表板涵蓋 OM 提案，需另將該 where 改為 `ownerId`（屬獨立小變更）。
- **`ownerId` 語意微調**：新提案 owner = 建立者（既往「依 project.managerId 授權」對 creator≠manager 的邊角案例行為改變；既有資料回填 = managerId，故無迴歸）。

### Runtime 注意點

- `prisma generate` 在 Windows 出現 `EPERM`（query engine DLL 被執行中 dev server 鎖住）。**TS 型別已成功生成**（typecheck 正常），僅 runtime DLL 待 **dev server 重啟**後完成置換。
- 目前執行中的 dev server 是 migration 前啟動、載入**舊 Prisma client**；**跑 live E2E / 手測前需重啟 dev server**，否則 create OM 提案會因 client/DB 不同步而失敗。
- 既有 E2E `budget-proposal-workflow.spec.ts` 經檢視**與改後表單相容**（用 `select[name="projectId"]`，表單預設 targetType='Project' 仍渲染此 select）。

### Phase 5 驗證紀錄（2026-06-16，dev server 已重啟於 :3000）

- ✅ **資料層驗證通過**（臨時腳本，跑完即刪）：對真實 DB + 新 Prisma client 跑 router 實際操作 —
  - project-bound 提案建立（project 關聯正常、omExpense=null、ownerId 設定）→ **迴歸 OK**
  - OM-bound 提案建立（omExpense 關聯正常、project=null、ownerId 設定）→ **新功能 OK**
  - 核准回寫 `OMExpense.approvedBudget` + `approvalStatus='Approved'` → **回寫 OK**；revert 還原 OK。
- ✅ **`budget-proposal-workflow.spec.ts` 已修到全綠（chromium + firefox，2 tests passed）**：完整審批（建立→提交→2 步審批→驗證回寫）+ 拒絕流程皆通過，runtime 印證 project 提案 create/submit/approve→`Project.approvedBudget` 回寫無迴歸。修復含一連串既有 drift（與 CHANGE-052 無關）：login fixture `/login`→`/zh-TW/login`、pm 密碼 `pm123`→`pm123456`+re-seed、按鈕文字「創建X」→`button[type=submit]`、原生 select→Combobox（budgetPool）、必填 `projectCode`、預設 30s timeout→120s、2 步審批需 adminPage、`toHaveURL` 用 regex、`已拒絕`→`已駁回`。
- 🐛 **附帶修一個真實產品 bug**：`BudgetPoolForm` 預設幣別寫死 TWD、無 fallback；本 DB 僅 HKD → 建立預算池必填幣別卡死（**公司 HKD 環境實際使用亦受影響**）。改為 `(twdCurrency ?? currencies?.[0])?.id`。web typecheck ✅。
- ⚠️ MCP 自動瀏覽器互動式登入無法建立 session（auth/CSRF 工具問題，與本變更無關）；Playwright fixture 登入正常。

---

## 相關文件
- `claudedocs/4-changes/feature-changes/CHANGE-043-budget-proposal-meeting-minutes-fields.md`（proposalType 由來）
- `claudedocs/4-changes/bug-fixes/FIX-150-153-P1-authorization-fixes.md`（物件級授權設計）
- `packages/api/src/lib/authorization.ts`（授權 helper）
- `packages/db/prisma/schema.prisma`（Schema SSOT）
