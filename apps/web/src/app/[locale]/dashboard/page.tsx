/**
 * @fileoverview Dashboard Main Page - 儀表板主頁
 *
 * @description
 * 系統主儀表板頁面，提供整體系統概覽和快速訪問入口。
 * 整合預算、專案、提案統計數據，並提供最近活動時間線和 AI 智能分析建議。
 * 支持主題切換（淺色/深色/系統），響應式設計適配各種設備。
 *
 * @page /[locale]/dashboard
 *
 * @features
 * - 統計卡片展示：月度預算、活躍專案數、待審提案數、預算使用率
 * - 預算趨勢圖表：6個月歷史趨勢視覺化
 * - 快速操作面板：6個常用功能的快速訪問入口（CHANGE-015: 權限過濾）
 * - 最近活動列表：系統活動時間線（提案批准、採購單建立、專案新增）
 * - AI 智能分析：預算優化建議和信心度評分
 * - 響應式佈局：桌面/平板/手機自適應網格
 * - 國際化支援：繁體中文/英文雙語切換
 * - 實時數據同步：Mock 數據（後續將連接 tRPC API）
 *
 * @permissions
 * - 所有已登入用戶可訪問（CHANGE-015: 通用登陸頁面）
 * - 快速操作根據菜單權限過濾顯示
 * - ProjectManager: 可查看（受限於自己管理的專案數據）
 * - Supervisor: 可查看（全局數據總覽）
 * - Admin: 可查看（系統級全局數據）
 *
 * @routing
 * - 主頁: /dashboard
 * - PM Dashboard: /dashboard/pm
 * - Supervisor Dashboard: /dashboard/supervisor
 *
 * @dependencies
 * - next-intl: 國際化翻譯支援
 * - lucide-react: 圖示庫 (Wallet, FolderKanban, FileText, TrendingUp, etc.)
 * - shadcn/ui: Card, Badge, Button UI 組件
 * - DashboardLayout: 統一的儀表板佈局容器
 * - usePermissions: 權限檢查 Hook (CHANGE-015)
 *
 * @related
 * - apps/web/src/app/[locale]/dashboard/pm/page.tsx - PM 專用儀表板
 * - apps/web/src/app/[locale]/dashboard/supervisor/page.tsx - Supervisor 儀表板
 * - apps/web/src/components/layout/dashboard-layout.tsx - Dashboard 佈局組件
 * - apps/web/src/components/dashboard/StatsCard.tsx - 統計卡片組件
 * - packages/api/src/routers/dashboard.ts - Dashboard API Router
 * - apps/web/src/hooks/usePermissions.ts - 權限管理 Hook
 *
 * @author IT Department
 * @since Epic 7 - Dashboard & Basic Reporting
 * @lastModified 2025-12-14
 */

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from '@/i18n/routing';
import { usePermissions, MENU_PERMISSIONS } from '@/hooks/usePermissions';
import {
  Wallet,
  FolderKanban,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  // CHANGE-015: 獲取用戶權限以過濾快速操作
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  // Mock data - 後續會從 tRPC API 獲取真實數據
  const stats = [
    {
      title: t('stats.monthlyBudget'),
      value: 'RM 485,200',
      change: { value: '+12.5%', isPositive: true, label: t('stats.vsLastMonth') },
      icon: Wallet,
    },
    {
      title: t('stats.activeProjects'),
      value: '24',
      change: { value: '+8', isPositive: true, label: t('stats.vsLastMonth') },
      icon: FolderKanban,
    },
    {
      title: t('stats.pendingProposals'),
      value: '32',
      change: { value: '-2.1%', isPositive: false, label: t('stats.vsLastMonth') },
      icon: FileText,
    },
    {
      title: t('stats.budgetUtilization'),
      value: '68.5%',
      change: { value: '+18.2%', isPositive: true, label: t('stats.vsLastMonth') },
      icon: TrendingUp,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: '預算提案已批准',
      subtitle: 'Q4 雲端服務擴充專案預算已獲主管批准',
      company: 'IT 部門',
      time: '1 小時前',
      amount: 'RM 150,000',
      status: 'completed',
    },
    {
      id: 2,
      title: '採購單已建立',
      subtitle: 'AI 專案管理系統開發採購單已完成',
      company: 'Tech Solutions Ltd',
      time: '2 小時前',
      amount: 'RM 85,000',
      status: 'completed',
    },
    {
      id: 3,
      title: '新專案建立',
      subtitle: '數位轉型專案已加入系統並分配預算池',
      company: 'IT 部門',
      time: '3 小時前',
      amount: 'RM 45,000',
      status: 'pending',
    },
  ];

  // CHANGE-015: 快速操作定義（含權限代碼）
  // 使用現有翻譯結構: quickActions.actions.[key].name/.description
  const allQuickActions = [
    {
      name: t('quickActions.actions.newProject.name'),
      description: t('quickActions.actions.newProject.description'),
      icon: '📁',
      href: '/projects/new',
      permission: MENU_PERMISSIONS.PROJECTS,
    },
    {
      name: t('quickActions.actions.newProposal.name'),
      description: t('quickActions.actions.newProposal.description'),
      icon: '📋',
      href: '/proposals/new',
      permission: MENU_PERMISSIONS.PROPOSALS,
    },
    {
      name: t('quickActions.actions.newBudgetPool.name'),
      description: t('quickActions.actions.newBudgetPool.description'),
      icon: '💰',
      href: '/budget-pools/new',
      permission: MENU_PERMISSIONS.BUDGET_POOLS,
    },
    {
      name: t('quickActions.actions.manageVendors.name'),
      description: t('quickActions.actions.manageVendors.description'),
      icon: '🏢',
      href: '/vendors',
      permission: MENU_PERMISSIONS.VENDORS,
    },
    {
      name: t('quickActions.actions.viewPurchaseOrders.name'),
      description: t('quickActions.actions.viewPurchaseOrders.description'),
      icon: '📄',
      href: '/purchase-orders',
      permission: MENU_PERMISSIONS.PURCHASE_ORDERS,
    },
    {
      name: t('quickActions.actions.recordExpense.name'),
      description: t('quickActions.actions.recordExpense.description'),
      icon: '💸',
      href: '/expenses/new',
      permission: MENU_PERMISSIONS.EXPENSES,
    },
  ];

  // CHANGE-015: 根據權限過濾快速操作
  const quickActions = useMemo(() => {
    if (permissionsLoading) return [];
    return allQuickActions.filter(
      (action) => !action.permission || hasPermission(action.permission)
    );
  }, [permissionsLoading, hasPermission, t]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('welcome')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.change.isPositive ? TrendingUp : TrendingDown;

            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-1 flex items-center text-xs">
                    <TrendIcon
                      className={`mr-1 h-3 w-3 ${
                        stat.change.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    <span
                      className={
                        stat.change.isPositive ? "text-green-600" : "text-red-600"
                      }
                    >
                      {stat.change.value}
                    </span>
                    <span className="ml-1 text-muted-foreground">{stat.change.label}</span>
                  </div>
                </CardContent>
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary opacity-10" />
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Budget Trends Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('budgetTrend.title')}</CardTitle>
                  <select className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>{t('budgetTrend.last6Months')}</option>
                    <option>{t('budgetTrend.last3Months')}</option>
                    <option>{t('budgetTrend.thisMonth')}</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex h-52 items-end justify-between gap-2">
                  {[18, 23, 25, 28, 32, 35].map((height, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full flex items-end justify-center">
                        <span className="absolute -top-6 text-xs rounded-full bg-green-600 px-2 py-0.5 font-medium text-white">
                          +{height}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/70"
                          style={{ height: `${height * 4.5}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{i + 1}月</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">RM 485K</p>
                    <p className="text-xs text-muted-foreground">{t('budgetTrend.monthlyBudget')}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-base font-semibold text-green-600">+7.8%</p>
                      <p className="text-xs text-muted-foreground">{t('budgetTrend.monthlyGrowth')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-primary">151</p>
                      <p className="text-xs text-muted-foreground">{t('budgetTrend.totalProposals')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - CHANGE-015: 權限過濾 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <CardTitle>{t('quickActions.title')}</CardTitle>
              </div>
              <CardDescription>{t('quickActions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                // 載入中狀態
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : quickActions.length === 0 ? (
                // 無權限時顯示提示訊息
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-3xl mb-2">🔒</span>
                  <p className="text-sm text-muted-foreground">
                    {t('quickActions.noActions')}
                  </p>
                </div>
              ) : (
                // 正常顯示快速操作
                <div className="grid grid-cols-2 gap-2.5">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="outline"
                        className="flex flex-col h-auto items-center gap-2 p-3 w-full"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xl flex-shrink-0">
                          {action.icon}
                        </div>
                        <div className="w-full">
                          <p className="text-xs font-medium text-foreground leading-tight">{action.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{action.description}</p>
                        </div>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('recentActivities.title')}</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    {t('recentActivities.viewAll')} →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-md border p-3 hover:border-muted-foreground/30 transition-colors"
                    >
                      <div className="rounded-md bg-primary/10 p-2.5">
                        {activity.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-medium text-foreground">{activity.title}</h3>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80 leading-snug">{activity.subtitle}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{activity.company}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-foreground whitespace-nowrap">{activity.amount}</p>
                        {activity.status === 'completed' && (
                          <Badge variant="success" className="mt-1">
                            {t('recentActivities.completed')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <CardTitle>{t('aiInsights.title')}</CardTitle>
              </div>
              <CardDescription>{t('aiInsights.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div className="rounded-md bg-card p-3 shadow-sm">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t('aiInsights.budgetOptimization')}</span>
                    <span className="text-xs font-semibold text-green-600">{t('aiInsights.confidence', { percent: '92' })}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {t('aiInsights.suggestion')}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[92%] bg-gradient-to-r from-green-600 to-green-400"></div>
                  </div>
                </div>

                <Button variant="outline" className="w-full justify-between">
                  <span className="text-xs font-medium text-primary">{t('aiInsights.viewDetails')}</span>
                  <span className="text-base">→</span>
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">{t('aiInsights.todayStats')}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">42</span>
                  <span className="text-xs text-foreground/80">{t('aiInsights.pendingProposals')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">8</span>
                  <span className="text-xs text-foreground/80">{t('aiInsights.todayMeetings')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
