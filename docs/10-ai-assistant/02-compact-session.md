# ITPM — Compact Summary Prompt（每個 session `/compact` 之前用）

> **用法**：直接 copy 下方「複製貼上區」整段入 Claude Code 對話框送出即可。其餘段落是給維護者看的背景，**不需要每次貼**。
>
> **適用範圍**：任何 ITPM-related working session。非 ITPM work（ad-hoc explore / 一次性 docs / 學習）可用通用 800 字 compact。

---

## ✂️ 複製貼上區（直接送出，毋須修改）

```
/compact

## ITPM Compact 格式（≤1200 字，繁體中文）

### 0. 座標
Branch / Working tree（clean / dirty）/ 本次任務類型（Feature / Change / Bug-fix / Trivial）/ 編號（FEAT-NNN / CHANGE-NNN / FIX-NNN）

### 1. 本次主要任務（一句話）

### 2. 已完成
- Code 變更：新建 / 修改 / 刪除（每 file 標明歸屬 package：apps/web · packages/api · packages/db · packages/auth）
- 規劃 / 文件：claudedocs/4-changes/ 文件建立或更新？FIXLOG.md / DEVELOPMENT-LOG.md 同步？
- 驗證：pnpm typecheck / lint / validate:i18n / db:generate 結果；Playwright（如有跑）pass/fail
- Commits：hash + subject（Conventional Commits）

### 3. ITPM 紀律 9 項自檢（每項 ✅/⚠️/❌/N/A）
1. Schema SSOT（改 schema.prisma → 有 db:migrate + db:generate？無手改 Prisma Client？）
2. 業務邏輯位置（業務邏輯在 packages/api，不在前端組件？）
3. Zod 驗證（所有 tRPC procedure input 有 Zod schema？）
4. 權限控制（受保護 procedure 用對 protected/supervisor/admin？）
5. 錯誤分類（多錯誤情境用 code / cause.reason / i18n key，非 message.includes()？）
6. i18n（en.json + zh-TW.json 同步 + validate:i18n 通過 + 無硬編碼文字？）
7. 載入狀態（mutation 按鈕用 LoadingButton，非手刻 '...'？）
8. Task classification（task → Feature / Change / Bug-fix / Trivial 之前 propose？）
9. Karpathy baseline（think before / simplicity first / surgical / goal-driven？）

### 4. 進行中 / 阻塞 / 🚧 延後項
（不可刪未授權的測試 / 文件；發現無關死碼 → 提出但不刪，標 🚧 + 理由）

### 5. 關鍵決策
- Spec-aligned 實作決策（為何選此方案）
- 偏離既有風格 / 需求範圍的地方（應極少；Surgical 原則）
- 觸碰到的已知技術債（兩套 Toast / 表單不一致 / 超大檔案）→ 有沒有不小心捲入

### 6. Commit ↔ 任務 mapping
| Hash | Subject | 對應任務 / 文件項目 |
|---|---|---|
| ... | ... | FIX-NNN / CHANGE-NNN / FEAT-NNN ... |

### 7. 下一步
- Next session 第 1 件事
- 本任務剩餘未完成項
- 待驗證項目（typecheck / lint / validate:i18n / Playwright / 瀏覽器手測）
- Open items / carry-overs

### 8. 紅旗（若有）
任何紅線 violation hint → 第一句寫，之後解釋：
- 業務邏輯滲進前端組件
- 改 schema.prisma 但沒 migrate + generate
- tRPC procedure input 缺 Zod / 受保護 procedure 用錯權限層
- 前端用 err.message.includes() 比對錯誤字串 / 手刻 '...' loading
- 硬編碼文字 / 只改一個語言檔
- 順手 refactor 無關代碼 / 刪未授權測試或文件
- 未經授權的 git reset --hard / push --force / push / --no-verify
```

> **就是這樣 — 上面代碼塊整段 copy 後送出即可。** 下面都是背景說明，不需要每次貼。

---

## 為何比通用 compact 多幾項

通用 800 字 compact 不檢查 ITPM-specific 紀律。本專案以下違反屬**直接 revert / 重做級**問題，必須每次 compact 強制驗證：

1. **Schema SSOT 流程**（§3 #1）— 改 schema 漏 migrate/generate 會造成 Prisma Client 與 DB 不同步
2. **業務邏輯位置**（§3 #2）— 邏輯散進前端組件是本專案明確紅線
3. **Zod + 權限**（§3 #3-4）— 缺 Zod 或用錯權限層 = 安全 / 驗證漏洞（FIX-101~103 即此類）
4. **錯誤分類 + 載入狀態**（§3 #5,7）— `message.includes()` 與手刻 `'...'` 是 Karpathy 審查抓到的反模式
5. **i18n 雙語同步**（§3 #6）— 重複 key 靜默覆蓋、單語更新是反覆出現的 bug 來源（FIX-074/075/116）
6. **Task classification**（§3 #8）— 走錯 workflow = 缺 traceability + 漏規劃文件
7. **Karpathy baseline**（§3 #9）— over-engineering / 順手 refactor = 重寫成本 + 破壞信任

