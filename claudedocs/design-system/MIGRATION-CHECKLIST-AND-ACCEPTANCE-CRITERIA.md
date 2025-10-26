# 設計系統遷移檢查清單和驗收標準

## 文檔目的

本文檔提供完整的檢查清單，用於驗證設計系統遷移的所有階段是否完成並符合質量標準。每個檢查項都有明確的驗收標準，確保遷移的成功和品質。

---

## 總體遷移狀態

### 階段完成狀態

| 階段 | 狀態 | 完成日期 | 驗收人 | 備註 |
|------|------|---------|--------|------|
| POC 驗證 | ⏳ | - | - | - |
| Phase 1: CSS 變數系統 | ⏳ | - | - | - |
| Phase 2: UI 組件庫 | ⏳ | - | - | - |
| Phase 3: 頁面遷移 | ⏳ | - | - | - |
| Phase 4: 進階功能 | ⏳ | - | - | - |
| 最終驗收 | ⏳ | - | - | - |

**圖例**: ⏳ 待開始 | 🔄 進行中 | ✅ 已完成 | ❌ 未通過

---

## POC 驗證檢查清單

### POC 必要條件（所有必須滿足）

| # | 檢查項 | 狀態 | 驗證方式 | 備註 |
|---|--------|------|----------|------|
| 1 | CSS 變數系統運行正常，無 console 錯誤 | ☐ | 瀏覽器 DevTools 檢查 | |
| 2 | 核心組件全部可用且通過測試 | ☐ | 運行測試套件 | |
| 3 | Dashboard 和 Login 頁面遷移成功 | ☐ | 手動功能測試 | |
| 4 | TypeScript 類型檢查 100% 通過 | ☐ | `pnpm typecheck` | |
| 5 | tRPC 整合無問題，數據加載正常 | ☐ | 測試 API 調用 | |
| 6 | Azure AD B2C 認證流程正常 | ☐ | 完整登入流程測試 | |
| 7 | 無 critical bugs 或 blockers | ☐ | Bug 追蹤系統檢查 | |

### POC 性能條件（至少滿足 80%）

| # | 檢查項 | 目標值 | 實際值 | 狀態 | 備註 |
|---|--------|--------|--------|------|------|
| 8 | FCP / LCP 性能退化 | < 10% | - | ☐ | Lighthouse 測試 |
| 9 | Bundle size 增加 | < 15% | - | ☐ | Webpack Bundle Analyzer |
| 10 | Lighthouse Performance Score | ≥ 90 | - | ☐ | Chrome DevTools |
| 11 | 無明顯的視覺延遲或卡頓 | 無 | - | ☐ | 手動測試 |

### POC 品質條件（至少滿足 80%）

| # | 檢查項 | 目標值 | 實際值 | 狀態 | 備註 |
|---|--------|--------|--------|------|------|
| 12 | 視覺效果評估 | ≥ ⭐⭐⭐⭐ | - | ☐ | 視覺對比評分 |
| 13 | 開發體驗評分 | ≥ 8.0/10 | - | ☐ | 團隊問卷調查 |
| 14 | 響應式設計在所有斷點正常 | 100% | - | ☐ | Mobile/Tablet/Desktop |
| 15 | 亮/暗色主題切換流暢無閃爍 | 無閃爍 | - | ☐ | 手動測試 |

### POC 決策結果

- **GO** ✅: 必要條件 7/7 + 性能條件 ≥3/4 + 品質條件 ≥3/4
- **CONDITIONAL GO** ⚠️: 必要條件 7/7 + (性能條件 2-3/4 或 品質條件 2-3/4)
- **NO-GO** ❌: 必要條件 <7/7 或 性能條件 <2/4 或 品質條件 <2/4

**最終決策**: [待填]
**決策日期**: [待填]
**決策人**: [待填]

---

## Phase 1: CSS 變數系統檢查清單

### P1.1 分支和環境設置

- [ ] `phase-1/css-variables` 分支已建立
- [ ] `phase-1-start` tag 已建立
- [ ] 開發環境正常啟動（`pnpm dev`）

### P1.2 CSS 變數系統

- [ ] `globals.css` 包含完整的 CSS 變數定義
- [ ] Light mode 顏色變數已定義（≥14 個）
  - [ ] background, foreground
  - [ ] card, card-foreground
  - [ ] popover, popover-foreground
  - [ ] primary, primary-foreground
  - [ ] secondary, secondary-foreground
  - [ ] muted, muted-foreground
  - [ ] accent, accent-foreground
  - [ ] destructive, destructive-foreground
  - [ ] border, input, ring
  - [ ] radius
