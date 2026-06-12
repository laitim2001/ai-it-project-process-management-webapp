# CHANGE-051: 讓 CI 變成有效閘門（修復 baseline lint 紅 + 規劃測試/防護）

> **建立日期**: 2026-06-11
> **狀態**: ✅ 已實作（2026-06-12，Option C 立即部分 + rules-of-hooks 真 bug 實修）；新分支 `chore/change-051-ci-gate`，待開 PR / merge
> **類型**: 基礎設施 / 開發流程改善
> **優先級**: Medium（不阻擋功能,但目前 CI 無實質保護;與 P1 安全批次並行,非其一部分）
> **緣由**: 處理 P0/P1 安全 PR 時發現 **PR #1、PR #2 的 CI check 皆 failed**,追查後確認為 repo baseline 既有狀態,非該批變更造成。

---

## 1. 問題與證據

GitHub Actions 實際結果(PR #1 與 PR #2 **完全相同**):

```
CI run conclusion = failure
  JOB Lint and Type Check  → failure
      ❌ 失敗 step: Run ESLint        ← pnpm lint
  JOB Build Check          → skipped  (needs: lint-and-typecheck)
  JOB Unit Tests           → skipped  (needs: lint-and-typecheck)
```

**驗證為 baseline、非變更造成**：
- PR #1（P0）未動 API routers,PR #2（P1）有動,但**同一 step、同樣 failure**。
- 完全未被本批觸碰的檔（`vendor.ts`、`notification.ts`,最後修改於 commit `3a42f27`）各自就有 ~34 個 error。
- FIX-150 改動檔 eslint **零新增 error**。

---

## 2. 現況盤點（實測數據,2026-06-11）

| Package | lint（`Run ESLint`） | typecheck | test | build |
|---------|----------------------|-----------|------|-------|
| `@itpm/api` | ❌ **82 errors** / 99 warn | ✅ 通過 | 無 script | 無 script |
| `@itpm/web` | ❌ **~354 errors** / ~1200 warn | ✅ 通過 | 無 script | ✅ `next build` |
| `@itpm/auth` | ✅ 0 error / 1 warn | ✅ 通過 | 無 script | 無 script |
| `@itpm/db` / `tsconfig` | 無 lint | 無 | 無 | 無 |

**lint error 規則分佈（api 範例,web 同型態)**：

| 規則 | api error 數 | 來源 |
|------|------------|------|
| `@typescript-eslint/no-unsafe-member-access` | 44 | type-aware,`any` 連鎖存取 |
| `@typescript-eslint/no-unsafe-assignment` | 30 | type-aware,`any` 賦值 |
| 其餘（no-unused-vars / prefer-const / no-floating-promises…) | 8 | 雜項 |

> 合計約 **430+ errors**,**~90% 屬 `no-unsafe-*` 家族**,根源是普遍使用 `any`（如 router 的 `updateData: any`、notification payload、web 元件未型別化）。

**設定來源**：root `.eslintrc.json` extends `plugin:@typescript-eslint/recommended-requiring-type-checking`（此 config 將 `no-unsafe-*` 設為 **error**）。`no-explicit-any` 本身已被降為 `warn`,但其「連鎖後果」仍是 error。web 另疊加 `next/core-web-vitals`。

---

## 3. 關鍵發現（決定修復策略）

1. **typecheck 全綠**（`pnpm typecheck` → 3/3 successful）。→ 「Lint and Type Check」job **只卡在 ESLint 一步**。
2. **沒有任何 package 有 `test` script** → CI 的 `pnpm test:ci`（`turbo run test`）是**空轉**;且**無真正的單元測試**。Playwright E2E 存在但**未接進 `ci.yml`**（無 Postgres service、無 app server、root `test:e2e` 未定義）。
3. `Build`/`Unit Tests` 因 `needs: lint-and-typecheck` 失敗而 **skipped** → 從未真正執行。

**結論**：只要讓 ESLint step 通過,整個 job 變綠 → 自動解鎖 Build（`next build`,typecheck 已過 + 線上持續部署,預期可過）與 Unit Tests（空轉,必過）。**CI 變綠的唯一實質關卡 = ESLint。** 但「綠」不等於「有保護」——實質測試保護需另外建立（見 §4 附加項）。

---

## 4. 選項評估

### Option A — 放寬 type-aware error 規則為 warn（快速解鎖）
- 作法：`.eslintrc.json` 把 `no-unsafe-member-access/assignment/argument/call/return`（必要時含 `no-floating-promises`/`restrict-template-expressions`）設為 `'warn'`。
- 效果：eslint exit 0 → lint job 綠 → 解鎖 build/test。
- 工時：~1h。風險：低（不動產品碼）。
- 代價：把真實型別安全債「正常化」為 warning,可能長期不修。

### Option B — 修碼消除 ~430 errors
- 作法：補型別消除 `any`（api 82 → web 354,分批）。
- 工時：大；風險：中（動既有碼,須逐一驗證不改行為）。最正確。

### Option C（推薦）— 混合 + ratchet 棘輪
- **立即**：Option A 放寬為 warn,並設 `eslint --max-warnings <當前基線數>` **凍結基線** → CI 立刻可綠、且 warning 不再增加（PR 引入新 warning 會失敗）。
- **持續**：分批修碼,每批調低 `--max-warnings` 上限（向下棘輪),warning 清零後個別規則再升回 `error`。
- 工時：立即解鎖 ~1h;後續增量。風險：低。兼顧「立刻有 gate」與「不放棄型別安全」。

