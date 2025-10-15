/**
 * ================================================================
 * Alert 組件 - 基於 shadcn/ui 風格
 * ================================================================
 *
 * 【功能說明】
 * 內聯通知組件，用於顯示重要資訊、警告、錯誤或成功訊息
 *
 * 【使用 CVA (class-variance-authority)】
 * 提供類型安全的變體管理
 *
 * 【變體說明】
 * • default: 預設資訊樣式 (藍色)
 * • destructive: 錯誤/危險樣式 (紅色)
 * • success: 成功樣式 (綠色)
 * • warning: 警告樣式 (黃色)
 *
 * 【使用範例】
 * ```tsx
 * <Alert>
 *   <Info className="h-4 w-4" />
 *   <AlertTitle>提示</AlertTitle>
 *   <AlertDescription>這是一則資訊訊息</AlertDescription>
 * </Alert>
 *
 * <Alert variant="destructive">
 *   <AlertCircle className="h-4 w-4" />
 *   <AlertTitle>錯誤</AlertTitle>
 *   <AlertDescription>操作失敗，請重試</AlertDescription>
 * </Alert>
 *
 * <Alert variant="success">
 *   <CheckCircle2 className="h-4 w-4" />
 *   <AlertTitle>成功</AlertTitle>
 *   <AlertDescription>操作已成功完成</AlertDescription>
 * </Alert>
 *
 * <Alert variant="warning">
 *   <AlertTriangle className="h-4 w-4" />
 *   <AlertTitle>警告</AlertTitle>
 *   <AlertDescription>請注意此操作可能影響資料</AlertDescription>
 * </Alert>
 * ```
 *
 * 【無障礙特性】
 * • role="alert" - ARIA 角色定義
 * • 適當的顏色對比度 (WCAG AA)
 * • 支援鍵盤導航
 * • 語義化的標題和描述結構
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 使用 CVA 定義 Alert 變體
const alertVariants = cva(
  // 基礎樣式（所有 Alert 共用）
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 bg-green-50 text-green-900 dark:border-green-500 dark:bg-green-950 dark:text-green-50 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
        warning:
          "border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-50 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Alert 主組件
 *
 * 【Props】
 * • variant: default | destructive | success | warning
 * • className: 額外的 CSS 類名
 * • ...div 元素的其他屬性
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

/**
 * AlertTitle 標題組件
 *
 * 【用途】
 * 顯示 Alert 的標題，通常使用較大字體和粗體
 *
 * 【樣式】
 * • 字體大小: sm
 * • 字重: medium
 * • 行高: none
 * • 標題語義化: <h5>
 */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

/**
 * AlertDescription 描述組件
 *
 * 【用途】
 * 顯示 Alert 的詳細描述內容
 *
 * 【樣式】
 * • 字體大小: sm
 * • 行高: relaxed (較寬鬆的行距)
 * • 段落語義化: <div>
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
