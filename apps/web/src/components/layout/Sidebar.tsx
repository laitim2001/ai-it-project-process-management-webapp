"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Wallet,
  Building,
  FileCheck,
  ShoppingCart,
  Receipt,
  Users,
  Settings,
  HelpCircle,
  Target,
} from "lucide-react"
import { useSession } from "next-auth/react"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navigation: NavigationSection[] = [
    {
      title: "概覽",
      items: [
        {
          name: "儀表板",
          href: "/dashboard",
          icon: LayoutDashboard,
          description: "專案總覽和關鍵指標"
        },
      ]
    },
    {
      title: "專案與預算",
      items: [
        {
          name: "專案管理",
          href: "/projects",
          icon: FolderKanban,
          description: "專案資料和進度管理"
        },
        {
          name: "預算提案",
          href: "/proposals",
          icon: FileText,
          description: "預算提案申請與審批"
        },
        {
          name: "預算池",
          href: "/budget-pools",
          icon: Wallet,
          description: "年度預算分配管理"
        },
      ]
    },
    {
      title: "採購管理",
      items: [
        {
          name: "供應商",
          href: "/vendors",
          icon: Building,
          description: "供應商資料管理"
        },
        {
          name: "報價單",
          href: "/quotes",
          icon: FileCheck,
          description: "供應商報價管理"
        },
        {
          name: "採購單",
          href: "/purchase-orders",
          icon: ShoppingCart,
          description: "採購訂單追蹤"
        },
        {
          name: "費用記錄",
          href: "/expenses",
          icon: Receipt,
          description: "費用發票與核銷"
        },
      ]
    },
    {
      title: "系統管理",
      items: [
        {
          name: "用戶管理",
          href: "/users",
          icon: Users,
          description: "用戶帳號和權限"
        },
      ]
    },
  ]

  const bottomNavigation = [
    {
      name: "系統設定",
      href: "/settings",
      icon: Settings,
      description: "系統參數設定"
    },
    {
      name: "幫助中心",
      href: "/help",
      icon: HelpCircle,
      description: "使用指南和支援"
    },
  ]

  // 獲取用戶名稱首字母
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 shadow-lg border-r border-border">
      {/* Logo 和品牌 */}
      <div className="flex h-16 shrink-0 items-center border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">IT 專案管理</span>
            <span className="text-xs text-muted-foreground">流程平台</span>
          </div>
        </Link>
      </div>

      {/* 用戶資訊 */}
      <div className="flex items-center space-x-3 rounded-lg bg-muted p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-medium text-primary-foreground">
            {getUserInitials(session?.user?.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {session?.user?.name || "用戶"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {(session?.user as any)?.role?.name || "角色"}
          </p>
        </div>
        <div className="flex h-2 w-2 rounded-full bg-green-400"></div>
      </div>

      {/* 主導航 */}
      <nav className="flex flex-1 flex-col">
        <div className="space-y-8">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="mt-3 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                      )}
                      title={item.description}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs font-medium',
                            item.badge === 'NEW'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 底部導航 */}
        <div className="mt-auto pt-6 border-t border-border">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  title={item.description}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 shrink-0',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
