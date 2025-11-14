/**
 * @fileoverview Progress Component - shadcn/ui 進度條組件
 *
 * @description
 * 基於 class-variance-authority 的進度條組件，提供多種尺寸和顏色變體。
 * 支援百分比標籤顯示、動畫過渡效果和主題系統整合。
 * 使用 CVA (Class Variance Authority) 管理樣式變體。
 *
 * @component Progress
 *
 * @features
 * - 多種尺寸變體 (sm: 2px, default: 4px, lg: 6px)
 * - 多種顏色變體 (default, success, warning, error, info)
 * - 百分比標籤顯示 (可選)
 * - 平滑過渡動畫 (transition-all)
 * - 自動百分比計算 (value/max * 100)
 * - 百分比範圍限制 (0-100%)
 * - 主題支援 (Light/Dark/System)
 *
 * @props
 * @param {number} [value=0] - 當前進度值
 * @param {number} [max=100] - 最大進度值
 * @param {"sm" | "default" | "lg"} [size="default"] - 進度條尺寸
 * @param {"default" | "success" | "warning" | "error" | "info"} [variant="default"] - 顏色變體
 * @param {boolean} [showLabel=false] - 是否顯示百分比標籤
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Progress value={60} />
 *
 * // 顯示百分比標籤
 * <Progress value={75} showLabel />
 *
 * // 使用顏色變體
 * <Progress value={90} variant="success" />
 * <Progress value={45} variant="warning" />
 * <Progress value={15} variant="error" />
 *
 * // 自訂尺寸
 * <Progress value={50} size="lg" />
 *
 * // 預算使用率
 * <Progress
 *   value={budgetPool.usedAmount}
 *   max={budgetPool.totalAmount}
 *   variant={percentage > 80 ? "warning" : "default"}
 *   showLabel
 * />
 * ```
 *
 * @dependencies
 * - class-variance-authority: 樣式變體管理
 * - React: forwardRef
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/index.ts - UI 組件索引
 * - apps/web/src/components/budget-pool/BudgetPoolCard.tsx - 使用範例
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        error: "bg-red-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  value?: number
  max?: number
  showLabel?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size,
      variant,
      showLabel = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="w-full">
        <div
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          {...props}
        >
          <div
            className={cn(progressIndicatorVariants({ variant }))}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress, progressVariants, progressIndicatorVariants }
