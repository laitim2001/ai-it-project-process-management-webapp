/**
 * Popover - 浮動內容容器組件
 *
 * 基於 @radix-ui/react-popover 的可定位浮動面板組件。
 * 用於顯示與觸發元素相關的補充內容或操作選項。
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger>
 *     <Button>打開選單</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <div>這是彈出內容</div>
 *   </PopoverContent>
 * </Popover>
 * ```
 *
 * 特性：
 * - 智能定位和碰撞檢測
 * - 鍵盤導航支援（ESC 關閉）
 * - 點擊外部關閉
 * - 平滑進出動畫
 * - 設計系統整合
 * - 完全無障礙（WCAG 2.1 AA）
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
