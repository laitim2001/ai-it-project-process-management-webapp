/**
 * ================================================================
 * Button 組件 - 基於 shadcn/ui 風格
 * ================================================================
 *
 * 【功能說明】
 * 統一的按鈕組件，支援多種變體和尺寸
 *
 * 【使用 CVA (class-variance-authority)】
 * 提供類型安全的變體管理
 *
 * 【變體說明】
 * • variant: default, destructive, outline, secondary, ghost, link
 * • size: default, sm, lg, icon
 *
 * 【使用範例】
 * ```tsx
 * <Button>預設按鈕</Button>
 * <Button variant="destructive">刪除</Button>
 * <Button variant="outline" size="sm">小按鈕</Button>
 * <Button variant="ghost" size="icon"><IconPlus /></Button>
 * ```
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 使用 CVA 定義按鈕變體
const buttonVariants = cva(
  // 基礎樣式（所有按鈕共用）
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // 視覺變體
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // 尺寸變體
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
