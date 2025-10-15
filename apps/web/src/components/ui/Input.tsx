/**
 * ================================================================
 * Input 組件 - 輸入框
 * ================================================================
 *
 * 【功能說明】
 * 統一的輸入框組件，支援所有原生 HTML input 屬性
 *
 * 【使用範例】
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
