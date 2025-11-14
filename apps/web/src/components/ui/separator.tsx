/**
 * @fileoverview Separator Component - shadcn/ui 視覺分隔線組件
 *
 * @description
 * 基於 Radix UI Separator 的視覺分隔器組件，用於在內容區域之間創建清晰的分隔。
 * 支援水平和垂直方向，提供語義化和裝飾性兩種模式，遵循 WCAG 無障礙性標準。
 * 遵循 shadcn/ui 設計系統規範，自動適應主題配色。
 *
 * @component Separator
 *
 * @features
 * - 基於 Radix UI Separator primitive
 * - 支援水平和垂直方向
 * - 語義化模式（對螢幕閱讀器有意義）
 * - 裝飾性模式（對螢幕閱讀器隱藏）
 * - 自動主題配色（使用 border token）
 * - 靈活的尺寸控制
 *
 * @props
 * @param {Object} props - 組件屬性（繼承自 Radix UI Separator.Root）
 * @param {"horizontal" | "vertical"} [props.orientation="horizontal"] - 分隔線方向
 * @param {boolean} [props.decorative=true] - 是否為裝飾性（true 則對螢幕閱讀器隱藏）
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 水平分隔線（預設）
 * <Separator />
 *
 * // 垂直分隔線
 * <div className="flex h-20 items-center">
 *   <span>左側內容</span>
 *   <Separator orientation="vertical" className="mx-4" />
 *   <span>右側內容</span>
 * </div>
 *
 * // 語義化分隔線（對螢幕閱讀器有意義）
 * <Separator decorative={false} />
 * ```
 *
 * @accessibility
 * - 預設 decorative={true}（對螢幕閱讀器隱藏）
 * - decorative={false} 時使用 role="separator"
 * - orientation 屬性自動設定 aria-orientation
 *
 * @dependencies
 * - @radix-ui/react-separator: 底層 Separator primitive
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
