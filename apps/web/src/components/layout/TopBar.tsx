/**
 * TopBar 組件 - 頂部導航欄
 *
 * 功能：
 * - 顯示搜索欄
 * - 顯示通知
 * - 顯示當前登入用戶信息
 * - Mobile 菜單切換按鈕
 * - 用戶下拉菜單（登出功能）
 */

"use client"

import { useState } from "react"
import { Search, Menu, LogOut, User, Settings, ChevronDown, Bell } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession()
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
    // 使用當前的 origin 以確保重定向到正確的端口
    const loginUrl = `${window.location.origin}/login`
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
              搜索
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="search"
                name="search"
                type="search"
                placeholder="搜索專案、提案、供應商..."
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 右側工具欄 */}
        <div className="flex items-center space-x-4">
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
                <span className="sr-only">查看通知</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-medium">通知</h3>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  全部標記為已讀
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
                  查看全部通知
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
                    {session?.user?.name || "用戶"}
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
                  {session?.user?.name || "用戶"}
                </div>
                <div className="text-xs text-gray-500">
                  {session?.user?.email}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(session?.user as any)?.role?.name || "角色"}
                </div>
              </div>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>個人資料</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>帳戶設定</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
