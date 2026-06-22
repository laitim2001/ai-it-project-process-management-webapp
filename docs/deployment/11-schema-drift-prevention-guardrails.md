# 11 - Schema 與 Seed 資料漂移防範 Guardrails（company/dev，2026-06）

> **類型**: 流程護欄 / 根因防範（由 2026-06-16 + 2026-06-22 兩次部署事故產出）
> **建立日期**: 2026-06-16 ｜ **2026-06-22 更新**: 新增「第二類漂移：Seed 資料漂移」（§1.2、§2 seed 護欄、檢查表步驟 2/5/8）
> **適用環境**: 公司 Azure `company/dev`（UAT）`app-itpm-company-dev-001` + `psql-itpm-company-dev-001`
> **前情**: doc 08（部署 runbook + 事故）、doc 10（漂移分析 + 修正 + cutover）、doc 12（升級到 HEAD + 補權限 + 執行記錄）
> **目的**: 把「為什麼會漂移」釘死成「以後怎麼做才不會再漂」的可執行規則
>
> ⚠️ **兩類漂移都要防**：① **Schema 漂移**（表/欄位，migration 管）→ §1、§2 schema 護欄；② **Seed 資料漂移**（Permission/RolePermission 等 seed 維護的資料，migration 不管）→ §1.2、§2 seed 護欄。**2026-06-22 的「approval workflow 看不到」屬第二類，且第一類的所有護欄都抓不到它**。

---

## 1. 根因（一句話）

公司 DB 的 schema 長期**不是靠 Prisma migration** 維持，而是靠 `health.fullSchemaSync`（raw SQL、`ADD COLUMN IF NOT EXISTS` 的 hardcoded 清單）拼湊。該清單**追不上最新欄位**（CHANGE-043 / FEAT-014 的 BudgetProposal 欄位），於是 DB 缺欄位；又因部署時 `migrate resolve --applied init`（標記已套用但沒實跑）**遮蔽了缺口**，`migrate status` 誤報 OK，最終 v20260609 的 Prisma Client SELECT 缺欄位 → 500。

### 1.1 為什麼會淪落到靠 fullSchemaSync？（更深一層的根因）

**app 映像（alpine, openssl-3.0）只含 musl/openssl-1.1.x 的 schema-engine** → 容器啟動腳本 `docker-entrypoint.sh` 裡的 `prisma migrate deploy` 會 **失敗（exit ~127）**，但被 `set +e` **靜默吞掉**，應用照樣啟動。

→ 後果：**app 映像本身無法自我套用 migration**，歷史上只能靠 fullSchemaSync 補 schema → 必然漂移。

```sh
# docker-entrypoint.sh（現況）
set +e                                   # ← 失敗不致命
MIGRATE_OUTPUT=$(node .../prisma migrate deploy ...)   # ← 在 app 映像內會失敗
MIGRATE_EXIT=$?
set -e
# 失敗時只印 warning 後繼續啟動 → schema 沒被套用，卻「看起來正常」
```

---

## 1.2 第二類漂移：Seed / 參考資料漂移（2026-06-22 補記，本次事故根因）

> doc 11 原本只涵蓋「schema 漂移」。2026-06-22 處理「approval workflow 在 Azure 看不到」時發現：**還有一類同樣是「線上與 SSOT 不同步」的漂移，但 §1/§2 的所有 schema 護欄都抓不到它**。

**根因**：有些資料**不是由 migration 維護，而是由 `packages/db/prisma/seed.ts` 維護**——主要是 `Permission` / `RolePermission`（FEAT-011 權限系統），以及 `Role` / `Currency` / `ExpenseCategory` 等參考資料。

- 線上 production 副本**從未跑過完整 `seed.ts`**（也不該跑，見 §2 的 MUST NOT）。
- 容器 `startup.sh` 的 inline seed **只 upsert `Role` / `Currency`，完全不碰 `Permission`**。
- FEAT-014 的 migration **只建表（ApprovalWorkflow 等），不插入任何 `Permission` 記錄**。
- → 結果：`seed.ts` 後來新增的權限（如 `menu:approval-workflows`）與角色授權**從未同步到線上**。功能的程式碼與資料表都在，但**因缺權限記錄，Sidebar 不顯示入口**，使用者誤以為「功能根本沒部署上去」。同時發現 ProjectManager/Supervisor 的選單授權也長期殘缺（各僅 4，應為 11/17）。

