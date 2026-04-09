# notification.ts - 通知系統 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/notification.ts` |
| 行數 | 380 行 |
| Procedure 總數 | 7 個 |
| 匯入的 middleware | `protectedProcedure` |
| 自 | Epic 8 - Notification System |
| 特殊匯入 | `emailService` from `../lib/email` |

---

## Procedures 清單

### 1. `getAll` (query) — 第 80~119 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `limit`: number, min(1), max(100), default(20)
  - `cursor`: string, optional（分頁游標，notification ID）
  - `isRead`: boolean, optional（undefined=全部）
- **回傳**: `{ notifications: Notification[], nextCursor?: string }`
- **業務邏輯**:
  - **游標分頁**（非 offset 分頁）
  - 只查詢當前用戶的通知（userId = session.user.id）
  - 多取一條判斷是否有下一頁
  - 按 createdAt desc 排序

### 2. `getById` (query) — 第 124~145 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: Notification
- **業務邏輯**: 使用 `findFirst` + userId 條件確保只能查詢自己的通知

### 3. `getUnreadCount` (query) — 第 150~161 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無
- **回傳**: `{ count: number }`
- **業務邏輯**: 計算當前用戶的未讀通知數量（用於 Badge 顯示）

### 4. `markAsRead` (mutation) — 第 166~194 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: 更新後的 Notification
- **業務邏輯**: 驗證通知屬於當前用戶後更新 isRead=true

### 5. `markAllAsRead` (mutation) — 第 199~213 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無
- **回傳**: `{ count: number }`（受影響的記錄數）
- **業務邏輯**: 使用 updateMany 批量更新當前用戶的所有未讀通知

### 6. `delete` (mutation) — 第 218~244 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: `{ success: true }`
- **業務邏輯**: 驗證通知屬於當前用戶後刪除

### 7. `create` (mutation) — 第 254~379 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `userId`: string.uuid()（接收者）
  - `type`: NotificationType（enum）
  - `title`: string, min(1)
  - `message`: string, min(1)
  - `link`: string, optional
  - `entityType`: EntityType, optional
  - `entityId`: string.uuid(), optional
  - `sendEmail`: boolean, default(true)
  - `emailData`: any, optional
- **回傳**: Notification
- **業務邏輯**:
  - 建立 notification 記錄（emailSent=false）
  - **郵件發送**（若 sendEmail=true 且有 emailData）:
    - 查詢接收者 email
    - 根據 type 調用對應 emailService 方法：
      - `PROPOSAL_SUBMITTED` -> `sendProposalSubmittedEmail`
      - `PROPOSAL_APPROVED/REJECTED/MORE_INFO` -> `sendProposalStatusEmail`
      - `EXPENSE_SUBMITTED` -> `sendExpenseSubmittedEmail`
      - `EXPENSE_APPROVED` -> `sendExpenseApprovedEmail`
    - 更新 emailSent=true（若發送成功）
    - **郵件失敗不阻斷通知建立**（try-catch 包裹）

---

## 匯出的 Zod Schemas

| Schema 名稱 | 用途 | 值 |
|---|---|---|
| `NotificationType` | 通知類型枚舉 | PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, PROPOSAL_REJECTED, PROPOSAL_MORE_INFO, EXPENSE_SUBMITTED, EXPENSE_APPROVED |
| `EntityType` | 實體類型枚舉 | PROPOSAL, EXPENSE, PROJECT |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Notification` | 讀/寫（完整 CRUD + 批量更新） |
| `User` | 讀取（查詢接收者 email） |

---

## 跨 Router 依賴

- 匯入 `emailService`（from `../lib/email`）
- create procedure 為「內部方法」，設計供其他 Router 調用
- **但實際上**: budgetProposal 和 expense Router 是直接在 transaction 中建立 Notification 記錄，**未透過此 Router 的 create**

---

## 特殊模式

- **游標分頁**: getAll 使用 cursor-based pagination（非 offset-based），適合大量通知的滾動載入
- **所有權檢查**: getById, markAsRead, delete 都驗證 userId 確保只能操作自己的通知
- **郵件整合**: create 自動觸發郵件發送（可選）
- **郵件失敗容忍**: 郵件發送失敗不影響通知建立（catch 後只 console.error）
- **emailData 類型**: 使用 `z.any()` 接收郵件數據（無嚴格類型檢查）
- **注意**: getById 和 delete 使用 `throw new Error` 而非 `TRPCError`
- **6 種通知類型**: 涵蓋提案和費用的主要狀態變更
