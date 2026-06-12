# FIX-145~147: P0 安全修復批次（源自 2026-06-11 安全審計）

> **狀態**: 🚧 實作中（FIX-145 改碼✅ / FIX-147✅ / FIX-146 已修 3 項，Next 剩餘 CVE 需 Next 15 決策）
> **建立日期**: 2026-06-11
> **來源報告**: `claudedocs/5-analysis/security-review/SECURITY-AUDIT-2026-06-11.md`（SR-01 / SR-02 / SR-10）
> **批次性質**: P0（最高優先），三個獨立 FIX 一起 review，可分別實作/提交
> **分支策略**: 建議單一分支 `fix/p0-security` 或三個獨立分支（見各 FIX 末「分支建議」）

---

## 批次總覽

| FIX | 對應發現 | 標題 | 嚴重度 | 誰執行 | break 風險 |
|-----|---------|------|--------|--------|-----------|
| **FIX-145** | SR-01 | 移除版控中的真實 `NEXTAUTH_SECRET` + 輪換指引 | Critical | 我改碼 + **你在 Azure 輪換** | 無 |
| **FIX-146** | SR-02 | 修補低風險 Critical/High 依賴 CVE | Critical/High | 我 | 低（patch 級 + overrides） |
| **FIX-147** | SR-10 | `user.getAll/getById` 排除 password 欄位 | High | 我 | 極低（一處 `omit`） |
| ~~FIX-148~~ | SR-11 | xlsx 升級（**本批分離，另排程**） | High | 後續 | 中（動到匯入/匯出） |

> **依你的決策**：① NEXTAUTH_SECRET 輪換即可、**不清理 git 歷史**（輪換後歷史舊值失效變無害）；② xlsx **本批分離**，另開 FIX-148 做完整功能測試。

---

## FIX-145: 移除版控中的真實 NEXTAUTH_SECRET + 輪換指引

### 問題描述
真實可用的 NextAuth JWT 簽章密鑰（前綴 `GN29F…`，完整值已於 2026-06-11 遮蔽並輪換）被提交進 git，出現在 6 個被追蹤的位置（含**程式碼檔** `playwright.config.ts`）。若此值與任一部署環境的 `NEXTAUTH_SECRET` 相同，持有者可簽發合法 JWT 冒充任意使用者（含 Admin），繞過全部 RBAC。

### 根本原因
早期開發為了讓 E2E / 本地 dev server 啟動方便，直接把生成的密鑰硬編碼進設定與文件，未使用佔位符。

### 解決方案（兩部分）

**Part A — 我負責（改碼，移除明文）**：將以下 6 處的真實值替換為佔位符/假值。

| 檔案:行號 | 處理方式 |
|-----------|---------|
| `apps/web/playwright.config.ts:77-78` | 改為測試專用假值 `test-only-not-a-real-secret-rotate-in-azure`（前後一致即可啟 dev server，不影響 E2E 登入測試帳號） |
| `archive/epic-records/認證系統實現摘要.md:193` | 改為 `<ROTATED-SEE-KEYVAULT>` 佔位符 |
| `claudedocs/7-archive/mvp-phase/COMPLETE-IMPLEMENTATION-PROGRESS.md:940` | 同上 |
| `claudedocs/5-status/testing/e2e/E2E-TESTING-FINAL-REPORT.md:131, 360` | 同上 |
| `claudedocs/5-status/testing/e2e/E2E-TESTING-ENHANCEMENT-PLAN.md:1068` | 同上 |

**Part B — 你負責（Azure 輪換，我做不到）**：
```bash
# 1. 生成新密鑰
openssl rand -base64 32

# 2. 更新個人環境 + 公司 company/dev 環境的 Key Vault secret（兩環境都要）
#    （依 docs/deployment 既有 runbook 與 memory「company-azure-deploy-2026-06」操作）
az keyvault secret set --vault-name <vault> --name NEXTAUTH-SECRET --value "<new-secret>"

# 3. 重啟 App Service 使新值生效（會使現有所有 session 失效，需重新登入 — 這是預期行為）
```
> ⚠️ **無論該外洩值是否真的用於線上環境，都應一律輪換**（以「已洩漏」處理）。輪換後 git 歷史中的舊值即失去效力，故不需清理歷史。

#### 🔴 補記（2026-06-11，後續發現）— FIX-145 漏網的第二個外洩點

補 `.gitignore` 時發現:**`packages/db/.env.local.backup` 是「已追蹤」檔案**（commit `fa5e5d2`，已在 `origin/main`），洩漏**另一個** 62 字元真實 `NEXTAUTH_SECRET`（與上述 6 處的 `GN29F…` 為不同值，故當時 `git grep` 未捕捉），另含 `DATABASE_URL`/`TEST_DATABASE_URL`/`SMTP_PASSWORD`/`REDIS_URL`——但連線目標皆為 localhost（本機 Docker dev），實質風險低。

