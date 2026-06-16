# FIX-154~156: Schema 漂移根因防範（app 映像 migrate / 啟動可觀測性 / fullSchemaSync 護欄）

> **狀態**: 📋 **規劃中 — 待使用者 review / 核准**（核准前不動 code）
> **建立日期**: 2026-06-16
> **類型**: Bug-fix（remediation；防止 2026-06-16 漂移→500 事故再發生）
> **來源**: `docs/deployment/11-schema-drift-prevention-guardrails.md` §3（提案 FIX-A/B/C）
> **相關**: doc 08（部署/事故）、doc 10（漂移分析/修正/cutover）、`docker-entrypoint.sh`、`Dockerfile`、`packages/api/src/routers/health.ts`、`packages/api/src/lib/schemaDefinition.ts`

---

## 0. 共同背景（根因鏈，一次說清）

2026-06-16 部署 v20260609 後 `budgetProposal.getAll` 等 500。根因鏈：

```
app 映像 schema-engine 不相容（migrate 失敗，exit ~127）
        │  被 docker-entrypoint.sh 的 set +e 靜默吞掉
        ▼
app 映像「無法自我套用 migration」→ 歷史改靠 health.fullSchemaSync（raw SQL, hardcoded）補 schema
        │  fullSchemaSync 清單 stale（追不上 CHANGE-043 / FEAT-014 欄位）
        ▼
DB 缺欄位（漂移）；baseline resolve --applied 又遮蔽缺口
        ▼
Prisma Client SELECT 缺欄位 → 500
```

本文把這條鏈的三個環節各拆成一個 FIX。**三者相依**（見 §4），故合併規劃、分開實作。

> 注意：目前線上 v20260609 **已正常**（doc 10 cutover 完成）。本批 FIX 是「**根因防範**」，非救火；可從容規劃、分批落地。

---

## FIX-154: app 映像無法執行 `prisma migrate`（schema-engine 不相容）

### 問題描述
`docker-entrypoint.sh` 啟動時跑 `prisma migrate deploy`，但在 app 映像（`node:20-alpine`）內**失敗**（前次實測 `prisma --version` / `migrate` exit ~127）。query engine 正常（查詢可跑），失敗的是 **schema-engine**（migration 專用 binary）。

### 根本原因（待實作時最終確認）
- `schema.prisma` 的 `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` 只控制 **query engine**（`libquery_engine`），所以查詢正常。
- **schema-engine 是另一支 binary**，由 `@prisma/engines` 提供、**不受 binaryTargets 控制**；app 映像內帶到的 schema-engine 變體與執行環境（alpine musl / openssl-3.0）不相容 → 無法 exec。
- Dockerfile runner 階段是從 builder（亦 alpine）複製 `@prisma/engines`，但帶到的 schema-engine 變體不對。

### 不修的風險
app 映像永遠無法自我套用 migration → 每次 schema 變更都得靠**外部 migrate-runner ACI**（目前可行，但流程上多一步、易遺漏）；且與 FIX-155 的「靜默失敗」疊加 → 漂移容易重演。

### 方案選項
| 方案 | 做法 | 取捨 |
|------|------|------|
| **① 解耦（推薦）** | **app 啟動不再跑 migrate**；migration 改為獨立部署步驟，固定用 `migrate-runner` 映像（debian, engine 正常，已驗證可用）執行 | ✅ 符合「app 啟動不該跑 migration」最佳實踐；✅ 不用跟 alpine/openssl engine 纏鬥；✅ 重用既有可用工具。⚠️ 代價＝部署流程須**固定執行 migrate 步驟**（doc 11 已立為硬規則） |
| **② app 映像改 debian base** | runner 階段 `node:20-alpine` → `node:20-bookworm-slim`（glibc/openssl-3.0），Prisma 預設 engine 即可跑 migrate | ✅ app 映像自給自足（能自我 migrate）。⚠️ 映像變大；⚠️ 整個 app 改在 debian build/run 需回歸測試（migrate-runner 已證 debian 可行，風險中低）；⚠️ 動到 production base image |
| **③ 修 alpine schema-engine** | 在 Dockerfile 明確抓 `linux-musl-openssl-3.0.x` 的 schema-engine（設 `PRISMA_CLI_BINARY_TARGETS` / 確認 `@prisma/engines` 帶對變體） | ✅ 映像維持 alpine、最小變動。⚠️ alpine+openssl+prisma 歷史上很 fiddly；⚠️ 需反覆試 engine 變體 |

