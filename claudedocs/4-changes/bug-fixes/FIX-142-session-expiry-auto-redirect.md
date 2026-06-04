# FIX-142: Session 過期後頁面停在原地、不自動導向登入頁

> **狀態**: ✅ 已完成（靜態驗證 + 瀏覽器 E2E 測試 1~4 全部通過）
> **類型**: FIX（認證 / UX）
> **建立日期**: 2026-06-04
> **影響層級**: 前端認證體驗（無資料庫 / API 變更）

---

## 問題描述

使用者登入後若將頁面**閒置一段時間**（JWT 超過 24 小時 `maxAge`），session 已過期，但：

- 頁面仍**停在原地**，不會 redirect 回登入頁。
- 後續任何受保護的 tRPC 查詢都回 `UNAUTHORIZED`，但畫面只會在個別區塊顯示錯誤或空白，使用者**不知道自己已被登出**。
- 使用者可能持續點擊操作但全部失敗，體驗困惑。

## 重現步驟

1. 登入系統，停留在任一受保護頁面（如 `/zh-TW/dashboard`）。
2. 不操作、不換頁，等待 JWT 過期（或手動清除/使 `next-auth.session-token` cookie 失效模擬過期）。
3. 過期後在原頁點擊任一觸發查詢的操作。
4. **預期**：被導向登入頁並提示「登入已過期」。
   **實際**：頁面停在原地，查詢靜默失敗，無任何導向或提示。

## 根本原因

| # | 原因 | 位置 |
|---|------|------|
| 1 | **Middleware 只在 HTTP 導航時執行**。頁面停在原地（SPA 狀態）時 middleware 不會再跑，故不會重定向。 | `apps/web/src/middleware.ts:158` |
| 2 | **tRPC client 完全沒有全域錯誤攔截**。`QueryClient` 無 `onError`，過期後的 `UNAUTHORIZED` 只讓個別查詢 `error` 有值，沒有任何機制轉成「登出並導向」。 | `apps/web/src/lib/trpc-provider.tsx:115-133` |
| 3 | **`SessionProvider` 未設定過期偵測**（無 `refetchInterval`），使用者不互動時不會主動發現 session 已失效。 | `apps/web/src/components/providers/SessionProvider.tsx:54-56` |

後端 `protectedProcedure` 在 session 不存在時會對每個請求拋 `TRPCError({ code: 'UNAUTHORIZED' })`（`packages/api/src/trpc.ts:323-325`），此為正常行為；缺的是**前端的接手機制**。

JWT `maxAge` = 24 小時（`apps/web/src/auth.config.ts:150`）。

---

## 解決方案

> 方案方向（已與使用者確認）：**全域攔截 + 主動輪詢**；偵測到過期後 **Toast 提示 +（帶 callbackUrl）自動導向登入頁**。

### 設計原則

**所有使用者可見行為（Toast + 導向）集中在單一 React 元件 `SessionExpiryWatcher`**，tRPC 攔截只負責「踢掉 session」。好處：

- Toast 走正常 `next-intl` i18n（onError 在 module context 無法用 `useTranslations`）。
- 導向走正常 `@/i18n/routing` 的 router。
- **單一導向出口**，避免 `httpBatchLink` 一個 batch 多個查詢同時失敗造成的重複 Toast / 重複導向。

### 觸發鏈

```
[被動] 使用者操作觸發查詢 → tRPC 回 UNAUTHORIZED
        → QueryCache/MutationCache onError 偵測 → signOut({ redirect: false })（只清 session，不導向）
                                                              │
[主動] SessionProvider refetchInterval 定期 refetch ──────────┤
        → JWT 過期 → /api/auth/session 回 null                │
                                                              ▼
                              useSession status 變為 'unauthenticated'
                                                              │
                              SessionExpiryWatcher 偵測「曾登入 → 變未登入」
                                                              ▼
                              Toast（i18n）+ router 導向 /{locale}/login?callbackUrl=<原頁>
```

### 為什麼兩條路都需要

- **被動（tRPC 攔截）**：涵蓋「使用者有互動」的情境（99% 真實案例：閒置後點任何按鈕即觸發）。
- **主動（輪詢）**：涵蓋「使用者完全不互動、僅開著分頁」的情境，定期發現過期。

兩條路最終都匯流到 `SessionExpiryWatcher` 的單一出口。

---

## 影響範圍

- **模型**: 無
- **API / Router**: 無（後端行為不變）
- **資料庫**: 無
- **頁面 / 組件 / 設定**:

