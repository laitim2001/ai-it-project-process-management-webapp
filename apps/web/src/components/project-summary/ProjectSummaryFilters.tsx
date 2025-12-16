/**
 * @fileoverview ProjectSummaryFilters - Project Summary 過濾器組件
 *
 * @description
 * 提供 Project Summary Tab 的過濾功能，包含財務年度選擇和預算類別多選。
 * 使用 Combobox 組件實現可搜尋的下拉選單，支援多選功能。
 *
 * @component ProjectSummaryFilters
 *
 * @features
 * - 財務年度單選下拉選單
 * - 預算類別多選下拉選單（可搜尋）
 * - 重置按鈕
 * - 響應式設計
 *
 * @dependencies
 * - @/components/ui/button - Button 組件
 * - @/components/ui/select - Select 組件
 * - @/components/ui/popover - Popover 組件
 * - @/lib/trpc - tRPC Client
 * - next-intl - 國際化
 *
 * @related
 * - apps/web/src/app/[locale]/om-summary/page.tsx - 主頁面
 * - packages/api/src/routers/project.ts - API
 * - packages/api/src/routers/budgetPool.ts - 預算池 API
 *
 * @author IT Department
 * @since FEAT-006 - Project Summary Tab
 * @lastModified 2025-12-05
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Check, ChevronsUpDown, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ProjectSummaryFilterState {
  financialYear: number;
  budgetCategoryIds: string[];
}

interface BudgetCategoryOption {
  id: string;
  categoryName: string;
  categoryCode: string | null;
}

interface ProjectSummaryFiltersProps {
  filters: ProjectSummaryFilterState;
  onFiltersChange: (filters: ProjectSummaryFilterState) => void;
  availableYears: number[];
  budgetCategoryOptions: BudgetCategoryOption[];
  isLoading?: boolean;
  /** CHANGE-030: 搜索詞 */
  searchTerm?: string;
  /** CHANGE-030: 搜索詞變更回調 */
  onSearchChange?: (term: string) => void;
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
}: {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
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

export function ProjectSummaryFilters({
  filters,
  onFiltersChange,
  availableYears,
  budgetCategoryOptions,
  isLoading = false,
  searchTerm = '',
  onSearchChange,
}: ProjectSummaryFiltersProps) {
  const t = useTranslations('projectSummary');

  // 處理年度變更
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const financialYear = parseInt(e.target.value, 10);
    onFiltersChange({
      ...filters,
      financialYear,
    });
  };

  // 處理預算類別變更
  const handleCategoryChange = (budgetCategoryIds: string[]) => {
    onFiltersChange({
      ...filters,
      budgetCategoryIds,
    });
  };

  // 重置過濾器
  const handleReset = () => {
    const financialYear = availableYears[0] || new Date().getFullYear();
    onFiltersChange({
      financialYear,
      budgetCategoryIds: budgetCategoryOptions.map((c) => c.id),
    });
  };

  // 轉換預算類別選項格式
  const categorySelectOptions = React.useMemo(
    () =>
      budgetCategoryOptions.map((c) => ({
        value: c.id,
        label: c.categoryCode ? `${c.categoryCode} - ${c.categoryName}` : c.categoryName,
      })),
    [budgetCategoryOptions]
  );

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* 財務年度 */}
        <div className="space-y-2">
          <Label htmlFor="financialYear">{t('filters.financialYear')}</Label>
          <NativeSelect id="financialYear"
            value={filters.financialYear.toString()}
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

        {/* 預算類別多選 */}
        <div className="space-y-2">
          <Label>{t('filters.budgetCategories')}</Label>
          <MultiSelect
            options={categorySelectOptions}
            value={filters.budgetCategoryIds}
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

      {/* CHANGE-030: 搜索輸入框 */}
      <div className="space-y-2">
        <Label htmlFor="projectSearch">{t('search.label')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="projectSearch"
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange?.('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('search.clear')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectSummaryFilters;
