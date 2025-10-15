/**
 * ================================================================
 * RadioGroup 組件 - 單選按鈕組
 * ================================================================
 *
 * 【功能說明】
 * 基於 Radix UI 的單選按鈕組件，用於單選場景
 *
 * 【特性】
 * • 互斥選擇（同時只能選一個）
 * • 完整的鍵盤導航支援（方向鍵）
 * • 無障礙友善（WCAG 2.1 AA）
 * • 與表單整合
 *
 * 【使用範例】
 * ```tsx
 * // 基本用法
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
 * // 受控組件
 * const [value, setValue] = useState("option1");
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <RadioGroupItem value="option1" id="r1" />
 *   <RadioGroupItem value="option2" id="r2" />
 * </RadioGroup>
 * ```
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
