/**
 * @fileoverview Avatar Component - shadcn/ui 頭像組件
 *
 * @description
 * 基於 shadcn/ui 設計系統的頭像組件，支援圖片顯示和首字母縮寫 fallback。
 * 使用 class-variance-authority 提供多種尺寸變體，自動處理圖片載入失敗的情況。
 * 適用於用戶資料顯示、評論區、用戶列表等場景。
 *
 * @component Avatar
 *
 * @features
 * - 多種尺寸變體 (sm, default, lg, xl)
 * - 自動生成首字母縮寫 (Initials)
 * - 圖片載入失敗自動 fallback
 * - 圓形頭像樣式
 * - 主題支援 (Light/Dark/System)
 * - 響應式圖片處理
 *
 * @example
 * ```tsx
 * // 基本用法 (使用圖片)
 * <Avatar src="/avatar.jpg" alt="John Doe" />
 *
 * // 使用 fallback (首字母縮寫)
 * <Avatar alt="John Doe" fallback="JD" />
 *
 * // 不同尺寸
 * <Avatar size="sm" src="/avatar.jpg" alt="Small Avatar" />
 * <Avatar size="lg" src="/avatar.jpg" alt="Large Avatar" />
 * <Avatar size="xl" src="/avatar.jpg" alt="Extra Large Avatar" />
 *
 * // 使用組合組件
 * <Avatar>
 *   <AvatarImage src="/avatar.jpg" alt="User Name" />
 *   <AvatarFallback>UN</AvatarFallback>
 * </Avatar>
 * ```
 *
 * @accessibility
 * - alt 屬性用於圖片描述
 * - fallback 文字提供無圖片時的辨識資訊
 * - 語義化的 HTML 結構
 *
 * @dependencies
 * - class-variance-authority: 樣式變體管理
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/layout/TopBar.tsx - 使用範例 (用戶頭像)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    // Generate initials from alt text or fallback
    const getInitials = () => {
      const text = alt || fallback || ""
      const words = text.trim().split(" ")
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase()
      }
      return text.slice(0, 2).toUpperCase()
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm font-medium">
            {getInitials()}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }
