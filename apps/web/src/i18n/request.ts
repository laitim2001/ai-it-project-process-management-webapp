/**
 * @fileoverview I18N Request Configuration - next-intl 請求層配置
 *
 * @description
 * 配置 next-intl 的請求層邏輯，處理語言偵測和翻譯文件動態載入。
 * 根據用戶請求的語言設定，動態載入對應的翻譯 JSON 文件。
 * 支援語言驗證和降級處理，確保始終載入有效的語言資源。
 *
 * @module i18n/request
 *
 * @features
 * - 從請求中獲取語言設定 (requestLocale)
 * - 語言驗證 (檢查是否在支援列表中)
 * - 降級處理 (無效語言時使用預設語言)
 * - 動態載入翻譯文件 (按需載入，優化性能)
 * - TypeScript 類型安全 (基於 Messages 類型)
 *
 * @supportedLocales
 * - zh-TW: 繁體中文 (預設)
 * - en: English
 *
 * @workflow
 * 1. 從請求中獲取 locale 參數
 * 2. 驗證 locale 是否在 routing.locales 中
 * 3. 無效時降級為 routing.defaultLocale (zh-TW)
 * 4. 動態 import 對應的 JSON 翻譯文件
 * 5. 返回 locale 和 messages 給 next-intl
 *
 * @example
 * ```typescript
 * // next-intl 自動使用此配置
 * // URL: /zh-TW/projects → 載入 messages/zh-TW.json
 * // URL: /en/projects → 載入 messages/en.json
 * // URL: /invalid/projects → 降級載入 messages/zh-TW.json
 * ```
 *
 * @dependencies
 * - next-intl/server: getRequestConfig
 * - ./routing: routing 配置 (locales, defaultLocale)
 *
 * @related
 * - apps/web/src/i18n/routing.ts - 路由配置
 * - apps/web/src/messages/zh-TW.json - 繁體中文翻譯
 * - apps/web/src/messages/en.json - 英文翻譯
 * - apps/web/src/messages/index.ts - Messages 類型定義
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14 (FIX-061: Force recompile)
 */

import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // 從請求中獲取語言設置 - FIX-061: Force recompile
  let locale = await requestLocale;

  // 驗證語言是否在支援列表中，否則使用默認語言
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // 動態加載對應語言的翻譯文件
    // 這樣可以確保只加載當前需要的語言，優化性能
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
