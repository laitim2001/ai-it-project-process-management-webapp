/**
 * @fileoverview Session 過期狀態協調 - FIX-142
 *
 * @description
 * 在「tRPC 全域 UNAUTHORIZED 攔截」「主動輪詢」「使用者主動登出」之間協調
 * session 失效的處理，確保：
 * - session 過期 → 顯示提示並導向登入頁（由 SessionExpiryWatcher 統一執行）
 * - 使用者主動登出 → 不顯示「登入已過期」提示（避免誤報）
 * - 一個 tRPC batch 內多個 UNAUTHORIZED → 只處理一次（避免重複 signOut）
 *
 * 這些旗標刻意以 module-level 狀態實作，因為 tRPC 的 QueryCache/MutationCache
 * onError 在 React 元件樹之外執行，無法使用 hook 或 context。
 *
 * @module apps/web/src/lib/session-expiry
 * @since FIX-142
 */

// 使用者是否為「主動登出」（而非 session 過期）
let manualSignOut = false;

// 是否已在處理過期（避免一個 batch 多查詢重複觸發 signOut）
let handlingExpiry = false;

/**
 * 標記為「使用者主動登出」。
 *
 * 由 TopBar 登出按鈕在呼叫 signOut 前呼叫，
 * 讓 SessionExpiryWatcher 不顯示「登入已過期」提示。
 */
export function markManualSignOut(): void {
  manualSignOut = true;
}

/** 查詢當前是否為使用者主動登出 */
export function isManualSignOut(): boolean {
  return manualSignOut;
}

/**
 * 嘗試取得「處理過期」的鎖。
 *
 * 第一次呼叫回傳 true（由呼叫者負責清除 session）；
 * 在重置前的重複呼叫回傳 false（已在處理中）。
 */
export function beginExpiryHandling(): boolean {
  if (handlingExpiry) return false;
  handlingExpiry = true;
  return true;
}

/**
 * 重置所有 session 狀態旗標。
 *
 * 由 SessionExpiryWatcher 在重新登入（status 變為 authenticated）時呼叫，
 * 確保下一輪過期 / 登出能正常被偵測與處理。
 */
export function resetSessionState(): void {
  manualSignOut = false;
  handlingExpiry = false;
}
