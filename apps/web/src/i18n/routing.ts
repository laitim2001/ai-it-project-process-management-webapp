/**
 * @fileoverview I18N Routing Configuration - next-intl 路由層配置
 *
 * @description
 * 配置 next-intl 的路由層邏輯，定義支援的語言列表、預設語言和 URL 前綴策略。
 * 創建類型安全的導航輔助函數 (Link, redirect, useRouter 等)，確保所有路由操作都正確處理語言前綴。
 * 使用 'always' 策略，所有語言都顯示 URL 前綴，提供明確的語言識別。
 *
 * @module i18n/routing
 *
 * @features
 * - 語言列表定義 (locales: ['en', 'zh-TW'])
 * - 預設語言設定 (defaultLocale: 'zh-TW')
 * - URL 前綴策略 (localePrefix: 'always')
 * - 類型安全的導航函數 (Link, redirect, useRouter, usePathname, getPathname)
 * - 自動語言前綴處理
 *
 * @config
 * - locales: ['en', 'zh-TW'] - 支援英文和繁體中文
 * - defaultLocale: 'zh-TW' - 預設為繁體中文
 * - localePrefix: 'always' - 所有語言都顯示前綴
 *
 * @urlStrategy
 * - 'always' 策略下的 URL 結構：
 *   - 繁體中文: /zh-TW/projects
 *   - 英文: /en/projects
 *   - 根路徑 / 會自動重定向到 /zh-TW
 *
 * @navigationHelpers
 * - Link: 類型安全的 Link 組件 (自動處理語言前綴)
 * - redirect: 類型安全的重定向函數
 * - usePathname: 獲取當前路徑 (不含語言前綴)
 * - useRouter: 類型安全的 Router Hook
 * - getPathname: 獲取完整路徑名 (含語言前綴)
 *
 * @example
 * ```tsx
 * import { Link, redirect, usePathname, useRouter } from '@/i18n/routing';
 *
 * // 使用 Link 組件 (自動添加語言前綴)
 * <Link href="/projects">專案列表</Link>
 * // 繁體中文: /zh-TW/projects
 * // 英文: /en/projects
 *
 * // 使用 redirect
 * redirect('/dashboard');
 * // 繁體中文: 重定向到 /zh-TW/dashboard
 *
 * // 使用 usePathname
 * const pathname = usePathname();
 * // URL: /zh-TW/projects/123 → pathname: /projects/123
 *
 * // 使用 useRouter
 * const router = useRouter();
 * router.push('/settings');
 * // 繁體中文: 導航到 /zh-TW/settings
 * ```
 *
 * @dependencies
 * - next-intl/routing: defineRouting
 * - next-intl/navigation: createNavigation
 *
 * @related
 * - apps/web/src/i18n/request.ts - 請求層配置
 * - apps/web/src/messages/zh-TW.json - 繁體中文翻譯
 * - apps/web/src/messages/en.json - 英文翻譯
 * - apps/web/src/middleware.ts - 中介軟體 (語言偵測)
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // 支援的語言列表
  locales: ['en', 'zh-TW'],

  // 默認語言為繁體中文
  defaultLocale: 'zh-TW',

  // URL 語言前綴策略：
  // - 'always': 所有語言都顯示前綴
  //   例如: /zh-TW/projects (繁中), /en/projects (英文)
  //   根路徑 / 會自動重定向到 /zh-TW
  localePrefix: 'always'
});

// 創建類型安全的導航輔助函數
// 使用這些函數可以確保語言路由正確
export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
