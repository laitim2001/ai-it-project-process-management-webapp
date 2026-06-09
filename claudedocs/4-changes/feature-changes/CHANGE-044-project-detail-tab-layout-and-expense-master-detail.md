# CHANGE-044: 專案詳情頁 Tab 化重構 + 專案費用 Master-Detail 月度檢視

> **建立日期**: 2026-06-09
> **完成日期**: 2026-06-09
> **狀態**: ✅ 已完成（含瀏覽器驗收）
> **優先級**: Medium
> **類型**: 現有功能增強 / UI 改進
> **前置依賴**: FEAT-015（Project Expense 月度模組）、CHANGE-036（專案詳情頁欄位增強）

---

## 1. 變更概述

專案詳情頁 (`/projects/[id]`) 經過 FEAT-001 / FEAT-006 / FEAT-010 / CHANGE-036 / FEAT-015 多次累加後，左欄已疊了 **8 張卡片 + 1 個全寬費用模組**，頁面變成一條很長的單頁，使用者只能不斷往下捲動才能查看與操作，體驗惡化。

**目標**（兩件事，互相獨立）：

1. **版面 Tab 化** — 比照預算提案詳情頁 (`/proposals/[id]`) 的設計，把左至中間（2/3 寬）改成 `Tabs`，右側（1/3 寬）保留現有資訊欄。內容分散到 5 個 tab，消除無止境的垂直捲動。
2. **專案費用 Master-Detail** — 切換到「專案費用」tab 時，右側 1/3 改為顯示**目前選中的費用明細（item）的 12 個月月度網格**，取代現行的彈窗 (Dialog) 編輯方式。左選 item、右編月度，更直覺。

> **明確不做**：本變更**純前端版面與互動重組**，不新增資料功能。「專案每月 budget / actual + 描述」的資料能力 FEAT-015 已完整提供（表頭 → 明細 item → 月度三層），**不碰後端、不碰 Prisma schema、不碰 `projectExpense` router、不碰金額計算邏輯**。亦**不與 OM Expense 合併**（兩者資料與畫面持續分離，沿用 FEAT-015 D11/R8 原則）。

---

## 2. 現況分析

### 2.1 目前專案詳情頁區塊（`projects/[id]/page.tsx`）

| 位置 | 區塊 | 對應卡片 |
|------|------|----------|
| 左 2/3 | 專案基本資訊 | `t('projectInfo')` |
| 左 2/3 | 專案分類 | `t('projectClassification')` |
| 左 2/3 | 費用分攤資訊 | `t('chargeOutInfo')` |
| 左 2/3 | 團隊資訊（team / personInCharge） | `t('projectTeam')`（左欄版） |
| 左 2/3 | 審核與財務 | `t('reviewAndFinance')` |
| 左 2/3 | 付款資訊 | `t('paymentInfo')` |
| 左 2/3 | 預算類別明細 | `<BudgetCategoryDetails>` |
| 左 2/3 | 專案統計數據 | `t('projectStats')` |
| 左 2/3 | 提案列表 | `t('proposalsList')` |
| 左 2/3 | 報價管理 | `t('quoteManagement')` |
| 左 2/3 | 採購單列表 | `t('purchaseOrdersList')` |
| 右 1/3 | 預算池資訊 | `t('budgetPoolInfo')` |
| 右 1/3 | 預算使用情況（Module 2） | `t('budgetUsage')` |
| 右 1/3 | 專案團隊（manager / supervisor 頭像） | `t('projectTeam')`（右欄版） |
| 右 1/3 | 快速操作 | `t('quickActions')` |
| **全寬（最底）** | **專案費用月度模組** | `<ProjectExpensePanel projectId={id} />`（FEAT-015） |

> ⚠️ 注意：左欄有「團隊資訊」(team / personInCharge)、右欄有「專案團隊」(manager / supervisor 頭像)，**兩者不同**。本變更只把**左欄的團隊資訊**歸入 tab；右欄的專案團隊維持在側欄。

