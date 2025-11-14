/**
 * @fileoverview Badge Component - shadcn/ui 徽章組件
 *
 * @description
 * 基於 shadcn/ui 設計系統的徽章/標籤組件，用於顯示狀態、類別或數量資訊。
 * 使用 class-variance-authority 提供多種變體樣式，支援主題切換。
 * 適用於狀態標記、分類標籤、數量指示器等場景。
 *
 * @component Badge
 *
 * @features
 * - 8 種變體樣式 (default, secondary, destructive, outline, success, warning, error, info)
 * - 主題支援 (Light/Dark/System)
 * - 焦點環樣式 (Focus Ring)
 * - Hover 效果
 * - 小巧緊湊的設計
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Badge>預設</Badge>
 *
 * // 不同變體
 * <Badge variant="success">已完成</Badge>
 * <Badge variant="warning">待處理</Badge>
 * <Badge variant="error">失敗</Badge>
 * <Badge variant="destructive">刪除</Badge>
 * <Badge variant="secondary">次要</Badge>
 * <Badge variant="outline">輪廓</Badge>
 * <Badge variant="info">資訊</Badge>
 *
 * // 在專案中的使用
 * <Badge variant="success">{project.status}</Badge>
 * <Badge variant="warning">{proposal.status}</Badge>
 * ```
 *
 * @dependencies
 * - class-variance-authority: 樣式變體管理
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/app/[locale]/projects/page.tsx - 使用範例 (專案狀態)
 * - apps/web/src/app/[locale]/proposals/page.tsx - 使用範例 (提案狀態)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
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