- [ ] Dark mode 顏色變數已定義（≥14 個）
- [ ] Chart 顏色變數已定義（可選，5 個）

### P1.3 Tailwind 整合

- [ ] `tailwind.config.ts` 已更新
- [ ] `darkMode: ["class"]` 已配置
- [ ] 所有 CSS 變數已映射到 Tailwind colors
- [ ] `borderRadius` 變數已配置
- [ ] 動畫已添加（accordion-down, accordion-up）
- [ ] `tailwindcss-animate` plugin 已引入

### P1.4 工具函數

- [ ] `lib/utils.ts` 文件已建立
- [ ] `cn()` 函數實現正確
- [ ] `cn()` 函數有完整的 JSDoc 註解
- [ ] `cn()` 函數有單元測試（可選）
- [ ] 測試通過（如果有）

### P1.5 依賴安裝

- [ ] `class-variance-authority` 已安裝
- [ ] `clsx` 已安裝
- [ ] `tailwind-merge` 已安裝
- [ ] `next-themes` 已安裝
- [ ] `@radix-ui/react-slot` 已安裝
- [ ] `tailwindcss-animate` 已安裝（dev dependency）
- [ ] 所有依賴可正常引入

### P1.6 主題系統

- [ ] `theme-provider.tsx` 組件已建立
- [ ] `theme-toggle.tsx` 組件已建立
- [ ] `theme-toggle-simple.tsx` 組件已建立（可選）
- [ ] `use-theme.ts` hook 已建立（可選）
- [ ] 所有組件有 "use client" directive
- [ ] 無 hydration mismatch 警告

### P1.7 Root Layout 整合

- [ ] ThemeProvider 已整合到 `layout.tsx`
- [ ] `suppressHydrationWarning` 已添加到 `<html>`
- [ ] ThemeProvider 配置正確
  - [ ] `attribute="class"`
  - [ ] `defaultTheme="system"`
  - [ ] `enableSystem={true}`
  - [ ] `disableTransitionOnChange`
- [ ] 開發服務器啟動無錯誤
- [ ] 無 console 警告

### P1.8 文檔

- [ ] `DESIGN-TOKENS.md` 文檔已建立
- [ ] 所有 CSS 變數已記錄
- [ ] 每個 token 有用途說明
- [ ] 包含使用範例
- [ ] 包含 light/dark mode 對照表
- [ ] 包含最佳實踐指引

### P1.9 測試

#### 自動化測試
- [ ] TypeScript 類型檢查通過（`pnpm typecheck`）
- [ ] ESLint 檢查通過（`pnpm lint`）
- [ ] 構建成功（`pnpm build`）
- [ ] 單元測試通過（如果有）

#### 功能測試
- [ ] CSS 變數正確加載
- [ ] 主題切換流暢無閃爍
- [ ] Light mode 顏色正確
- [ ] Dark mode 顏色正確
- [ ] System mode 跟隨系統設置

#### 視覺測試
- [ ] 測試頁面（/theme-test）正常渲染
- [ ] 所有顏色 token 正確顯示
- [ ] 主題切換即時生效

#### 性能測試
- [ ] Lighthouse Performance Score ≥ 90
- [ ] Bundle size 增加可接受
- [ ] 無性能退化

### P1.10 完成報告

- [ ] `PHASE-1-COMPLETION-REPORT.md` 已建立
- [ ] 報告包含所有關鍵指標
- [ ] 遇到的問題已記錄
- [ ] 學到的經驗已總結

### P1.11 Code Review 和合併

- [ ] PR 已建立
- [ ] PR 描述完整
- [ ] Code review 完成
- [ ] 所有審查意見已處理
- [ ] PR 已批准
- [ ] 代碼已合併到 `feature/design-system-migration`
- [ ] `phase-1-completed` tag 已建立

### Phase 1 總體驗收

**必須全部通過才能進入 Phase 2:**

- [ ] 所有檢查項已完成
- [ ] 所有測試通過
- [ ] 無阻塞性問題
- [ ] Code review 批准
- [ ] 代碼已合併

**Phase 1 驗收結果**: ☐ 通過 | ☐ 未通過
**驗收日期**: [待填]
**驗收人**: [待填]

---

## Phase 2: UI 組件庫檢查清單

### P2.1 分支和環境設置

- [ ] `phase-2/ui-components` 分支已建立
- [ ] `phase-2-start` tag 已建立
- [ ] 開發環境正常啟動

### P2.2 依賴安裝

