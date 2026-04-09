# 安全審查報告 (Security Review)

> **審查日期**: 2026-04-09
> **審查範圍**: 認證/授權、輸入驗證、檔案上傳、敏感資料暴露、CSRF/XSS
> **嚴重程度等級**: Critical / High / Medium / Low

---

## 1. 認證漏洞 (Authentication Vulnerabilities)

### SEC-001: User Router 的 CRUD 操作使用 publicProcedure — 嚴重權限缺失

- **嚴重程度**: Critical
- **檔案**: `packages/api/src/routers/user.ts`
- **行號**: 第 93, 109, 146, 173, 194, 216, 269, 319, 357, 411 行
- **描述**: User Router 中幾乎所有 procedure（含 create、update、delete）都使用 `publicProcedure`，表示任何未認證的使用者都可以透過 tRPC API：
  - **建立使用者**（第 216 行）— 任何人可建立帳號並指定任意角色（含 Admin）
  - **更新使用者**（第 269 行）— 任何人可修改任何使用者的 email、姓名、角色
  - **刪除使用者**（第 319 行）— 任何人可刪除任何使用者
  - **取得所有使用者**（第 93 行）— 暴露所有使用者的資料（含 email）
  - **取得使用者詳情**（第 109 行）— 包含關聯的專案資訊
  - **取得角色列表**（第 357 行）— 暴露系統角色結構
  - **檢查密碼狀態**（第 411 行）— `hasPassword` 為 public，可枚舉哪些帳號有設定密碼
- **風險**: 未認證的攻擊者可以：(1) 建立 Admin 帳號取得完整系統存取權、(2) 竄改其他使用者資料、(3) 刪除使用者帳號、(4) 獲取使用者清單進行釣魚攻擊
- **建議**: 
  - `create`、`update`、`delete` 應改為 `adminProcedure`
  - `getAll`、`getById`、`getByRole`、`getManagers`、`getSupervisors` 應改為 `protectedProcedure`
  - `getRoles` 應改為 `protectedProcedure`
  - `hasPassword` 應改為 `protectedProcedure`

### SEC-002: Health Router 暴露大量公開的資料庫操作端點

- **嚴重程度**: Critical
- **檔案**: `packages/api/src/routers/health.ts`
- **行號**: 第 82, 229, 288, 380, 438, 513, 712, 805, 902, 1008, 1154, 1306, 1418, 1508, 1657, 1865, 1974, 2315 行
- **描述**: Health Router 包含 20+ 個 `publicProcedure`，其中多個是 mutation 操作，可直接執行：
  - `fixMigration`（第 82 行）— 建立/修改資料庫 table
  - `fixOmExpenseSchema`（第 438 行）— 修改 OMExpense table schema
  - `fixAllTables`（第 513 行）— 執行所有 table 修復
  - `fixAllSchemaIssues`（第 902 行）— 修復所有 schema 問題
  - `fixAllSchemaComplete`（第 1508 行）— 完整 schema 同步
  - `fixPermissionTables`（第 1657 行）— 建立/修改權限表
  - `fullSchemaSync`（第 1974 行）— 完整 schema 同步（含 DDL）
  - `debugUserPermissions`（第 2315 行）— 暴露使用者權限詳情
  - 多個 `diagXxx` 和 `schemaCompare` 查詢暴露資料庫結構資訊
- **風險**: 任何人可以遠端修改資料庫結構、查看完整 schema 資訊。這本質上是 Admin-only 的維運工具，但完全無認證保護。
- **建議**: 
  - 所有 `fix*` mutation 應改為 `adminProcedure`
  - 所有 `diag*` 和 `schemaCompare` 查詢至少改為 `protectedProcedure`
  - `ping` 和 `dbCheck` 可保持 `publicProcedure`（健康檢查用途）
  - 建議在生產環境完全停用這些端點

