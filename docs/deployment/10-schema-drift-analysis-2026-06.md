# 10 - 公司環境 Schema 漂移分析與修正計畫（company/dev, 2026-06）

> **類型**: 故障根因分析 + 修正計畫（待 review / 核准後才套用到正式 DB）
> **建立日期**: 2026-06-16
> **狀態**: ✅ **已核准並執行完成**（2026-06-16：快照測試全綠 → 使用者核准 → 正式 DB 套 §6 SQL → cutover v20260609 → 驗證 38/38 model + 500 查詢回 5 筆。詳見 §8.1 與 doc 08 §10.1）
> **前情**: doc `08-company-dev-deploy-runbook-2026-06.md` §10 — 2026-06-16 部署 v20260609 後 `budgetProposal.getAll` 等登入後 tRPC 回 500，已回滾到 `v20260504-123857`。根因＝**公司 DB 與 HEAD schema 漂移**。本文是該根因的**完整、權威**分析。
> **資料安全承諾**: 本分析全程**唯讀**（migrate diff introspect + SELECT count），且只在**預部署快照**（`psql-itpm-company-dev-001-predeploy`，拋棄式測試 server）上進行，**完全未碰正式 DB**。

---

## 0. 一句話總結

公司 DB 長期靠 `fullSchemaSync`（raw SQL）同步，已偏離 Prisma schema。但**真正導致 500 的只有一件事：`BudgetProposal` 缺 6 個 HEAD 有的欄位**。因為 **Prisma Client 只 `SELECT` schema 明列的欄位、從不 `SELECT *`**，所以 DB「多出」的欄位（isActive / hasItems …）對 app **完全無害**。

→ **最安全修法 = 只補缺欄位（ADD）+ 放寬幾個 NOT NULL（DROP NOT NULL）。完全不做任何 `DROP COLUMN` / `SET NOT NULL`。零資料風險、零 backfill。**

---

## 1. 為什麼「只 ADD」就夠？（修法方向的理論基礎）

這是本計畫最關鍵的判斷，且**已由程式碼與資料雙重實證**，非臆測：

### 1.1 Prisma Client 從不 `SELECT *`

Prisma 對每個查詢產生**明列欄位**的 SQL（`SELECT "id","title",...`）。後果：

| DB 與 HEAD schema 的差異 | 對 v20260609 app 的影響 |
|--------------------------|--------------------------|
| DB **缺** HEAD 有的欄位（如 `BudgetProposal.documentLink`） | Prisma SELECT 不存在的欄位 → **`column does not exist` → 500**（← 這次的病因） |
| DB **多出** HEAD 已移除的欄位（如 `BudgetPool.isActive`） | Prisma 根本不提及該欄位 → **完全無感，不會壞** |
| 非空欄位（HEAD 為 `Float`/`Boolean` 非 nullable）在 DB 內含 NULL | Prisma 讀到 null 填入非空型別 → **read error**（需確認無 NULL，見 §4） |

→ 修好 app 的**充分必要條件**＝「補齊缺欄位」＋「確保非空欄位無 NULL 值」。**不需要**把多餘欄位刪掉。

### 1.2 沒有任何自動程序會刪欄位（補的欄位不會被回退）