| 動作 | 檔案 | 說明 |
|------|------|------|
| **新增** | `apps/web/src/lib/session-expiry.ts` | module-level 旗標協調：`markManualSignOut` / `isManualSignOut`（區分主動登出）、`beginExpiryHandling`（防一個 batch 重複觸發）、`resetSessionState`（重新登入後重置）。 |
| **修改** | `apps/web/src/lib/trpc-provider.tsx` | `QueryClient` 加 `QueryCache` + `MutationCache` 的 `onError`，偵測 `UNAUTHORIZED` → `signOut({ redirect: false })`（清 session、不導向）。**不改動既有 link / transformer 設定**。 |
| **新增** | `apps/web/src/components/providers/SessionExpiryWatcher.tsx` | Client 元件。`useSession()` 監聽 status，記錄「曾經 authenticated」，當變為 `unauthenticated` 時：Toast（i18n）+ 導向 `/{locale}/login?callbackUrl=<原路徑>`。內含 ref 確保只導向一次；在 login 頁不觸發（防迴圈）。 |
| **修改** | `apps/web/src/components/providers/SessionProvider.tsx` | 給 `NextAuthSessionProvider` 加 `refetchInterval`（建議 15 分鐘）與 `refetchOnWindowFocus`。 |
| **修改** | `apps/web/src/app/[locale]/layout.tsx` | 在 `NextIntlClientProvider` 內掛 `<SessionExpiryWatcher />`（須在 i18n provider 內以使用 `useTranslations`）。 |
| **修改** | `apps/web/src/components/layout/TopBar.tsx` | `handleSignOut` 開頭呼叫 `markManualSignOut()`，避免正常登出被 Watcher 誤判為 session 過期。 |
| **修改** | `apps/web/src/messages/en.json` + `zh-TW.json` | 新增 session 過期 Toast 訊息 key（兩語言同步）。 |

### 預計新增 i18n key（草案，待 review 確認命名）

```jsonc
// common 命名空間下
"sessionExpired": {
  "title": "登入已過期",          // en: "Session expired"
  "description": "請重新登入以繼續操作"  // en: "Please sign in again to continue"
}
```

---

## 技術細節

### 1. tRPC 全域攔截（`trpc-provider.tsx`）

```typescript
import { QueryCache, MutationCache, QueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { signOut } from 'next-auth/react';

// module-level flag：避免一個 batch 多查詢失敗時重複呼叫 signOut
let isHandlingUnauthorized = false;

function handleMaybeUnauthorized(error: unknown) {
  if (
    error instanceof TRPCClientError &&
    error.data?.code === 'UNAUTHORIZED' &&
    !isHandlingUnauthorized
  ) {
    isHandlingUnauthorized = true;
    // 只清 session、不導向；導向交給 SessionExpiryWatcher（單一出口）
    void signOut({ redirect: false });
  }
}

const [queryClient] = useState(() => new QueryClient({
  queryCache: new QueryCache({ onError: handleMaybeUnauthorized }),
  mutationCache: new MutationCache({ onError: handleMaybeUnauthorized }),
}));
```

### 2. SessionExpiryWatcher（新元件）

重點邏輯：
- `const { status } = useSession();`
- `wasAuthenticatedRef`：一旦 `status === 'authenticated'` 設為 `true`。
- 當 `wasAuthenticatedRef.current === true && status === 'unauthenticated'`：
  - 防呆：若當前已在 `/login` 路徑則略過。
  - `toast({ title: t('sessionExpired.title'), description: t('sessionExpired.description'), variant: 'destructive' })`
  - 計算 `callbackUrl = window.location.pathname + window.location.search`
  - `router.push('/login?callbackUrl=' + encodeURIComponent(callbackUrl))`（locale 由 `@/i18n/routing` 自動處理）
  - 用 `hasRedirectedRef` 確保只導向一次。

### 3. 主動輪詢（`SessionProvider.tsx`）

```typescript
<NextAuthSessionProvider
  refetchInterval={15 * 60}     // 每 115 分鐘檢查 session
  refetchOnWindowFocus={true}    // 切回分頁時也檢查
>
  {children}
</NextAuthSessionProvider>
```

---

## 驗證計畫（Goal-Driven）

| # | 步驟 | 驗證 |
|---|------|------|
| 1 | 修改 `trpc-provider.tsx` | `pnpm typecheck` 通過 |
| 2 | 新增 `SessionExpiryWatcher.tsx` + 掛載 layout | `pnpm typecheck` + `pnpm lint` 通過 |
| 3 | 修改 `SessionProvider.tsx` refetchInterval | `pnpm typecheck` 通過 |
| 4 | 新增 i18n key（兩語言） | `pnpm validate:i18n` 報告 en / zh-TW key 一致 |
| 5 | **手動 E2E（被動）**：登入 → 在 dashboard 手動清除 session cookie → 點任一操作 | 出現「登入已過期」Toast 並導向 `/zh-TW/login?callbackUrl=...`，重新登入後回到原頁 |
| 6 | **手動 E2E（主動）**：登入 → 清除 session cookie → 不操作，等待 ≤ 15 分鐘輪詢 | 自動偵測並導向登入頁 |
| 7 | **防迴圈**：在 login 頁（未登入）停留 | 不會誤觸發 Toast 或導向 |
| 8 | **防重複**：過期後一次觸發多個並發查詢 | 只出現一次 Toast、只導向一次 |

