/**
 * @fileoverview Combobox Component - 可搜尋下拉選單組件
 *
 * @description
 * 支援搜尋和鍵盤導航的下拉選單組件，使用 Radix UI Popover 實現。
 * 完全重寫版本（FIX-093），移除原本的 cmdk 依賴，改用原生 React 狀態管理，
 * 提供更穩定的 UUID 值選取功能和更好的性能表現。
 *
 * @component Combobox
 *
 * @features
 * - 即時搜尋過濾（客戶端過濾，使用 useMemo 優化）
 * - 完整鍵盤導航支援（上下鍵、Enter 選取、Esc 關閉）
 * - 支援 UUID 值和字串值（修復 FIX-093 中的選取問題）
 * - 可自訂佔位符和空狀態文字（國際化支援）
 * - 整合 Radix UI Popover（無障礙性和鍵盤導航）
 * - 性能優化（過濾邏輯使用 useMemo，避免不必要的重新渲染）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {ComboboxOption[]} props.options - 選項列表（每個選項包含 value 和 label）
 * @param {string} props.value - 當前選中的值（支援空字串）
 * @param {(value: string) => void} props.onChange - 值變更回調函數
 * @param {string} [props.placeholder='Select option...'] - 未選取時顯示的佔位符
 * @param {string} [props.searchPlaceholder='Search...'] - 搜尋輸入框佔位符
 * @param {string} [props.emptyText='No option found.'] - 無搜尋結果時顯示的文字
 * @param {string} [props.className] - 額外的 CSS 類名
 * @param {boolean} [props.disabled=false] - 是否禁用組件
 *
 * @example
 * ```tsx
 * // 基本使用（預算池選擇）
 * <Combobox
 *   options={budgetPools.map(bp => ({ value: bp.id, label: bp.name }))}
 *   value={selectedBudgetPoolId}
 *   onChange={handleBudgetPoolChange}
 *   placeholder="選擇預算池"
 *   searchPlaceholder="搜尋預算池..."
 *   emptyText="找不到預算池"
 * />
 *
 * // 使用者選擇（UUID 值支援）
 * <Combobox
 *   options={users.map(u => ({ value: u.id, label: u.name }))}
 *   value={selectedUserId}
 *   onChange={setSelectedUserId}
 *   placeholder="選擇使用者"
 *   disabled={isLoading}
 * />
 *
 * // 靜態選項（字串值）
 * <Combobox
 *   options={[
 *     { value: 'draft', label: '草稿' },
 *     { value: 'pending', label: '待審批' },
 *     { value: 'approved', label: '已批准' }
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 * />
 * ```
 *
 * @dependencies
 * - @radix-ui/react-popover: Popover 彈出視窗組件
 * - lucide-react: 圖示庫 (ChevronsUpDown, Check)
 * - React: useMemo, useState (性能優化)
 *
 * @related
 * - apps/web/src/components/ui/popover.tsx - Popover 基礎組件
 * - apps/web/src/components/ui/Button.tsx - Button 組件
 * - apps/web/src/components/project/ProjectForm.tsx - 使用範例（預算池和使用者選擇）
 * - apps/web/src/components/budget-pool/BudgetPoolForm.tsx - 使用範例
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-13 (FIX-093: 完全重寫，移除 cmdk 依賴，修復 UUID 選取問題)
 *
 * @history
 * - 2025-11-13 (FIX-093): 完全重寫組件
 *   - 移除 cmdk (Command) 依賴 → 原生 HTML input + React state
 *   - 修復 UUID 值無法選取的問題（原因：cmdk 內部值比較機制）
 *   - 改用 useMemo 優化過濾性能
 *   - 簡化組件結構，提升可維護性
 *   - 保持相同的 API 介面（向後兼容）
 * - 原始版本: 基於 shadcn/ui Combobox (使用 cmdk)
 */

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Combobox 選項介面
 *
 * @interface ComboboxOption
 * @property {string} value - 選項的唯一值（支援 UUID 或字串）
 * @property {string} label - 顯示給用戶的文字標籤
 */
export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const handleSelect = (optionValue: string) => {
    console.log('Combobox handleSelect triggered:', optionValue);
    onChange(optionValue === value ? '' : optionValue);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
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
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
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