逐行檢查 `packages/api/src/routers/health.ts` 的 `fullSchemaCompare` / `fullSchemaSync`：**每一條都是 `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `ADD CONSTRAINT` / `DROP NOT NULL`（放寬）——全檔零個 `DROP COLUMN` / `DROP TABLE`。** 且：

- 容器啟動只跑 `migrate deploy`（baseline 後為 no-op），**不自動跑** fullSchemaSync。
- 即使日後手動觸發 fullSchemaSync，它的 hardcoded 清單是 stale 的（**不含** CHANGE-043 / FEAT-014 的 BudgetProposal 新欄位），所以它**補不出**我們要補的欄位——這也正是當初漂移沒被補上的原因——但它**也絕不會刪**我們手動補的欄位。

→ 結論：手動 `ADD COLUMN` 後，沒有任何機制會把它移除。修法穩定。

---

## 2. 取得本分析的方法（唯讀、可重現）

1. 在**快照** server 加暫時防火牆規則 `AllowAzureServices`（0.0.0.0；快照 PITR restore 後防火牆為空）。
2. 以 ACI（`itpm-migrate:v20260610-000604`，內含 prisma + psql + HEAD schema/migrations）對快照執行：
   - `prisma migrate diff --from-url <snapshot> --to-schema-datamodel schema.prisma --script`（introspect，產出完整 SQL delta；§5 附全文）
   - 一批 `SELECT count(*)`（NULL 計數 + 保留欄位資料量；§4）
3. 兩個 ACI 均 exitCode=0；輸出為純 SQL/數字（ASCII），不受先前 cp1252 log 問題影響。

> 快照與正式 DB 的**業務資料相同**（PITR 取自部署前一刻，且我們的 migration 未動這些欄位的資料），故快照上的 NULL 計數＝正式 DB 的計數，具代表性。

---

## 3. 漂移成因（為什麼會變成這樣）

- 公司 DB 的真實「最後 migration」是 `v20260504-123857`（commit `67e2e21` / FIX-139）。其後的 schema 演進（CHANGE-043 的 BudgetProposal 欄位、FEAT-014 的 `workflowId`/`currentStepSequence`）原本是靠 `fullSchemaSync` 的 hardcoded 清單補——但那份清單**沒更新到這些最新欄位** → DB 一直缺。
- FIX-141 把 migration 重立基線（這些欄位被「折」進 `00000000000000_init`）。我們部署時對 init 做 `migrate resolve --applied`（**標記已套用、但沒實際執行建表 SQL**）→ DB 永遠拿不到 init 內那些欄位，且 `migrate status` 因為「已標記」而**誤報 up to date**，遮蔽了漂移。
- 同時 DB 還留著更早版本的欄位（`isActive`/`hasItems`/BudgetProposal 的 `budgetCategoryId`/`currencyId`），這些在 HEAD 已移除 → 形成「多出」的一側。

---

## 4. 資料影響查證（決定無須 backfill 的證據）

對快照（= 正式 DB 等效資料）的唯讀計數結果：

| 項目 | 值 | 解讀 |
|------|----|------|
| `OMExpense.totalBudgetAmount` IS NULL | **0** | SET NOT NULL 候選；無 NULL → app 讀取 OK，無須 backfill |
| `OMExpense.totalActualSpent` IS NULL | **0** | 同上 |
| `OMExpenseItem.isOngoing` IS NULL | **0** | 同上 |
| `Project.{projectType,expenseType,chargeBackToOpCo,probability,isCdoReviewRequired,isManagerConfirmed,isOngoing}` IS NULL | **全部 0** | 同上（7 欄全無 NULL） |
| `ChargeOutItem.expenseId` IS NULL | 0（且全表 0 列） | DROP NOT NULL 候選；表為空 |
| `BudgetPool.isActive = false` | **0**（共 8 列） | 「多餘欄位」無有效資料 → 保留零成本 |
| `OMExpense.hasItems = true` | **0**（共 134 列） | 同上 |
| `BudgetProposal.budgetCategoryId / currencyId` 非空 | **0 / 0**（共 5 列） | 同上（這兩欄無資料） |
| 規模 | BudgetPool=8 / BudgetProposal=5 / Project=78 / OMExpense=134 / OMExpenseItem=774 / ChargeOutItem=0 | 小 → ADD/INDEX 瞬間完成 |

**關鍵結論**：所有「HEAD 為非空」的欄位在 DB 內**零 NULL** → ① Prisma 讀取不會出錯；② 不需要任何 `UPDATE` backfill；③ 那些 `SET NOT NULL` 即使不做，app 也完全正常。

---

## 5. 完整漂移分類（migrate diff 全量逐項裁決）

> 圖例：✅**必做**（修好 500 / 防止寫入失敗，且安全）｜🟢**安全可選**（非必要、無風險，列為「對齊」可做可不做）｜⏸️**延後**（非必要 + 破壞性或有風險，**本次不做**，留待專屬維運窗口）｜⚙️**已在 live**（snapshot diff 的雜訊；正式 DB 已透過 5 個 migration 具備）

### 5.1 ✅ 必做（最小安全修正集）

| diff 語句 | 類別 | 裁決理由 |
|-----------|------|----------|
| `BudgetProposal ADD COLUMN currentStepSequence INTEGER` | 安全 ADD（nullable） | 修 500 |
| `BudgetProposal ADD COLUMN documentLink TEXT` | 安全 ADD（nullable） | 修 500 |
| `BudgetProposal ADD COLUMN proposalType TEXT NOT NULL DEFAULT 'BudgetProposal'` | 安全 ADD（**有 default**，既有 5 列自動填預設） | 修 500 |
| `BudgetProposal ADD COLUMN reviewNotes TEXT` | 安全 ADD（nullable） | 修 500 |
| `BudgetProposal ADD COLUMN vendorId TEXT` | 安全 ADD（nullable） | 修 500 |
| `BudgetProposal ADD COLUMN workflowId TEXT` | 安全 ADD（nullable） | 修 500 |
| `CREATE INDEX BudgetProposal_vendorId_idx` | 安全 INDEX | 配合新欄位（HEAD 有此索引） |
| `CREATE INDEX BudgetProposal_workflowId_idx` | 安全 INDEX | 同上 |
| `ADD FK BudgetProposal_vendorId_fkey → Vendor (SET NULL)` | 安全 FK | 新欄位全 NULL → 無孤兒，驗證必過 |
| `ADD FK BudgetProposal_workflowId_fkey → ApprovalWorkflow (SET NULL)` | 安全 FK | 同上；ApprovalWorkflow 已在 live |
| `ChargeOutItem ALTER COLUMN expenseId DROP NOT NULL` | 安全放寬 | HEAD 為 nullable；防止新式 ChargeOut 寫入失敗（表目前 0 列） |
| `OMExpense ALTER COLUMN opCoId DROP NOT NULL` | 安全放寬 | deprecated 欄位；新式 OMExpense 建立時省略 → 防寫入失敗 |
| `OMExpense ALTER COLUMN budgetAmount DROP NOT NULL` | 安全放寬 | 同上 |
| `OMExpense ALTER COLUMN startDate DROP NOT NULL` | 安全放寬 | 同上 |
| `OMExpense ALTER COLUMN endDate DROP NOT NULL` | 安全放寬 | 同上 |

> 放寬（DROP NOT NULL）對既有 134 列 OMExpense **無任何影響**（它們已有值）；只是讓未來「新式」寫入（省略 deprecated 欄位）不會被擋。對舊 app 也向後相容。

### 5.2 ⏸️ 延後（本次不做 — 非必要且破壞性/有風險）

| diff 語句 | 為何不做 |
|-----------|----------|
| `BudgetPool DROP COLUMN isActive` | 破壞性；多餘欄位對 Prisma 無害（§1.1）；資料量 0；無修復價值 |
| `BudgetProposal DROP COLUMN budgetCategoryId, currencyId` | 同上（資料量 0） |
| `OMExpense DROP COLUMN hasItems` | 同上（資料量 0） |
| `{OMExpense,OMExpenseItem,Project} ... SET NOT NULL`（共 10 欄） | 收緊操作；§4 已證 0 NULL → app 本就正常；收緊無增益、且若未來出現邊界 NULL 會卡寫入 |
| `{ExpenseCategory,OMExpenseItem,Permission,ProjectChargeOutOpCo,RolePermission,UserOperatingCompany,UserPermission} ALTER COLUMN id/updatedAt DROP DEFAULT` | 純 Prisma 慣例噪音（DB 端 default 對 Prisma 無害，Prisma 一律自帶 id/updatedAt 值）；無功能差異 |
| 可選索引：`Project_*`(5)、`Permission_code`、`OMExpenseItem_sortOrder`、`UserOperatingCompany_*`(2) | 純效能；非功能必要。可在維運窗口統一補（安全） |
| 可選 / 有風險 FK：`UserOperatingCompany_*`、`OMExpense_categoryId/sourceExpenseId`、`OMExpense_opCoId`(重定義)、`ChargeOutItem_expenseId/expenseItemId` | 對既有資料欄位加 FK 會**驗證既有列**，若有孤兒會失敗；非功能必要 → 延後，且補前須先驗孤兒 |

### 5.3 ⚙️ 已在 live（snapshot diff 雜訊，正式 DB 已具備，本次不需動作）

- `CREATE TABLE` ×6：`ApprovalWorkflow` / `ApprovalStep` / `ProposalApprovalProgress`（FEAT-014）+ `ProjectExpense` / `ProjectExpenseItem` / `ProjectExpenseMonthly`（FEAT-015）及其索引/FK
- `OMExpenseMonthly ADD COLUMN actualAmountHKD`（CHANGE-048）
- `User ALTER COLUMN roleId SET DEFAULT 2`（security migration）
- `ApprovalStep.approverUserId` 等（CHANGE-047）

> 這些是「snapshot 缺、但 live 已透過 5 個 migration 建好」的部分。**快照測試時**需先在快照重跑這 5 個 migration，才能還原成 live 等效狀態（見 §7）。

---

## 6. 建議修正 SQL（冪等；可在快照測試、核准後對正式 DB 套用、可重跑）

> 全部 `IF NOT EXISTS` / `DROP NOT NULL`（冪等）/ FK 以 `DO` 區塊先查 `pg_constraint`。**無 `DROP COLUMN`、無 `SET NOT NULL`、無 `UPDATE`。** 前置假設：FEAT-014 的 `ApprovalWorkflow` 表已存在（live 已有；快照測試前先跑 5 migration）。

```sql
-- ============================================================
-- company/dev schema-drift 最小安全修正（ADD-only + 放寬）
-- 對應 doc 10 §5.1。零 DROP COLUMN / 零 SET NOT NULL / 零 backfill。
-- ============================================================
BEGIN;

