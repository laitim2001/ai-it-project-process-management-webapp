/**
 * @fileoverview Switch Component - shadcn/ui 開關切換組件
 *
 * @description
 * 基於 Radix UI Switch 的布林值切換組件，提供視覺化的開關狀態和平滑動畫。
 * 適用於設定頁面、功能開關、偏好設定等場景，支援受控和非受控模式。
 * 遵循 shadcn/ui 設計系統規範，提供一致的視覺樣式和無障礙性支援。
 *
 * @component Switch
 *
 * @features
 * - 基於 Radix UI Switch primitive
 * - 視覺化的開/關狀態（顏色變化）
 * - 平滑的滑動動畫（translate transform）
 * - 完整的鍵盤支援（Space/Enter切換）
 * - 支援受控和非受控模式
 * - 禁用狀態視覺回饋
 * - 與 React Hook Form 無縫整合
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @props
 * @param {Object} props - 組件屬性（繼承自 Radix UI Switch.Root）
 * @param {boolean} [props.defaultChecked] - 預設開關狀態（非受控）
 * @param {boolean} [props.checked] - 當前開關狀態（受控）
 * @param {(checked: boolean) => void} [props.onCheckedChange] - 狀態變更回調
 * @param {boolean} [props.disabled] - 是否禁用
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法（非受控）
 * <div className="flex items-center space-x-2">
 *   <Switch id="airplane-mode" />
 *   <Label htmlFor="airplane-mode">飛航模式</Label>
 * </div>
 *
 * // 受控組件
 * const [enabled, setEnabled] = useState(false);
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * // 禁用狀態
 * <Switch disabled />
 *
 * // 與 React Hook Form 整合
 * <Switch {...field} checked={field.value} onCheckedChange={field.onChange} />
 * ```
 *
 * @accessibility
 * - 使用 role="switch" 語義化組件
 * - aria-checked 指示開關狀態
 * - Space/Enter 切換狀態
 * - 焦點環視覺指示
 * - 禁用狀態視覺和行為回饋
 *
 * @dependencies
 * - @radix-ui/react-switch: 底層 Switch primitive
 * - Tailwind CSS: 樣式系統和動畫
 *
 * @related
 * - apps/web/src/components/ui/label.tsx - Label 組件（常用搭配）
 * - apps/web/src/app/[locale]/settings/page.tsx - 使用範例（設定頁面）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
