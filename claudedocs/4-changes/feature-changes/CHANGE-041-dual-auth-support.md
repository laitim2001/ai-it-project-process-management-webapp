# CHANGE-041: 雙認證方式支援 (Dual Authentication Support)

> **建立日期**: 2026-01-27
> **完成日期**: 2026-01-27
> **狀態**: ✅ 已完成
> **優先級**: High
> **類型**: 現有功能增強 (Enhancement)
> **前置依賴**: CHANGE-032 (用戶密碼管理功能)

---

## 1. 變更概述

### 1.1 背景
目前系統的認證方式存在限制：
- SSO 使用者（Azure AD B2C）的 `password` 欄位為 `null`，無法使用 email/password 登入
- 使用者無法自助管理密碼（只有 Admin 可透過 `user.setPassword` 設定）
- Settings 頁面的安全設定區塊全部 disabled，無法使用

### 1.2 目標
讓單一使用者帳號可以同時使用 **Azure AD SSO** 和 **本機密碼** 兩種方式登入：
- SSO 使用者可在 Settings 頁面自助設定本機密碼
- 已有密碼的使用者可自助變更密碼（需驗證舊密碼）
- Settings Security Tab 顯示認證方式狀態和密碼管理功能

### 1.3 現狀 vs 期望

| 場景 | 目前行為 | 期望行為 |
|------|---------|---------|
| SSO 使用者想用密碼登入 | `password=null`，無法登入 | 可在 Settings 自助設定密碼 |
| 本地使用者用 Azure AD 登入 | upsert 保留 password，兩種都可用 | 維持現狀 |
| 使用者自行變更密碼 | 只有 Admin 可設定密碼 | 自助變更（需驗證舊密碼） |
| Settings 安全設定頁 | 所有按鈕 disabled | 啟用密碼管理 + 認證方式顯示 |

---

## 2. 功能需求

### 2.1 自助密碼管理

#### 2.1.1 設定密碼（SSO 使用者首次）
- SSO 使用者開啟 Settings → Security Tab
- 看到「本機密碼：未設定」狀態
- 點擊「設定密碼」按鈕 → 開啟 Dialog
- 輸入新密碼 + 確認密碼（不需要舊密碼）
- 密碼強度驗證（12 字元 + 6 特殊字符）
- 設定成功後可用 email/password 登入

#### 2.1.2 變更密碼（已有密碼）
- 已有密碼的使用者開啟 Settings → Security Tab
- 看到「本機密碼：已設定」狀態
- 點擊「變更密碼」按鈕 → 開啟 Dialog
- 輸入舊密碼 + 新密碼 + 確認密碼
- 驗證舊密碼正確 → 更新為新密碼

#### 2.1.3 認證方式顯示
- 顯示 Azure AD SSO 狀態（根據環境配置）
- 顯示本機密碼狀態（已設定/未設定）
- 雙認證說明文字

### 2.2 安全設計
| 安全措施 | 說明 |
|----------|------|
| `protectedProcedure` | 必須登入才能操作 |
| 舊密碼驗證 | 已有密碼時必須驗證（防止 session 盜用） |
| SSO 免舊密碼 | 使用者已通過 SSO 認證，可直接設定 |
| bcrypt hash | 密碼使用 bcrypt (rounds: 12) 加密 |
| 密碼強度 | 12 字元 + 6 個大寫/數字/符號 |

---

## 3. 技術設計

### 3.1 後端 API 變更

**檔案**: `packages/api/src/routers/user.ts`

#### 3.1.1 新增 `changeOwnPassword` procedure
```typescript
changeOwnPassword: protectedProcedure
  .input(z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. 取得當前使用者（ctx.session.user.id）
    // 2. 查詢 user.password
    // 3. 有密碼 → 必須驗證 currentPassword
    // 4. 無密碼 → 跳過驗證（SSO 首次設定）
    // 5. 驗證 newPassword === confirmPassword
    // 6. 驗證密碼強度
    // 7. bcrypt.hash + prisma.user.update
    // 8. 返回 { success, isFirstTimeSet }
  })
```

#### 3.1.2 新增 `getOwnAuthInfo` procedure
```typescript
getOwnAuthInfo: protectedProcedure
  .query(async ({ ctx }) => {
    // 返回 { hasPassword, authMethods }
  })
```

### 3.2 前端組件

| 組件 | 路徑 | 說明 |
|------|------|------|
| `PasswordChangeDialog` | `components/settings/PasswordChangeDialog.tsx` | 密碼設定/變更 Dialog |
| `AuthMethodsCard` | `components/settings/AuthMethodsCard.tsx` | 認證方式狀態 Card |