-- 1) BudgetProposal 補 6 欄（修 500 主因）
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "currentStepSequence" INTEGER;
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "documentLink" TEXT;
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "proposalType" TEXT NOT NULL DEFAULT 'BudgetProposal';
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "BudgetProposal" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;

-- 2) 對應索引
CREATE INDEX IF NOT EXISTS "BudgetProposal_vendorId_idx" ON "BudgetProposal"("vendorId");
CREATE INDEX IF NOT EXISTS "BudgetProposal_workflowId_idx" ON "BudgetProposal"("workflowId");

-- 3) 對應外鍵（新欄位全 NULL → 驗證必過）
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetProposal_vendorId_fkey') THEN
    ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetProposal_workflowId_fkey') THEN
    ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_workflowId_fkey"
      FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) 放寬 deprecated 欄位的 NOT NULL（不影響既有列；防新式寫入失敗）
ALTER TABLE "OMExpense"     ALTER COLUMN "opCoId"      DROP NOT NULL;
ALTER TABLE "OMExpense"     ALTER COLUMN "budgetAmount" DROP NOT NULL;
ALTER TABLE "OMExpense"     ALTER COLUMN "startDate"    DROP NOT NULL;
ALTER TABLE "OMExpense"     ALTER COLUMN "endDate"      DROP NOT NULL;
ALTER TABLE "ChargeOutItem" ALTER COLUMN "expenseId"   DROP NOT NULL;