### 推薦
**方案 ①（解耦）**。理由：① 業界共識是「migration 是部署階段、不是 app 啟動階段」；② 我們已有可用的 migrate-runner ACI；③ 避免在 alpine engine 上耗時。
若你希望「app 映像自給自足、未來部署更簡單」→ 選 **方案 ②**。

### 影響檔案（預估，依方案）
- 方案①：`docker-entrypoint.sh`（移除/停用 migrate 段）+ doc 08/11 流程強化；可能新增 `azure/scripts/run-migration.sh`（包裝 migrate-runner ACI 叫用）。
- 方案②：`Dockerfile`（runner base image + engine 複製路徑）。

### 驗證
- 方案①：app 映像啟動 log 不再出現 migrate 失敗；migrate 由 ACI 步驟完成且 `migrate status` = up to date。
- 方案②：`docker run <app> prisma migrate status` 成功；完整 app 在 debian 映像上頁面/登入後 API 正常。

### 回滾
純啟動腳本/Dockerfile 變更；保留前一版映像 tag，異常即 `container set` 回退。

---

## FIX-155: 啟動時 migrate 失敗被靜默吞掉（可觀測性）

### 問題描述
`docker-entrypoint.sh` 以 `set +e` 包住 migrate，失敗只印 warning 後照常啟動：

```sh
set +e
MIGRATE_OUTPUT=$(node .../prisma migrate deploy ...)
MIGRATE_EXIT=$?
set -e
# 失敗時印「可能已執行過/無新遷移/連接問題」後繼續 → 把「schema 沒套用成功」當成正常
```

→ schema 沒套用成功也「看起來正常啟動」，缺陷直接上線（正是這次 500 能 ship 的原因之一）。

### 根本原因
失敗分類不足：把「無新 migration（正常）」與「engine/連線錯誤（異常）」一視同仁地容忍。

### 不修的風險
未來任何 migrate 異常都會被吞 → 帶病上線、且難排查。

### 方案選項（與 FIX-154 決定相依）
| 情境 | 做法 |
|------|------|
| **若 FIX-154 選①（解耦）** | entrypoint **直接移除 migrate 段** → 不存在「啟動 migrate 失敗」這件事；把關移到部署流程的 migrate 步驟 + doc 11 的 `migrate diff` 硬閘門。最簡單。 |
| **若 FIX-154 選②（debian 自給）** | 保留 migrate，但**區分結果**：真正的 engine/連線錯誤 → **醒目告警**或 **fail-fast（exit 1 不啟動）**；「無 pending migration」→ 視為成功。 |
| 通用增強（可選） | 啟動後做一個輕量 schema 自檢（對近期新增欄位/表做 probe query），落後即告警，避免「migrate 報成功但 schema 仍不符」的邊界。 |

### 取捨（fail-fast vs 容忍）
- **fail-fast** 能擋住「帶病上線」，但 DB 暫時性抖動會讓 app 起不來（可用性風險）。
- **容忍+醒目告警** 不擋啟動，但需有人看 log/告警。
- 建議：FIX-154 選①時用「移除」；選②時，**migrate 連線/engine 失敗 → fail-fast**（schema 不對本就不該對外服務），「無 pending」正常放行。

### 影響檔案
`docker-entrypoint.sh`。

### 驗證
模擬 migrate 失敗（壞 DATABASE_URL / 故意缺 engine）→ 確認行為符合選定策略（移除：無此步；fail-fast：容器不進入服務狀態並有明確錯誤）。

### 回滾
腳本變更，保留前版映像即可回退。

---

## FIX-156: `fullSchemaSync` / `fullSchemaCompare` footgun（護欄/棄用）

