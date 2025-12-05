/**
 * @fileoverview Currency Select Component - 貨幣選擇組件
 *
 * @description
 * 統一的貨幣選擇下拉組件，使用 shadcn/ui Select 組件。
 * 自動從 API 載入啟用的貨幣列表，支援表單整合和驗證。
 *
 * @features
 * - 自動載入啟用的貨幣列表
 * - 顯示貨幣代碼和名稱
 * - 支援必填驗證
 * - 支援禁用狀態
 * - 載入狀態顯示
 * - 錯誤處理
 *
 * @module components/shared/CurrencySelect
 *
 * @example
 * // 基本用法
 * <CurrencySelect
 *   value={currencyId}
 *   onChange={setCurrencyId}
 *   required
 * />
 *
 * @example
 * // 與 React Hook Form 整合
 * <Controller
 *   name="currencyId"
 *   control={control}
 *   render={({ field }) => (
 *     <CurrencySelect
 *       value={field.value}
 *       onChange={field.onChange}
 *       required
 *     />
 *   )}
 * />
 *
 * @related
 * - apps/web/src/components/shared/CurrencyDisplay.tsx - 貨幣顯示組件
 * - packages/api/src/routers/currency.ts - Currency API Router
 * - apps/web/src/components/ui/select.tsx - shadcn/ui Select 組件
 *
 * @since FEAT-001 - Project Fields Enhancement
 * @lastModified 2025-11-17 (FEAT-002)
 */

'use client';

import React from 'react';
import { NativeSelect } from '@/components/ui/select';
import { api } from '@/lib/trpc';
import { useTranslations } from 'next-intl';

export interface CurrencySelectProps {
  /** 當前選中的貨幣 ID */
  value?: string;
  /** 值變更回調 */
  onChange: (value: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** Placeholder 文字（可選，預設使用 i18n） */
  placeholder?: string;
  /** 自定義 CSS 類名 */
  className?: string;
}

/**
 * 貨幣選擇下拉組件
 *
 * 從 API 載入啟用的貨幣列表並提供選擇功能。
 * 使用 tRPC 查詢，支援載入狀態和錯誤處理。
 */
export function CurrencySelect({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  className,
}: CurrencySelectProps) {
  const t = useTranslations('common');

  // 查詢啟用的貨幣列表
  const { data: currencies, isLoading, error } = api.currency.getAll.useQuery({
    includeInactive: false,
  });

  // 載入中狀態
  if (isLoading) {
    return (
      <NativeSelect disabled={true} className={className}>
        <option value="">{t('loading')}</option>
      </NativeSelect>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <NativeSelect disabled={true} className={className}>
        <option value="">{t('error')}</option>
      </NativeSelect>
    );
  }

  // 沒有可用貨幣
  if (!currencies || currencies.length === 0) {
    return (
      <NativeSelect disabled={true} className={className}>
        <option value="">{t('noCurrenciesAvailable')}</option>
      </NativeSelect>
    );
  }

  return (
    <NativeSelect value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={className}
    >
      <option value="">
        {placeholder || t('selectCurrency')}
      </option>
      {currencies.map((currency) => (
        <option key={currency.id} value={currency.id}>
          {currency.code} - {currency.name} ({currency.symbol})
        </option>
      ))}
    </NativeSelect>
  );
}

/**
 * 簡化版貨幣選擇組件（只顯示代碼）
 *
 * @example
 * <CurrencySelectCompact value={currencyId} onChange={setCurrencyId} />
 */
export function CurrencySelectCompact({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  className,
}: CurrencySelectProps) {
  const t = useTranslations('common');

  const { data: currencies, isLoading, error } = api.currency.getAll.useQuery({
    includeInactive: false,
  });

  if (isLoading || error || !currencies || currencies.length === 0) {
    return (
      <NativeSelect disabled={true} className={className}>
        <option value="">
          {isLoading ? t('loading') : error ? t('error') : t('noCurrenciesAvailable')}
        </option>
      </NativeSelect>
    );
  }

  return (
    <NativeSelect value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={className}
    >
      <option value="">
        {placeholder || t('selectCurrency')}
      </option>
      {currencies.map((currency) => (
        <option key={currency.id} value={currency.id}>
          {currency.code}
        </option>
      ))}
    </NativeSelect>
  );
}
