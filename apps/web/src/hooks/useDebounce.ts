/**
 * @fileoverview useDebounce Hook - 防抖 Hook
 *
 * @description
 * 提供值的防抖（Debounce）功能，延遲更新值直到指定時間內沒有新的變更。
 * 主要用於優化搜尋輸入框和 API 呼叫，避免頻繁觸發不必要的操作。
 *
 * @hook useDebounce
 *
 * @features
 * - 泛型支援（支援任意類型的值）
 * - 可自訂延遲時間（預設 500ms）
 * - 自動清理 setTimeout（避免記憶體洩漏）
 * - 值變更時重置計時器
 * - 簡單易用的 API
 *
 * @example
 * ```tsx
 * // 搜尋輸入框防抖
 * import { useDebounce } from '@/hooks/useDebounce';
 * import { api } from '@/lib/trpc';
 *
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 *   // 只在 debouncedSearchTerm 變更時觸發 API 查詢
 *   const { data } = api.project.search.useQuery({
 *     query: debouncedSearchTerm
 *   }, {
 *     enabled: debouncedSearchTerm.length > 0
 *   });
 *
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="搜尋專案..."
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 自動儲存草稿
 * function DraftEditor() {
 *   const [content, setContent] = useState('');
 *   const debouncedContent = useDebounce(content, 1000);
 *
 *   useEffect(() => {
 *     if (debouncedContent) {
 *       saveDraft(debouncedContent);
 *     }
 *   }, [debouncedContent]);
 *
 *   return (
 *     <textarea
 *       value={content}
 *       onChange={(e) => setContent(e.target.value)}
 *     />
 *   );
 * }
 * ```
 *
 * @dependencies
 * - react: useEffect, useState
 *
 * @related
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案列表搜尋
 * - apps/web/src/app/[locale]/vendors/page.tsx - 供應商列表搜尋
 * - apps/web/src/app/[locale]/proposals/page.tsx - 提案列表搜尋
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池列表搜尋
 * - apps/web/src/app/[locale]/purchase-orders/page.tsx - 採購單列表搜尋
 *
 * @author IT Department
 * @since MVP Phase 1
 * @lastModified 2025-11-14
 *
 * @see {@link https://www.developerway.com/posts/debouncing-in-react|Debouncing in React}
 */

import { useEffect, useState } from 'react';

/**
 * useDebounce Hook
 *
 * @template T - 值的類型（泛型）
 * @param {T} value - 要防抖的原始值
 * @param {number} [delay=500] - 延遲時間（毫秒），預設 500ms
 * @returns {T} 防抖後的值
 *
 * @description
 * 當 value 在 delay 時間內沒有變更時，才更新返回的值。
 * 每次 value 變更時，會重置計時器。
 *
 * @performance
 * - 時間複雜度: O(1)
 * - 空間複雜度: O(1)
 * - 記憶體管理: 自動清理 setTimeout，無記憶體洩漏
 *
 * @example
 * ```tsx
 * const [input, setInput] = useState('');
 * const debouncedInput = useDebounce(input, 300);
 *
 * // input 變更時，debouncedInput 會在 300ms 後才更新
 * // 如果在 300ms 內再次變更 input，計時器會重置
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 設定延遲更新的計時器
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函數：在下次 effect 執行前或組件卸載時清理計時器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