### 2.2 FEAT-015 專案費用模組（資料層已完備，無需改動）

```
ProjectExpensePanel              ← 容器：查詢 getByProject、表頭/明細/月度 CRUD 編排
├── ProjectExpenseForm           ← 表頭表單（Dialog）
├── ProjectExpenseItemList       ← 明細清單（dnd 排序、編輯、刪除、開月度）
│   └── ProjectExpenseItemForm   ← 明細表單（Dialog）
└── ProjectExpenseItemMonthlyGrid ← 12 月「預算 + 實際」雙欄網格（目前在 Dialog 內）
```

**關鍵發現**：`ProjectExpenseItemMonthlyGrid` 本身已是獨立 `Card`，介面為 `{ item, onSaved?, onClose? }`，**完全可直接渲染到右欄**，幾乎不用改它本體；存檔走 `projectExpense.updateItemMonthlyRecords`，成功後 invalidate `getByProject`。

### 2.3 範本：預算提案詳情頁（`proposals/[id]/page.tsx`）

- 左 2/3：`<Tabs defaultValue="basic">`（basic / project / file / meeting）+ 下方評論區
- 右 1/3：固定的 `ProposalActions` / 審批進度 / 歷史
- 採 **uncontrolled** Tabs（`defaultValue`）。**本變更需改為 controlled**（見 §3.2）。

---

## 3. UI/UX 設計

### 3.1 整體版面

頁首（麵包屑、標題、狀態 Badge、編輯/刪除/退回草稿按鈕）維持不變。下方改為：

```
┌──────────────────────────────────────────────────────────────────┐
│ 麵包屑 / 標題 + 狀態 / [編輯] [刪除] [退回草稿]                      │
├───────────────────────────────────────────┬──────────────────────┤
│ 左 2/3：Tabs                                │ 右 1/3：側欄          │
│ ┌ 概覽 ┬ 分類與分攤 ┬ 預算統計 ┬ 提案採購 ┬ 專案費用 ┐           │ （依 active tab 切換）│
│ │                                          │                      │
│ │  (對應 tab 內容)                          │  非費用 tab →        │
│ │                                          │   預算池 / 預算使用 / │
│ │                                          │   專案團隊 / 快速操作 │
│ │                                          │                      │
│ │                                          │  費用 tab →          │
│ │                                          │   選中 item 的月度網格 │
│ └──────────────────────────────────────────┘                      │
└───────────────────────────────────────────┴──────────────────────┘
```

### 3.2 Tab 分組（5 個 tab — 已與使用者確認）

| Tab | i18n key（新增） | 內含現有區塊 |
|-----|------------------|--------------|
| **概覽** | `projects.detail.tabs.overview` | 專案基本資訊、團隊資訊(team/personInCharge)、審核與財務 |
| **分類與分攤** | `projects.detail.tabs.classification` | 專案分類、費用分攤資訊、付款資訊 |
| **預算統計** | `projects.detail.tabs.budget` | 預算類別明細 (`BudgetCategoryDetails`)、專案統計數據 |
| **提案採購** | `projects.detail.tabs.procurement` | 提案列表、報價管理、採購單列表 |
| **專案費用** | `projects.detail.tabs.expense` | `ProjectExpensePanel`（左側：表頭 + 明細清單） |

> 既有卡片本身**原樣搬移**，只改外層容器（從直接堆疊改為包進對應 `TabsContent`）。卡片標題沿用既有翻譯 key，無須改字。

### 3.3 右側側欄行為（依 active tab）

- **概覽 / 分類與分攤 / 預算統計 / 提案採購** → 右欄沿用現狀：預算池資訊、預算使用情況、專案團隊、快速操作。
- **專案費用** → 右欄改為 Master-Detail 的「Detail」：
  - 已選中某 item → 渲染 `<ProjectExpenseItemMonthlyGrid item={selectedItem} />`（右欄版，`onClose` = 取消選取）。
  - 尚未選中 → 顯示提示空狀態（`projectExpenses.panel.selectItemHint`，例：「請於左側點選費用明細以檢視 / 編輯月度記錄」）。