COMMIT;
```

---

## 7. 快照測試計畫（必須驗到「登入後 API 層」，補上次驗證缺口）

> 上次失誤＝只驗頁面 302/200，漏了登入後 tRPC。本次直接以 **HEAD Prisma Client 重現失敗查詢**，命中根因層。全程只動快照。

1. **快照還原成 live 等效**：對快照跑 baseline+5 migration（同 `migrate-baseline.sh`），使其具備 FEAT-014/015 新表 → 與正式 DB 結構一致。
2. **套用 §6 修正 SQL** 到快照（ACI psql）。
3. **重現驗證**（用 v20260609 **app 映像**內的 Prisma Client，`DATABASE_URL`=快照，跑 `node -e` 直接執行）：
   - `budgetProposal.findMany({ include: { project, comments, historyItems } })`（＝當初 500 的 `getAll`）→ 必須**不報錯**
   - 同樣抽驗 `project.getAll`、`omExpense` 列表、`expense`、`chargeOut` 等核心 list query 的 include 形狀
   - 全部回傳成功 = 漂移已修復、無殘留缺欄位
4.（可選增強）對快照另起一個 v20260609 App Service slot / 容器實例，實際登入點幾個頁面確認。
5. 測試結論寫回 doc 08 §10 與本文。

### 7.1 測試執行結果（2026-06-16 ✅ **全綠**）

於快照 `psql-itpm-company-dev-001-predeploy`（= production 資料副本）執行，全程未碰正式 DB：

| 步驟 | 方式 | 結果 |
|------|------|------|
| 1. baseline + 5 migration（→ live 等效） | ACI `migrate-baseline.sh` | exitCode 0；6 個新表建立、schema up to date |
| 2. 套用 §6 修正 SQL | ACI psql（`ON_ERROR_STOP=1`，`BEGIN…COMMIT`） | exitCode 0；FIX APPLIED OK |
| 3. **修正後 migrate diff** | ACI `migrate diff`（純 SQL） | **零 `ADD COLUMN` 殘留** → 無任何缺欄位；殘留全為刻意延後項（DROP COLUMN ×4 / SET NOT NULL ×10 / DROP DEFAULT 噪音 / 可選 index・FK） |
| 4. **HEAD Prisma Client 實測**（v20260609 app 映像） | ACI `node` 對快照逐 model `findMany` | **38/38 model OK、0 FAIL**；`RESULT ALL_PASS` |
| 4b. 重現當初 500 查詢 | `budgetProposal.findMany({ include: project/comments/historyItems/vendor/workflow/approvalProgress/approver })` | ✅ **回傳 5 筆**（先前 500 → 現正常） |

**結論**：§6 最小安全修正在 production 資料副本上**證實可行**——補齊全部缺欄位、修復當初 500 查詢、零破壞性操作、零 backfill。可進入 §8 正式 cutover（待使用者明確核准）。

---

## 8. 正式 cutover 條件與回滾（核准後才執行）

**前置（全部成立才 cutover）**：
- [ ] §7 快照測試全綠（尤其 `budgetProposal` 等 list query 不報錯）
- [ ] 使用者 review §6 SQL 並**明確核准對正式 DB 套用**
- [ ] 正式 DB 另存即時 PITR 還原點（或沿用現有快照機制）作為安全網

**cutover 步驟**：
1. （可選）停機窗口開始。
2. 對**正式 DB** 套用 §6 修正 SQL（ACI psql；冪等、純加項，秒級完成）。
3. `az webapp config container set` → `itpm-web:v20260609-185714` → restart。
4. **驗證（含登入後 API）**：login → 進入 `/proposals`、`/projects`、`/om-expenses`、`/charge-outs` 並確認**列表載入成功**（非 500）；觀察 15 分鐘。

**回滾**：任何異常 → `container set :v20260504-123857` + restart（1–3 分，無資料影響）。§6 為純加項，回滾後對舊 app 亦無害（多出的欄位/FK 舊 app 不理會）。

### 8.1 cutover 執行結果（2026-06-16 ✅ 成功）

| 步驟 | 結果 |
|------|------|
| 0 Pre-flight（唯讀 diff on LIVE） | 確認 live 缺 4 欄（`workflowId`/`currentStepSequence` 已由 feat014 具備）；與快照測試一致、無意料外項 |
| 1 PITR 錨點 | `2026-06-16T04:27:12Z` |
| 2 套 §6 SQL（ACI psql） | exit 0；4 欄+index+FK 新增，2 欄/1 index 自動 skip，5 DROP NOT NULL 完成，COMMIT |
| 3 修正後 diff | `ADD COLUMN` 殘留 = **0** |
| 4 cutover | `v20260504-123857` → `v20260609-185714` + restart |
| 5 驗證 | **正式 DB：38/38 model OK、`budgetProposal.getAll` 回 5 筆、ALL_PASS**；HTTP：health=200(pong)、login=200、核心頁面=302（非 500） |

> 與 2026-06-16 首次部署的關鍵差異：本次**直接以 HEAD Prisma Client 對正式 DB 重現當初 500 的查詢並成功**，驗到登入後 API 層，補上首次只驗頁面 302 的缺口。

---

## 9. 殘留資源 / 清理

| 資源 | 現況 | 處置 |
|------|------|------|
| `psql-itpm-company-dev-001-predeploy`（快照 server） | 保留（測試床） | §7/§8 完成且新版穩定後刪除 |
| 快照防火牆規則 `AllowAzureServices`（0.0.0.0） | 已加（為了 ACI 連線） | 測試完成後刪除 |
| ACI `aci-itpm-diff-001` / `aci-itpm-diag-001` | 已 Terminated（exit 0） | 本次分析後刪除 |
| migrate runner 映像 `itpm-migrate:v20260610-000604` | 在 ACR | 測試/cutover 仍需用（psql/migrate）→ 保留至完成 |

---

## 10. 附錄 A — 完整 migrate diff 全量（snapshot → HEAD，原始輸出）

> 權威來源。`✅/🟢/⏸️/⚙️` 標註對應 §5。

```sql
-- DropForeignKey  ⏸️(FK 重定義)
ALTER TABLE "ChargeOutItem" DROP CONSTRAINT "ChargeOutItem_expenseId_fkey";
-- DropForeignKey  ⏸️(FK 重定義)
ALTER TABLE "OMExpense" DROP CONSTRAINT "OMExpense_opCoId_fkey";