#### Radix UI 組件
- [ ] @radix-ui/react-checkbox
- [ ] @radix-ui/react-radio-group
- [ ] @radix-ui/react-select
- [ ] @radix-ui/react-switch
- [ ] @radix-ui/react-slider
- [ ] @radix-ui/react-dialog
- [ ] @radix-ui/react-popover
- [ ] @radix-ui/react-dropdown-menu
- [ ] @radix-ui/react-tooltip
- [ ] @radix-ui/react-context-menu
- [ ] @radix-ui/react-alert-dialog
- [ ] @radix-ui/react-toast
- [ ] @radix-ui/react-progress
- [ ] @radix-ui/react-tabs
- [ ] @radix-ui/react-accordion

#### 表單管理
- [ ] react-hook-form
- [ ] zod
- [ ] @hookform/resolvers

#### 圖標庫
- [ ] lucide-react

### P2.3 P1 組件（核心基礎組件 - 8 個）

| 組件 | 已實現 | 有測試 | 在 index.ts | 文檔 | 備註 |
|------|--------|--------|-------------|------|------|
| Button | ☐ | ☐ | ☐ | ☐ | 6 variants, 4 sizes |
| Card | ☐ | ☐ | ☐ | ☐ | Compound component |
| Input | ☐ | ☐ | ☐ | ☐ | Error states |
| Label | ☐ | ☐ | ☐ | ☐ | Form labels |
| Badge | ☐ | ☐ | ☐ | ☐ | Variants |
| Avatar | ☐ | ☐ | ☐ | ☐ | Image + Fallback |
| Skeleton | ☐ | ☐ | ☐ | ☐ | Loading states |
| Separator | ☐ | ☐ | ☐ | ☐ | H/V divider |

### P2.4 P2 組件（表單組件 - 7 個）

| 組件 | 已實現 | 有測試 | 在 index.ts | 文檔 | 備註 |
|------|--------|--------|-------------|------|------|
| Textarea | ☐ | ☐ | ☐ | ☐ | Multi-line input |
| Select | ☐ | ☐ | ☐ | ☐ | Radix UI |
| Checkbox | ☐ | ☐ | ☐ | ☐ | Radix UI |
| RadioGroup | ☐ | ☐ | ☐ | ☐ | Radix UI |
| Switch | ☐ | ☐ | ☐ | ☐ | Radix UI |
| Slider | ☐ | ☐ | ☐ | ☐ | Radix UI |
| Form | ☐ | ☐ | ☐ | ☐ | react-hook-form |

### P2.5 P3 組件（浮層組件 - 7 個）

| 組件 | 已實現 | 有測試 | 在 index.ts | 文檔 | 備註 |
|------|--------|--------|-------------|------|------|
| Dialog | ☐ | ☐ | ☐ | ☐ | Modal |
| Popover | ☐ | ☐ | ☐ | ☐ | Floating content |
| Dropdown Menu | ☐ | ☐ | ☐ | ☐ | Action menus |
| Tooltip | ☐ | ☐ | ☐ | ☐ | Hints |
| Sheet | ☐ | ☐ | ☐ | ☐ | Side drawer |
| Alert Dialog | ☐ | ☐ | ☐ | ☐ | Confirm |
| Context Menu | ☐ | ☐ | ☐ | ☐ | Right-click |

### P2.6 P4 組件（反饋組件 - 3 個）

| 組件 | 已實現 | 有測試 | 在 index.ts | 文檔 | 備註 |
|------|--------|--------|-------------|------|------|
| Alert | ☐ | ☐ | ☐ | ☐ | Inline alerts |
| Toast | ☐ | ☐ | ☐ | ☐ | Notifications |
| Progress | ☐ | ☐ | ☐ | ☐ | Progress bar |

### P2.7 P5 組件（進階組件 - 3 個，可選）

| 組件 | 已實現 | 有測試 | 在 index.ts | 文檔 | 備註 |
|------|--------|--------|-------------|------|------|
| Table | ☐ | ☐ | ☐ | ☐ | Data tables |
| Tabs | ☐ | ☐ | ☐ | ☐ | Tab panels |
| Accordion | ☐ | ☐ | ☐ | ☐ | Collapsible |

### P2.8 組件質量檢查（每個組件）

**對於每個組件，驗證以下項目:**

- [ ] 使用 CVA (class-variance-authority) 管理變體
- [ ] 使用 `forwardRef` 正確轉發 ref
- [ ] 設置 `displayName`
- [ ] 使用 `cn()` 工具合併類名
- [ ] 完整的 TypeScript 類型定義
- [ ] Props 繼承正確的 HTML 元素屬性
- [ ] 支持 light/dark 主題
- [ ] 可訪問性（ARIA 屬性）
- [ ] 鍵盤導航支持
- [ ] 有 JSDoc 註解
- [ ] 有使用範例

