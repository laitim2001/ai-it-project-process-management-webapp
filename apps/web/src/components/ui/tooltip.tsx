/**
 * Tooltip - 工具提示組件
 *
 * 基於 @radix-ui/react-tooltip 的上下文提示組件。
 * 用於顯示元素的簡短說明或補充信息。
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>
 *       <Button>懸停查看提示</Button>
 *     </TooltipTrigger>
 *     <TooltipContent>
 *       <p>這是提示內容</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 *
 * 特性：
 * - 智能顯示延遲控制
 * - 多種定位選項
 * - 鍵盤導航支援
 * - 優雅的淡入淡出動畫
 * - 設計系統整合
 * - 完全無障礙（WCAG 2.1 AA）
 *
 * 注意：必須包裹在 TooltipProvider 中使用
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
