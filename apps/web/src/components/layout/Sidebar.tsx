/**
 * @fileoverview Sidebar Component - 側邊欄導航組件
 *
 * @description
 * 提供應用程式的主要導航側邊欄，包含品牌標識、用戶資訊和分類導航選單。
 * 支援多層級導航結構（概覽、專案預算、採購、系統），
 * 動態高亮當前頁面，顯示用戶角色和線上狀態，提供完整的導航體驗。
 *
 * FEAT-011: 整合權限管理系統，根據用戶有效權限動態過濾菜單項。
 * 權限計算邏輯：角色預設權限 + 用戶自訂覆蓋（granted=true 新增, granted=false 移除）
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
 * - FEAT-011: 權限過濾（根據用戶權限動態顯示/隱藏菜單）
 * - FEAT-011: 空區段自動隱藏
 * - FEAT-011: 載入狀態骨架屏
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
 * - usePermissions: FEAT-011 權限狀態（權限代碼、檢查方法）
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next-auth/react: 用戶會話管理
 * - lucide-react: 圖示組件（10+ 圖示）
 * - @/i18n/routing: 國際化路由
 * - @/hooks/usePermissions: 權限管理 Hook (FEAT-011)
 * - Tailwind CSS: 樣式和佈局
 *
 * @related
 * - apps/web/src/components/layout/TopBar.tsx - 頂部導航欄組件
 * - apps/web/src/components/layout/dashboard-layout.tsx - 佈局容器組件
 * - packages/auth/src/index.ts - NextAuth 配置
 * - apps/web/src/messages/zh-TW.json - 翻譯檔案
 * - apps/web/src/hooks/usePermissions.ts - 權限管理 Hook (FEAT-011)
 * - packages/api/src/routers/permission.ts - 權限 API (FEAT-011)
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-12-14
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
  FolderUp,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions, MENU_PERMISSIONS } from "@/hooks/usePermissions"
import { Skeleton } from "@/components/ui/skeleton"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  /** FEAT-011: 權限代碼，用於過濾菜單顯示 */
  permissionCode?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const t = useTranslations('navigation')

  // FEAT-011: 權限管理 Hook
  const { hasPermission, isLoading: isPermissionLoading } = usePermissions()

  // 導航配置（含權限代碼）
  const navigation: NavigationSection[] = [
    {
      title: t('sections.overview'),
      items: [
        {
          name: t('menu.dashboard'),
          href: "/dashboard",
          icon: LayoutDashboard,
          description: t('descriptions.dashboard'),
          permissionCode: MENU_PERMISSIONS.DASHBOARD,
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
          description: t('descriptions.budgetPools'),
          permissionCode: MENU_PERMISSIONS.BUDGET_POOLS,
        },
        {
          name: t('menu.projects'),
          href: "/projects",
          icon: FolderKanban,
          description: t('descriptions.projects'),
          permissionCode: MENU_PERMISSIONS.PROJECTS,
        },
        {
          name: t('menu.proposals'),
          href: "/proposals",
          icon: FileText,
          description: t('descriptions.proposals'),
          permissionCode: MENU_PERMISSIONS.PROPOSALS,
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
          description: t('descriptions.vendors'),
          permissionCode: MENU_PERMISSIONS.VENDORS,
        },
        {
          name: t('menu.quotes'),
          href: "/quotes",
          icon: FileCheck,
          description: t('descriptions.quotes'),
          permissionCode: MENU_PERMISSIONS.QUOTES,
        },
        {
          name: t('menu.purchaseOrders'),
          href: "/purchase-orders",
          icon: ShoppingCart,
          description: t('descriptions.purchaseOrders'),
          permissionCode: MENU_PERMISSIONS.PURCHASE_ORDERS,
        },
        {
          name: t('menu.expenses'),
          href: "/expenses",
          icon: Receipt,
          description: t('descriptions.expenses'),
          permissionCode: MENU_PERMISSIONS.EXPENSES,
        },
        {
          name: t('menu.omExpenses'),
          href: "/om-expenses",
          icon: Target,
          description: t('descriptions.omExpenses'),
          permissionCode: MENU_PERMISSIONS.OM_EXPENSES,
        },
        {
          name: t('menu.omSummary'),
          href: "/om-summary",
          icon: BarChart3,
          description: t('descriptions.omSummary'),
          permissionCode: MENU_PERMISSIONS.OM_SUMMARY,
        },
        {
          name: t('menu.chargeOuts'),
          href: "/charge-outs",
          icon: ArrowRightLeft,
          description: t('descriptions.chargeOuts'),
          permissionCode: MENU_PERMISSIONS.CHARGE_OUTS,
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
          description: t('descriptions.users'),
          permissionCode: MENU_PERMISSIONS.USERS,
        },
        {
          name: t('menu.operatingCompanies'),
          href: "/operating-companies",
          icon: Building2,
          description: t('descriptions.operatingCompanies'),
          permissionCode: MENU_PERMISSIONS.OPERATING_COMPANIES,
        },
        {
          name: t('menu.omExpenseCategories'),
          href: "/om-expense-categories",
          icon: Tags,
          description: t('descriptions.omExpenseCategories'),
          permissionCode: MENU_PERMISSIONS.OM_EXPENSE_CATEGORIES,
        },
        {
          name: t('menu.currencies'),
          href: "/settings/currencies",
          icon: Coins,
          description: t('descriptions.currencies'),
          permissionCode: MENU_PERMISSIONS.CURRENCIES,
        },
        {
          name: t('menu.dataImport'),
          href: "/data-import",
          icon: Upload,
          description: t('descriptions.dataImport'),
          permissionCode: MENU_PERMISSIONS.DATA_IMPORT,
        },
        {
          name: t('menu.projectDataImport'),
          href: "/project-data-import",
          icon: FolderUp,
          description: t('descriptions.projectDataImport'),
          permissionCode: MENU_PERMISSIONS.PROJECT_DATA_IMPORT,
        },
      ]
    },
  ]

  const bottomNavigation: NavigationItem[] = [
    {
      name: t('menu.settings'),
      href: "/settings",
      icon: Settings,
      description: t('descriptions.settings'),
      permissionCode: MENU_PERMISSIONS.SETTINGS,
    },
    // TODO: 待實現 Help 頁面後恢復
    // {
    //   name: t('menu.help'),
    //   href: "/help",
    //   icon: HelpCircle,
    //   description: t('descriptions.help')
    // },
  ]

  /**
   * FEAT-011: 過濾導航項目
   * 根據用戶有效權限過濾菜單項目，並自動隱藏空白區段
   */
  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // 無權限代碼的項目預設顯示
        if (!item.permissionCode) return true
        // 根據權限代碼過濾
        return hasPermission(item.permissionCode)
      }),
    }))
    // 過濾掉空白區段
    .filter((section) => section.items.length > 0)

  /**
   * FEAT-011: 過濾底部導航項目
   */
  const filteredBottomNavigation = bottomNavigation.filter((item) => {
    if (!item.permissionCode) return true
    return hasPermission(item.permissionCode)
  })

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
        {/* FEAT-011: 權限載入狀態骨架屏 */}
        {isPermissionLoading ? (
          <div className="space-y-8" aria-busy="true" aria-label="載入導航選單中">
            {/* 骨架屏：模擬 4 個區段 */}
            {[1, 2, 3, 4].map((sectionIndex) => (
              <div key={sectionIndex}>
                <Skeleton className="h-3 w-20 mb-3" />
                <div className="space-y-1">
                  {[1, 2, 3].slice(0, sectionIndex === 1 ? 1 : 3).map((itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3 px-3 py-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* FEAT-011: 使用過濾後的導航配置 */}
            {filteredNavigation.map((section) => (
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
        )}

        {/* 底部導航 */}
        <div className="mt-auto pt-6 border-t border-border">
          {isPermissionLoading ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-3 px-3 py-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* FEAT-011: 使用過濾後的底部導航配置 */}
              {filteredBottomNavigation.map((item) => {
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
          )}
        </div>
      </nav>
    </div>
  )
}