### P2.9 測試

#### 自動化測試
- [ ] TypeScript 類型檢查通過
- [ ] ESLint 檢查通過
- [ ] 構建成功
- [ ] 單元測試通過（目標覆蓋率 ≥ 80%）
- [ ] 可訪問性測試通過（axe-core）

#### 組件展示頁面
- [ ] `/component-showcase` 頁面已建立
- [ ] 所有組件在頁面上展示
- [ ] 所有變體正確渲染
- [ ] Light mode 正確
- [ ] Dark mode 正確

#### 性能測試
- [ ] Bundle size 可接受（增加 < 15%）
- [ ] Lighthouse Performance Score ≥ 90
- [ ] 無性能退化

### P2.10 文檔

- [ ] `components/ui/README.md` 已建立
- [ ] 每個組件有使用範例
- [ ] Props API 文檔完整
- [ ] Variants 說明清晰
- [ ] Storybook 已建立（可選）

### P2.11 完成報告和合併

- [ ] `PHASE-2-COMPLETION-REPORT.md` 已建立
- [ ] PR 已建立並包含詳細描述
- [ ] Code review 完成
- [ ] PR 已批准和合併
- [ ] `phase-2-completed` tag 已建立

### Phase 2 總體驗收

**必須全部通過才能進入 Phase 3:**

- [ ] 所有 P1 組件（8個）已完成
- [ ] 所有 P2 組件（7個）已完成
- [ ] 所有 P3 組件（7個）已完成
- [ ] 所有 P4 組件（3個）已完成
- [ ] 組件質量檢查通過
- [ ] 測試覆蓋率 ≥ 80%
- [ ] 所有測試通過
- [ ] 文檔完整
- [ ] Code review 批准

**Phase 2 驗收結果**: ☐ 通過 | ☐ 未通過
**驗收日期**: [待填]
**驗收人**: [待填]

---

## Phase 3: 頁面遷移檢查清單

### P3.1 準備工作

- [ ] `phase-3/page-migration` 分支已建立
- [ ] `phase-3-start` tag 已建立
- [ ] 遷移工具和模板已建立
  - [ ] PAGE-MIGRATION-TRACKER.md
  - [ ] COLOR-MIGRATION-MAP.md
  - [ ] COMPONENT-MIGRATION-MAP.md
  - [ ] migrate-page.sh（可選）
- [ ] 頁面審計已完成
  - [ ] PAGE-AUDIT-REPORT.md
  - [ ] 風險已識別
  - [ ] 遷移順序已定義

### P3.2 頁面遷移狀態（29 頁面）

#### Priority 1 - 認證和核心（4 頁面）

| 頁面 | 路徑 | 狀態 | 功能測試 | 視覺測試 | 備註 |
|------|------|------|---------|---------|------|
| 登入 | /login | ☐ | ☐ | ☐ | Azure AD B2C |
| 註冊 | /register | ☐ | ☐ | ☐ | 如果存在 |
| Dashboard | /dashboard | ☐ | ☐ | ☐ | 高優先級 |
| 首頁 | / | ☐ | ☐ | ☐ | |

#### Priority 2 - 核心業務（11 頁面）

**預算管理（3 頁面）:**
| 頁面 | 路徑 | 狀態 | 功能測試 | 視覺測試 | 備註 |
|------|------|------|---------|---------|------|
| 預算池列表 | /budget-pools | ☐ | ☐ | ☐ | |
| 預算池詳情 | /budget-pools/[id] | ☐ | ☐ | ☐ | |
| 建立預算池 | /budget-pools/new | ☐ | ☐ | ☐ | |

**專案管理（3 頁面）:**
| 頁面 | 路徑 | 狀態 | 功能測試 | 視覺測試 | 備註 |
|------|------|------|---------|---------|------|
| 專案列表 | /projects | ☐ | ☐ | ☐ | |
| 專案詳情 | /projects/[id] | ☐ | ☐ | ☐ | |
| 建立專案 | /projects/new | ☐ | ☐ | ☐ | |

**提案管理（5 頁面）:**
| 頁面 | 路徑 | 狀態 | 功能測試 | 視覺測試 | 備註 |
|------|------|------|---------|---------|------|
| 提案列表 | /proposals | ☐ | ☐ | ☐ | |
| 提案詳情 | /proposals/[id] | ☐ | ☐ | ☐ | |
| 建立提案 | /proposals/new | ☐ | ☐ | ☐ | |
| 編輯提案 | /proposals/[id]/edit | ☐ | ☐ | ☐ | |
| 提案審批 | /proposals/[id]/approve | ☐ | ☐ | ☐ | |

