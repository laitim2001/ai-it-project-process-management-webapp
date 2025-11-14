/**
 * @fileoverview useTheme Hook - 主題管理 Hook
 *
 * @description
 * 提供應用程式主題管理功能，支援淺色（Light）、深色（Dark）和跟隨系統（System）三種模式。
 * 主題選擇會持久化至 localStorage，並自動監聽系統主題變更（當選擇 System 模式時）。
 *
 * @hook useTheme
 *
 * @features
 * - 三種主題模式（light / dark / system）
 * - 主題持久化（localStorage）
 * - 自動監聽系統主題變更（system 模式）
 * - 即時切換主題（無需重新載入頁面）
 * - 解析後的實際主題（resolvedTheme）
 * - 自動應用 CSS class 到根元素
 *
 * @example
 * ```tsx
 * // 在組件中使用
 * import { useTheme } from '@/hooks/use-theme';
 *
 * function ThemeToggle() {
 *   const { theme, resolvedTheme, setTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>當前主題設定: {theme}</p>
 *       <p>實際顯示主題: {resolvedTheme}</p>
 *
 *       <button onClick={() => setTheme('light')}>淺色</button>
 *       <button onClick={() => setTheme('dark')}>深色</button>
 *       <button onClick={() => setTheme('system')}>跟隨系統</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 根據主題顯示不同內容
 * function ThemedComponent() {
 *   const { resolvedTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       {resolvedTheme === 'dark' ? (
 *         <MoonIcon />
 *       ) : (
 *         <SunIcon />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @dependencies
 * - react: useEffect, useState
 *
 * @related
 * - apps/web/src/components/theme/ThemeToggle.tsx - 主題切換組件
 * - apps/web/src/app/[locale]/settings/page.tsx - 設定頁面
 * - apps/web/tailwind.config.ts - Tailwind CSS dark mode 配置
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 *
 * @notes
 * - 主題值儲存於 localStorage key: "theme"
 * - CSS class 應用於 document.documentElement (html 元素)
 * - System 模式使用 window.matchMedia('(prefers-color-scheme: dark)')
 * - 支援 Tailwind CSS dark: modifier
 *
 * @see {@link https://tailwindcss.com/docs/dark-mode|Tailwind CSS Dark Mode}
 */

import { useEffect, useState } from 'react';

/**
 * 主題類型
 * @typedef {'light' | 'dark' | 'system'} Theme
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * useTheme Hook 返回值
 * @interface UseThemeReturn
 * @property {Theme} theme - 當前主題設定（light / dark / system）
 * @property {'light' | 'dark'} resolvedTheme - 解析後的實際主題（light / dark）
 * @property {(theme: Theme) => void} setTheme - 設定主題的函數
 */
interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

/**
 * useTheme Hook
 *
 * @returns {UseThemeReturn} 主題管理物件
 * @returns {Theme} theme - 當前主題設定
 * @returns {'light' | 'dark'} resolvedTheme - 實際顯示的主題
 * @returns {Function} setTheme - 設定主題的函數
 *
 * @description
 * 管理應用程式的主題模式，支援三種模式：
 * - **light**: 強制使用淺色主題
 * - **dark**: 強制使用深色主題
 * - **system**: 跟隨系統主題設定
 *
 * 當選擇 system 模式時，Hook 會：
 * 1. 偵測當前系統主題偏好
 * 2. 監聽系統主題變更事件
 * 3. 自動更新 resolvedTheme
 *
 * @implementation
 * 1. 初始化時從 localStorage 讀取已儲存的主題
 * 2. 根據主題設定應用對應的 CSS class
 * 3. 將主題選擇持久化至 localStorage
 * 4. 如果是 system 模式，監聽系統主題變更
 *
 * @performance
 * - 時間複雜度: O(1)
 * - 空間複雜度: O(1)
 * - Side Effects: localStorage 寫入, DOM class 操作
 *
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme } = useTheme();
 *
 * // theme: 'system'
 * // resolvedTheme: 'dark' (如果系統偏好深色)
 *
 * setTheme('light');
 * // theme: 'light'
 * // resolvedTheme: 'light'
 * ```
 */
export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // 初始化：從 localStorage 讀取已儲存的主題
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 應用主題 CSS class 並持久化至 localStorage
  useEffect(() => {
    const root = window.document.documentElement;

    // 移除現有的主題 class
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      // 使用系統偏好設定
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }

    // 應用主題 class
    root.classList.add(effectiveTheme);
    setResolvedTheme(effectiveTheme);

    // 持久化至 localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 監聽系統主題變更（僅在 system 模式下）
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    /**
     * 處理系統主題變更事件
     * @param {MediaQueryListEvent} e - 媒體查詢事件
     */
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