```
專案費用 tab：
左 2/3 (ProjectExpensePanel)            右 1/3 (Detail)
┌──────────────────────────────────┐  ┌─ 月度記錄 — 雲端授權費 ──────┐
│ ⓘ 與 PO→Expense 區隔說明           │  │ 年度預算 $36,000              │
│ FY2025 雲端維運      [✎][🗑]       │  │ 年度實際 $31,200 / 達成 86.7% │
│  # 名稱        類別  預算   實際   │  │ ────────────────────────────  │
│  1 雲端授權費◄ 授權  36k   31.2k  │  │ 1月  [ 3,000 ] [ 2,980 ]      │
│  2 監控服務     維運  12k   11k    │  │ 2月  [ 3,000 ] [ 3,100 ]      │
│  3 備援頻寬     網路  6k    5.5k   │  │ ...                           │
│  + 新增明細                        │  │ 12月 [ 3,000 ] [   —   ]      │
│ + 新增費用表                       │  │             [ 儲存 ]          │
└──────────────────────────────────┘  └──────────────────────────────┘
                                       （選中列高亮；未選時顯示提示）
```

### 3.4 互動規則

- 左側明細列點選（名稱 / 月度圖示）→ 設定該 item 為選中，右欄顯示其月度網格。
- 選中列以高亮樣式標示（沿用既有 hover / muted 配色）。
- 月度儲存成功 → invalidate `getByProject` → 左側清單與右欄網格一致刷新。
- 選中的 item 被刪除 → 自動取消選取，右欄回到提示空狀態。
- 表頭 CRUD、明細 CRUD / 排序維持原本的 Dialog / dnd 互動（**只有「月度」從 Dialog 移到右欄**）。

---

## 4. 技術設計

### 4.1 修改的檔案

| 檔案 | 改動 |
|------|------|
| `apps/web/src/app/[locale]/projects/[id]/page.tsx` | 左欄改 controlled `Tabs`（5 個）；新增 `activeTab` 與 `selectedExpenseItemId` 狀態；新增頁面層 `getByProject` query（與 panel 共用 cache，自動去重）以取得 fresh 選中 item；右欄依 `activeTab` 條件渲染側欄 vs 月度網格 |
| `apps/web/src/components/project-expense/ProjectExpensePanel.tsx` | 新增 props `selectedItemId?` / `onSelectItem?`；移除內部 `monthlyDialog` 狀態與月度 Dialog；把「開月度」動作改為呼叫 `onSelectItem`；向下傳遞選取狀態 |
| `apps/web/src/components/project-expense/ProjectExpenseItemList.tsx` | 新增 `selectedItemId?`；月度動作語意由「開 Dialog」改為「選取」；選中列高亮 |
| `apps/web/src/components/project-expense/ProjectExpenseItemMonthlyGrid.tsx` | 預期**零或極小改動**（已是獨立 Card，支援 `onSaved` / `onClose`）。若右欄需要 sticky，於頁面外層包裝處理，不改本體 |
| `apps/web/src/messages/{en,zh-TW}.json` | 新增 5 個 tab 標籤 + 1 個右欄提示 key |

### 4.2 狀態提升與資料一致性（核心技術點）

右欄屬**頁面層**欄位，但「選中的 item」資料藏在 `ProjectExpensePanel` 的 `getByProject` 查詢內。解法：

1. 頁面持有 `selectedExpenseItemId: string | null`，透過 `onSelectItem` 由 panel 回傳。
2. 頁面自行呼叫 `api.projectExpense.getByProject.useQuery({ projectId })`——**與 panel 同一 React Query cache key，會自動去重，不產生額外請求**。
3. 頁面由該查詢結果 + `selectedExpenseItemId` **推導出 fresh 的 selectedItem 物件**傳給右欄網格（不直接存物件，避免存檔後 stale）。
4. 任一 mutation 成功 invalidate 同一 key → 左清單與右網格一起刷新；`ProjectExpenseItemMonthlyGrid` 既有的 `useEffect([item])` 會用新值重置，數字自動同步。

