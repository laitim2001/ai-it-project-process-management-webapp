/**
 * ================================================================
 * Label 組件 - 表單標籤
 * ================================================================
 *
 * 【功能說明】
 * 基於 Radix UI 的表單標籤組件，提供無障礙支援
 *
 * 【使用範例】
 * ```tsx
 * <Label htmlFor="email">電子郵件</Label>
 * <Input id="email" type="email" />
 * ```
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