#### Priority 3 - 支援功能（11 頁面）

**廠商管理（3 頁面）、報價管理（2 頁面）、採購單（3 頁面）、費用（3 頁面）**
[類似的表格結構...]

#### Priority 4 - 其他（3 頁面）

| 頁面 | 路徑 | 狀態 | 功能測試 | 視覺測試 | 備註 |
|------|------|------|---------|---------|------|
| 通知中心 | /notifications | ☐ | ☐ | ☐ | |
| 設定 | /settings | ☐ | ☐ | ☐ | |
| 用戶資料 | /profile | ☐ | ☐ | ☐ | |

### P3.3 每頁遷移檢查（適用於所有頁面）

**元素替換:**
- [ ] 所有 `<button>` 替換為 `<Button>`
- [ ] 所有自定義 input 替換為 `<Input>`
- [ ] 所有自定義 card 替換為 `<Card>`
- [ ] 所有 badge/tag 替換為 `<Badge>`
- [ ] 所有 select 替換為 `<Select>`
- [ ] 所有 dialog/modal 替換為 `<Dialog>`
- [ ] 所有 table 替換為 `<Table>`

**顏色系統:**
- [ ] `bg-white` → `bg-background`
- [ ] `bg-blue-*` → `bg-primary`
- [ ] `bg-red-*` → `bg-destructive`
- [ ] `text-gray-*` → `text-foreground` / `text-muted-foreground`
- [ ] `border-gray-*` → `border`

**功能驗證:**
- [ ] 表單提交正常
- [ ] tRPC 數據加載正常
- [ ] 導航和路由正常
- [ ] 互動元素可用
- [ ] 無 console 錯誤

**主題支援:**
- [ ] Light mode 顯示正常
- [ ] Dark mode 顯示正常
- [ ] 主題切換流暢

**響應式:**
- [ ] Mobile (375px) 正常
- [ ] Tablet (768px) 正常
- [ ] Desktop (1920px) 正常

### P3.4 全站佈局組件

- [ ] Navbar 遷移完成
- [ ] Sidebar 遷移完成（如果有）
- [ ] Footer 遷移完成（如果有）
- [ ] ThemeToggle 已整合到 Navbar
- [ ] 導航功能正常

### P3.5 測試

#### 功能測試
- [ ] 所有頁面功能正常（參考 PHASE-3-TESTING-CHECKLIST.md）
- [ ] 所有表單提交正常
- [ ] 所有數據加載正常
- [ ] 所有導航正常

#### 自動化測試
- [ ] TypeScript 類型檢查通過
- [ ] ESLint 檢查通過
- [ ] 構建成功
- [ ] E2E 測試通過（如果有）

#### 性能測試
- [ ] Lighthouse Performance ≥ 90（關鍵頁面）
- [ ] Lighthouse Accessibility ≥ 90（關鍵頁面）
- [ ] Bundle size 增加可接受

#### 可訪問性測試
- [ ] axe DevTools 無 violations
- [ ] 鍵盤導航完整
- [ ] Screen reader 測試通過
- [ ] 顏色對比度符合 WCAG AA

#### 跨瀏覽器測試
- [ ] Chrome 最新版正常
- [ ] Firefox 最新版正常
- [ ] Safari 最新版正常
- [ ] Edge 最新版正常

### P3.6 文檔

- [ ] PAGE-MIGRATION-TRACKER.md 已更新
- [ ] PHASE-3-TEST-RESULTS.md 已建立
- [ ] PHASE-3-COMPLETION-REPORT.md 已建立

### P3.7 完成和合併

- [ ] 所有 29 個頁面遷移完成
- [ ] 所有測試通過
- [ ] PR 已建立
- [ ] Code review 完成
- [ ] PR 已批准和合併
- [ ] `phase-3-completed` tag 已建立

### Phase 3 總體驗收

**必須全部通過才能進入 Phase 4:**

- [ ] 所有頁面遷移完成（29/29）
- [ ] 功能完整性 100%
- [ ] 所有測試通過
- [ ] 性能指標達標
- [ ] 可訪問性達標
- [ ] 跨瀏覽器兼容
- [ ] Code review 批准

**Phase 3 驗收結果**: ☐ 通過 | ☐ 未通過
**驗收日期**: [待填]
**驗收人**: [待填]

---

## Phase 4: 進階功能檢查清單

### P4.1 準備工作

- [ ] `phase-4/advanced-features` 分支已建立
- [ ] `phase-4-start` tag 已建立

### P4.2 多主題系統

