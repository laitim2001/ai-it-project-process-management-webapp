/**
 * @fileoverview Checkbox Component - shadcn/ui 複選框組件
 *
 * @description
 * 基於 Radix UI Checkbox 的複選框組件，支援多選和未定狀態 (indeterminate)。
 * 提供完整的鍵盤導航、焦點管理和表單整合功能。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和完整的無障礙性。
 *
 * @component Checkbox
 *
 * @features
 * - 三種狀態支援 (未選、已選、未定 indeterminate)
 * - 完整的鍵盤導航 (Space 切換)
 * - 焦點環樣式 (Focus Ring)
 * - 與 React Hook Form 整合
 * - 主題支援 (Light/Dark/System)
 * - 禁用狀態樣式
 * - 完整的無障礙性支援 (ARIA 屬性)
 * - WCAG 2.1 AA 標準
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Checkbox id="terms" />
 * <Label htmlFor="terms">同意條款</Label>
 *
 * // 受控組件
 * const [checked, setChecked] = useState(false);
 * <Checkbox checked={checked} onCheckedChange={setChecked} />
 *
 * // 未定狀態 (用於「全選」功能)
 * <Checkbox checked="indeterminate" />
 *
 * // 與 Form 組件整合
 * <FormField
 *   control={form.control}
 *   name="terms"
 *   render={({ field }) => (
 *     <FormItem className="flex items-center space-x-2">
 *       <FormControl>
 *         <Checkbox
 *           checked={field.value}
 *           onCheckedChange={field.onChange}
 *         />
 *       </FormControl>
 *       <FormLabel>同意服務條款</FormLabel>
 *     </FormItem>
 *   )}
 * />
 * ```
 *
 * @accessibility
 * - role="checkbox" 自動處理
 * - aria-checked 狀態自動同步
 * - Space 鍵切換選中狀態
 * - 焦點樣式明確可見
 * - 禁用狀態正確傳達
 * - WCAG 2.1 AA 標準
 *
 * @dependencies
 * - @radix-ui/react-checkbox: Checkbox 底層實現
 * - lucide-react: Check 圖標
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/form.tsx - Form 組件 (表單整合)
 * - apps/web/src/components/ui/label.tsx - Label 組件 (標籤配對)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
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
