# 安全批次待辦清單（手動執行項）

> **建立日期**: 2026-06-12
> **緣由**: P0（FIX-145~147）+ P1（FIX-150/151/152）+ CHANGE-051 處理後，剩餘需**人工操作**的項目（AI 無法代做）。
> **相關**: `FIX-145-147-P0-security-fixes.md`、`FIX-150-153-P1-authorization-fixes.md`、`../feature-changes/CHANGE-051-ci-effective-gate.md`

---

## 🔴 1. Azure Key Vault — 輪換 NEXTAUTH_SECRET（最高優先）

- [ ] **個人環境** 輪換 `NEXTAUTH_SECRET`
- [ ] **公司環境** 輪換 `NEXTAUTH_SECRET`

**Why**：FIX-145 已從版控移除外洩的明文，但**已外洩的密鑰值仍然有效**，必須輪換才真正作廢。輪換同時作廢 `packages/db/.env.local.backup` 中那個歷史外洩值（兩個不同值，一次輪換皆失效）。**不需清理 git 歷史**（輪換後歷史值無用）。

**步驟**（兩環境各做一次）：
1. 產生新密鑰（**自己跑、勿貼進對話**）：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. 更新該環境 Azure Key Vault / App Service 應用程式設定的 `NEXTAUTH_SECRET` 為新值。
3. 重啟 App Service（讓新設定生效）。
4. 驗證：重新登入正常。**舊 JWT session 會失效** → 提醒使用者清瀏覽器 cookie 後重新登入。

---

## 🟡 2. FIX-151 PR #2 留言（低優先，待 gh 認證）

- [ ] 在 PR #2 補上 FIX-151 的說明留言

**Why**：留言內容已備妥，但此環境 `gh` 未認證、無法代發。

**選項**：
- **A**：在輸入框 `! gh auth login` 完成認證後，叫我代發（內容已備妥於 `%TEMP%\fix151-pr-comment.md`，亦在對話記錄中）。
- **B**：直接到 GitHub PR #2 手動貼上（內容見對話中「選項 C — 手動複製貼上」段落）。
- **C**：**略過** —— PR #2 merge 後此留言價值不大，可不補。

---

## ✅ 3. 合併 P0 / P1 PR（已完成，2026-06-12）

- [x] **PR #3**（CHANGE-051，`chore/change-051-ci-gate`）→ merged（`0093912`）
- [x] **PR #1**（`fix/p0-security`）CI 綠 → merged（`20ff814`）
- [x] **PR #2**（`fix/p1-authorization`）CI 綠 → merged（`1d2aa6b`）

main 現含 P0（FIX-145~147）+ P1（FIX-150/151/152）+ CHANGE-051。本地 main 已同步至 `1d2aa6b`。

**可選清理**：已合併分支 `chore/change-051-ci-gate`、`fix/p0-security`、`fix/p1-authorization` 可刪除（本地 + 遠端）—— 屬破壞性操作，需明確授權。

---

## 後續（非本批、已登記，供追蹤）

- **FIX-148**：`xlsx` 0.18.5（原型污染 + ReDoS）→ 需改 SheetJS 官方 CDN 0.20.3+，會動到匯入功能、需功能測試。
- **FIX-149**：Next 剩餘 CVE → 需 Next 15/16 major 升級 + 完整迴歸。
- **FIX-153**：login/register/forgot-password rate limit → 需新增 Redis client 基礎設施。
- **CHANGE-051 後續**：A2（E2E 進 CI）、A3（單元測試）、A4（branch protection，CI 穩定綠後開）；型別 `any` 棘輪逐批消（降 `--max-warnings`）。
