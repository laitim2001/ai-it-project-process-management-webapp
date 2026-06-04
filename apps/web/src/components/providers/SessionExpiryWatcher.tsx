/**
 * @fileoverview SessionExpiryWatcher - Session 過期偵測與導向 (FIX-142)
 *
 * @description
 * 監聽 NextAuth session 狀態，當「曾經登入」的使用者 session 失效時
 * （JWT 過期被 tRPC 全域攔截清除，或主動輪詢 refetch 後發現過期），
 * 顯示「登入已過期」提示並導向登入頁，並帶上 callbackUrl 以便登入後返回原頁。
 *
 * 此元件是 session 過期處理的「單一出口」，用以解決：
 * - tRPC 一個 batch 多查詢同時回 401 時的重複導向 / 重複 Toast
 * - module-level onError 中無法使用 i18n（useTranslations）與 router 的限制
 *
 * @component SessionExpiryWatcher
 * @features
 * - 僅在「曾登入 → 變未登入」時觸發（避免訪客在公開頁誤觸發）
 * - 排除使用者主動登出（isManualSignOut）以免誤報
 * - 排除 login 頁本身（避免自我導向迴圈）
 * - hasRedirectedRef 確保只導向一次
 * @dependencies
 * - next-auth/react: useSession
 * - @/i18n/routing: useRouter, usePathname（locale-aware）
 * - @/lib/session-expiry: 旗標協調
 * @related
 * - apps/web/src/lib/trpc-provider.tsx - tRPC 全域 UNAUTHORIZED 攔截
 * - apps/web/src/components/providers/SessionProvider.tsx - 主動輪詢設定
 * @since FIX-142
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { toast } from '@/components/ui/use-toast';
import { isManualSignOut, resetSessionState } from '@/lib/session-expiry';

export function SessionExpiryWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // 不含 locale 前綴，例如 /dashboard
  const t = useTranslations('common.sessionExpired');

  const wasAuthenticatedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // 成功登入：記錄狀態並重置所有旗標，讓下一輪過期 / 登出能正常處理
    if (status === 'authenticated') {
      wasAuthenticatedRef.current = true;
      hasRedirectedRef.current = false;
      resetSessionState();
      return;
    }

    // 僅在「曾經登入 → 變為未登入」、非主動登出、且不在 login 頁時觸發
    if (
      status === 'unauthenticated' &&
      wasAuthenticatedRef.current &&
      !hasRedirectedRef.current &&
      !isManualSignOut() &&
      pathname !== '/login'
    ) {
      hasRedirectedRef.current = true;

      toast({
        title: t('title'),
        description: t('description'),
        variant: 'destructive',
      });

      // callbackUrl 使用「不含 locale」的內部路徑（pathname + 原 query），
      // 交由 login 頁的 locale-aware router 自動補上前綴（避免雙重 locale）
      const callbackUrl = `${pathname}${window.location.search}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, pathname, router, t]);

  return null;
}
