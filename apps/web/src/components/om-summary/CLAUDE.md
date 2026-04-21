# OM Summary Components — CHANGE-004 跨年度報表

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐⭐（跨年度樞紐 + 多層篩選 + 1000+ 行資料網格）
> **Feature**: CHANGE-004 OM Summary Report
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（om-summary 章節）
> - `docs/codebase-analyze/02-api-layer/detail/omExpense.md`（`getSummary` / `getMonthlyTotals` procedures）

## 📋 目錄用途

實作 **CHANGE-004 OM Summary 報表** 的前端組件。這是管理階層最常查看的**跨年度 OM 費用彙總報表**，支援：
- 按 OpCo / Category / Project 三種維度樞紐
- 跨多個財年（FY）比較
- 月度展開 / 收合
- Budget vs Actual vs Variance 三欄對照

## 🏗️ 檔案結構

```
om-summary/
├── index.ts                     # 統一匯出
├── OMSummaryFilters.tsx         # 379 行 — 篩選條件（FY、OpCo、Category 等）
├── OMSummaryCategoryGrid.tsx    # 199 行 — 類別彙總網格（較簡單的檢視）
└── OMSummaryDetailGrid.tsx      # 1032 行 — 完整明細網格（本目錄最核心，最大組件）
```

## 🎯 核心業務邏輯

### OMSummaryFilters.tsx — 篩選條件

| 篩選欄位 | 預設 | 說明 |
|---------|------|------|
| `financialYear` | 當前 FY（CHANGE-028）| 必選，可多選以跨年比較 |
| `opCoIds` | 全部 | 多選 |
| `categoryIds` | 全部 | 多選 |
| `projectIds` | 全部 | 多選（可用於專案經理檢視自己）|
| `searchText` | 空 | CHANGE-029 文字搜尋 |

### OMSummaryDetailGrid.tsx — 明細網格（核心）

**資料結構**：
```
Row 1: OpCo A
  Row 1.1: Category X
    Row 1.1.1: Project Alpha
      - Jan: Budget / Actual / Variance
      - Feb: ...
      ...
```

**三層樞紐**：
1. **Level 1**: OpCo 彙總（可展開/收合）
2. **Level 2**: Category 彙總
3. **Level 3**: Project 逐筆明細（最底層）

**每個 Cell 顯示**：
- **Budget**: 從 `OMExpenseItem.budgetAmount` 按月拆分
- **Actual**: 從 `OMExpenseMonthly.actualAmount` 加總
- **Variance**: Budget − Actual（正值=有餘；負值=超支，標紅）

**效能優化**：
- 使用 virtualization（`react-window` 或類似）避免 DOM 節點過多
- 資料計算在 API 層（`getSummary`），前端只做展示
- 展開狀態存 localStorage 保留使用者偏好

### OMSummaryCategoryGrid.tsx — 簡化檢視

- 僅兩層樞紐（OpCo → Category）
- 用於高階主管快速瀏覽
- 點 Category 可 drill down 到 DetailGrid

## 🔗 依賴關係

- **API**: `packages/api/src/routers/omExpense.ts` 的 `getSummary` 和 `getMonthlyTotals`
- **資料來源**: `OMExpense` → `OMExpenseItem` → `OMExpenseMonthly`（見 `om-expense/CLAUDE.md`）
- **頁面**: `apps/web/src/app/[locale]/om-summary/`
- **權限**: FEAT-009 — 使用者僅看得到有權限的 OpCo 資料

## ⚠️ 開發注意事項

1. **報表資料量大**：單一 FY × 10 OpCo × 20 Category × 50 Project × 12 月 ≈ 120,000 格 — **必須分頁或虛擬滾動**
2. **API 端應做彙總**：前端只展示；不要在前端做 groupBy
3. **Variance 著色規則**：
   - > 0: 綠色（有餘）
   - 0: 灰色
   - < 0 且 |Variance| < 10% Budget: 黃色（警告）
   - < 0 且 |Variance| ≥ 10% Budget: 紅色（顯著超支）
4. **跨幣別處理**：若多 OpCo 幣別不同，需用 `currency.ts` 統一換算成報表幣別（預設 Project 幣別）
5. **預設 FY 邏輯（CHANGE-028）**：若當前月份 > 6 月，預設 FY 為今年；否則為去年（財年邊界業務規則）
6. **搜尋（CHANGE-029）**：在客戶端做 text filter 而非 API（避免過多請求）；但資料量大時應考慮 API 過濾
7. **匯出 CSV/Excel**：目前由 `exportToExcel` API 提供伺服器端產生，避免大量資料傳回前端

## 🐛 已知陷阱

- **展開全部風險**：使用者展開全部 OpCo + Category 可能凍結瀏覽器 — 建議加「一鍵展開」前確認
- **Variance 與捨入誤差**：小數點捨入可能導致 Σ(細項 Variance) ≠ 總 Variance（需選擇一致的捨入策略）
- **跨年比較 FY 重疊**：選兩個相鄰 FY 時注意財年邊界的交界月份重複計算風險
- **OpCo 權限收緊**：FEAT-009 後，新增權限的使用者舊有 localStorage 展開狀態可能指向沒權限的 OpCo — 需容錯

## 🔄 相關變更歷史

- **CHANGE-004**: 初版 OM Summary 報表
- **CHANGE-012~016**: OM Summary 欄位優化系列
- **CHANGE-028**: 預設 FY 邏輯
- **CHANGE-029**: 搜尋功能
- **FEAT-009**: OpCo 權限過濾整合