---

## 何時用 ITPM compact、何時用通用 compact

| 場景 | 用哪個 |
|---|---|
| Feature / Change / Bug-fix working session | **ITPM compact**（本檔上方代碼塊）|
| Bug-fix（FIX-NNN）session | ITPM compact + 強調 §3 #8 classification + §5 根因 |
| Change（CHANGE-NNN）session | ITPM compact + 強調 §3 #2（業務邏輯位置）|
| 改 schema / 資料庫 session | ITPM compact + 強調 §3 #1（migrate + generate）|
| 改 i18n session | ITPM compact + 強調 §3 #6（雙語 + validate）|
| 非 ITPM work（ad-hoc explore / 一次性 docs / 學習）| 通用 800 字 compact |
| 緊急 token 壓力（context > 90%）| 通用 800 字 compact（記下 ITPM 紀律未驗證）|

---

## §3 ITPM 紀律 9 項對應 source

| # | Item | 權威 source |
|---|---|---|
| 1 | Schema SSOT | `CLAUDE.md` Critical Constraints + `.claude/rules/database.md` |
| 2 | 業務邏輯位置 | `CLAUDE.md` Key Architecture Patterns + `.claude/rules/backend-api.md` |
| 3 | Zod 驗證 | `.claude/rules/backend-api.md` + `typescript.md` |
| 4 | 權限控制 | `.claude/rules/backend-api.md`（權限控制模式）|
| 5 | 錯誤分類 | `.claude/rules/backend-api.md`（🚨 錯誤分類必須用 `code`）|
| 6 | i18n | `.claude/rules/i18n.md` + `scripts/validate-i18n.js` |
| 7 | 載入狀態 | `.claude/rules/components.md`（🚨 `LoadingButton`）|
| 8 | Task classification | `01-session-start.md` §5 + `CLAUDE.md` 協作行為邊界 |
| 9 | Karpathy baseline | `.claude/rules/karpathy-guidelines.md` + `CLAUDE.md` §AI 編碼行為準則 |

---

## §8 紅旗信號（ITPM-specific watch list）

任何 compact 偵測到以下任一信號，**第一句就寫紅旗**：

- **「業務邏輯寫進 `apps/web` 的組件 / 頁面」** → 違反「所有業務邏輯在 `packages/api`」
- **「改了 `schema.prisma` 但沒跑 `db:migrate` + `db:generate`」** → Schema SSOT 流程斷裂
- **「新 tRPC procedure 沒有 Zod input schema」** 或 **「受保護 procedure 用了 `protectedProcedure` 卻該用 `adminProcedure`」** → 安全 / 驗證紅線
- **「前端用 `err.message.includes('...')` 決定顯示哪個錯誤」** → 後端改字就靜默失效（backend-api.md 反模式）
- **「mutation 按鈕手刻 `{isLoading ? '...' : ...}`」** → 繞過 `LoadingButton` 設計系統
- **「硬編碼中文 / 只改了 `zh-TW.json` 沒改 `en.json`」** → i18n 紅線
- **「順手把這檔案的 useState 表單升級成 react-hook-form」/「順手統一 Toast」** → 專案級技術債，需獨立任務（Karpathy §3）
- **「刪了 / 跳過 / 關閉測試（Playwright）未經授權」** 或 **「刪了 `docs/` / `claudedocs/` 文件未經授權」**
- **「`git reset --hard` / `git push --force` / `git push` / `--no-verify` 未經明確授權」**

---

## 維護

- 同 `01-session-start.md` 配套使用（一個 session 開頭、一個 session 結尾）
- `CLAUDE.md` 紅線 / 協作邊界大改時，§3 + §8 紅旗信號對應更新
- `.claude/rules/` 新增 / 大改領域規則時，§3 紀律項目 + §3 source 對應表 + §8 紅旗信號對應更新
- ITPM slash command 或 Task classification 改變時，§3 #8 對應更新

---

**Last Updated**：2026-06-01（初版 v1.0 — 基於 `02-compact-session-sample.md`（EKP）結構，改寫成 ITPM 紀律：Schema SSOT / 業務邏輯位置 / Zod / 權限 / 錯誤分類 / i18n / LoadingButton / Task classification / Karpathy baseline。移除 EKP 專屬的 H1-H6 / R1-R5 / 13 component / Tier 2 boundary / Dify reference 等不適用概念）
**Maintained By**：開發團隊 + AI 助手共同維護
**File location**：`docs/10-ai-assistant/02-compact-session.md`
**Companion**：`01-session-start.md`（每個新 session 開頭用）

---

## Update history

| Date | 變更 | 說明 |
|---|---|---|
| 2026-06-01 | 初版 v1.0 | 基於 EKP `02-compact-session-sample.md` 結構，改寫成 ITPM 9 項紀律 compact + ITPM-specific 紅旗信號。與 `01-session-start.md` v1.0 同期建立。|
