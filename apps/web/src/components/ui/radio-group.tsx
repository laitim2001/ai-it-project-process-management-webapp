/**
 * @fileoverview RadioGroup Component - shadcn/ui 單選按鈕組組件
 *
 * @description
 * 基於 Radix UI RadioGroup 的單選按鈕組件，提供互斥選擇功能和完整的鍵盤導航支援。
 * 適用於表單中的單選場景，支援受控和非受控模式，與 React Hook Form 無縫整合。
 * 遵循 shadcn/ui 設計系統規範，提供一致的視覺樣式和無障礙性支援。
 *
 * @component RadioGroup
 *
 * @features
 * - 基於 Radix UI RadioGroup primitive
 * - 互斥選擇（同一組內只能選一個）
 * - 完整的鍵盤導航支援（方向鍵、Tab、Space）
 * - 支援受控和非受控模式
 * - Circle 圖示指示選中狀態
 * - 禁用狀態視覺回饋
 * - 與 React Hook Form 無縫整合
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @components
 * - RadioGroup: 單選組容器（管理選中狀態）
 * - RadioGroupItem: 單一單選項目
 *
 * @props
 * RadioGroup Props:
 * @param {Object} props - 組件屬性（繼承自 Radix UI RadioGroup.Root）
 * @param {string} [props.defaultValue] - 預設選中值（非受控）
 * @param {string} [props.value] - 當前選中值（受控）
 * @param {(value: string) => void} [props.onValueChange] - 值變更回調
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * RadioGroupItem Props:
 * @param {Object} props - 組件屬性（繼承自 Radix UI RadioGroup.Item）
 * @param {string} props.value - 選項值
 * @param {boolean} [props.disabled] - 是否禁用
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法（非受控）
 * <RadioGroup defaultValue="option1">
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option1" id="r1" />
 *     <Label htmlFor="r1">選項 1</Label>
 *   </div>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option2" id="r2" />
 *     <Label htmlFor="r2">選項 2</Label>
 *   </div>
 * </RadioGroup>
 *
 * // 受控模式
 * const [value, setValue] = useState("option1");
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <RadioGroupItem value="option1" id="r1" />
 *   <RadioGroupItem value="option2" id="r2" />
 * </RadioGroup>
 *
 * // 與 React Hook Form 整合
 * <RadioGroup {...field}>
 *   <RadioGroupItem value="yes" />
 *   <RadioGroupItem value="no" />
 * </RadioGroup>
 * ```
 *
 * @accessibility
 * - 使用 role="radiogroup" 語義化容器
 * - role="radio" 標記單選項目
 * - aria-checked 指示選中狀態
 * - 方向鍵導航（上下左右鍵切換選項）
 * - Space/Enter 選擇當前項目
 * - 焦點環視覺指示
 * - 禁用狀態視覺和行為回饋
 *
 * @dependencies
 * - @radix-ui/react-radio-group: 底層 RadioGroup primitive
 * - lucide-react: Circle 圖示
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/label.tsx - Label 組件（常用搭配）
 * - apps/web/src/components/ui/form.tsx - Form 組件（React Hook Form 整合）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
