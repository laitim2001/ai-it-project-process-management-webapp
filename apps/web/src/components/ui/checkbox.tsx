/**
 * ================================================================
 * Checkbox 組件 - 複選框
 * ================================================================
 *
 * 【功能說明】
 * 基於 Radix UI 的複選框組件，支援多選和未定狀態
 *
 * 【特性】
 * • 支援勾選、未勾選、未定狀態（indeterminate）
 * • 完整的鍵盤導航支援
 * • 無障礙友善（WCAG 2.1 AA）
 * • 與表單整合
 *
 * 【使用範例】
 * ```tsx
 * // 基本用法
 * <Checkbox id="terms" />
 * <Label htmlFor="terms">同意條款</Label>
 *
 * // 受控組件
 * const [checked, setChecked] = useState(false);
 * <Checkbox checked={checked} onCheckedChange={setChecked} />
 *
 * // 未定狀態
 * <Checkbox checked="indeterminate" />
 * ```
 */

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
