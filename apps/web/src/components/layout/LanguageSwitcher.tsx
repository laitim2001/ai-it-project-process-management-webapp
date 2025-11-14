/**
 * @fileoverview Language Switcher Component - 語言切換器組件
 *
 * @description
 * 提供繁體中文和英文之間的語言切換功能，使用下拉選單展示可用語言。
 * 切換語言時保持當前頁面路徑，透過完整頁面重新載入確保所有翻譯正確更新，
 * 避免 React hydration 錯誤，提供流暢的多語言切換體驗。
 *
 * @component LanguageSwitcher
 *
 * @features
 * - 語言選項展示（繁體中文、English）
 * - 當前語言高亮顯示（Check 圖示）
 * - 完整頁面重新載入（避免 hydration 錯誤）
 * - 保持當前頁面路徑（URL 語言部分替換）
 * - 切換中狀態禁用（防止重複點擊）
 * - 下拉選單 UI（shadcn/ui DropdownMenu）
 * - 無障礙支援（ARIA labels）
 *
 * @stateManagement
 * - useLocale: 取得當前語言（next-intl）
 * - usePathname: 取得當前路徑（next/navigation）
 * - useState: 切換中狀態（isChanging）
 *
 * @languageOptions
 * - zh-TW: 繁體中文
 * - en: English
 *
 * @dependencies
 * - next-intl: 國際化框架（useLocale）
 * - next/navigation: Next.js 導航（usePathname）
 * - lucide-react: 圖示組件（Languages, Check）
 * - shadcn/ui: Button, DropdownMenu 組件
 *
 * @related
 * - apps/web/src/components/layout/TopBar.tsx - 頂部導航欄（使用此組件）
 * - apps/web/src/i18n/routing.ts - 國際化路由配置
 * - apps/web/src/messages/zh-TW.json - 繁中翻譯檔案
 * - apps/web/src/messages/en.json - 英文翻譯檔案
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14 (FIX-077: 使用完整頁面重新載入避免 hydration 錯誤)
 */

"use client"

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages, Check } from "lucide-react"
import { useState } from 'react'

const locales = [
  { code: 'zh-TW', name: '繁體中文', shortName: '中' },
  { code: 'en', name: 'English', shortName: 'EN' },
] as const

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return

    setIsChanging(true)

    // 使用原生瀏覽器導航進行完整頁面重新載入
    // 這樣可以完全避免 React hydration 錯誤
    // 構建新的 URL: 替換路徑中的語言部分
    const segments = pathname.split('/')
    segments[1] = newLocale // 替換語言部分 (例如: /zh-TW/dashboard -> /en/dashboard)
    const newPath = segments.join('/')

    // 使用 window.location.href 進行完整頁面重新載入
    window.location.href = newPath
  }

  const currentLocale = locales.find(l => l.code === locale) || locales[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700"
          title="切換語言 / Switch Language"
          disabled={isChanging}
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">切換語言 / Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleLocaleChange(loc.code)}
            className="flex items-center justify-between cursor-pointer"
            disabled={isChanging || locale === loc.code}
          >
            <span className="flex items-center space-x-2">
              <span className="font-medium">{loc.name}</span>
              <span className="text-xs text-gray-500">({loc.shortName})</span>
            </span>
            {locale === loc.code && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
