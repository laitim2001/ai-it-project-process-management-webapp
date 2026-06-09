# FIX-143: 審批步驟缺角色時前端防護（avoid null role crash）

> **編號註記**: 原暫配 FIX-142，因 FIX-142 已被既有分支 `fix/142-session-expiry-auto-redirect`（session 過期偵測）佔用，改配 FIX-143。
> **建立日期**: 2026-06-09
> **完成日期**: 2026-06-09
> **狀態**: ✅ 已完成
> **優先級**: Low
> **類型**: Bug 修復（防禦性）
> **相關**: FEAT-014（可配置序列審批流程 Phase 1）

## 問題描述

審批步驟清單組件 `ApprovalStepList` 直接讀取 `step.role.name` 來顯示角色 Badge。前端型別 `ApprovalStepData.role` 宣告為必填 `ApprovalRole`，但實務上該關聯可能因資料漂移 / 角色被刪除而取到 `null`。一旦 `role` 為 null，渲染步驟清單就會 `Cannot read properties of null (reading 'name')` 而崩潰。

## 重現步驟

1. 存在一個審批流程，其某步驟對應的角色資料缺失（`role` 關聯為 null）。
2. 進入該流程的設定 / 步驟清單畫面。
3. 渲染到該步驟時，前端嘗試讀 `step.role.name` → 運行期崩潰（白畫面 / error boundary）。

> 註：在 schema 完整、FK 正常的情況下不會發生；本修復為**防禦性**，避免資料異常時整個畫面崩掉。

## 根本原因

- 前端型別 `ApprovalStepData.role: ApprovalRole`（必填）與「實務上可能為 null」不符。
- UI 直接 `step.role.name`，無 null 防護。

## 解決方案

1. **型別放寬**：`ApprovalStepData.role` 改為 `ApprovalRole | null`，並加註說明（理論必填、實務可能因資料漂移為 null，前端需防護）。
2. **UI 防護**：Badge 顯示改為 `step.role?.name ?? t('steps.unknownRole')`；缺角色時 Badge variant 改為 `destructive`，提供視覺警示。
3. **i18n**：新增 `approvalWorkflows.steps.unknownRole`（zh-TW：「未知角色（資料異常）」/ en：「Unknown role (data error)」）。

## 修改的檔案

- `apps/web/src/components/approval-workflow/types.ts` — `role` 型別放寬為可空
- `apps/web/src/components/approval-workflow/ApprovalStepList.tsx` — Badge null 防護 + destructive 視覺
- `apps/web/src/messages/zh-TW.json` — 新增 `approvalWorkflows.steps.unknownRole`
- `apps/web/src/messages/en.json` — 同上（英文）

## 測試驗證

- [x] `pnpm validate:i18n` 通過（雙語 key 一致）
- [x] `pnpm typecheck` 全綠（`role` 改可空後，全 codebase 無未防護的 `.role.name` 殘留）
- [x] i18n key `approvalWorkflows.steps.unknownRole` 與組件 `useTranslations('approvalWorkflows')` + `t('steps.unknownRole')` namespace 對齊（runtime 不會 IntlError）
