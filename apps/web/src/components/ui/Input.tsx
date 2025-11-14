/**
 * @fileoverview Input 組件 - 統一輸入框
 *
 * @description
 * 統一的輸入框組件，支援所有原生 HTML input 屬性。
 * 完全整合設計系統樣式，包含 focus 狀態、disabled 狀態和 file 類型特殊處理。
 *
 * @module apps/web/src/components/ui/Input
 * @component Input
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 *
 * @features
 * - 支援所有原生 HTML input 類型
 * - 設計系統整合（border, ring, focus 等）
 * - 文件上傳樣式優化
 * - Disabled 狀態處理
 * - Forward ref 支援
 *
 * @dependencies
 * - React forwardRef - Ref 轉發
 * - @/lib/utils - cn() 工具函數
 *
 * @example
 * ```tsx
 * <Input type="text" placeholder="請輸入..." />
 * <Input type="email" placeholder="電子郵件" />
 * <Input type="password" placeholder="密碼" />
 * <Input type="file" />
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