### 問題描述
`health.fullSchemaSync`（adminProcedure mutation）與 `fullSchemaCompare`（query）是 hardcoded raw-SQL 的 schema 同步工具：
- 清單 **stale**（不含 FEAT-014/015 / CHANGE-043 欄位）→ 補不出新欄位，卻會讓人誤判「已同步」。
- 是這次漂移的歷史成因（用它取代 migration）。
- 目前**非自動執行**（只手動呼叫），但仍是隨時可誤用的 footgun。

### 不修的風險
有人（或未來某流程）對正式環境呼叫 → 製造新的「假同步」與漂移。

### 方案選項
| 方案 | 做法 | 取捨 |
|------|------|------|
| **① 護欄（推薦先做）** | `fullSchemaSync`/`fullSchemaCompare` 在 production（依 `NODE_ENV` 或顯式 flag）**拒絕執行**，回傳 deprecation 訊息（「請改走 migration / migrate-runner」） | ✅ 立即移除 footgun、低風險；保留 dev 用途。⚠️ 需確認沒有現存流程仍依賴它救援（doc 11 已宣告不再依賴） |
| **② 移除** | 整個刪掉這兩個 procedure（與 `schemaDefinition.ts` 相關死碼） | ✅ 徹底。⚠️ 需先確認全無引用（SITUATION-7 等文件/腳本）；屬較大刪除，獨立小 PR |
| **③ 改成 DMMF 驅動修好它** | 重寫成完全 DMMF 驅動、永不 stale、且能建表 | ❌ **不建議**：等於再投資一套與 migration 並行的 SSOT，違反「單一真相來源」，正是漂移的溫床 |

### 推薦
先 **①（護欄）** 立即堵住誤用；待確認無引用後再 **②（移除）**。**避免 ③**。

### 影響檔案
`packages/api/src/routers/health.ts`（+ 可能 `packages/api/src/lib/schemaDefinition.ts`）。

### 驗證
production 模式呼叫 → 被擋並回 deprecation；dev 模式行為不變（或一併標記）。`pnpm typecheck` / `lint` 通過。

### 回滾
單純加守衛條件；移除守衛即回退。

---

## 4. 相依關係與建議實作順序

```
FIX-154（決定 migrate 由誰跑）  ──┬──▶ FIX-155（依 154 決定「移除」或「fail-fast」）
                                   └──▶（與 156 獨立）
FIX-156（fullSchemaSync 護欄）   ──▶ 可獨立先做，立即降低 footgun 風險
```

**建議順序**：
1. **FIX-156 ①（護欄）** — 最低風險、立即見效，先堵 footgun。
2. **FIX-154** — 先定方案（① 解耦 or ② debian），這是核心決策。
3. **FIX-155** — 依 154 結果落地。

---

## 5. 待你裁決的決策點（review 重點）

- [ ] **D1（最關鍵）**：FIX-154 走 **① 解耦**（migration 永遠由 migrate-runner ACI 跑，app 不碰）還是 **② debian app 映像**（app 自給自足能 migrate）？
- [ ] **D2**：FIX-155 的失敗策略 —— 若選 D1=②，migrate 真錯時要 **fail-fast（不啟動）** 還是 **容忍+醒目告警**？
- [ ] **D3**：FIX-156 先只做 **①護欄**，還是直接 **②移除**？（移除前我會先全庫確認無引用）
- [ ] **D4**：實作節奏 —— 三個一起做，還是先 FIX-156 護欄、其餘排後？

> 核准（含對以上決策點的選擇）後，我才會分別建立各 FIX 的實作分支並動 code；每個 FIX 的驗證以 `pnpm typecheck` / `lint` + 對應映像/啟動行為測試為準。

---

## 6. 測試驗證（共通）
- [ ] `pnpm typecheck`、`pnpm lint`（改動檔案範圍）
- [ ] 對應映像 build + `docker run` 行為驗證（migrate / 啟動）
- [ ] 部署到 company/dev 前，仍走 doc 11 的硬閘門：`migrate diff` → `ADD COLUMN = 0` + 登入後 API 層驗證