-- AlterTable  ⏸️ DROP COLUMN（多餘欄位，0 資料）
ALTER TABLE "BudgetPool" DROP COLUMN "isActive";

-- AlterTable  混合：⏸️ DROP COLUMN ×2 ｜ ✅ ADD COLUMN ×6
ALTER TABLE "BudgetProposal" DROP COLUMN "budgetCategoryId",
DROP COLUMN "currencyId",
ADD COLUMN     "currentStepSequence" INTEGER,
ADD COLUMN     "documentLink" TEXT,
ADD COLUMN     "proposalType" TEXT NOT NULL DEFAULT 'BudgetProposal',
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "vendorId" TEXT,
ADD COLUMN     "workflowId" TEXT;

-- AlterTable  ✅ DROP NOT NULL（放寬）
ALTER TABLE "ChargeOutItem" ALTER COLUMN "expenseId" DROP NOT NULL;

-- AlterTable  ⏸️ DROP DEFAULT（噪音）
ALTER TABLE "ExpenseCategory" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable  混合：⏸️ DROP COLUMN hasItems ｜ ✅ DROP NOT NULL ×4 ｜ ⏸️ SET NOT NULL ×2
ALTER TABLE "OMExpense" DROP COLUMN "hasItems",
ALTER COLUMN "opCoId" DROP NOT NULL,
ALTER COLUMN "budgetAmount" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "totalBudgetAmount" SET NOT NULL,
ALTER COLUMN "totalActualSpent" SET NOT NULL;

