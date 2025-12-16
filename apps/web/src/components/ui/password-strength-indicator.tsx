/**
 * @fileoverview Password Strength Indicator 組件 - 密碼強度指示器
 *
 * @description
 * 顯示密碼強度的視覺指示器，包含進度條和詳細的要求狀態。
 * 密碼要求：
 * - 最小長度：12 個字符
 * - 複雜度：至少 6 個字符為大寫字母、數字或符號
 *
 * @module apps/web/src/components/ui/PasswordStrengthIndicator
 * @component PasswordStrengthIndicator
 * @author IT Department
 * @since CHANGE-032 - 用戶密碼管理功能
 * @lastModified 2025-12-16
 *
 * @features
 * - 密碼強度視覺進度條
 * - 即時驗證反饋
 * - 詳細的要求狀態顯示
 * - 支援國際化
 *
 * @dependencies
 * - React - UI 渲染
 * - @/lib/utils - cn() 工具函數
 * - lucide-react - Check/X 圖示
 * - next-intl - 國際化
 *
 * @example
 * ```tsx
 * <PasswordStrengthIndicator password={password} />
 * ```
 */

'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

/** 密碼要求常數（與後端保持一致） */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  MIN_SPECIAL_CHARS: 6,
  ALLOWED_SYMBOLS: '!@#$%^&*()_+-=[]{};\':"|,./<>?`~',
} as const;

export interface PasswordStrengthIndicatorProps {
  /** 要驗證的密碼 */
  password: string;
  /** 額外的 className */
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  length: number;
  uppercaseCount: number;
  digitCount: number;
  symbolCount: number;
  specialCharCount: number;
  lengthValid: boolean;
  complexityValid: boolean;
}

/**
 * 驗證密碼強度（前端版本，與後端邏輯一致）
 */
function validatePassword(password: string): ValidationResult {
  // 轉義正則特殊字符
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const uppercaseMatches = password.match(/[A-Z]/g) || [];
  const digitMatches = password.match(/[0-9]/g) || [];
  const symbolRegex = new RegExp(
    `[${escapeRegExp(PASSWORD_REQUIREMENTS.ALLOWED_SYMBOLS)}]`,
    'g'
  );
  const symbolMatches = password.match(symbolRegex) || [];

  const uppercaseCount = uppercaseMatches.length;
  const digitCount = digitMatches.length;
  const symbolCount = symbolMatches.length;
  const specialCharCount = uppercaseCount + digitCount + symbolCount;

  const lengthValid = password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH;
  const complexityValid = specialCharCount >= PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS;

  return {
    isValid: lengthValid && complexityValid,
    length: password.length,
    uppercaseCount,
    digitCount,
    symbolCount,
    specialCharCount,
    lengthValid,
    complexityValid,
  };
}

/**
 * 計算強度百分比（用於進度條）
 */
function calculateStrengthPercentage(validation: ValidationResult): number {
  if (!validation.length) return 0;

  // 長度貢獻 50%
  const lengthScore = Math.min(
    (validation.length / PASSWORD_REQUIREMENTS.MIN_LENGTH) * 50,
    50
  );

  // 複雜度貢獻 50%
  const complexityScore = Math.min(
    (validation.specialCharCount / PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS) * 50,
    50
  );

  return Math.round(lengthScore + complexityScore);
}

/**
 * 根據強度百分比獲取顏色
 */
function getStrengthColor(percentage: number): string {
  if (percentage === 0) return 'bg-gray-200 dark:bg-gray-700';
  if (percentage < 40) return 'bg-red-500';
  if (percentage < 70) return 'bg-yellow-500';
  if (percentage < 100) return 'bg-blue-500';
  return 'bg-green-500';
}

/**
 * 根據強度百分比獲取標籤
 */
function getStrengthLabel(
  percentage: number,
  t: (key: string) => string
): string {
  if (percentage === 0) return '';
  if (percentage < 40) return t('weak');
  if (percentage < 70) return t('fair');
  if (percentage < 100) return t('good');
  return t('strong');
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const t = useTranslations('users.password');

  const validation = React.useMemo(() => validatePassword(password), [password]);
  const percentage = React.useMemo(
    () => calculateStrengthPercentage(validation),
    [validation]
  );

  // 如果沒有輸入密碼，不顯示
  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 進度條 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('strength')}</span>
          <span
            className={cn(
              'font-medium',
              percentage < 40 && 'text-red-500',
              percentage >= 40 && percentage < 70 && 'text-yellow-500',
              percentage >= 70 && percentage < 100 && 'text-blue-500',
              percentage >= 100 && 'text-green-500'
            )}
          >
            {getStrengthLabel(percentage, t)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              getStrengthColor(percentage)
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 要求清單 */}
      <div className="space-y-2 text-sm">
        {/* 長度要求 */}
        <div className="flex items-center gap-2">
          {validation.lengthValid ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              validation.lengthValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {t('requirements.length', { count: PASSWORD_REQUIREMENTS.MIN_LENGTH })}
            <span className="ml-1 text-xs text-muted-foreground">
              ({validation.length}/{PASSWORD_REQUIREMENTS.MIN_LENGTH})
            </span>
          </span>
        </div>

        {/* 複雜度要求 */}
        <div className="flex items-center gap-2">
          {validation.complexityValid ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              validation.complexityValid
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground'
            )}
          >
            {t('requirements.complexity', { count: PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS })}
            <span className="ml-1 text-xs text-muted-foreground">
              ({validation.specialCharCount}/{PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS})
            </span>
          </span>
        </div>

        {/* 詳細統計 */}
        {validation.specialCharCount > 0 && (
          <div className="ml-6 text-xs text-muted-foreground">
            {t('details.breakdown')}
            {validation.uppercaseCount > 0 && (
              <span className="ml-1">
                {t('details.uppercase', { count: validation.uppercaseCount })}
              </span>
            )}
            {validation.digitCount > 0 && (
              <span className="ml-1">
                {t('details.digits', { count: validation.digitCount })}
              </span>
            )}
            {validation.symbolCount > 0 && (
              <span className="ml-1">
                {t('details.symbols', { count: validation.symbolCount })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
