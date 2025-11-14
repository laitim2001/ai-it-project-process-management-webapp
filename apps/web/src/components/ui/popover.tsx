/**
 * @fileoverview Popover Component - shadcn/ui 彈出式內容容器組件
 *
 * @description
 * 基於 Radix UI Popover 的可定位浮動面板組件，用於顯示與觸發元素相關的補充內容或操作選項。
 * 提供智能定位系統、碰撞檢測和平滑動畫，遵循 shadcn/ui 設計系統規範。
 * 適用於下拉選單、工具提示、表單幫助文字等場景。
 *
 * @component Popover
 *
 * @features
 * - 基於 Radix UI Popover primitive
 * - 智能定位和邊界碰撞檢測
 * - 自動調整位置（top/right/bottom/left）
 * - 鍵盤導航支援（ESC 關閉、Tab 循環）
 * - 點擊外部自動關閉
 * - 平滑進出動畫（fade + zoom）
 * - Portal 渲染（避免 z-index 問題）
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @components
 * - Popover: 根容器（狀態管理）
 * - PopoverTrigger: 觸發器（按鈕或其他可點擊元素）
 * - PopoverContent: 彈出內容容器
 * - PopoverAnchor: 自訂錨點元素（可選）
 *
 * @props
 * PopoverContent Props:
 * @param {Object} props - 組件屬性（繼承自 Radix UI Popover.Content）
 * @param {"center" | "start" | "end"} [props.align="center"] - 對齊方式
 * @param {number} [props.sideOffset=4] - 與觸發器的距離（px）
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button variant="outline">打開選單</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <div className="space-y-2">
 *       <h4 className="font-medium">標題</h4>
 *       <p className="text-sm">這是彈出內容</p>
 *     </div>
 *   </PopoverContent>
 * </Popover>
 *
 * // 自訂對齊和間距
 * <Popover>
 *   <PopoverTrigger>...</PopoverTrigger>
 *   <PopoverContent align="start" sideOffset={8}>
 *     內容
 *   </PopoverContent>
 * </Popover>
 * ```
 *
 * @accessibility
 * - 使用 role="dialog" 語義化容器
 * - 鍵盤導航支援（Tab 循環、ESC 關閉）
 * - 焦點管理（開啟時聚焦內容，關閉時返回觸發器）
 * - aria-haspopup 自動標記觸發器
 * - Portal 渲染確保正確的 DOM 層級
 *
 * @dependencies
 * - @radix-ui/react-popover: 底層 Popover primitive
 * - Tailwind CSS: 樣式系統和動畫
 *
 * @related
 * - apps/web/src/components/ui/button.tsx - Button 組件（常用觸發器）
 * - apps/web/src/components/ui/dropdown-menu.tsx - DropdownMenu 組件（類似功能）
 * - apps/web/src/components/ui/combobox.tsx - Combobox 組件（使用 Popover）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
