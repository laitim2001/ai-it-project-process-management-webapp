/**
 * @fileoverview Utility Functions - 通用工具函數庫
 *
 * @description
 * 提供跨專案使用的核心工具函數，主要用於 Tailwind CSS 類別處理。
 * cn() 函數是整個專案中最常用的工具函數，用於條件式類別合併和衝突解決。
 *
 * @module lib/utils
 *
 * @functions
 * - cn(): Tailwind CSS 類別名稱合併工具（條件類別 + 衝突解決）
 *
 * @dependencies
 * - clsx: 條件式類別名稱處理（支援物件、陣列、條件語法）
 * - tailwind-merge: Tailwind CSS 類別衝突智能合併
 *
 * @related
 * - apps/web/src/components/ui/*.tsx - 所有 UI 組件都使用 cn()
 * - apps/web/tailwind.config.ts - Tailwind 配置文件
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合併 Tailwind CSS 類別名稱（條件類別 + 衝突解決）
 *
 * @description
 * 這是整個專案中最核心的工具函數，用於智能合併 CSS 類別。
 * 結合 clsx 的條件語法和 tailwind-merge 的衝突解決能力，
 * 確保 Tailwind CSS 類別正確覆蓋而不產生樣式衝突。
 *
 * @param {...ClassValue[]} inputs - 類別名稱或條件類別
 *   - 支援字串: "text-red-500 bg-white"
 *   - 支援陣列: ["text-red-500", "bg-white"]
 *   - 支援物件: { "bg-red-500": isError, "bg-green-500": isSuccess }
 *   - 支援條件: isActive && "bg-blue-500"
 *   - 支援 undefined/null（會自動忽略）
 *
 * @returns {string} 合併且去除衝突後的類別字串
 *
 * @example
 * ```typescript
 * // 基本用法 - 合併多個類別
 * cn('text-red-500', 'bg-white')
 * // → "text-red-500 bg-white"
 *
 * // 條件類別 - 根據條件動態添加
 * cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class')
 * // → "base-class active-class" (如果 isActive=true, isDisabled=false)
 *
 * // 物件語法 - 多個條件
 * cn('text-sm', {
 *   'text-red-500': isError,
 *   'text-green-500': isSuccess,
 *   'font-bold': isImportant
 * })
 * // → "text-sm text-red-500 font-bold" (根據條件)
 *
 * // 衝突解決 - 後面的類別會覆蓋前面的（同屬性）
 * cn('text-red-500', 'text-blue-500')
 * // → "text-blue-500" (blue 覆蓋 red)
 *
 * cn('p-4', 'px-6')
 * // → "py-4 px-6" (px-6 覆蓋 p-4 的 padding-left/right)
 *
 * // 組件開發常見用法 - 合併預設樣式和自訂樣式
 * function Button({ className, ...props }) {
 *   return (
 *     <button
 *       className={cn(
 *         // 基礎樣式
 *         "px-4 py-2 rounded-md font-medium",
 *         // 條件樣式
 *         props.variant === "destructive" && "bg-red-500 text-white",
 *         props.variant === "outline" && "border border-gray-300",
 *         // 允許外部覆蓋
 *         className
 *       )}
 *       {...props}
 *     />
 *   )
 * }
 *
 * // shadcn/ui 組件標準模式
 * <Button className="hover:bg-blue-600">
 *   // hover:bg-blue-600 會正確合併而不會衝突
 * </Button>
 * ```
 *
 * @usage-frequency 極高（幾乎所有 UI 組件都使用）
 *
 * @performance
 * - 輕量級：僅合併類別字串，無 DOM 操作
 * - 高效率：適合在渲染函數中頻繁調用
 * - 緩存友好：相同輸入總是產生相同輸出（純函數）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
