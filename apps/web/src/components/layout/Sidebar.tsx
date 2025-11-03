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
  FileCheck,
  ShoppingCart,
  Receipt,
  Users,
  Settings,
  HelpCircle,
  Target,
  ArrowRightLeft,
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
        {
          name: t('menu.budgetPools'),
          href: "/budget-pools",
          icon: Wallet,
          description: t('descriptions.budgetPools')
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
    {
      name: t('menu.help'),
      href: "/help",
      icon: HelpCircle,
      description: t('descriptions.help')
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