### 附加項（獨立、可分期,讓 CI「綠且有保護」)
- **A2 — Playwright E2E 接進 CI**：加 Postgres service container + 起 app server + seed,接既有 `docs/.../E2E-TESTING-*` 設定。→ CI 才有實質測試保護。工時：中。
- **A3 — 補單元測試基礎**（Jest/Vitest + RTL,README 已 planned）。工時：大、長期。
- **A4 — branch protection**：CI 穩定綠後,開 main「需 CI pass 才能 merge」。→ 才算真正 gate。

---

## 5. 推薦

1. **先做 Option C 的「立即」部分**（放寬 + `--max-warnings` 凍結基線）→ 一次讓 CI 變綠,解除 PR 紅燈、且防止退步。
2. 接著排 **A2（E2E 進 CI）** 提供實質保護。
3. **B / A3** 增量補強,**A4** 收尾開 branch protection。

> 不建議單做 Option A 不設 max-warnings（等於放棄這些規則）;也不建議一開始就硬啃 Option B（~430 點,阻塞太久）。

---

## 6. 範圍邊界
- **不屬於 P1 安全批次**（FIX-150/151/152/153）。兩者並行不衝突。
- 本 CHANGE 僅處理「CI 有效性」;產品功能不變。

---

## 7. 決策點（✅ 2026-06-12 使用者已拍板）
- **D1 = Option C**（混合 + ratchet）：型別雜訊放寬為 warn + `--max-warnings` 凍結基線。
- **D2 = 先只解鎖 lint**：A2（E2E 進 CI）另開，不納入本批。
- **D3 = 暫不開 branch protection**：待 CI 穩定綠後再評估（A4）。
- **D4 = 放寬「所有目前 erroring 的規則」為 warn，唯獨保留 `react-hooks/rules-of-hooks` 為 error**（並實修其 8 個真 bug，不靜音）。清單見 §9。

---

## 8. 相關文件
- CI 設定：`.github/workflows/ci.yml`、root `.eslintrc.json`
- 既有 E2E：`claudedocs/5-status/testing/e2e/E2E-TESTING-ENHANCEMENT-PLAN.md`、`E2E-TESTING-SETUP-GUIDE.md`
- 安全批次（緣由）：`claudedocs/4-changes/bug-fixes/FIX-150-153-P1-authorization-fixes.md`、`FIX-145-147-P0-security-fixes.md`

---

## 9. 實作記錄（2026-06-12，分支 `chore/change-051-ci-gate`）

### 量測（放寬前，api + web 合計 436 errors / 15 規則）
| 規則 | api | web | 合計 |
|------|-----|-----|------|
| `no-unsafe-member-access` | 44 | 85 | 129 |
| `no-unsafe-assignment` | 30 | 74 | 104 |
| `no-unused-vars` | 3 | 85 | 88 |
| `no-floating-promises` | 1 | 47 | 48 |
| `no-unsafe-call` | 0 | 23 | 23 |
| `no-unsafe-argument` | 1 | 18 | 19 |
| **`react-hooks/rules-of-hooks`** | 0 | **8** | **8** |
| `require-await` | 0 | 5 | 5 |
| `no-unnecessary-type-assertion` | 0 | 3 | 3 |
| 其餘（`no-misused-promises`/`restrict-template-expressions`/`no-base-to-string`/`no-useless-escape`/`no-case-declarations`/`prefer-const`） | — | — | 9 |

### 變更內容
1. **實修 `rules-of-hooks` 8 個真 bug（非靜音）**：`dashboard/supervisor/page.tsx`、`settings/currencies/page.tsx` 兩頁的 FIX-134 角色檢查早退（`if (!isAdmin) return null`）原置於一連串 `useState`/`useQuery`/`useMutation` **之前** → 條件式呼叫 Hook，session 載入翻轉時可能「Rendered fewer hooks than expected」runtime crash。將 guard（含 `const isAdmin`）整塊移到**所有 Hooks 之後**。
2. **`.eslintrc.json` 放寬為 warn**：`no-unsafe-{assignment,member-access,call,argument,return}`、`no-floating-promises`、`require-await`、`restrict-template-expressions`、`no-base-to-string`、`no-unnecessary-type-assertion`、`no-misused-promises`、`no-unused-vars`、`prefer-const`、`no-case-declarations`、`no-useless-escape`。
3. **顯式鎖 `react-hooks/rules-of-hooks` = error**（web override），確保唯一有保護力的規則不被一併靜音。
4. **`--max-warnings` 凍結基線（ratchet）**：`apps/web` = 1546、`packages/api` = 181、`packages/auth` = 1。新 PR 引入額外 warning 即 CI 失敗；修復（降低 warning）不受影響。

### 驗證
- `pnpm lint`（= CI 的 `turbo run lint`）→ **3/3 successful、exit 0**（api/web/auth 皆 0 error）。
- `pnpm typecheck`（web）→ exit 0；`rules-of-hooks` 殘留 0。

### 合併協調（重要）
本修正於新分支 `chore/change-051-ci-gate`（自 origin/main）。因 PR #1/#2 分支早於此修正切出，**需於本 PR merge 進 main 後，再將 main merge 回 `fix/p0-security` 與 `fix/p1-authorization`**，其 CI 才會帶到放寬設定而轉綠（三方合併已驗證無衝突）。順序：本 PR → main → 回灌 p0/p1 → 依序 merge PR #1、#2。

---

> **下一步**：開 PR（`chore/change-051-ci-gate` → main）→ 確認 CI 綠 → merge → 回灌 p0/p1 → merge PR #1、#2。A2（E2E 進 CI）/ A4（branch protection）另排。
