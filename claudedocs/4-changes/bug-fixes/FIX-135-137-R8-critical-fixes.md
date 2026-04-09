# FIX-135 ~ FIX-137: R8 Critical Fixes

> **建立日期**: 2026-04-09
> **來源**: R8 Codebase 覆蓋審計
> **優先級**: 🔴 Critical — 立即修復

---

## FIX-135: 移除根目錄 middleware.ts (雙 middleware 衝突)

### 問題
- `apps/web/middleware.ts` (18 行) — 僅 i18n，**無 auth 保護**
- `apps/web/src/middleware.ts` (222 行) — 完整 auth + i18n 保護
- Next.js 優先解析根目錄的 middleware.ts
- **結果**: 所有 FIX-108 的路由保護修復以及原有的認證保護可能完全失效

### 修復方式
1. 刪除 `apps/web/middleware.ts`（根目錄的簡化版）
2. 確認 `apps/web/src/middleware.ts` 包含所有必要功能
3. 驗證 Next.js 正確解析 src/ 下的 middleware

### 風險
- 如果 Next.js 配置需要根目錄 middleware，可能需要將 src/ 版本移到根目錄
- 需確認 next.config.mjs 的 rootDir 設定

---

## FIX-136: packages/auth/ Dead Package 清理

### 問題
- `packages/auth/src/index.ts` 包含完整 NextAuth v4 配置但未被實際使用
- `apps/web/src/auth.ts` 使用 NextAuth v5 風格配置
- `packages/auth` 被 trpc.ts 和 API routes 引用，但可能僅用於 TypeScript type augmentations
- 維護混亂：兩套近似的 auth 配置

### 修復方式
1. 確認 packages/auth 的實際導入用途（type augmentation vs runtime）
2. 如果僅用於 types，保留 types 但移除 runtime config
3. 如果有 runtime 依賴，標記為 deprecated 並添加註釋

### 風險
- 刪除可能破壞 TypeScript 編譯
- 需先驗證所有 import 的實際用途

---

## FIX-137: Azure Blob Storage 容器改為 Private Access

### 問題
- `apps/web/src/lib/azure-storage.ts` 第 160 行
- 容器建立時使用 `access: "blob"`（公開讀取）
- 上傳的發票、報價、提案文件可被任何知道 URL 的人存取
- 含敏感商業文件

### 修復方式
1. 將 `access: "blob"` 改為 `access: undefined`（private，需認證才能存取）
2. 修改下載邏輯使用 SAS Token 或後端代理下載
3. 如果前端直接使用 blob URL 顯示檔案，需改為透過 API 代理

### 風險
- 現有已上傳的檔案 URL 可能在前端被直接引用
- 改為 private 後需要提供替代的檔案存取方式

---

## FIX-137 Resolution

> **修復日期**: 2026-04-09
> **狀態**: ✅ 已完成

### 根本原因
`apps/web/src/lib/azure-storage.ts` 第 159 行的 `getContainerClient` 函數在建立新容器時使用 `access: "blob"`，允許匿名公開讀取。任何取得 blob URL 的人都可以無需認證直接存取上傳的商業文件（發票、報價、提案）。

### 影響分析
經程式碼審查，以下 2 處前端頁面直接使用 blob URL 作為 `<a href>` 超連結：
1. `apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx` — 報價單文件連結
2. `apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx` — 報價單文件連結

其他引用（expenses 頁面、quotes 編輯頁面）僅顯示檔案名稱文字，未建立可點擊的連結。

另外，`azure-storage.ts` 已包含 `generateSasUrl()` 函數，但從未在任何地方被呼叫。

### 修復內容

#### 1. 容器存取權限修正
- **檔案**: `apps/web/src/lib/azure-storage.ts`
- **變更**: 移除 `containerClient.create({ access: "blob" })`，改為 `containerClient.create()`（預設 private）
- **效果**: 新建立的容器不再允許匿名讀取

#### 2. 新增安全文件下載 API
- **新增檔案**: `apps/web/src/app/api/download/route.ts`
- **功能**: 接收 `?url={blobUrl}` 參數，驗證用戶 session 後，使用 `generateSasUrl()` 生成 15 分鐘有效期的 SAS URL，並重定向至該 URL
- **安全機制**:
  - 需要有效的 NextAuth session
  - 驗證 URL 屬於已知的 blob container
  - SAS Token 僅授予唯讀權限，15 分鐘後過期

#### 3. 前端連結更新
- **`apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx`**: `href` 從直接 blob URL 改為 `/api/download?url=${encodeURIComponent(filePath)}`
- **`apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx`**: 同上

### 注意事項
- **已存在的容器**: 此修復僅影響新建立的容器。已存在的容器需手動在 Azure Portal 將存取層級改為 Private
- **資料庫 URL**: 資料庫中存儲的 blob URL 保持不變（用於伺服器端 SAS Token 生成）
- **本地開發**: Azurite 不支援 SAS Token，`generateSasUrl` 會直接返回原始 URL（開發環境行為不變）

### 修改的檔案
1. `apps/web/src/lib/azure-storage.ts` — 容器建立改為 private，更新註釋
2. `apps/web/src/app/api/download/route.ts` — 新增安全文件下載代理 API
3. `apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx` — 連結改用 download API
4. `apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx` — 連結改用 download API
5. `claudedocs/4-changes/bug-fixes/FIX-135-137-R8-critical-fixes.md` — 本文件

