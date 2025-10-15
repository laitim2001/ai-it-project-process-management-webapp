/**
 * ================================================================
 * Slider 組件 - 滑桿
 * ================================================================
 *
 * 【功能說明】
 * 基於 Radix UI 的滑桿組件，用於數值範圍選擇
 *
 * 【特性】
 * • 支援單點或範圍選擇
 * • 自訂 min、max、step
 * • 完整的鍵盤支援（方向鍵、Page Up/Down、Home/End）
 * • 無障礙友善（WCAG 2.1 AA）
 * • 與表單整合
 *
 * 【使用範例】
 * ```tsx
 * // 基本用法（單點）
 * <Slider defaultValue={[50]} max={100} step={1} />
 *
 * // 範圍選擇
 * <Slider defaultValue={[25, 75]} max={100} step={1} />
 *
 * // 受控組件
 * const [value, setValue] = useState([50]);
 * <Slider value={value} onValueChange={setValue} />
 *
 * // 自訂範圍和步進
 * <Slider defaultValue={[5]} min={0} max={10} step={0.1} />
 * ```
 */

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
