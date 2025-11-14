/**
 * @fileoverview Messages Type Definition - next-intl 翻譯類型定義
 *
 * @description
 * 導出翻譯文件的 TypeScript 類型，為 next-intl 提供完整的類型安全支援。
 * 基於繁體中文翻譯文件 (zh-TW.json) 生成類型，確保所有語言文件結構一致。
 * 在使用 useTranslations 時提供自動補全和編譯時類型檢查。
 *
 * @module messages
 *
 * @features
 * - TypeScript 類型定義 (基於 zh-TW.json)
 * - 自動補全支援 (useTranslations 使用時)
 * - 編譯時類型檢查 (防止翻譯鍵錯誤)
 * - 多語言結構一致性保證
 *
 * @typeSource
 * - zh-TW.json: 繁體中文翻譯文件 (主要類型來源)
 * - en.json: 英文翻譯文件 (必須與 zh-TW.json 結構一致)
 *
 * @usage
 * ```typescript
 * // next-intl 自動使用此類型
 * import { useTranslations } from 'next-intl';
 *
 * // TypeScript 提供自動補全和類型檢查
 * const t = useTranslations('common.actions');
 * t('create'); // ✅ 正確
 * t('invalid'); // ❌ TypeScript 錯誤
 * ```
 *
 * @validation
 * - pnpm validate:i18n - 驗證翻譯文件結構一致性
 * - 檢查 en.json 和 zh-TW.json 是否有相同的鍵結構
 * - 偵測重複鍵、空值、缺失鍵等問題
 *
 * @dependencies
 * - TypeScript: typeof 類型推斷
 *
 * @related
 * - apps/web/src/messages/zh-TW.json - 繁體中文翻譯 (類型來源)
 * - apps/web/src/messages/en.json - 英文翻譯
 * - apps/web/src/i18n/request.ts - 請求層配置
 * - apps/web/src/i18n/routing.ts - 路由層配置
 * - scripts/validate-i18n.js - 翻譯驗證腳本
 * - claudedocs/I18N-TRANSLATION-KEY-GUIDE.md - 翻譯鍵使用指南
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

// 導出翻譯文件的 TypeScript 類型
// 這樣可以在使用 useTranslations 時獲得自動補全和類型檢查
export type Messages = typeof import('./zh-TW.json');
