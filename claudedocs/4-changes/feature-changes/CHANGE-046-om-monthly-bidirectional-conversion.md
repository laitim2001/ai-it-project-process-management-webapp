# CHANGE-046: OM Monthly 月度金額雙向自動換算（USD ↔ HKD）

> **建立日期**: 2026-06-03
> **狀態**: ✅ 已完成（doc-first：規劃文件先於實作、經使用者 review 核准；2026-06-03 實作）
> **優先級**: Medium
> **類型**: 現有功能增強（將 CHANGE-044 的單向換算改為雙向）
> **前置依賴**: CHANGE-044（月度 USD/HKD 雙欄、`usdToHkd`、`effectiveHkdRate`、`actualAmountHKD`）、CHANGE-045（固定 HKD 顯示）

---

## 1. 變更概述

**現況（CHANGE-044）**：月度網格的兩欄換算是**單向**的——
- 編輯 **Actual Spending (USD)** → 自動帶入 HKD（`USD × 匯率`）✅
- 編輯 **Actual Spending (HKD)** → **不回寫 USD**（HKD 為可獨立覆寫的真實金額）

**本次變更**：改為**雙向自動換算**——
- 編輯 **HKD** 欄 → 自動換算回 **USD**（`USD = HKD ÷ 匯率`）

變更後：兩欄任一邊輸入，另一邊即時依匯率連動。

---

## 2. 功能需求

| ID | 需求 | 說明 |
|---|---|---|
| R1 | USD → HKD 自動帶入 | 沿用 CHANGE-044，不變（`HKD = USD × rate`） |
| R2 | HKD → USD 自動換算（**新增**） | 編輯 HKD 時 `USD = HKD ÷ rate`，四捨五入 2 位 |
| R3 | 無匯率時降級 | `effectiveHkdRate` 為 null（無 HKD 匯率且 item 幣別非 HKD）時，HKD 編輯**不動** USD（維持各自獨立，不報錯） |
| R4 | 彙總連動 | 因 USD 驅動 item/表頭 `actualSpent` 與使用率，編輯 HKD 後這些值會依換算後 USD 反映（即雙向的預期效果） |

---

## 3. 技術設計

**唯一檔案**：`apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx`

1. 新增 `hkdToUsd(hkd)`：`effectiveHkdRate ? round2(hkd / effectiveHkdRate) : null`（與既有 `usdToHkd` 對稱）。
2. `updateMonthHKD` 改為**同時更新** `actualAmount`：
   ```ts
   const updateMonthHKD = (month, amount) => {
     setMonthlyData(prev => prev.map(r => {
       if (r.month !== month) return r;
       const convertedUSD = hkdToUsd(amount);
       return { ...r, actualAmountHKD: amount, actualAmount: convertedUSD ?? r.actualAmount };
     }));
   };
   ```

**語意說明**：
- 雙向後，CHANGE-044「HKD 可獨立於 `USD×rate` 發散」的能力實質取消——任一欄編輯都會把另一欄鎖到匯率。這是使用者明確要求的行為。
- `OMExpenseMonthly.actualAmountHKD` 仍持久化（保留 rate-drift 免疫：日後調匯率，已存的 HKD 不變）。
- 儲存與 API 不變（`updateItemMonthlyRecords` 仍收 `actualAmount`+`actualAmountHKD`）。

---

## 4. 影響範圍

- **組件**：`OMExpenseItemMonthlyGrid.tsx`（新增 1 個 helper + 改 `updateMonthHKD`，約 5 行）
- **無**：schema / migration / API / i18n / 其他組件變更

---

## 5. 驗收標準

- [ ] 編輯某月 HKD = 500,000（匯率 7.8）→ USD 欄自動變 64,102.56；該列、總計、使用率以新 USD 反映（待手測）
- [ ] 編輯某月 USD → HKD 自動帶入（CHANGE-044 行為不變）（待手測）
- [ ] 無 HKD 匯率時，編輯 HKD 不影響 USD（不報錯）（待手測）
- [x] `pnpm typecheck` 綠（3 packages）；改動檔 `lint` 無新增 error（無 i18n 改動）
- [ ] 瀏覽器手測雙向連動

---

## 6. 實施計劃

1. 加 `hkdToUsd` helper → 驗證：`pnpm typecheck`
2. 改 `updateMonthHKD` 同時設 `actualAmount` → 驗證：`pnpm typecheck`
3. 改動檔 `lint`（無新增 error）
4. 瀏覽器手測（需 CHANGE-044 已重啟生效的環境）

---

## 7. 相關文檔

- 修改對象：`CHANGE-044-om-monthly-dual-currency-input.md`（單向 → 雙向）
- 相關：`CHANGE-045-om-item-entry-currency-conversion.md`、`apps/web/src/components/om-expense/CLAUDE.md`
- 換算語意：`apps/web/src/lib/currency.ts`（1 USD = `exchangeRate` × 該幣）
