/**
 * @fileoverview Sidebar Component - 側邊欄導航組件
 *
 * @description
 * 提供應用程式的主要導航側邊欄，包含品牌標識、用戶資訊和分類導航選單。
 * 支援多層級導航結構（概覽、專案預算、採購、系統），
 * 動態高亮當前頁面，顯示用戶角色和線上狀態，提供完整的導航體驗。
 *
 * @component Sidebar
 *
 * @features
 * - 品牌標識和應用標題顯示
 * - 用戶資訊卡片（頭像、姓名、角色、線上狀態）
 * - 分類導航結構（4 大分類：概覽、專案預算、採購、系統）
 * - 當前頁面高亮顯示（URL 路徑匹配）
 * - 導航項目懸停效果和圖示
 * - 底部導航區域（設定、說明）
 * - 多語言支援（繁中/英文）
 * - 響應式設計（桌面和移動裝置）
 *
 * @navigation
 * - 概覽區：Dashboard
 * - 專案預算區：預算池、專案、提案
 * - 採購區：廠商、報價、採購單、費用、O&M 費用、成本分攤
 * - 系統區：使用者管理
 * - 底部區：設定、說明
 *
 * @stateManagement
 * - useSession: NextAuth 會話狀態（用戶資訊、角色）
 * - usePathname: 當前路徑（用於高亮導航）
 * - useTranslations: 國際化翻譯
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next-auth/react: 用戶會話管理
 * - lucide-react: 圖示組件（10+ 圖示）
 * - @/i18n/routing: 國際化路由
 * - Tailwind CSS: 樣式和佈局
 *
 * @related
 * - apps/web/src/components/layout/TopBar.tsx - 頂部導航欄組件
 * - apps/web/src/components/layout/dashboard-layout.tsx - 佈局容器組件
 * - packages/auth/src/index.ts - NextAuth 配置
 * - apps/web/src/messages/zh-TW.json - 翻譯檔案
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

"use client"

import { useTranslations } from 'next-intl'
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Wallet,
  Building,
  Building2,
  FileCheck,
  ShoppingCart,
  Receipt,
  Users,
  Settings,
  HelpCircle,
  Target,
  ArrowRightLeft,
  Coins,
  BarChart3,
  Tags,
  Upload,
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
  const t = useTranslations('navigation')

  const navigation: NavigationSection[] = [
    {
      title: t('sections.overview'),
      items: [
        {
          name: t('menu.dashboard'),
          href: "/dashboard",
          icon: LayoutDashboard,
          description: t('descriptions.dashboard')
        },
      ]
    },
    {
      title: t('sections.projectBudget'),
      items: [
        {
          name: t('menu.budgetPools'),
          href: "/budget-pools",
          icon: Wallet,
          description: t('descriptions.budgetPools')
        },
        {
          name: t('menu.projects'),
          href: "/projects",
          icon: FolderKanban,
          description: t('descriptions.projects')
        },
        {
          name: t('menu.proposals'),
          href: "/proposals",
          icon: FileText,
          description: t('descriptions.proposals')
        },
      ]
    },
    {
      title: t('sections.procurement'),
      items: [
        {
          name: t('menu.vendors'),
          href: "/vendors",
          icon: Building,
          description: t('descriptions.vendors')
        },
        {
          name: t('menu.quotes'),
          href: "/quotes",
          icon: FileCheck,
          description: t('descriptions.quotes')
        },
        {
          name: t('menu.purchaseOrders'),
          href: "/purchase-orders",
          icon: ShoppingCart,
          description: t('descriptions.purchaseOrders')
        },
        {
          name: t('menu.expenses'),
          href: "/expenses",
          icon: Receipt,
          description: t('descriptions.expenses')
        },
        {
          name: t('menu.omExpenses'),
          href: "/om-expenses",
          icon: Target,
          description: t('descriptions.omExpenses')
        },
        {
          name: t('menu.omSummary'),
          href: "/om-summary",
          icon: BarChart3,
          description: t('descriptions.omSummary')
        },
        {
          name: t('menu.chargeOuts'),
          href: "/charge-outs",
          icon: ArrowRightLeft,
          description: t('descriptions.chargeOuts')
        },
      ]
    },
    {
      title: t('sections.system'),
      items: [
        {
          name: t('menu.users'),
          href: "/users",
          icon: Users,
          description: t('descriptions.users')
        },
        {
          name: t('menu.operatingCompanies'),
          href: "/operating-companies",
          icon: Building2,
          description: t('descriptions.operatingCompanies')
        },
        {
          name: t('menu.omExpenseCategories'),
          href: "/om-expense-categories",
          icon: Tags,
          description: t('descriptions.omExpenseCategories')
        },
        {
          name: t('menu.currencies'),
          href: "/settings/currencies",
          icon: Coins,
          description: t('descriptions.currencies')
        },
        {
          name: t('menu.dataImport'),
          href: "/data-import",
          icon: Upload,
          description: t('descriptions.dataImport')
        },
      ]
    },
  ]

  const bottomNavigation = [
    {
      name: t('menu.settings'),
      href: "/settings",
      icon: Settings,
      description: t('descriptions.settings')
    },
    // TODO: 待實現 Help 頁面後恢復
    // {
    //   name: t('menu.help'),
    //   href: "/help",
    //   icon: HelpCircle,
    //   description: t('descriptions.help')
    // },
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
            <span className="text-sm font-semibold text-foreground">{t('brand.title')}</span>
            <span className="text-xs text-muted-foreground">{t('brand.subtitle')}</span>
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
            {session?.user?.name || t('user.profile')}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {(session?.user as any)?.role?.name || t('user.role')}
          </p>
        </div>
        <div className="flex h-2 w-2 rounded-full bg-green-400" title={t('user.status.online')}></div>
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
