/**
 * ================================================================
 * Badge 組件 - 徽章/標籤
 * ================================================================
 *
 * 【功能說明】
 * 用於顯示狀態、類別或數量的小型標籤
 *
 * 【變體說明】
 * • default - 主要徽章（藍色）
 * • secondary - 次要徽章（灰色）
 * • destructive - 破壞性操作（紅色）
 * • outline - 邊框樣式
 * • success - 成功狀態（綠色）
 * • warning - 警告狀態（黃色）
 * • error - 錯誤狀態（紅色）
 * • info - 資訊提示（藍色）
 *
 * 【使用範例】
 * ```tsx
 * <Badge>預設</Badge>
 * <Badge variant="success">已完成</Badge>
 * <Badge variant="warning">待處理</Badge>
 * <Badge variant="error">失敗</Badge>
 * ```
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800",
        error:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
