/**
 * @fileoverview Button Component - shadcn/ui 按鈕組件
 *
 * @description
 * 基於 shadcn/ui 設計系統的統一按鈕組件，使用 class-variance-authority 提供類型安全的變體管理。
 * 支援多種視覺樣式和尺寸，提供 asChild 模式用於組合其他組件。
 * 是整個應用中最常用的交互組件之一。
 *
 * @component Button
 *
 * @features
 * - 6 種視覺變體 (default, destructive, outline, secondary, ghost, link)
 * - 4 種尺寸變體 (default, sm, lg, icon)
 * - asChild 模式支援 (使用 Radix UI Slot)
 * - 主題支援 (Light/Dark/System)
 * - 焦點環樣式 (Focus Ring)
 * - 禁用狀態樣式
 * - Hover 和 Active 狀態效果
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Button>預設按鈕</Button>
 *
 * // 不同變體
 * <Button variant="destructive">刪除</Button>
 * <Button variant="outline">輪廓</Button>
 * <Button variant="secondary">次要</Button>
 * <Button variant="ghost">幽靈</Button>
 * <Button variant="link">連結</Button>
 *
 * // 不同尺寸
 * <Button size="sm">小按鈕</Button>
 * <Button size="lg">大按鈕</Button>
 * <Button size="icon"><IconPlus /></Button>
 *
 * // asChild 模式 (將樣式應用到子組件)
 * <Button asChild>
 *   <Link href="/projects">前往專案</Link>
 * </Button>
 * ```
 *
 * @dependencies
 * - @radix-ui/react-slot: Slot 組件 (asChild 功能)
 * - class-variance-authority: 樣式變體管理
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/alert-dialog.tsx - AlertDialogAction, AlertDialogCancel 使用 buttonVariants
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
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
