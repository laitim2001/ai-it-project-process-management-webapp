/**
 * Separator Component
 *
 * 視覺分隔器組件，用於在內容區域之間創建清晰的分隔
 * 基於 Radix UI Separator 構建
 *
 * @component
 * @example
 * // 水平分隔線（默認）
 * <Separator />
 *
 * // 垂直分隔線
 * <Separator orientation="vertical" className="h-20" />
 *
 * // 裝飾性分隔線（不影響屏幕閱讀器）
 * <Separator decorative />
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
