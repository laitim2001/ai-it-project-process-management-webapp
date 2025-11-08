/**
 * LanguageSwitcher 組件 - 語言切換器
 *
 * 功能：
 * - 顯示當前語言
 * - 快速切換語言 (繁體中文/English)
 * - 保持當前頁面路徑
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
