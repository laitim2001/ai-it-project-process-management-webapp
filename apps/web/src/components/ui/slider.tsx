/**
 * @fileoverview Slider Component - shadcn/ui 滑桿組件
 *
 * @description
 * 基於 Radix UI Slider 的數值範圍選擇組件，支援單點和雙點範圍選擇。
 * 提供完整的鍵盤導航支援和視覺回饋，適用於數值調整和範圍過濾場景。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和無障礙性標準。
 *
 * @component Slider
 *
 * @features
 * - 基於 Radix UI Slider primitive
 * - 支援單點和雙點範圍選擇
 * - 自訂 min、max、step 參數
 * - 完整的鍵盤支援（方向鍵、Page Up/Down、Home/End）
 * - 視覺化數值範圍（Track + Range + Thumb）
 * - 禁用狀態視覺回饋
 * - 與 React Hook Form 無縫整合
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @props
 * @param {Object} props - 組件屬性（繼承自 Radix UI Slider.Root）
 * @param {number[]} [props.defaultValue] - 預設值（非受控）
 * @param {number[]} [props.value] - 當前值（受控）
 * @param {(value: number[]) => void} [props.onValueChange] - 值變更回調
 * @param {number} [props.min=0] - 最小值
 * @param {number} [props.max=100] - 最大值
 * @param {number} [props.step=1] - 步進值
 * @param {boolean} [props.disabled] - 是否禁用
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法（單點）
 * <Slider defaultValue={[50]} max={100} step={1} />
 *
 * // 範圍選擇（雙點）
 * <Slider defaultValue={[25, 75]} max={100} step={1} />
 *
 * // 受控組件
 * const [value, setValue] = useState([50]);
 * <Slider value={value} onValueChange={setValue} />
 *
 * // 自訂範圍和步進
 * <Slider defaultValue={[5]} min={0} max={10} step={0.1} />
 * ```
 *
 * @accessibility
 * - 使用 role="slider" 語義化組件
 * - aria-valuemin, aria-valuemax, aria-valuenow 自動設定
 * - 鍵盤導航：左右方向鍵、Page Up/Down、Home/End
 * - 焦點環視覺指示
 * - 禁用狀態視覺和行為回饋
 *
 * @dependencies
 * - @radix-ui/react-slider: 底層 Slider primitive
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/label.tsx - Label 組件（常用搭配）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
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