### 4.3 Controlled Tabs

```tsx
const [activeTab, setActiveTab] = useState('overview');
const [selectedExpenseItemId, setSelectedExpenseItemId] = useState<string | null>(null);

// 右欄
<div className="lg:col-span-1 space-y-6">
  {activeTab === 'expense' ? (
    selectedItem ? (
      <ProjectExpenseItemMonthlyGrid
        item={selectedItem}
        onSaved={() => { /* invalidate 由 grid 內部 mutation 觸發 */ }}
        onClose={() => setSelectedExpenseItemId(null)}
      />
    ) : (
      <Card>{/* selectItemHint 空狀態 */}</Card>
    )
  ) : (
    <>{/* 預算池 / 預算使用 / 專案團隊 / 快速操作（現狀） */}</>
  )}
</div>
```

### 4.4 i18n（依 `.claude/rules/i18n.md`：同步雙語 + `pnpm validate:i18n`）

新增 key（en / zh-TW 同步）：

| Key | zh-TW | en |
|-----|-------|----|
| `projects.detail.tabs.overview` | 概覽 | Overview |
| `projects.detail.tabs.classification` | 分類與分攤 | Classification & Charge-Out |
| `projects.detail.tabs.budget` | 預算統計 | Budget & Stats |
| `projects.detail.tabs.procurement` | 提案採購 | Proposals & Procurement |
| `projects.detail.tabs.expense` | 專案費用 | Project Expense |
| `projectExpenses.panel.selectItemHint` | 請於左側點選費用明細以檢視 / 編輯月度記錄 | Select an item on the left to view / edit its monthly records |

---

## 5. 影響範圍

- **頁面**: `projects/[id]/page.tsx`（大幅版面重組，但區塊內容原樣搬移）
- **組件**: `project-expense/` 模組 3 個檔（Panel / ItemList / MonthlyGrid）
- **翻譯**: 新增 6 個 key（雙語）
- **後端 / Schema / API**: **無**（不碰）
- **OM Expense**: **無**（持續分離）
- **風險**: 中低 — 純前端；主要風險在 (a) 既有卡片搬進 tab 時遺漏某區塊、(b) 月度 Dialog → 右欄 的狀態接線。皆可由 typecheck + 手動驗證覆蓋。

---

## 6. 驗收標準

- [x] 詳情頁左 2/3 呈現 5 個 tab；右 1/3 在非費用 tab 維持原側欄
- [x] 原 8 張卡片 + BudgetCategoryDetails + 統計全部正確歸入對應 tab，無遺漏、無重複
- [x] 切到「專案費用」tab：左側顯示 `ProjectExpensePanel`（表頭 + 明細清單）
- [x] 點選左側明細 → 右欄顯示該 item 的 12 月網格；選中列高亮
- [x] 未選明細時右欄顯示提示空狀態
- [x] 月度於右欄編輯並儲存 → 左側年度預算/實際/達成率與右欄即時同步
- [~] 刪除選中的明細 → 右欄回到提示空狀態（不報錯）：由「右欄物件從 fresh 查詢推導」邏輯保證（item 被刪 → 推導為 null → 顯示提示），未於瀏覽器實際刪除以保留測試資料
- [x] 表頭/明細的新增/編輯/刪除/排序維持原本 Dialog / dnd 行為（該段程式碼未改動，面板渲染正常）
- [x] 月度編輯的 Dialog 路徑已移除（grep 確認無 monthlyDialog 殘留；月度改於右欄呈現）
- [x] Typecheck：全專案 `pnpm typecheck` **全綠**（執行 `pnpm --filter db run db:generate` 修復過舊 Prisma Client 後，api + web 皆通過）；改動檔 0 錯
- [x] `pnpm validate:i18n` 通過（雙語 key 一致，2847 keys）
- [x] `next lint --file` 對改動檔無新增錯誤（兩個 project-expense 組件零問題；page 既有 5 個 error 為 pre-existing 死碼/floating-promise，未由本變更引入）

