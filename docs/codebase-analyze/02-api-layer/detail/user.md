# user Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/user.ts`
> **行數**: 520 行
> **模組**: `api/routers/user`
> **功能**: 用戶管理 + 密碼設定 + 認證資訊查詢

---

## 概述

管理用戶 CRUD、角色查詢、密碼管理（CHANGE-032）和自助密碼變更（CHANGE-041）。

> **FIX-101 已修復**: 所有 procedure 已改為適當權限級別 — 查詢使用 protectedProcedure，CUD + setPassword 使用 adminProcedure。

---

## Procedures 清單（共 13 個）

### 1. `getAll` (query) — 行 93
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: 無
- **回傳**: User[]（含 role，按 createdAt desc 排序）

### 2. `getById` (query) — 行 109
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: `{ id: string (uuid) }`
- **回傳**: User（含 role, projects.budgetPool, approvals.budgetPool）

### 3. `getByRole` (query) — 行 146
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: `{ roleName: enum('ProjectManager', 'Supervisor', 'Admin') }`
- **回傳**: User[]（含 role，按 name asc 排序）

### 4. `getManagers` (query) — 行 173
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: 無
- **回傳**: User[]（ProjectManager 角色）

### 5. `getSupervisors` (query) — 行 194
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: 無
- **回傳**: User[]（Supervisor 角色）

### 6. `create` (mutation) — 行 216
- **權限**: adminProcedure _(FIX-101: 原 publicProcedure)_
- **Input Schema** (`userCreateInputSchema`):
  - `email`: string (email 格式)
  - `name`: string (可選)
  - `roleId`: number (正整數)
  - `password`: string (可選)
- **回傳**: User（含 role）
- **關鍵業務邏輯**: 檢查 email 唯一性；驗證 roleId 存在；可選密碼驗證強度 + bcrypt hash (12 rounds)

### 7. `update` (mutation) — 行 269
- **權限**: adminProcedure _(FIX-101: 原 publicProcedure)_
- **Input Schema** (`userUpdateInputSchema`):
  - `id`: string (uuid)
  - `email`, `name`, `roleId` (皆可選)
- **回傳**: User（含 role）
- **關鍵業務邏輯**: 更新 email 時檢查與其他用戶重複；更新 roleId 時驗證存在

### 8. `delete` (mutation) — 行 319
- **權限**: adminProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: `{ id: string (uuid) }`
- **回傳**: `{ success: true }`
- **關鍵業務邏輯**: 檢查 projects（作為 manager）和 approvals（作為 supervisor）關聯

### 9. `getRoles` (query) — 行 357
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: 無
- **回傳**: Role[]（按 id asc 排序）

### 10. `setPassword` (mutation) — 行 374
- **權限**: adminProcedure
- **Input Schema** (`setPasswordInputSchema`):
  - `userId`: string (uuid)
  - `password`: string
- **回傳**: `{ success, message }`
- **關鍵業務邏輯** (CHANGE-032): 驗證用戶存在；使用 `validatePasswordStrength` 驗證密碼強度；bcrypt hash (12 rounds)

### 11. `hasPassword` (query) — 行 411
- **權限**: protectedProcedure _(FIX-101: 原 publicProcedure)_
- **Input**: `{ userId: string (uuid) }`
- **回傳**: `{ hasPassword: boolean }`

### 12. `changeOwnPassword` (mutation) — 行 438
- **權限**: protectedProcedure
- **Input**: `{ currentPassword?: string, newPassword: string, confirmPassword: string }`
- **回傳**: `{ success, isFirstTimeSet }`
- **關鍵業務邏輯** (CHANGE-041): SSO 用戶首次設定不需舊密碼；已有密碼需驗證舊密碼（bcrypt.compare）；新舊密碼一致性檢查；密碼強度驗證

### 13. `getOwnAuthInfo` (query) — 行 503
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ hasPassword: boolean }`

---

## 匯出的 Zod Schemas

| Schema | 用途 |
|--------|------|
| `userCreateInputSchema` | 建立用戶 |
| `userUpdateInputSchema` | 更新用戶 |
| `setPasswordInputSchema` | 設定密碼 |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `User` | CRUD + 密碼管理 |
| `Role` | 讀取 |
| `Project` | 讀取（刪除保護檢查） |

---

## 跨 Router 依賴

- `../lib/passwordValidation` 的 `validatePasswordStrength`
- `bcryptjs` 庫（密碼 hash + compare）

---

## 顯著模式

- **✅ FIX-101 權限修復完成**: 查詢操作 (getAll, getById, getByRole, getManagers, getSupervisors, getRoles, hasPassword) 改為 protectedProcedure；CUD 操作 (create, update, delete) + setPassword 改為 adminProcedure
- **雙重認證支援**: SSO 用戶首次設定密碼 vs 已有密碼用戶變更（CHANGE-041）
- **密碼安全**: bcrypt 12 rounds + `validatePasswordStrength` (12 字元 + 6 特殊字元)
- **級聯刪除保護**: 有 project 關聯時拒絕刪除