-- AlterTable  ⏸️ DROP DEFAULT（噪音）｜ ⏸️ SET NOT NULL
ALTER TABLE "OMExpenseItem" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "isOngoing" SET NOT NULL;

-- AlterTable  ⚙️ 已在 live（CHANGE-048）
ALTER TABLE "OMExpenseMonthly" ADD COLUMN     "actualAmountHKD" DOUBLE PRECISION;

-- AlterTable  ⏸️ DROP DEFAULT（噪音）
ALTER TABLE "Permission" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable  ⏸️ SET NOT NULL ×7（0 NULL，非必要）
ALTER TABLE "Project" ALTER COLUMN "projectType" SET NOT NULL,
ALTER COLUMN "expenseType" SET NOT NULL,
ALTER COLUMN "chargeBackToOpCo" SET NOT NULL,
ALTER COLUMN "probability" SET NOT NULL,
ALTER COLUMN "isCdoReviewRequired" SET NOT NULL,
ALTER COLUMN "isManagerConfirmed" SET NOT NULL,
ALTER COLUMN "isOngoing" SET NOT NULL;

-- AlterTable  ⏸️ DROP DEFAULT（噪音）
ALTER TABLE "ProjectChargeOutOpCo" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "RolePermission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable  ⚙️ 已在 live（security migration）
ALTER TABLE "User" ALTER COLUMN "roleId" SET DEFAULT 2;

-- AlterTable  ⏸️ DROP DEFAULT（噪音）
ALTER TABLE "UserOperatingCompany" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "UserPermission" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable ×6  ⚙️ 已在 live（FEAT-014 / FEAT-015）
--   ApprovalWorkflow / ApprovalStep / ProposalApprovalProgress
--   ProjectExpense / ProjectExpenseItem / ProjectExpenseMonthly
--   （含其 CreateIndex 與 AddForeignKey；略，見原始 diff）

-- CreateIndex  ✅ ×2（BudgetProposal_vendorId/workflowId）
-- CreateIndex  ⚙️ 新表索引（已在 live）
-- CreateIndex  🟢 可選：OMExpenseItem_sortOrder / Permission_code / Project_*(5) / UserOperatingCompany_*(2)

-- AddForeignKey  ✅ ×2（BudgetProposal_vendorId/workflowId_fkey）
-- AddForeignKey  ⚙️ 新表 FK（已在 live）
-- AddForeignKey  🟢/⏸️ 可選/有風險：UserOperatingCompany_* / OMExpense_categoryId/sourceExpenseId/opCoId(重定義) / ChargeOutItem_expenseItemId/expenseId(重定義)
```

> 完整逐字 diff（含所有 CreateTable/CreateIndex/AddForeignKey 細節）保存於本次 session ACI log；如需重新產出，依 §2 步驟重跑即可。

---

**維護者**: AI 助手 + DevOps
**相關**: doc 08（部署 runbook / §10 事故）、doc 04（rollback）、FIX-141（baseline）、`packages/api/src/routers/health.ts`（fullSchemaSync）、`packages/api/src/lib/schemaDefinition.ts`