---

## 7. 實施計劃（Goal-Driven）

| 階段 | 任務 | 驗證 |
|------|------|------|
| 1 | 新增 6 個 i18n key（雙語） | `pnpm validate:i18n` 通過 |
| 2 | 頁面左欄改 controlled `Tabs`，既有卡片原樣搬入 5 個 `TabsContent` | typecheck 通過；瀏覽器目視 5 tab 內容齊全 |
| 3 | 重構 `ProjectExpensePanel` / `ItemList`：加選取 props、移除月度 Dialog | typecheck 通過 |
| 4 | 頁面加 `getByProject` query + `selectedExpenseItemId`；右欄條件渲染月度網格 / 提示 | typecheck 通過 |
| 5 | 端到端手動驗證（master-detail 選取、存檔同步、刪除回退） | 對照 §6 驗收標準逐項 |
| 6 | 更新 `PROJECT-INDEX.md` / 當週週報 / 本文件狀態 → ✅ | — |

> 階段 2–4 為「大幅改寫 production 程式碼」，**開工前需取得使用者明確同意**（依協作行為邊界）。

---

## 8. 設計決策

### 已與使用者確認
- **D1 Tab 分組**：5 個 tab（概覽 / 分類與分攤 / 預算統計 / 提案採購 / 專案費用）。
- **D2 費用頁右側**：Master-Detail 月度網格（左選 item、右顯示），取代現有 Dialog。

### 本文件預設（待審核時可推翻）
- **D3 移除月度 Dialog**：因 panel 僅用於此頁，採完全移除 Dialog 路徑（不保留雙路徑），符合 Simplicity First。
- **D4 未選取時右欄**：顯示提示空狀態，**不**自動選取第一筆（避免多表頭時行為意外）。
- **D5 右欄 sticky**：月度網格 `sticky top-*`，使左側長清單捲動時網格仍可見。
- **D6 不做 URL 同步**：active tab 以 `useState` 管理，不寫入 query param（沿用 proposal 頁慣例、保持最小改動）。
- **D7 預設 tab**：概覽 (overview)。

---

## 9. 相關文檔

- FEAT-015 — Project Expense 月度模組（資料層，本變更的前置）
- CHANGE-036 — 專案詳情頁欄位增強（本變更的版面前身）
- CHANGE-042 — OM Expense 雙幣別顯示（`DualCurrency`，月度網格沿用）
- `apps/web/src/app/[locale]/proposals/[id]/page.tsx` — Tab 版面範本
- `.claude/rules/i18n.md` / `.claude/rules/components.md` / `.claude/rules/frontend.md`

---

## 10. 實施記錄

### 10.1 完成日期
2026-06-09（程式碼 + 靜態驗證完成；瀏覽器互動驗收待使用者確認）

### 10.2 修改的檔案