**為什麼 §2 的 schema 護欄全都漏掉它**：

| 既有護欄 | 為何抓不到 seed 資料漂移 |
|---------|------------------------|
| `migrate diff` ADD COLUMN=0 | 只比對 **schema**（表/欄位），**完全不看資料列** |
| `budgetProposal.getAll` 非 500 | 權限缺失**不會 500**，API 層完全正常，只是 Sidebar 少了選單 |
| 頁面回 302/200 | middleware **只擋登入、不檢查功能權限** → 頁面照樣 302 |

→ **核心教訓**：部署同步的對象不是只有「schema」，而是 **「schema（migration）＋ seed 維護的資料 ＋ 映像」三者**。三者任一與 HEAD 不同步，就可能出現「程式碼在、資料表在，功能卻看不到/用不到」。**驗證也必須對應到第三類——「功能可見性」，不能只驗 schema 與 API 非 500。**

---

## 2. 護欄（MUST / MUST NOT）

### ✅ MUST — schema 變更只走正規 migration

1. 任何 schema 變更 → 在 `packages/db/prisma/schema.prisma` 改 → `pnpm db:migrate` 產生 migration 檔 → commit。
2. 套用到 company/dev：因 **app 映像的 startup migrate 失效**，必須用 **migrate-runner ACI**（debian + 正確 engine）執行 `prisma migrate deploy`（見 doc 08 §0.1、`docker/migrate-runner.Dockerfile`）。
3. baseline 已對齊（`00000000000000_init` + 後續 migration）→ 往後 `migrate deploy` 會乾淨累加，不需要再做 baseline 重置。

### ✅ MUST — 部署後「零缺欄位」硬閘門

> 這是唯一能在 cutover 前抓到「缺欄位 → 會 500」的檢查，**每次部署都要做**。

```bash
# 對目標 DB 跑（migrate-runner ACI，唯讀 introspect）
prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel /work/prisma/schema.prisma --script
```

**通過標準：輸出中 `ADD COLUMN` 數量 = 0**（= DB 不缺任何 HEAD 需要的欄位）。
殘留的 `DROP COLUMN` / `SET NOT NULL` / `DROP DEFAULT` / 可選 index・FK 屬「DB 多出或裝飾」，**不影響 Prisma 運行**，可接受（見 doc 10 §1.1）。

> 額外把關：登入後實際打一個會 SELECT 該表全欄位的 tRPC（如 `budgetProposal.getAll`），或用 HEAD Prisma Client 對 DB 跑 `findMany` sweep（doc 10 §7 的做法）。**不要只看頁面 302/200**——那會漏掉登入後 API 層的 500。

### ❌ MUST NOT — 不要用這些方式改 company/dev 的 schema

- ❌ **`health.fullSchemaSync` / `fullSchemaCompare`**：hardcoded 清單已 stale（不含 FEAT-014/015 / CHANGE-043 欄位），只能 `ADD IF NOT EXISTS`、補不出新欄位、又會讓人誤以為「同步好了」。**正式環境一律不要呼叫。**
- ❌ **`prisma db push`**：跳過 migration、直接改 schema → 製造與 migration 歷史的分歧（正是漂移來源）。
- ❌ 直接手動 `ALTER TABLE` 改結構（drift-fix 那種「補欄位」的一次性修補除外，且須像 doc 10 那樣分析 + 快照測試 + 留檔）。

### ✅ MUST — Seed / 參考資料也要同步（schema 之外的第二類同步）

每次部署，除了 schema migration，**必須檢查 `seed.ts` 是否新增/變更了參考資料**（特別是 `Permission` / `RolePermission`），並用**外科手術式的補資料腳本**同步：

1. 比對 `seed.ts` 的 menu 權限清單（`menuPermissions` + `rolePermissionMapping`）與線上 `Permission` / `RolePermission` 現況（檢查表步驟 2）。
2. 用**只動目標表的 idempotent 腳本**補齊。範本：`docker/seed-permissions.sql`——只 INSERT/UPDATE `Permission` / `RolePermission`、`ON CONFLICT` 冪等、用 `Role.name` 匹配、且**內建 BEFORE/AFTER 業務表計數**作為「transaction data 零變動」鐵證。
3. 補完後**用各角色帳號（Admin / Supervisor / ProjectManager）實際登入**，確認 Sidebar 功能可見性符合 `seed.ts` 的 `rolePermissionMapping` 設計（檢查表步驟 8）。

