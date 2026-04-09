# permission Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/permission.ts`
> **行數**: 451 行
> **模組**: `api/routers/permission`
> **功能**: 菜單權限與用戶權限管理 (FEAT-011)

---

## 概述

實現 FEAT-011 的權限管理系統，支援角色預設權限 + 用戶覆蓋機制。權限繼承邏輯：角色預設 -> 用戶覆蓋（granted=true 新增, granted=false 撤銷）。

---

## Procedures 清單（共 7 個）

### 1. `getAllPermissions` (query) — 行 58
- **權限**: protectedProcedure
- **Input** (可選):
  - `category`: PermissionCategoryEnum (`'menu' | 'project' | 'proposal' | 'expense' | 'system'`)
  - `isActive`: boolean
- **回傳**: Permission[]（按 category + sortOrder 排序）

### 2. `getMyPermissions` (query) — 行 85
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ permissions: Array<{code, name, category}>, permissionCodes: string[] }`
- **關鍵業務邏輯**: 讀取角色預設權限 (RolePermission) -> 讀取用戶自訂權限 (UserPermission) -> 合併計算（granted=true 新增，granted=false 撤銷）-> 只返回 isActive 的權限

### 3. `getUserPermissions` (query) — 行 143
- **權限**: adminProcedure
- **Input**: `{ userId: string }`
- **回傳**: `{ user: {id, name, email, role}, permissions: Array<{...permission, isRoleDefault, userOverride, isGranted}> }`
- **關鍵業務邏輯**: 返回所有啟用權限的完整狀態（角色預設 + 用戶覆蓋 + 計算後的有效狀態）

### 4. `setUserPermission` (mutation) — 行 212
- **權限**: adminProcedure
- **Input**: `{ userId: string, permissionId: string, granted: boolean }`
- **回傳**: `{ success: true }`
- **關鍵業務邏輯**: 如果用戶設定等於角色預設，刪除覆蓋記錄（恢復角色預設）；否則 upsert 覆蓋記錄

### 5. `setUserPermissions` (mutation) — 行 297
- **權限**: adminProcedure
- **Input**: `{ userId: string, permissions: Array<{permissionId: string, granted: boolean}> }`
- **回傳**: `{ success: true, updatedCount: number }`
- **關鍵業務邏輯**: 使用 transaction 先刪除所有自訂權限，再只建立與角色預設不同的覆蓋記錄

### 6. `getRolePermissions` (query) — 行 366
- **權限**: adminProcedure
- **Input**: `{ roleId?: number }`
- **回傳**: 指定角色的權限列表，或所有角色的權限配置
- **關鍵業務邏輯**: roleId 指定時返回該角色權限；否則返回所有角色的權限

### 7. `hasPermission` (query) — 行 408
- **權限**: protectedProcedure
- **Input**: `{ code: string }`
- **回傳**: `{ hasPermission: boolean }`
- **關鍵業務邏輯**: 檢查權限是否存在且 isActive -> 檢查角色預設 -> 應用用戶覆蓋 -> 返回計算結果

---

## 匯出的 Zod Schemas

- `PermissionCategoryEnum`: `z.enum(['menu', 'project', 'proposal', 'expense', 'system'])`

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Permission` | 讀取 |
| `RolePermission` | 讀取 |
| `UserPermission` | CRUD |
| `User` | 讀取（驗證） |
| `Role` | 讀取（含 defaultPermissions） |

---

## 跨 Router 依賴

- 無直接呼叫其他 Router
- 使用 `../trpc` 的 `createTRPCRouter`, `protectedProcedure`, `adminProcedure`

---

## 顯著模式

- **角色-用戶二級權限**: 角色預設 + 用戶覆蓋（只儲存差異）
- **智慧儲存**: setUserPermission 會在用戶設定等於角色預設時自動刪除覆蓋記錄
- **Admin 限定**: 所有寫入操作和用戶權限查詢都需要 Admin 權限
- **批量操作**: setUserPermissions 使用 transaction 整批替換