---

## 風險與緩解

| 風險 | 緩解 |
|------|------|
| `httpBatchLink` 一個 batch 多查詢失敗 → onError 多次觸發 | module-level `isHandlingUnauthorized` flag + Watcher `hasRedirectedRef` 雙重保護 |
| login 頁未登入狀態誤觸發導向（迴圈） | `wasAuthenticatedRef` 須曾為 true + 當前路徑非 login 才觸發 |
| refetchInterval 增加定期請求負載 | 15 分鐘間隔對 `/api/auth/session`（輕量）影響可忽略 |
| Toast 在 non-React context 無法 i18n | 已透過「UI 集中在 Watcher」設計規避，tRPC 端不碰 UI |

## 不在本次範圍

- 不調整 JWT `maxAge`（24 小時維持不變）。
- 不引入「session 即將過期前提醒續期」功能（如有需要另開 FEAT）。
- 不重構既有 Toast / 表單系統（屬專案級技術債，獨立處理）。

---

## 實作備註（2026-06-04）

實作時發現一個規劃未涵蓋的 edge case 並據此調整方案：

- **問題**：`SessionExpiryWatcher` 以 `useSession` status 由 `authenticated` → `unauthenticated` 作為觸發條件，但**使用者主動登出**（TopBar 登出按鈕）同樣會觸發此轉換，會被誤報為「登入已過期」。
- **修正**：新增 `apps/web/src/lib/session-expiry.ts` 集中管理 module-level 旗標，並在 `TopBar.handleSignOut` 開頭呼叫 `markManualSignOut()`，讓 Watcher 略過主動登出情境。tRPC 攔截的「防重複」與「重新登入後重置」旗標一併收斂到此 util。
- **callbackUrl locale**：因 login 頁使用 locale-aware router（`@/i18n/routing`），Watcher 改用 next-intl `usePathname()`（不含 locale）組 callbackUrl，交由 login 頁自動補前綴，避免 `/zh-TW/zh-TW/...` 雙重 locale。
- **淨影響**：較原規劃多 1 個新檔（`session-expiry.ts`）與 1 處既有檔修改（`TopBar.tsx`），共 7 個檔案。

**靜態驗證**：`pnpm validate:i18n` ✅（2851 鍵一致）、`pnpm typecheck` ✅（3 packages）、本次新增/修改檔案 `next lint` 0 error（僅餘與全專案一致的既有 import/order warning）。

**瀏覽器 E2E（Playwright，dev server localhost:3000，admin@itpm.local）**：

| # | 測試 | 結果 |
|---|------|------|
| 1 | 被動：登入後在 `/projects` 清除 `authjs.session-token` → 搜尋觸發 client query | ✅ 4 個 `project.getAll` 全 401 → 只導向一次 → Toast「登入已過期 / 請重新登入以繼續操作」→ `/zh-TW/login?callbackUrl=%2Fprojects`（callbackUrl 不含 locale、前綴正確） |
| 2 | 主動輪詢：清除 cookie 後**完全不互動**（臨時將 refetchInterval 改 10 秒實測，測後改回 15 分鐘） | ✅ 約 8 秒後自動偵測 → Toast + 導向 `/zh-TW/login?callbackUrl=%2Fdashboard` |
| 3 | 防誤報：正常點 TopBar 登出 | ✅ **無**「登入已過期」Toast → 導向 `/zh-TW/login`（無 callbackUrl），與過期路徑區分 |
| 4 | 防迴圈：在 login 頁（曾登入）停留 6 秒 | ✅ 無 Toast、`urlChanges: 0`，不誤觸發 |

> 同時驗證了**防重複**（一個 batch 4 個並發 401 僅導向一次）與後端 `protectedProcedure` 對無 session 請求正確回 401 `UNAUTHORIZED`。

## 相關文件

- `apps/web/src/middleware.ts` — 路由層認證保護
- `apps/web/src/auth.config.ts` — JWT session 設定
- `packages/api/src/trpc.ts` — `protectedProcedure`（UNAUTHORIZED 來源）
- `.claude/rules/components.md`、`.claude/rules/i18n.md` — 實作規範
