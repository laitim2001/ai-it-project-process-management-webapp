/**
 * @fileoverview TopBar Component - 頂部導航欄組件
 *
 * @description
 * 提供應用程式頂部導航欄，包含搜尋功能、通知中心、主題切換、語言切換和用戶選單。
 * 支援移動裝置的選單按鈕，整合通知系統即時提醒，
 * 提供用戶資訊展示和登出功能，確保完整的導航和操作體驗。
 *
 * @component TopBar
 *
 * @features
 * - 全域搜尋欄（支援鍵盤導航）
 * - 移動選單切換按鈕（lg 以下顯示）
 * - 語言切換器（繁中/英文）
 * - 主題切換器（Light/Dark/System）
 * - 通知鈴鐺（未讀數量徽章）
 * - 用戶下拉選單（頭像、姓名、角色、登出）
 * - 多語言支援（i18n）
 * - 響應式設計（移動和桌面）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {() => void} [props.onMenuClick] - 移動選單點擊回調（傳遞給 DashboardLayout）
 *
 * @example
 * ```tsx
 * <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
 * ```
 *
 * @userActions
 * - 搜尋：輸入關鍵字進行全域搜尋
 * - 語言切換：點擊地球圖示切換繁中/英文
 * - 主題切換：點擊太陽/月亮圖示切換主題
 * - 通知：點擊鈴鐺查看通知下拉選單
 * - 用戶選單：點擊頭像查看個人資訊和登出
 *
 * @dependencies
 * - next-auth/react: 用戶會話管理和登出功能
 * - next-intl: 國際化翻譯
 * - lucide-react: 圖示組件（Search, Menu, Bell, User, LogOut 等）
 * - shadcn/ui: Button, Input, Badge, DropdownMenu 組件
 *
 * @related
 * - apps/web/src/components/layout/Sidebar.tsx - 側邊欄組件
 * - apps/web/src/components/layout/LanguageSwitcher.tsx - 語言切換器
 * - apps/web/src/components/theme/ThemeToggle.tsx - 主題切換器
 * - apps/web/src/components/layout/dashboard-layout.tsx - 佈局容器
 * - packages/auth/src/index.ts - NextAuth 配置
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

"use client"

import { useState } from "react"
import { Search, Menu, LogOut, User, Settings, ChevronDown, Bell } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession()
  const t = useTranslations('navigation')
  const [notifications] = useState([
    {
      id: 1,
      type: 'success',
      title: '預算提案已批准',
      message: '您的 Q4 雲端服務預算提案已獲批准',
      time: '5分鐘前',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      title: '專案進度更新',
      message: 'AI 專案系統已進入測試階段',
      time: '1小時前',
      unread: true,
    },
    {
      id: 3,
      type: 'warning',
      title: '待辦提醒',
      message: '採購單 PO-2024-001 需要您的審批',
      time: '3小時前',
      unread: false,
    },
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  // 獲取用戶名稱首字母用於 Avatar
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // 處理登出
  const handleSignOut = async () => {
    // 獲取當前語言並重定向到對應的登入頁面
    const currentLocale = window.location.pathname.split('/')[1] || 'zh-TW';
    const loginUrl = `${window.location.origin}/${currentLocale}/login`;
    await signOut({
      callbackUrl: loginUrl,
      redirect: true
    })
  }

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左側：Mobile 菜單 + 搜索欄 */}
        <div className="flex flex-1 items-center justify-start">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 搜索欄 */}
          <div className="w-full max-w-lg lg:max-w-xs">
            <label htmlFor="search" className="sr-only">
              {t('search.label')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="search"
                name="search"
                type="search"
                placeholder={t('search.placeholder')}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 右側工具欄 */}
        <div className="flex items-center space-x-4">
          {/* 語言切換 */}
          <LanguageSwitcher />

          {/* 主題切換 */}
          <ThemeToggle />

          {/* 通知 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">{t('notifications.view')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-medium">{t('notifications.title')}</h3>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  {t('notifications.markAllRead')}
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-center text-blue-600">
                  {t('notifications.viewAll')}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用戶選單 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-sm font-medium text-white">
                    {getUserInitials(session?.user?.name)}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {session?.user?.name || t('userMenu.defaultUser')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <div className="text-sm font-medium text-gray-900">
                  {session?.user?.name || t('userMenu.defaultUser')}
                </div>
                <div className="text-xs text-gray-500">
                  {session?.user?.email}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(session?.user as any)?.role?.name || t('userMenu.defaultRole')}
                </div>
              </div>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>{t('userMenu.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>{t('userMenu.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>{t('userMenu.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

