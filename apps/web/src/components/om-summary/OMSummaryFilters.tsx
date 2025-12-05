/**
 * @fileoverview OMSummaryFilters - O&M Summary 過濾器組件
 *
 * @description
 * 提供 O&M Summary 頁面的過濾功能，包含財務年度選擇、OpCo 多選和 Category 多選。
 * 使用 Combobox 組件實現可搜尋的下拉選單，支援多選功能。
 *
 * FEAT-007 說明：此組件的過濾邏輯不受新架構影響，因為：
 * - 年度過濾：基於 OMExpense.financialYear
 * - OpCo 過濾：新架構中 OpCo 在 OMExpenseItem 層級，API 會處理聚合
 * - Category 過濾：基於 OMExpense.category
 * 過濾參數傳遞給 API，由 API 層處理資料聚合邏輯。
 *
 * @component OMSummaryFilters
 *
 * @features
 * - 財務年度單選下拉選單
 * - OpCo 多選下拉選單（可搜尋）
 * - O&M Category 多選下拉選單（可搜尋）
 * - 重置按鈕
 * - 響應式設計
 *
 * @dependencies
 * - @/components/ui/button - Button 組件
 * - @/components/ui/select - Select 組件
 * - @/lib/trpc - tRPC Client
 * - next-intl - 國際化
 *
 * @related
 * - apps/web/src/app/[locale]/om-summary/page.tsx - 主頁面
 * - packages/api/src/routers/omExpense.ts - API (getSummary)
 * - packages/api/src/routers/operatingCompany.ts - OpCo API
 *
 * @author IT Department
 * @since FEAT-003 - O&M Summary Page
 * @lastModified 2025-12-05
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterState {
  currentYear: number;
  previousYear: number;
  opCoIds: string[];
  categories: string[];
}

interface OpCoOption {
  id: string;
  code: string;
  name: string;
}

interface OMSummaryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableYears: number[];
  opCoOptions: OpCoOption[];
  categoryOptions: string[];
  isLoading?: boolean;
}

/**
 * 多選下拉組件
 * 支援搜尋和選擇多個選項
 */
function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  _getLabel,
  _getValue,
}: {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  _getLabel?: (option: { label: string; value: string }) => string;
  _getValue?: (option: { label: string; value: string }) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const displayText = React.useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length) return `${placeholder} (All)`;
    if (value.length === 1) {
      const selected = options.find((o) => o.value === value[0]);
      return selected?.label || placeholder;
    }
    return `${value.length} selected`;
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {/* Select All option */}
            <div
              onClick={handleSelectAll}
              className={cn(
                'hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none font-medium border-b mb-1',
                value.length === options.length && 'bg-accent'
              )}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  value.length === options.length ? 'opacity-100' : 'opacity-0'
                )}
              />
              Select All
            </div>
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      isSelected && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function OMSummaryFilters({
  filters,
  onFiltersChange,
  availableYears,
  opCoOptions,
  categoryOptions,
  isLoading = false,
}: OMSummaryFiltersProps) {
  const t = useTranslations('omSummary');

  // 處理年度變更
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currentYear = parseInt(e.target.value, 10);
    onFiltersChange({
      ...filters,
      currentYear,
      previousYear: currentYear - 1,
    });
  };

  // 處理 OpCo 變更
  const handleOpCoChange = (opCoIds: string[]) => {
    onFiltersChange({
      ...filters,
      opCoIds,
    });
  };

  // 處理 Category 變更
  const handleCategoryChange = (categories: string[]) => {
    onFiltersChange({
      ...filters,
      categories,
    });
  };

  // 重置過濾器
  const handleReset = () => {
    const currentYear = availableYears[0] || new Date().getFullYear();
    onFiltersChange({
      currentYear,
      previousYear: currentYear - 1,
      opCoIds: opCoOptions.map((o) => o.id),
      categories: categoryOptions,
    });
  };

  // 轉換 OpCo 選項格式
  const opCoSelectOptions = React.useMemo(
    () =>
      opCoOptions.map((o) => ({
        value: o.id,
        label: `${o.code} - ${o.name}`,
      })),
    [opCoOptions]
  );

  // 轉換 Category 選項格式
  const categorySelectOptions = React.useMemo(
    () =>
      categoryOptions.map((c) => ({
        value: c,
        label: c,
      })),
    [categoryOptions]
  );

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 財務年度 */}
        <div className="space-y-2">
          <Label htmlFor="financialYear">{t('filters.financialYear')}</Label>
          <NativeSelect
            id="financialYear"
            value={filters.currentYear.toString()}
            onChange={handleYearChange}
            disabled={isLoading}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                FY{year}
              </option>
            ))}
          </NativeSelect>
        </div>

        {/* OpCo 多選 */}
        <div className="space-y-2">
          <Label>{t('filters.opCos')}</Label>
          <MultiSelect
            options={opCoSelectOptions}
            value={filters.opCoIds}
            onChange={handleOpCoChange}
            placeholder={t('filters.selectOpCos')}
            searchPlaceholder={t('filters.searchOpCos')}
            emptyText={t('filters.noOpCoFound')}
            disabled={isLoading}
          />
        </div>

        {/* Category 多選 */}
        <div className="space-y-2">
          <Label>{t('filters.categories')}</Label>
          <MultiSelect
            options={categorySelectOptions}
            value={filters.categories}
            onChange={handleCategoryChange}
            placeholder={t('filters.selectCategories')}
            searchPlaceholder={t('filters.searchCategories')}
            emptyText={t('filters.noCategoryFound')}
            disabled={isLoading}
          />
        </div>

        {/* 重置按鈕 */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('filters.reset')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OMSummaryFilters;