**處置**（沿用本檔既定決策：輪換、不清理歷史）：
- ✅ `.gitignore`（root，env 區塊）新增 `.env*.backup` / `.env*.bak`。
- ✅ `git rm --cached packages/db/.env.local.backup`（移出版控，保留本機檔案）。
- ⏳ 併入既有 `NEXTAUTH_SECRET` 輪換待辦（同一輪換即作廢此歷史值）；localhost 的 DB/Redis/SMTP 值不需輪換。

### 驗證標準
- [ ] `git grep` 搜尋舊密鑰明文回傳 0 筆（明文已從當前版本完全移除）
- [ ] `pnpm --filter web test:e2e` 仍能啟動 dev server 並通過登入相關測試（假值前後一致，功能不受影響）
- [ ] （你執行後確認）Azure 兩環境 `NEXTAUTH_SECRET` 已換新值且 App 正常登入

### 分支建議
獨立分支 `fix/145-rotate-nextauth-secret`，可優先合併。

---

## FIX-146: 修補低風險 Critical/High 依賴 CVE

### 問題描述
`pnpm audit --prod` 顯示依賴鏈含 1 Critical + 多個 High，其中本批處理「低 break 風險」的 patch 級項目（xlsx 另排）：

| 套件 | 嚴重度 | CVE | 現況 → 目標 |
|------|--------|-----|------------|
| `fast-xml-parser`（經 `@azure/storage-blob`） | Critical | GHSA-m7jm-9gc2-mpf2 | 5.2.5 → ≥5.3.5（pnpm override） |
| `jws`（經 `@azure/identity > msal-node > jsonwebtoken`） | High | GHSA-869p-cjfg-cm3x | 3.2.2 → ≥3.2.3（pnpm override） |
| `next`（經 next-auth） | High | GHSA-mwv6-3258-q52c | 14.2.33 → 14.2.35 |
| `@trpc/server`+client+next+react-query | High | GHSA-43p4-m455-4f4j | 10.45.2 → 10.45.3 |

### 解決方案
1. **根 `package.json` 的 `pnpm.overrides` 追加**（已存在 `@auth/core` override，沿用同區塊）：
   ```jsonc
   "pnpm": {
     "overrides": {
       "@auth/core": "0.41.0",
       "fast-xml-parser": ">=5.3.5",
       "jws": ">=3.2.3"
     }
   }
   ```
2. **`apps/web/package.json`**：`next` `14.2.33` → `14.2.35`；`eslint-config-next` 同步 `14.2.35`。
3. **`@trpc/*`**：caret `^10.45.1` 已允許 10.45.3，執行 `pnpm update @trpc/server @trpc/client @trpc/next @trpc/react-query --latest` 限制在 10.x，讓 lock 從 10.45.2 → 10.45.3。
4. `pnpm install` 重建 lockfile。

### 驗證標準
- [ ] `pnpm audit --prod` 不再出現 fast-xml-parser(Critical)、jws、next、@trpc/server 這四項（xlsx 仍會在，屬 FIX-148）
- [ ] `pnpm install` 成功，無 peer dependency 衝突報錯
- [ ] `pnpm --filter web typecheck` **不新增**錯誤（對照 baseline，見 memory「typecheck-baseline-gotchas」）
- [ ] `pnpm --filter web build` 成功（next 14.2.35 為 patch，預期相容）
- [ ] 手動冒煙：登入、開一個用 Azure Blob 的頁面（上傳/下載）、開一個 tRPC 頁面正常

### 風險與回滾
- 全為 patch 級升級 + transitive override，破壞性低。
- override 強制 transitive 版本理論上可能與 Azure SDK 不相容 → 若 `@azure/*` 執行期報錯，回滾該 override 並改走「升級 `@azure/storage-blob`/`@azure/identity` 主版本」路線。
- 回滾：`git checkout package.json apps/web/package.json pnpm-lock.yaml && pnpm install`。

### 分支建議
獨立分支 `fix/146-dep-cve-patch`。

---

## FIX-147: user.getAll / getById 排除 password 欄位

### 問題描述
`packages/api/src/routers/user.ts` 的 `getAll`（:94-105）與 `getById`（:110-141）用 `include` 而非 `select`/`omit`，回傳完整 User 物件**含 bcrypt password hash**。這兩個端點是 `protectedProcedure`（任一登入者可呼叫，含最低權 ProjectManager），等於任何登入者可撈全體密碼 hash 離線破解。

### 根本原因
FIX-101 當時只調整了權限層級（public → protected），未一併過濾敏感欄位。團隊其他端點（`register`、`hasPassword`、`changeOwnPassword`）都正確用 `select`，僅這兩處遺漏。

### 解決方案
最 surgical 的做法：在這兩個查詢加 `omit: { password: true }`（Prisma ≥5.16 GA；本專案實裝 5.22，支援）。

