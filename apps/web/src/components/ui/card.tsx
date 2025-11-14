/**
 * @fileoverview Card Component - shadcn/ui 卡片容器組件
 *
 * @description
 * 基於 shadcn/ui 設計系統的卡片容器組件，提供結構化的內容展示容器。
 * 由 6 個子組件組成複合組件系統 (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)。
 * 適用於各種內容展示場景，如統計卡片、表單容器、列表項目等。
 *
 * @component Card
 *
 * @features
 * - 結構化的複合組件系統
 * - 語義化的 HTML 結構 (h3 for title, p for description)
 * - 圓角邊框和陰影效果
 * - 主題支援 (Light/Dark/System)
 * - 靈活的內容組織
 * - 可選的 Header/Content/Footer 區塊
 *
 * @example
 * ```tsx
 * // 完整結構
 * <Card>
 *   <CardHeader>
 *     <CardTitle>卡片標題</CardTitle>
 *     <CardDescription>卡片描述</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     卡片內容
 *   </CardContent>
 *   <CardFooter>
 *     <Button>操作</Button>
 *   </CardFooter>
 * </Card>
 *
 * // 最小結構 (僅 Content)
 * <Card>
 *   <CardContent>
 *     簡單卡片內容
 *   </CardContent>
 * </Card>
 *
 * // 統計卡片範例 (Dashboard)
 * <Card>
 *   <CardHeader>
 *     <CardTitle>總預算</CardTitle>
 *     <CardDescription>本財年</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p className="text-3xl font-bold">NT$ 10,000,000</p>
 *   </CardContent>
 * </Card>
 * ```
 *
 * @dependencies
 * - 無外部依賴 (純 React + Tailwind CSS)
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/dashboard/StatsCard.tsx - 使用範例 (統計卡片)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