### SEC-003: 註冊 API 無速率限制

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/api/auth/register/route.ts`
- **行號**: 第 124 行
- **描述**: 註冊端點 `POST /api/auth/register` 無任何速率限制（rate limiting），攻擊者可以：
  - 批量建立帳號（帳號枚舉）
  - 對 email 進行暴力枚舉測試
  - 消耗資料庫資源（DoS）
- **驗證**: 在整個 codebase 中搜尋 `rateLimit`、`throttle`、`rate.limit` 等關鍵字均未找到任何結果（0 筆匹配）。
- **建議**: 加入 IP 基礎的速率限制（如 `upstash/ratelimit`），建議限制為每 IP 每分鐘 5 次請求

### SEC-004: 認證日誌包含敏感資訊

- **嚴重程度**: High
- **檔案**: `packages/auth/src/index.ts`
- **行號**: 第 86, 228, 249, 264, 281, 284, 296, 318, 332, 335, 341, 351 行
- **描述**: 認證模組包含 18+ 條 `console.log` 敏感日誌，包含：
  - 第 228 行：`console.log('Authorize 函數執行', { email: credentials?.email });` — 記錄登入 email
  - 第 249 行：`console.log('用戶存在', { userId: dbUser.id, hasPassword: !!dbUser.password });` — 暴露 userId 與密碼狀態
  - 第 264 行：`console.log('密碼正確，返回用戶對象', { userId: dbUser.id, email: dbUser.email, roleId: dbUser.roleId });` — 記錄完整認證資訊
  - 第 318-324 行：Azure AD 登入記錄包含完整 dbUser 查詢結果
  - 第 335 行：JWT callback 記錄 token 的 id 和 email
- **風險**: 在生產環境中，這些日誌會寫入 Azure App Service 日誌，任何有日誌存取權的人可看到所有認證活動詳情
- **建議**: 移除所有生產環境的 `console.log`，或改用 `debug` 模式的條件日誌（已有 `debug: process.env.NODE_ENV === 'development'` 但日誌卻不受此控制）

### SEC-005: 註冊端點的密碼強度要求較弱

- **嚴重程度**: Medium
- **檔案**: `apps/web/src/app/api/auth/register/route.ts`
- **行號**: 第 65 行
- **描述**: 註冊端點的密碼驗證僅要求 `z.string().min(8)`（最少 8 字元），而 User Router 的 `setPassword` 和 `changeOwnPassword` 使用 `validatePasswordStrength` 要求 12 字元 + 6 個大寫/數字/符號。兩個密碼建立路徑的強度要求不一致。
- **建議**: 在 `register/route.ts` 中也使用 `validatePasswordStrength` 進行驗證

---

## 2. 授權缺口 (Authorization Gaps)

### SEC-006: 檔案上傳 API 無認證檢查

- **嚴重程度**: Critical
- **檔案**: 
  - `apps/web/src/app/api/upload/quote/route.ts`
  - `apps/web/src/app/api/upload/invoice/route.ts`
  - `apps/web/src/app/api/upload/proposal/route.ts`
- **描述**: 三個檔案上傳端點都沒有認證檢查。搜尋 `getServerSession`、`getSession`、`auth()` 在 upload 目錄中均無結果（0 筆匹配）。任何人可以：
  - 上傳任意檔案到 Azure Blob Storage
  - 建立假的 Quote 記錄（quote/route.ts 第 205-222 行直接建立 Prisma 記錄）
  - 消耗儲存空間（雖有 10MB/20MB 大小限制）
- **建議**: 在每個 upload route 開頭加入認證檢查：
  ```typescript
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ```

### SEC-007: Admin Seed API 的 GET 端點無認證

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/api/admin/seed/route.ts`
- **行號**: 第 49-91 行
- **描述**: GET `/api/admin/seed` 端點完全無認證，會回傳系統的 Role 和 Currency 種子資料狀態。POST 端點有 Bearer token 驗證（使用 NEXTAUTH_SECRET），但 GET 端點可被任何人存取。
- **額外風險**: POST 端點的 fallback secret 是 `process.env.NEXTAUTH_SECRET`（第 104 行），表示知道 NEXTAUTH_SECRET 的人可以執行 seed 操作。
- **建議**: GET 端點也應加入 Bearer token 驗證

### SEC-008: 無資源所有權驗證

- **嚴重程度**: Medium
- **檔案**: 多個 Router 檔案
- **描述**: 即使使用 `protectedProcedure` 的端點，也沒有驗證「目前使用者是否有權操作該資源」。例如：
  - 使用者 A（ProjectManager）可以透過 API 編輯使用者 B 管理的專案
  - 任何已登入使用者可以修改不屬於自己的提案
  - 費用記錄的更新和刪除沒有驗證操作者是否為該費用的建立者
- **建議**: 在敏感操作中加入資源所有權檢查（如 `where: { id: input.id, managerId: ctx.session.user.id }`）

---

## 3. 輸入驗證 (Input Validation)

### SEC-009: 所有 tRPC Router 均使用 Zod 驗證 — 合格

- **嚴重程度**: Low (資訊性)
- **描述**: 檢查所有 17 個 Router 檔案，均使用 `z.object()` 進行輸入驗證。tRPC 的 `.input()` 機制確保未經驗證的輸入不會到達處理邏輯。

### SEC-010: Health Router 中大量 Raw SQL 查詢

- **嚴重程度**: Medium
- **檔案**: `packages/api/src/routers/health.ts`
- **描述**: Health Router 包含 60+ 次 `$executeRaw` 和 `$queryRaw` 呼叫。雖然使用 tagged template literals（防止 SQL injection），但這些操作直接修改資料庫結構（CREATE TABLE、ALTER TABLE、CREATE INDEX），如果結合 SEC-002 的公開存取問題，風險極大。
- **建議**: 確保這些端點在生產環境中被保護或停用

### SEC-011: 檔案上傳的路徑遍歷防護不足

- **嚴重程度**: Medium
- **檔案**: `apps/web/src/app/api/upload/quote/route.ts` 第 174 行
- **描述**: 檔案名稱使用 `file.name.split('.').pop()` 取得副檔名，然後用於建立 blob 名稱。雖然上傳到 Azure Blob Storage（不是本地檔案系統），路徑遍歷風險較低，但 `file.name` 來自客戶端輸入，未經過清理。如果 blob 名稱包含特殊字元，可能造成問題。
- **建議**: 對 `fileExtension` 進行白名單過濾，僅允許已知的副檔名

