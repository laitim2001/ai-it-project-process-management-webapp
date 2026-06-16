# 11 - Schema 漂移防範 Guardrails（company/dev，2026-06）

> **類型**: 流程護欄 / 根因防範（由 2026-06-16 部署事故產出）
> **建立日期**: 2026-06-16
> **適用環境**: 公司 Azure `company/dev`（UAT）`app-itpm-company-dev-001` + `psql-itpm-company-dev-001`
> **前情**: doc 08（部署 runbook + 事故）、doc 10（漂移分析 + 修正 + cutover）
> **目的**: 把「為什麼會漂移」釘死成「以後怎麼做才不會再漂」的可執行規則

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
[ ] 2. （停機窗口）用 migrate-runner ACI 對目標 DB 跑 migrate deploy
[ ] 3. migrate diff（唯讀）→ 確認 ADD COLUMN 數 = 0   ← 硬閘門
[ ] 4. container set 新映像 + restart
[ ] 5. 驗證「登入後 API 層」：budgetProposal.getAll 等回正常（非 500）
       — 或 HEAD Prisma Client 對 DB 跑 findMany sweep（doc 10 §7）
[ ] 6. 觀察 15 分鐘；異常即 container set 回上一版
```

---

**維護者**: AI 助手 + DevOps
**相關**: doc 08（runbook/事故）、doc 09（infra P1~P5）、doc 10（漂移分析/修正/cutover）、`docker/migrate-runner.Dockerfile`、`docker-entrypoint.sh`、`packages/api/src/routers/health.ts`、`packages/api/src/lib/schemaDefinition.ts`
