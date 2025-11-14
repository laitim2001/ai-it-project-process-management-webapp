/**
 * @fileoverview Skeleton Component - shadcn/ui 骨架屏載入組件
 *
 * @description
 * 用於內容載入時顯示的骨架屏組件，提供脈動動畫的佔位符。
 * 包含基礎 Skeleton 組件和多個預設組件（SkeletonText, SkeletonCard, SkeletonAvatar 等）。
 * 適用於改善載入體驗，減少內容突然出現造成的視覺跳躍。
 *
 * @component Skeleton
 *
 * @features
 * - 基於 class-variance-authority 的樣式變體管理
 * - 脈動動畫（animate-pulse）
 * - 三種視覺變體（default, lighter, darker）
 * - 預設組件集（Text, Card, Avatar, Button, Table）
 * - 靈活的尺寸和形狀控制
 * - 主題支援（Light/Dark/System）
 *
 * @components
 * - Skeleton: 基礎骨架組件
 * - SkeletonText: 文字段落骨架（可自訂行數）
 * - SkeletonCard: 卡片骨架（圖片 + 文字）
 * - SkeletonAvatar: 頭像骨架（圓形，支援 sm/default/lg）
 * - SkeletonButton: 按鈕骨架
 * - SkeletonTable: 表格骨架（可自訂行列數）
 *
 * @props
 * Skeleton Props:
 * @param {Object} props - 組件屬性
 * @param {"default" | "lighter" | "darker"} [props.variant="default"] - 視覺變體
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Skeleton className="h-4 w-[250px]" />
 *
 * // 文字段落骨架
 * <SkeletonText lines={3} />
 *
 * // 卡片骨架
 * <SkeletonCard />
 *
 * // 頭像骨架
 * <SkeletonAvatar size="lg" />
 *
 * // 表格骨架
 * <SkeletonTable rows={5} columns={4} />
 *
 * // 自訂變體
 * <Skeleton variant="lighter" className="h-12 w-12 rounded-full" />
 * ```
 *
 * @accessibility
 * - 使用 aria-busy 指示載入狀態
 * - 建議搭配 aria-label 說明載入內容
 *
 * @dependencies
 * - class-variance-authority: 樣式變體管理
 * - Tailwind CSS: 樣式系統和動畫
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/app/[locale]/projects/page.tsx - 使用範例（列表載入）
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
  variants: {
    variant: {
      default: "bg-muted",
      lighter: "bg-muted/50",
      darker: "bg-muted/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Preset skeleton components for common use cases
const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-4/5" : "w-full" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}
SkeletonText.displayName = "SkeletonText"

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-[200px] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
SkeletonCard.displayName = "SkeletonCard"

const SkeletonAvatar: React.FC<{ size?: "sm" | "default" | "lg"; className?: string }> = ({
  size = "default",
  className,
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  )
}
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => {
  return <Skeleton className={cn("h-10 w-24", className)} />
}
SkeletonButton.displayName = "SkeletonButton"

const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  )
}
SkeletonTable.displayName = "SkeletonTable"

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonTable,
  skeletonVariants,
}