- [ ] 4+ 主題顏色已定義（Blue, Green, Purple, Rose）
- [ ] 每個主題支持 light/dark mode
- [ ] `lib/themes.ts` 配置文件已建立
- [ ] `theme-color-selector.tsx` 組件已建立
- [ ] 主題切換即時生效
- [ ] 主題選擇持久化（localStorage）
- [ ] 所有主題對比度符合 WCAG AA

### P4.3 Toast 通知系統

- [ ] Toast 組件已整合到 Root Layout
- [ ] `lib/notifications.ts` 工具函數已建立
  - [ ] showSuccess()
  - [ ] showError()
  - [ ] showWarning()
  - [ ] showInfo()
  - [ ] showLoading()
- [ ] 全局錯誤處理器已建立
- [ ] 在實際操作中測試成功
- [ ] Toast 可訪問（ARIA live regions）

### P4.4 全局狀態組件

#### Loading 狀態
- [ ] LoadingState 組件已建立
- [ ] PageLoading 組件已建立
- [ ] InlineLoading 組件已建立
- [ ] 支持不同尺寸（sm, md, lg）
- [ ] 全屏模式可用

#### Error 狀態
- [ ] ErrorState 組件已建立
- [ ] PageError 組件已建立
- [ ] InlineError 組件已建立
- [ ] Retry 功能可用

#### Empty 狀態
- [ ] EmptyState 組件已建立
- [ ] 可自定義圖標、標題、描述
- [ ] Action 按鈕可用

### P4.5 表單系統優化

- [ ] 通用驗證 schemas 已建立（`lib/validations/common.ts`）
  - [ ] Email, password, phone
  - [ ] Date, amount, description
  - [ ] Required field helpers
- [ ] 業務驗證 schemas 已建立（例如 `project.ts`）
- [ ] `useFormWithToast` hook 已建立
- [ ] 至少一個表單使用新模式
- [ ] 表單驗證即時生效
- [ ] 錯誤訊息清晰友好

### P4.6 骨架屏加載（可選）

- [ ] Skeleton 組件變體已建立
- [ ] Card skeleton
- [ ] Table skeleton
- [ ] List skeleton
- [ ] 在數據加載時正確顯示

### P4.7 頁面過渡動畫（可選）

- [ ] 頁面切換動畫已實現
- [ ] 元素進入/離開動畫已實現
- [ ] 動畫流暢不影響性能

### P4.8 響應式表格優化

- [ ] Mobile 下表格變為卡片佈局
- [ ] 水平滾動可用
- [ ] 觸控體驗優化

### P4.9 可重用數據表格（可選）

- [ ] 整合 TanStack Table
- [ ] 排序功能
- [ ] 篩選功能
- [ ] 分頁功能
- [ ] 統一的表格 API

### P4.10 可訪問性優化

- [ ] ARIA 屬性完善
- [ ] 鍵盤導航優化
- [ ] Focus 管理改進
- [ ] Skip links 已添加
- [ ] Landmark roles 正確使用

### P4.11 性能優化

- [ ] Code splitting 實現
- [ ] 懶加載組件實現
- [ ] 圖片優化（next/image）
- [ ] Bundle size 分析完成
- [ ] 性能退化 < 5%

### P4.12 Storybook 文檔（可選）

- [ ] Storybook 已配置
- [ ] 所有組件有 stories
- [ ] 所有 variants 有展示
- [ ] 控制面板（controls）可用

### P4.13 E2E 測試（可選）

- [ ] Playwright 已配置
- [ ] 關鍵用戶流程有 E2E 測試
  - [ ] 登入流程
  - [ ] 建立專案流程
  - [ ] 提交提案流程
- [ ] 所有 E2E 測試通過

### P4.14 測試

#### 功能測試
- [ ] 主題切換（4種顏色 x 2種模式）全部正常
- [ ] Toast 通知系統測試通過
- [ ] Loading/Error/Empty 狀態測試通過
- [ ] 表單驗證測試通過

#### 性能測試
- [ ] Lighthouse Performance Score ≥ 92
- [ ] Lighthouse Accessibility Score ≥ 95
- [ ] Bundle size 增加 < 10%

#### 可訪問性測試
- [ ] axe DevTools 無 violations
- [ ] WCAG 2.1 AA 完全符合
- [ ] WCAG 2.1 AAA 部分符合（目標）

### P4.15 文檔和合併

- [ ] PHASE-4-COMPLETION-REPORT.md 已建立
- [ ] PR 已建立
- [ ] Code review 完成
- [ ] PR 已批准和合併
- [ ] `phase-4-completed` tag 已建立

### Phase 4 總體驗收

**必須全部通過才能進入最終驗收:**