### 3.3 翻譯鍵

在 `settings.security` 下新增約 25 個翻譯鍵，涵蓋：
- `authMethods.*` — 認證方式相關
- `passwordManagement.*` — 密碼管理相關
- `passwordDialog.*` — Dialog 相關

---

## 4. 影響範圍

### 4.1 修改文件清單

| 文件 | 變更類型 | 說明 |
|------|----------|------|
| `packages/api/src/routers/user.ts` | 修改 | 新增 `changeOwnPassword` + `getOwnAuthInfo` |
| `apps/web/src/components/settings/PasswordChangeDialog.tsx` | **新增** | 密碼設定/變更 Dialog |
| `apps/web/src/components/settings/AuthMethodsCard.tsx` | **新增** | 認證方式狀態 Card |
| `apps/web/src/app/[locale]/settings/page.tsx` | 修改 | 啟用 Security Tab |
| `apps/web/src/messages/en.json` | 修改 | 新增 ~25 個翻譯鍵 |
| `apps/web/src/messages/zh-TW.json` | 修改 | 新增對應中文翻譯 |

### 4.2 不需修改

| 文件 | 原因 |
|------|------|
| `apps/web/src/auth.ts` | JWT callback upsert 已正確保留 password |
| `packages/auth/src/index.ts` | 認證邏輯無需變更 |
| `schema.prisma` | 不需要新增 model 或欄位 |
| `packages/api/src/root.ts` | 不需註冊新 router |

### 4.3 重用基礎設施

| 現有組件/工具 | 用途 |
|--------------|------|
| `passwordValidation.ts` | 密碼強度驗證 |
| `password-input.tsx` | 密碼輸入組件 |
| `password-strength-indicator.tsx` | 密碼強度指示器 |
| `user.setPassword` | Admin 設定密碼（不受影響） |
| `user.hasPassword` | 檢查密碼狀態 |

---

## 5. 驗收標準

### 5.1 功能驗收
- [ ] SSO 使用者開啟 Settings Security → 看到「未設定」+ 「設定密碼」按鈕
- [ ] SSO 使用者設定密碼 → 不需舊密碼，成功後狀態變「已設定」
- [ ] 設定密碼後用 email/password 登入 → 成功
- [ ] 設定密碼後用 Azure AD 登入 → 仍然成功
- [ ] 已有密碼的使用者變更密碼 → 需要輸入舊密碼
- [ ] 輸入錯誤舊密碼 → 顯示錯誤
- [ ] 新密碼不符合強度 → PasswordStrengthIndicator 顯示，提交失敗
- [ ] 兩次新密碼不一致 → 顯示錯誤
- [ ] i18n 切換 en/zh-TW → 所有文字正確切換
- [ ] Admin `setPassword` 功能 → 不受影響

### 5.2 安全驗收
- [ ] API 使用 `protectedProcedure`（必須登入）
- [ ] 有密碼時必須驗證舊密碼
- [ ] 密碼使用 bcrypt hash (rounds: 12)
- [ ] 前端不顯示現有密碼

### 5.3 驗證命令
```bash
pnpm validate:i18n    # i18n 一致性
pnpm typecheck        # TypeScript 類型檢查
pnpm lint             # ESLint 檢查
```

---

## 6. 實施計劃

### Phase 1: 後端 API
1. 新增 `changeOwnPassword` procedure
2. 新增 `getOwnAuthInfo` procedure
3. 更新 JSDoc

### Phase 2: i18n 翻譯
1. 更新 `en.json` — 新增 settings.security 翻譯鍵
2. 更新 `zh-TW.json` — 新增對應中文翻譯
3. 執行 `pnpm validate:i18n`

### Phase 3: 前端組件
1. 建立 `components/settings/` 目錄
2. 新增 `PasswordChangeDialog.tsx`
3. 新增 `AuthMethodsCard.tsx`
4. 修改 Settings Security Tab

### Phase 4: 測試驗證
1. TypeScript 類型檢查
2. ESLint 檢查
3. 功能流程測試

---

## 7. 相關文檔

- **前置功能**: CHANGE-032 用戶密碼管理
- **密碼驗證**: `packages/api/src/lib/passwordValidation.ts`
- **密碼組件**: `apps/web/src/components/ui/password-input.tsx`
- **強度指示器**: `apps/web/src/components/ui/password-strength-indicator.tsx`
- **User Router**: `packages/api/src/routers/user.ts`
- **Settings Page**: `apps/web/src/app/[locale]/settings/page.tsx`