### 測試驗證
- [ ] 上傳新文件後，直接存取 blob URL 應返回 403/404
- [ ] 透過 `/api/download?url=...` 可正常下載文件
- [ ] 未登入用戶存取 `/api/download` 應返回 401
- [ ] SAS URL 過期後無法再存取
- [ ] 本地 Azurite 開發環境功能正常

---

## FIX-136 Resolution

> **修復日期**: 2026-04-09
> **狀態**: ✅ 已完成

### 調查結果

**packages/auth 的實際用途分析：**

1. **唯一的實際 import**：`packages/api/src/trpc.ts:62` — `import '@itpm/auth';`
   - 這是一個 side-effect import，目的是載入 `declare module 'next-auth'` 和 `declare module 'next-auth/jwt'` 的 TypeScript 類型擴展
   - 這些類型擴展為 Session.user 添加了 `role` 和 `roleId` 欄位
   - API 層的 RBAC 中間件（supervisorProcedure、adminProcedure）依賴 `ctx.session.user.role.name`
   - API 層的 routers（budgetProposal、dashboard、permission、project 等）也使用這些類型

2. **沒有任何 runtime 使用**：
   - `authOptions` export — 僅被 `scripts/test-nextauth-direct.ts` 測試腳本引用，非應用程式碼
   - `hashPassword` / `verifyPassword` — 從未被任何檔案 import（apps/web/src/auth.ts 有自己的副本）
   - NextAuth providers / callbacks — 完全是 dead code（實際配置在 apps/web/src/auth.ts）

3. **所有 runtime auth 呼叫** 使用 `import { auth } from '@/auth'`（本地 auth.ts），不使用 `@itpm/auth`

4. **apps/web/src/auth.ts** 也有自己的 `declare module 'next-auth'` 和 `declare module '@auth/core/jwt'` 類型擴展，但 packages/api 的 tsconfig 無法看到這些（因為它只 include 自己的 src/ 目錄）

### 根本原因

在 NextAuth v4 → v5 遷移過程中，auth 邏輯從 `packages/auth/src/index.ts`（v4 風格）遷移到了 `apps/web/src/auth.ts`（v5 風格），但舊的 package 未被清理。它保留了超過 400 行的 dead runtime code（v4 authOptions、providers、bcrypt 邏輯等），同時也保留了 API 層所依賴的 TypeScript 類型擴展。

### 修復內容

#### 1. 精簡 packages/auth/src/index.ts
- **移除**：所有 runtime code（~350 行）
  - `authOptions` export（完整 NextAuth v4 配置）
  - Azure AD Provider 配置
  - Credentials Provider 配置（含 Prisma 查詢和 bcrypt 密碼驗證）
  - JWT 和 Session callbacks
  - `hashPassword()` 和 `verifyPassword()` 工具函數
  - `console.log('... NextAuth 配置文件正在載入...')` side effect
  - 所有 runtime imports（next-auth providers、@itpm/db prisma、bcryptjs）
- **保留**：TypeScript 類型擴展（~40 行）
  - `declare module 'next-auth'` — Session 和 User 類型（含 role、roleId）
  - `declare module 'next-auth/jwt'` — JWT 類型（含 role、roleId）
- **新增**：清晰的檔案頭注釋說明此 package 的唯一目的和歷史

#### 2. 精簡 packages/auth/package.json
- **移除的 dependencies**：
  - `@auth/prisma-adapter` — 從未被使用（即使在舊 code 中也被注釋掉）
  - `@itpm/db` — Prisma 不再需要
  - `bcryptjs` — 密碼工具已移除
- **保留的 dependencies**：
  - `next-auth` — TypeScript 類型擴展的 `declare module` 需要此 module 存在
- **移除的 devDependencies**：
  - `@types/bcryptjs` — bcryptjs 已移除

#### 3. 更新 packages/api/src/trpc.ts 注釋
- 將 import 注釋更新為更準確的描述

### 驗證結果

1. **`@itpm/auth` typecheck**: ✅ 通過（零錯誤）
2. **`@itpm/api` typecheck**: ✅ 無新增錯誤（所有錯誤均為 pre-existing，與 auth 無關）
   - pre-existing 錯誤在 schemaDefinition.ts、omExpense.ts、project.ts 中
   - 無任何 session/role/auth 相關的類型錯誤
3. **Session 類型推斷**: ✅ `ctx.session.user.role.name` 和 `ctx.session.user.role.id` 正常工作

### 修改的檔案

1. `packages/auth/src/index.ts` — 從 437 行精簡至 ~85 行（僅保留類型擴展）
2. `packages/auth/package.json` — 移除不再需要的 runtime dependencies
3. `packages/api/src/trpc.ts` — 更新 import 注釋
4. `claudedocs/4-changes/bug-fixes/FIX-135-137-R8-critical-fixes.md` — 本文件

### 未來建議

- 可考慮將 `@itpm/auth` 從 `apps/web/package.json` 的 dependencies 中移除（web app 不直接 import 它）
- 長期可將類型擴展直接放入 `packages/api/src/` 中的 `.d.ts` 檔案，完全移除 auth package
- 但這些都是低優先級的清理工作，當前修復已消除了維護混亂的根源