- [ ] 所有核心功能已實現
- [ ] 所有測試通過
- [ ] 性能指標達標
- [ ] 可訪問性達標
- [ ] Code review 批准

**Phase 4 驗收結果**: ☐ 通過 | ☐ 未通過
**驗收日期**: [待填]
**驗收人**: [待填]

---

## 最終驗收檢查清單

### 整體完整性

- [ ] 所有 Phase（1-4）已完成
- [ ] 所有階段的 tag 已建立
- [ ] 所有代碼已合併到 `feature/design-system-migration`

### 功能完整性

- [ ] 所有頁面功能正常（29/29）
- [ ] 所有 UI 組件可用（22+/22+）
- [ ] Azure AD B2C 認證正常
- [ ] tRPC API 調用正常
- [ ] 表單提交和驗證正常
- [ ] 導航和路由正常
- [ ] 主題切換正常（多種顏色 + light/dark）
- [ ] 通知系統正常

### 質量指標

#### 代碼質量
- [ ] TypeScript 類型覆蓋率 100%
- [ ] ESLint 無錯誤，警告 < 5 個
- [ ] 測試覆蓋率 ≥ 85%
- [ ] 無 console 錯誤
- [ ] 無 console 警告（除了合理的警告）

#### 性能指標

| 指標 | 目標值 | 實際值 | 狀態 |
|------|--------|--------|------|
| Lighthouse Performance | ≥ 90 | - | ☐ |
| Lighthouse Accessibility | ≥ 95 | - | ☐ |
| Lighthouse Best Practices | ≥ 90 | - | ☐ |
| Lighthouse SEO | ≥ 85 | - | ☐ |
| FCP (First Contentful Paint) | < 1.5s | - | ☐ |
| LCP (Largest Contentful Paint) | < 2.5s | - | ☐ |
| TBT (Total Blocking Time) | < 300ms | - | ☐ |
| CLS (Cumulative Layout Shift) | < 0.1 | - | ☐ |
| JavaScript Bundle (gzipped) | 增加 < 15% | - | ☐ |
| CSS Bundle (gzipped) | 增加 < 10% | - | ☐ |

#### 可訪問性指標

- [ ] WCAG 2.1 Level A: 100% 符合
- [ ] WCAG 2.1 Level AA: 100% 符合
- [ ] WCAG 2.1 Level AAA: ≥ 70% 符合（目標）
- [ ] 鍵盤導航: 所有互動元素可訪問
- [ ] Screen reader: NVDA/JAWS 測試通過
- [ ] 顏色對比度: 所有文字 ≥ 4.5:1
- [ ] Focus indicators: 清晰可見
- [ ] ARIA 屬性: 正確使用

### 跨瀏覽器兼容性

| 瀏覽器 | 版本 | 狀態 | 備註 |
|--------|------|------|------|
| Chrome | 最新 | ☐ | |
| Firefox | 最新 | ☐ | |
| Safari | 最新 | ☐ | |
| Edge | 最新 | ☐ | |
| Chrome Mobile | 最新 | ☐ | |
| Safari Mobile | 最新 | ☐ | |

### 響應式設計

| 斷點 | 解析度 | 狀態 | 備註 |
|------|---------|------|------|
| Mobile Small | 320px | ☐ | iPhone SE |
| Mobile | 375px | ☐ | iPhone 12/13 |
| Mobile Large | 414px | ☐ | iPhone 12 Pro Max |
| Tablet | 768px | ☐ | iPad |
| Laptop | 1024px | ☐ | iPad Pro |
| Desktop | 1440px | ☐ | MacBook Pro |
| Large Desktop | 1920px | ☐ | 標準顯示器 |
| Extra Large | 2560px | ☐ | 4K 顯示器 |

### 文檔完整性

- [ ] README 已更新
- [ ] CLAUDE.md 已更新（如有變更）
- [ ] 所有 Phase 完成報告已建立
- [ ] API 文檔已更新（如有變更）
- [ ] 組件文檔完整
- [ ] 設計 Token 文檔完整
- [ ] 遷移指南已建立

### 安全性檢查

- [ ] 無已知安全漏洞
- [ ] 依賴項已更新到安全版本
- [ ] 無 secrets 或敏感資訊洩露
- [ ] CSRF 保護正常
- [ ] XSS 防護正常
- [ ] 認證和授權正常

### 最終測試

#### 冒煙測試（Smoke Test）
- [ ] 用戶可以登入
- [ ] 用戶可以建立專案
- [ ] 用戶可以提交提案
- [ ] 用戶可以查看數據
- [ ] 用戶可以登出

