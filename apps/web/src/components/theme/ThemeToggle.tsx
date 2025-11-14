/**
 * @fileoverview Theme Toggle Component - 主題切換組件
 *
 * @description
 * 下拉選單式的主題切換器，支援淺色、深色和跟隨系統三種模式。
 * 整合 next-intl 提供國際化支援，使用 lucide-react 圖示庫顯示當前主題。
 * 提供流暢的主題切換動畫和即時視覺反饋。
 *
 * @component ThemeToggle
 *
 * @features
 * - 支援三種主題模式（Light / Dark / System）
 * - 即時主題切換（無需重新載入頁面）
 * - 國際化主題名稱（繁體中文 / English）
 * - 圖示動畫效果（主題切換時的旋轉和淡入淡出）
 * - 當前主題高亮顯示（背景色標示）
 * - 無障礙支援（ARIA labels 和鍵盤導航）
 * - 跟隨系統主題（自動偵測作業系統設定）
 *
 * @example
 * ```tsx
 * // 在 TopBar 或 Navbar 中使用
 * <TopBar>
 *   <div className="flex items-center gap-4">
 *     <ThemeToggle />
 *   </div>
 * </TopBar>
 *
 * // 在設定頁面中使用
 * <SettingsSection title="外觀設定">
 *   <ThemeToggle />
 * </SettingsSection>
 * ```
 *
 * @dependencies
 * - next-intl: 國際化框架（useTranslations）
 * - lucide-react: 圖示庫 (Sun, Moon, Monitor)
 * - @/hooks/use-theme: 自訂主題管理 Hook
 * - shadcn/ui: DropdownMenu, Button 組件
 *
 * @related
 * - apps/web/src/hooks/use-theme.ts - 主題管理 Hook
 * - apps/web/src/components/ui/dropdown-menu.tsx - 下拉選單組件
 * - apps/web/src/components/layout/TopBar.tsx - 使用範例
 * - apps/web/src/app/[locale]/settings/page.tsx - 設定頁面整合
 * - apps/web/src/messages/en.json - 英文翻譯 (common.theme.*)
 * - apps/web/src/messages/zh-TW.json - 繁中翻譯 (common.theme.*)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 *
 * @notes
 * - 主題狀態持久化至 localStorage (由 use-theme Hook 處理)
 * - System 模式會監聽作業系統的 prefers-color-scheme 變更
 * - 圖示使用 Tailwind dark: modifier 實現自動切換
 * - 支援 WCAG 2.1 AA 無障礙標準
 */

'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * ThemeToggle 組件
 *
 * @returns {JSX.Element} 主題切換下拉選單
 *
 * @description
 * 渲染一個帶圖示的按鈕，點擊後彈出包含三個主題選項的下拉選單。
 * 當前選中的主題會以背景色高亮顯示。
 */
export function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label={t('theme.toggle')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('theme.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('theme.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('theme.system')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