### ❌ MUST NOT — 不要在 production 跑完整 `seed.ts`

`pnpm db:seed`（完整 `seed.ts`）會：注入示範專案/提案/供應商等**測試資料**、建立**弱密碼測試帳號**，且對預算池做**無條件 `increment usedAmount`**（非 upsert，每跑一次污染一次金額）。**正式環境一律只用「只補參考資料」的外科手術腳本**（如 `docker/seed-permissions.sql`），**絕不整檔重跑 seed.ts**。

---

## 3. 建議的 code 強化（**doc-first，待核准後才實作**）

> 以下是「把根因從工具層面堵死」的 code 變更。依專案紅線（規劃文件先行），**列為提案，需你核准後才動 code**，並各自走 FIX 流程。

| # | 提案 | 內容 | 風險/取捨 |
|---|------|------|-----------|
| FIX-A | **修好 app 映像的 schema-engine** | Dockerfile 補上正確的 `schema-engine`/`migration-engine`（debian 或對應 openssl 變體），讓 `docker-entrypoint.sh` 的 `migrate deploy` 在 app 映像內**真的能跑** | 根治「startup migrate 靜默失敗」；但需驗證 engine 變體與 alpine/openssl 相容，build 體積略增 |
| FIX-B | **startup migrate 失敗不再靜默** | entrypoint 區分「無新 migration（OK）」與「engine/連線失敗（FAIL）」；後者要醒目告警（或在 FIX-A 後改為 fail-fast） | 提升可觀測性；fail-fast 需權衡「migrate 暫時失敗是否該擋啟動」 |
| FIX-C | **fullSchemaSync 加護欄/棄用** | 對 `health.fullSchemaSync`/`fullSchemaCompare` 加上「正式環境拒絕執行」或明確 deprecation 警告；或改為純 DMMF 驅動並補齊新表 | 移除 footgun；需確認沒有現存流程仍依賴它救援 |

> 在 FIX-A 落地前，**company/dev 的 migration 一律用 migrate-runner ACI 套用**（現行可行做法）。

---

## 4. 一頁式部署檢查表（貼到每次 company/dev 部署）

```
[ ] 1. schema 變更已有對應 migration 檔（非 db push / 非 fullSchemaSync）
[ ] 2. ★seed 資料：比對 seed.ts（Permission/RolePermission 等）vs 線上 → 備好 idempotent 補資料腳本
       （docker/seed-permissions.sql；不可整檔跑 seed.ts）              ← 第二類漂移
[ ] 3. （停機窗口）用 migrate-runner ACI 對目標 DB 跑 migrate deploy
[ ] 4. migrate diff（唯讀）→ 確認 ADD COLUMN 數 = 0                      ← schema 硬閘門
[ ] 5. ★用 migrate-runner ACI 跑補資料腳本 → 確認 BEFORE/AFTER 業務表筆數不變、
       Permission/RolePermission 已補齊                                 ← seed 硬閘門
[ ] 6. container set 新映像 + restart
[ ] 7. 驗證「登入後 API 層」：budgetProposal.getAll 等回正常（非 500）
       — 或 HEAD Prisma Client 對 DB 跑 findMany sweep（doc 10 §7）
[ ] 8. ★功能可見性：用 Admin / Supervisor / ProjectManager 各登入，確認 Sidebar
       選單數量符合 seed.ts rolePermissionMapping（抓「缺權限→功能看不到」）  ← 第二類驗證
[ ] 9. 觀察 15 分鐘；異常即 container set 回上一版
```

---

**維護者**: AI 助手 + DevOps
**相關**: doc 08（runbook/事故）、doc 09（infra P1~P5）、doc 10（漂移分析/修正/cutover）、doc 12（升級 HEAD + 補權限 + 執行記錄）、`docker/migrate-runner.Dockerfile`、`docker/seed-permissions.sql`（補權限範本）、`docker/verify-schema.sh`（schema 硬閘門）、`docker-entrypoint.sh`、`packages/db/prisma/seed.ts`（seed 資料 SSOT）、`packages/api/src/routers/health.ts`、`packages/api/src/lib/schemaDefinition.ts`