#### 回歸測試（Regression Test）
- [ ] 所有現有功能仍然正常
- [ ] 無新引入的 bugs
- [ ] 性能無退化

#### 用戶驗收測試（UAT）
- [ ] 關鍵用戶已測試
- [ ] 用戶反饋已收集
- [ ] 重大問題已解決

### 部署準備

- [ ] 部署腳本已更新（如需要）
- [ ] 環境變數已配置
- [ ] Database migration 已準備（如需要）
- [ ] Rollback 計劃已建立
- [ ] 監控和告警已配置

---

## 驗收決策

### 最終驗收標準

**必須滿足所有以下條件:**

#### Critical (阻塞性) - 必須 100% 通過
- [ ] 所有 Phase 完成
- [ ] 所有功能正常
- [ ] 無 Critical bugs
- [ ] TypeScript 無錯誤
- [ ] 構建成功
- [ ] Azure AD B2C 認證正常

#### High (高優先級) - 必須 ≥ 95% 通過
- [ ] 測試覆蓋率 ≥ 85%
- [ ] Performance Score ≥ 90
- [ ] Accessibility Score ≥ 95
- [ ] 跨瀏覽器兼容（6/6）
- [ ] 響應式設計（8/8 斷點）

#### Medium (中優先級) - 必須 ≥ 90% 通過
- [ ] 文檔完整性
- [ ] Code review 批准
- [ ] 無 High severity bugs
- [ ] SEO Score ≥ 85

### 驗收決策矩陣

| 條件 | 通過率 | 狀態 | 備註 |
|------|--------|------|------|
| Critical 項目 | 100% | ☐ | |
| High 項目 | ≥ 95% | ☐ | |
| Medium 項目 | ≥ 90% | ☐ | |

### 最終決策

- **✅ APPROVED (批准)**: 所有條件滿足
- **⚠️ CONDITIONAL APPROVAL (有條件批准)**: Critical 100% + High ≥ 90% + 有明確的改進計劃
- **❌ REJECTED (拒絕)**: 未滿足基本條件

**決策結果**: [待填]
**決策日期**: [待填]
**決策人**: [待填]
**備註**: [待填]

---

## 後續行動

### 如果 APPROVED

**立即行動:**
1. [ ] 合併到 `develop` 分支
2. [ ] 建立 `design-system-migration-completed` tag
3. [ ] 部署到 Staging 環境
4. [ ] 進行 Staging 環境測試
5. [ ] 部署到 Production 環境（分批次）
6. [ ] 監控生產環境
7. [ ] 收集用戶反饋

**後續優化:**
1. [ ] 收集性能指標
2. [ ] 持續優化 Bundle size
3. [ ] 增強可訪問性到 AAA 級別
4. [ ] 建立組件庫 Storybook
5. [ ] 增加 E2E 測試覆蓋

### 如果 CONDITIONAL APPROVAL

**必須完成的改進:**
1. [列出必須改進的項目]
2. [設定改進時間表]
3. [指定負責人]

**改進完成後再次驗收。**

### 如果 REJECTED

**問題分析:**
1. [詳細分析未通過的原因]
2. [評估是否需要調整計劃]
3. [決定是回滾還是繼續修復]

**行動計劃:**
1. [制定修復計劃]
2. [重新測試]
3. [再次提交驗收]

---

## 附錄

### A. 測試工具和命令

```bash
# TypeScript 類型檢查
pnpm typecheck --filter=web

# ESLint 檢查
pnpm lint --filter=web

# 單元測試
pnpm test --filter=web --coverage

# E2E 測試
pnpm test:e2e --filter=web

# 構建測試
pnpm build --filter=web

# Lighthouse CI
pnpm lhci autorun --filter=web

# Bundle 分析
pnpm analyze --filter=web

# 可訪問性測試（axe）
pnpm axe http://localhost:3000 --filter=web
```

### B. 問題追蹤模板

| ID | 嚴重性 | 描述 | 階段 | 狀態 | 負責人 | 預計完成 |
|----|--------|------|------|------|--------|----------|
| 1 | Critical | [描述] | Phase X | Open | [姓名] | [日期] |
| 2 | High | [描述] | Phase Y | In Progress | [姓名] | [日期] |

### C. 驗收簽署

**項目經理**:
姓名: ____________
日期: ____________
簽名: ____________

**技術負責人**:
姓名: ____________
日期: ____________
簽名: ____________

**QA 負責人**:
姓名: ____________
日期: ____________
簽名: ____________

**產品負責人**:
姓名: ____________
日期: ____________
簽名: ____________

---

**文檔版本**: 1.0
**最後更新**: [待填]
**維護人**: [待填]