```typescript
// user.ts getAll
const users = await ctx.prisma.user.findMany({
  omit: { password: true },        // ← 新增
  include: { role: true },
  orderBy: { createdAt: 'desc' },
});

// user.ts getById
const user = await ctx.prisma.user.findUnique({
  where: { id: input.id },
  omit: { password: true },        // ← 新增
  include: { role: true, projects: { include: { budgetPool: true } }, approvals: { include: { budgetPool: true } } },
});
```
> Fallback：若實裝 Prisma < 5.16（`omit` 不可用），改用明確 `select` 列出所需欄位（不含 password）。實作時先 `pnpm --filter db exec prisma -v` 確認版本。

### 驗證標準
- [ ] `pnpm --filter api typecheck` 通過（若前端某處讀了 `user.password`，型別會報錯——預期不會有）
- [ ] `pnpm --filter web typecheck` **不新增**錯誤
- [ ] 手動：以 admin 登入開 `/users` 列表與某使用者詳情頁，畫面正常（password 本就不顯示在 UI）
- [ ] （可選）用 tRPC panel 或瀏覽器 network 確認 `user.getAll` 回應 JSON 不再含 `password` 欄位

### 風險
極低。password hash 不應被任何前端邏輯使用；移除只會讓回應更安全。

### 分支建議
獨立分支 `fix/147-omit-user-password`。

---

## FIX-148（本批不做，僅登記排程）: xlsx 升級

`xlsx@0.18.5` 有原型污染 + ReDoS（GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9），且用於解析使用者上傳的 Excel（`data-import`、`project-data-import`）與匯出（`exportUtils.ts`）。因 npm registry 無修補版（需改用 SheetJS 官方 CDN 0.20.3+）、且會動到匯入/匯出功能需完整 E2E 測試，**依決策本批分離**，另開 FIX-148 規劃文件處理。

**過渡期緩解**（可在 FIX-148 前先做，若需要可納入本批討論）：對 `data-import`/`project-data-import` 的上傳加嚴格檔案大小上限與類型檢查，降低 ReDoS/惡意檔可達性。

---

## 實作後文檔更新（核准實作完成時一併做）
- [ ] 更新 `FIXLOG.md`：新增 FIX-145/146/147 三條記錄
- [ ] 更新 `SECURITY-AUDIT-2026-06-11.md` 對應 SR 項狀態為「已修」
- [ ] 更新 memory `security-audit-2026-06-11.md` 的 P0 待辦勾選

---

## 實作結果（2026-06-11）

### FIX-145 ✅（改碼完成，Azure 輪換待執行）
- 6 處原始檔 + hook 自動產生的 `docs/development-log/security-2026-06-11.md` + 本批文件/報告中為舉證寫的值，全部遮蔽。
- 驗證：`git grep` 工作目錄（含未追蹤檔）已 0 筆明文殘留 ✅。
- ⏳ 待你執行：Azure Key Vault 輪換 `NEXTAUTH_SECRET`（兩環境）。

### FIX-146 ⚠️（3 項已修；Next 剩餘 CVE 需 Next 15 major）
| 套件 | 結果 |
|------|------|
| `fast-xml-parser` | 5.2.5 → **5.8.0** ✅（**Critical 消除**） |
| `jws` | 3.2.2 → **3.2.3** ✅ |
| `@trpc/server` | 10.45.2 → **10.45.4** ✅ |
| `next` | 14.2.33 → **14.2.35** ✅（但 14.2.35 已是 **14.x 系列終版**） |

- **`pnpm audit --prod` 從含 Critical → 0 critical / 8 high。**
- ⚠️ **重大發現**：Next 14.2.35 之後 Vercel 不再 backport 安全修補；audit 中剩餘多個 Next CVE（Middleware/Proxy bypass、SSRF、Server Components DoS、App Router XSS 等）的 patched 版本皆為 **`>=15.x`**，**無法在 14.2.x 內修復**。→ 需 Next 15/16 **major 升級**（breaking changes + 完整迴歸測試），已超出 P0 快速批次範圍，建議另開 **FIX-149** 評估。
- 驗證：`pnpm install` 成功（唯一 peer warning 為既有的 `@auth/core`↔`nodemailer` 無關項）；`@itpm/api` + `web` typecheck **皆乾淨通過** ✅；`web build` 編譯成功，僅 standalone 輸出因 **Windows symlink 權限（EPERM）** 失敗——屬環境限制（Docker/Linux/CI 不受影響），非升級造成。

### FIX-147 ✅
- 因 Prisma Client 未啟用 omitApi（`omit` 型別為 `never`），改用最 surgical 的 **return 前解構移除 `password`** 方案（型別自動為 `Omit<User,'password'>`）。
- 驗證：`@itpm/api` typecheck 通過；`web` typecheck 通過 → 證明前端無任何處依賴 `user.password` ✅。

### 後續發現（本批未處理，登記待評估）
- **FIX-149（建議）**：Next 15/16 major 升級（修剩餘 Next CVE）。
- audit 另報既有依賴的新 advisory：`nodemailer`（addressparser DoS / SMTP injection）、`postcss`、`next-intl`（open redirect / prototype pollution）、`uuid`、`xlsx`（已歸 FIX-148）。建議併入依賴升級專案統一評估。
