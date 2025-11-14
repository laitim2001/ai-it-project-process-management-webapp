/**
 * @fileoverview Tooltip Component - shadcn/ui 工具提示組件
 *
 * @description
 * 基於 Radix UI Tooltip 的上下文提示組件，用於顯示元素的簡短說明或補充信息。
 * 提供智能顯示延遲控制、多種定位選項和優雅的動畫效果。
 * 遵循 shadcn/ui 設計系統規範，必須包裹在 TooltipProvider 中使用。
 *
 * @component Tooltip
 *
 * @features
 * - 基於 Radix UI Tooltip primitive
 * - 智能顯示延遲控制（hover 延遲顯示）
 * - 多種定位選項（top, right, bottom, left）
 * - 自動邊界檢測和位置調整
 * - 優雅的淡入淡出動畫（fade + zoom）
 * - Portal 渲染（避免 z-index 問題）
 * - 鍵盤導航支援（ESC 關閉）
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（WCAG 2.1 AA）
 *
 * @components
 * - TooltipProvider: 全域 Provider（必須）
 * - Tooltip: 根容器（狀態管理）
 * - TooltipTrigger: 觸發元素
 * - TooltipContent: 提示內容容器
 *
 * @props
 * TooltipProvider Props:
 * @param {number} [delayDuration=700] - 顯示延遲（毫秒）
 * @param {number} [skipDelayDuration=300] - 快速切換延遲（毫秒）
 *
 * TooltipContent Props:
 * @param {Object} props - 組件屬性（繼承自 Radix UI Tooltip.Content）
 * @param {"top" | "right" | "bottom" | "left"} [props.side] - 顯示位置
 * @param {number} [props.sideOffset=4] - 與觸發器的距離（px）
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法（必須包裹在 TooltipProvider 中）
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <Button variant="outline">懸停查看提示</Button>
 *     </TooltipTrigger>
 *     <TooltipContent>
 *       <p>這是提示內容</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 *
 * // 自訂位置
 * <Tooltip>
 *   <TooltipTrigger>...</TooltipTrigger>
 *   <TooltipContent side="right" sideOffset={10}>
 *     提示內容
 *   </TooltipContent>
 * </Tooltip>
 *
 * // 多個 Tooltip 共用 Provider
 * <TooltipProvider>
 *   <Tooltip>...</Tooltip>
 *   <Tooltip>...</Tooltip>
 * </TooltipProvider>
 * ```
 *
 * @accessibility
 * - 使用 role="tooltip" 語義化組件
 * - aria-describedby 自動關聯觸發器和內容
 * - 鍵盤導航支援（ESC 關閉）
 * - 焦點管理（觸發器保持焦點）
 * - Portal 渲染確保正確的 DOM 層級
 *
 * @dependencies
 * - @radix-ui/react-tooltip: 底層 Tooltip primitive
 * - Tailwind CSS: 樣式系統和動畫
 *
 * @related
 * - apps/web/src/components/ui/button.tsx - Button 組件（常用觸發器）
 * - apps/web/src/components/ui/popover.tsx - Popover 組件（類似功能）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
