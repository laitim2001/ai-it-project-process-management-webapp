/**
 * @fileoverview Password Validation Utilities - 密碼驗證工具
 *
 * @description
 * 提供密碼強度驗證功能，用於用戶密碼設定和更改。
 * 密碼要求：
 * - 最小長度：12 個字符
 * - 複雜度：至少 6 個字符為大寫字母、數字或特殊符號
 *
 * @module api/lib/passwordValidation
 *
 * @features
 * - 密碼長度驗證
 * - 密碼複雜度驗證
 * - 詳細的驗證錯誤訊息
 *
 * @related
 * - packages/api/src/routers/user.ts - 使用此驗證的 API
 * - apps/web/src/app/api/auth/register/route.ts - 註冊 API
 *
 * @since CHANGE-032: 用戶密碼管理功能
 * @lastModified 2025-12-16
 */

/**
 * 密碼驗證結果
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  details: {
    length: number;
    minLength: number;
    uppercaseCount: number;
    digitCount: number;
    symbolCount: number;
    specialCharCount: number;
    requiredSpecialChars: number;
  };
}

/**
 * 密碼要求常數
 */
export const PASSWORD_REQUIREMENTS = {
  /** 最小密碼長度 */
  MIN_LENGTH: 12,
  /** 最少需要的特殊字符數（大寫、數字、符號的總和） */
  MIN_SPECIAL_CHARS: 6,
  /** 允許的符號字符 */
  ALLOWED_SYMBOLS: '!@#$%^&*()_+-=[]{};\':"|,./<>?`~',
} as const;

/**
 * 驗證密碼強度
 *
 * @param password - 要驗證的密碼
 * @returns PasswordValidationResult - 驗證結果，包含是否有效、錯誤訊息和詳細統計
 *
 * @example
 * ```typescript
 * const result = validatePasswordStrength('MyP@ssw0rd123');
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 * ```
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // 計算各類字符數量
  const uppercaseMatches = password.match(/[A-Z]/g) || [];
  const digitMatches = password.match(/[0-9]/g) || [];
  const symbolRegex = new RegExp(`[${escapeRegExp(PASSWORD_REQUIREMENTS.ALLOWED_SYMBOLS)}]`, 'g');
  const symbolMatches = password.match(symbolRegex) || [];

  const uppercaseCount = uppercaseMatches.length;
  const digitCount = digitMatches.length;
  const symbolCount = symbolMatches.length;
  const specialCharCount = uppercaseCount + digitCount + symbolCount;

  // 驗證長度
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(
      `密碼長度至少需要 ${PASSWORD_REQUIREMENTS.MIN_LENGTH} 個字符（目前 ${password.length} 個）`
    );
  }

  // 驗證複雜度
  if (specialCharCount < PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS) {
    errors.push(
      `密碼需包含至少 ${PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS} 個大寫字母、數字或符號（目前 ${specialCharCount} 個）`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    details: {
      length: password.length,
      minLength: PASSWORD_REQUIREMENTS.MIN_LENGTH,
      uppercaseCount,
      digitCount,
      symbolCount,
      specialCharCount,
      requiredSpecialChars: PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS,
    },
  };
}

/**
 * 簡單驗證密碼是否符合要求
 *
 * @param password - 要驗證的密碼
 * @returns boolean - 是否符合密碼要求
 *
 * @example
 * ```typescript
 * if (!isPasswordValid('MyP@ssw0rd123')) {
 *   throw new Error('密碼不符合要求');
 * }
 * ```
 */
export function isPasswordValid(password: string): boolean {
  return validatePasswordStrength(password).isValid;
}

/**
 * 獲取密碼驗證錯誤訊息（單一訊息）
 *
 * @param password - 要驗證的密碼
 * @returns string | null - 錯誤訊息，如果有效則返回 null
 */
export function getPasswordValidationError(password: string): string | null {
  const result = validatePasswordStrength(password);
  if (result.isValid) {
    return null;
  }
  return result.errors.join('；');
}

/**
 * 輔助函數：轉義正則表達式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