| 檔案 | 改動摘要 |
|------|----------|
| `apps/web/src/messages/zh-TW.json` / `en.json` | 新增 `projectExpenses.panel.selectItemHint`；**重用**既有但未被引用的死 key `projects.detail.tabs`，改寫為議定的 5 個 tab 標籤（overview / classification / budget / procurement / expense） |
| `apps/web/src/app/[locale]/projects/[id]/page.tsx` | 左欄改 controlled `Tabs`（5 tab）；既有卡片**原樣搬移**並重排（團隊資訊 + 審核與財務上移至基本資訊後，使分組連續）；新增 `activeTab` / `selectedExpenseItemId` 狀態 + 頁面層 `getByProject` query + `useMemo` 推導 `selectedExpenseItem`；右欄依 `activeTab` 條件渲染（費用 tab → sticky 月度網格 / 提示空狀態；其他 tab → 原側欄）；移除頁底原全寬 `ProjectExpensePanel`（移入費用 tab） |
| `apps/web/src/components/project-expense/ProjectExpensePanel.tsx` | 新增 `selectedItemId` / `onSelectItem` props；移除 `monthlyDialog` 狀態、`handleMonthlySaved`、月度 Dialog JSX 與 `ProjectExpenseItemMonthlyGrid` import；更新 docstring |
| `apps/web/src/components/project-expense/ProjectExpenseItemList.tsx` | `onEditMonthly` → `onSelectItem`（語意改為選取）；新增 `selectedItemId`；選中列高亮（列底色 + 名稱 primary 色）；明細名稱點擊改為選取 |

### 10.3 設計決策落實
- D1–D7 全數照 §8 實施。D3：月度 Dialog 已完全移除（無雙路徑殘留）。

### 10.4 過程發現
- **既有死 key `projects.detail.tabs`**：發現一組（overview/proposals/quotes/purchaseOrders/expenses）從未被任何 .tsx 引用的孤兒翻譯 key（proposals 頁用的是自身 namespace）。因本變更正好需要此 key，直接重用該 slot 改寫為議定結構，避免製造重複 key。
- **`items.clickToEdit`**：名稱點擊改為選取後，此 i18n key 失去引用（保留，不影響驗證；移除需動雙語檔且無功能效益）。

### 10.5 驗證結果
- ✅ `pnpm validate:i18n`：全綠（2847 keys，雙語一致、無重複/空值）
- ✅ Typecheck（`pnpm --filter @itpm/web run typecheck`）：改動檔 **0 錯**
- ✅ `next lint --file`（3 個改動 .tsx）：未引入新錯誤
- ⚠️ **既有非本變更問題**：全專案 `pnpm typecheck` 因工作區未提交的 `apps/web/src/components/approval-workflow/types.ts`（`approverRoleId` 收緊為 non-null）連帶 break `packages/api/src/routers/budgetProposal.ts`(573/617/850) 與 `proposals/[id]/page.tsx`(496)。與 CHANGE-044 無關，未處理。
- ✅ 瀏覽器互動驗收（Playwright，使用 UUID 專案 `eeee9999-...`「Test Project (Cross-Pool 400 Bug)」）：
  - 5 個 tab 正確渲染、卡片分組正確（Overview = 基本資訊/團隊/審核財務；Classification = 分類/費用分攤/付款）
  - 非費用 tab 右欄維持原側欄；切到費用 tab 右欄切換為月度區
  - 費用 tab 未選明細 → 右欄顯示提示空狀態
  - 點選明細 → 右欄顯示該 item 的 12 月網格、左側列高亮
  - 右欄填 Jan 預算 1000 / 實際 800 並儲存 → 左側明細列、Total、表頭年度彙總**同步**更新為 US$1,000 / US$800 / 80.0%（共用 cache key invalidation 驗證成功）；驗證後已還原為 0
  - 切回 Classification tab → 右欄正確切回原側欄

### 10.6 順帶發現（非本變更，未處理）
- **Prisma Client 過舊致 typecheck 紅**：本機 `db:generate` 未跑，generated client 的 `approverRoleId` 仍為舊 nullable 型別，導致 `budgetProposal.ts` / proposals 頁 typecheck 失敗。已執行 `pnpm --filter db run db:generate` 修復，typecheck 回綠。
- **種子資料非 UUID id**：`proj-erp-upgrade` / `proj-cloud-migration` 為 slug id，但 `project.getById` input 限定 `z.string().uuid()`，導致這兩個專案詳情頁 getById 回 400（既有問題，與本變更無關）。

### 10.7 後續
- 視需要更新 `PROJECT-INDEX.md` / 當週週報（提交時一併處理）。