---

## 4. 敏感資料暴露 (Sensitive Data Exposure)

### SEC-012: User Router 的 getAll/getById 回傳包含密碼 hash

- **嚴重程度**: High
- **檔案**: `packages/api/src/routers/user.ts`
- **行號**: 第 94, 116 行
- **描述**: `getAll` 和 `getById` 使用 `findMany`/`findUnique` 搭配 `include: { role: true }` 但未使用 `select` 排除 `password` 欄位。Prisma 預設會回傳所有欄位，因此 API response 中包含 bcrypt 密碼 hash。
  - 第 94 行：`ctx.prisma.user.findMany({ include: { role: true } })` — 回傳所有使用者含密碼 hash
  - 第 116 行：`ctx.prisma.user.findUnique({ include: { role: true, projects: ..., approvals: ... } })` — 回傳單一使用者含密碼 hash
- **風險**: 結合 SEC-001（這些端點是 public 的），任何人可以取得所有使用者的密碼 hash
- **建議**: 使用 `select` 明確排除 `password` 欄位，或使用 Prisma 的 `omit` 功能

### SEC-013: 上傳 API 的 console.log 記錄 Blob URL

- **嚴重程度**: Low
- **檔案**: 
  - `apps/web/src/app/api/upload/invoice/route.ts` 第 132-145 行
  - `apps/web/src/app/api/upload/quote/route.ts` 第 180-193 行
  - `apps/web/src/app/api/upload/proposal/route.ts` 第 138-151 行
- **描述**: 所有上傳端點在成功後記錄 Blob URL 和容器名稱到 console.log。雖然不是直接的安全漏洞，但在生產環境中不應記錄儲存位置資訊。
- **建議**: 移除或改為 debug 級別的條件日誌

---

## 5. CSRF / XSS 防護

### SEC-014: tRPC 的 CSRF 防護 — 基本合格

- **嚴重程度**: Low (資訊性)
- **描述**: tRPC 透過 `fetchRequestHandler` 處理請求，使用 superjson 序列化。因為 tRPC 的 mutation 使用 POST 請求加上 custom content-type（application/json），現代瀏覽器的同源策略提供了基本的 CSRF 防護。NextAuth 也內建 CSRF token 機制。

### SEC-015: dangerouslySetInnerHTML 使用 — 低風險

- **嚴重程度**: Low
- **檔案**: `apps/web/src/app/[locale]/layout.tsx` 第 102-104 行
- **描述**: 使用 `dangerouslySetInnerHTML` 動態設定 `document.documentElement.lang` 屬性：
  ```typescript
  dangerouslySetInnerHTML={{
    __html: `document.documentElement.lang = "${locale}";`,
  }}
  ```
  `locale` 值來自路由參數，但在 middleware 中已被限制為 `['en', 'zh-TW']`（middleware.ts 第 120 行），因此 XSS 風險極低。
- **建議**: 可考慮改用 Next.js 原生的 `<html lang={locale}>` 方式替代

---

## 6. 其他安全問題

### SEC-016: 無全域速率限制

- **嚴重程度**: High
- **描述**: 整個應用沒有任何速率限制機制。搜尋 `rateLimit`、`throttle`、`rate_limit`、`rate.limit` 均無結果。攻擊者可以：
  - 暴力破解登入密碼
  - 大量呼叫 API 造成 DoS
  - 批量上傳檔案消耗儲存
- **建議**: 在 middleware 或 tRPC 中間件中加入速率限制

### SEC-017: bcrypt 和 bcryptjs 同時安裝

- **嚴重程度**: Low
- **檔案**: `apps/web/package.json` 第 55-56 行
- **描述**: 同時安裝了 `bcrypt`（native 模組）和 `bcryptjs`（純 JS 實現），以及它們的類型定義 `@types/bcrypt` 和 `@types/bcryptjs`。程式碼實際使用的是 `bcryptjs`（驗證: 搜尋 `from 'bcrypt'` 無結果，`from 'bcryptjs'` 有多處使用）。
- **建議**: 移除未使用的 `bcrypt` 和 `@types/bcrypt` 依賴

---

## 統計摘要

| 嚴重程度 | 數量 | 問題編號 |
|----------|------|----------|
| **Critical** | 3 | SEC-001, SEC-002, SEC-006 |
| **High** | 4 | SEC-003, SEC-004, SEC-007, SEC-012, SEC-016 |
| **Medium** | 3 | SEC-005, SEC-008, SEC-010, SEC-011 |
| **Low** | 4 | SEC-009, SEC-013, SEC-014, SEC-015, SEC-017 |
| **總計** | **17** | |

## 最高優先修復項目

1. **SEC-001**: 將 User Router 的 `publicProcedure` 改為適當的認證等級
2. **SEC-002**: 保護 Health Router 的所有 mutation 端點
3. **SEC-006**: 在所有檔案上傳 API 加入認證檢查
4. **SEC-012**: 排除 User 查詢中的 password 欄位
5. **SEC-004**: 移除生產環境的認證日誌
