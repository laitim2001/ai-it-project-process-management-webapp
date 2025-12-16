/**
 * @fileoverview Password Input 組件 - 密碼輸入框
 *
 * @description
 * 密碼輸入框組件，支援顯示/隱藏密碼切換功能。
 * 基於 Input 組件擴展，完全整合設計系統樣式。
 *
 * @module apps/web/src/components/ui/PasswordInput
 * @component PasswordInput
 * @author IT Department
 * @since CHANGE-032 - 用戶密碼管理功能
 * @lastModified 2025-12-16
 *
 * @features
 * - 顯示/隱藏密碼切換
 * - 支援所有 Input 組件的 props
 * - 設計系統整合
 * - Forward ref 支援
 *
 * @dependencies
 * - React forwardRef - Ref 轉發
 * - @/lib/utils - cn() 工具函數
 * - lucide-react - Eye/EyeOff 圖示
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   placeholder="請輸入密碼"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 是否顯示強度指示器 */
  showStrengthIndicator?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          tabIndex={-1}
          aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
