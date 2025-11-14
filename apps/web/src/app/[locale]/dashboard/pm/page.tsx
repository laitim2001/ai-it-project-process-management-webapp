/**
 * @fileoverview Project Manager Dashboard Page - 專案經理儀表板
 *
 * @description
 * 專案經理專屬的儀表板頁面，聚焦於個人管理的專案和待處理任務。
 * 提供專案概覽、預算追蹤、待處理提案和費用列表，支持快速訪問和狀態管理。
 * 整合 tRPC 即時數據查詢，使用 React Query 進行數據快取和自動更新。
 *
 * @page /[locale]/dashboard/pm
 *
 * @features
 * - 統計卡片：總專案數、活躍專案、待審批提案、待處理任務
 * - 預算概覽：總預算、已使用預算、剩餘預算視覺化
 * - 我的專案列表：僅顯示當前用戶管理的專案（前5個）
 * - 專案狀態標籤：Draft, InProgress, Completed, Archived
 * - 待處理任務分頁：需補充資訊的提案、草稿費用列表
 * - 提案快速鏈接：點擊直達提案詳情頁補充資訊
 * - 費用快速鏈接：點擊直達費用詳情頁繼續編輯
 * - 響應式網格佈局：適配桌面和移動設備
 * - 錯誤處理：友好的錯誤提示和重試機制
 * - 骨架屏加載：提升加載體驗
 *
 * @permissions
 * - ProjectManager: 可查看（僅限自己管理的專案和任務）
 *
 * @routing
 * - PM Dashboard: /dashboard/pm
 * - 專案詳情: /projects/[id]
 * - 提案詳情: /proposals/[id]
 * - 費用詳情: /expenses/[id]
 *
 * @dependencies
 * - next-intl: 國際化翻譯支援
 * - @tanstack/react-query: tRPC 數據查詢和快取
 * - lucide-react: 圖示庫 (Briefcase, TrendingUp, Clock, AlertCircle, etc.)
 * - shadcn/ui: Card, Badge, Button, Tabs, Skeleton, Alert
 * - DashboardLayout: 統一的儀表板佈局容器
 * - Link: i18n 路由導航組件
 *
 * @related
 * - packages/api/src/routers/dashboard.ts - getProjectManagerDashboard procedure
 * - apps/web/src/app/[locale]/dashboard/supervisor/page.tsx - Supervisor 儀表板
 * - apps/web/src/components/dashboard/StatCard.tsx - 統計卡片組件
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁
 * - apps/web/src/app/[locale]/proposals/[id]/page.tsx - 提案詳情頁
 *
 * @author IT Department
 * @since Epic 7 - Story 7.1: Project Manager Dashboard Core View
 * @lastModified 2025-11-14
 */

'use client';

import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProjectManagerDashboard() {
  const t = useTranslations('dashboardPM');
  const tCommon = useTranslations('common');

  // 查詢儀表板數據
  const { data, isLoading, error } = api.dashboard.getProjectManagerDashboard.useQuery();

  // 專案狀態配置
  const getProjectStatusConfig = (status: string) => {
    const configs = {
      Draft: { variant: 'outline' as const, color: 'text-muted-foreground' },
      InProgress: { variant: 'secondary' as const, color: 'text-green-600' },
      Completed: { variant: 'default' as const, color: 'text-primary' },
      Archived: { variant: 'outline' as const, color: 'text-muted-foreground' },
    };
    return {
      label: t(`projectStatus.${status}` as any),
      ...configs[status as keyof typeof configs],
    };
  };

  // 提案狀態配置
  const getProposalStatusConfig = (status: string) => {
    const configs = {
      Draft: { variant: 'outline' as const },
      PendingApproval: { variant: 'default' as const },
      Approved: { variant: 'secondary' as const },
      Rejected: { variant: 'destructive' as const },
      MoreInfoRequired: { variant: 'default' as const },
    };
    return {
      label: t(`proposalStatus.${status}` as any),
      ...configs[status as keyof typeof configs],
    };
  };

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤處理
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md space-y-6 text-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('error.message', { error: error.message })}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return null;
  }

  const { myProjects, pendingTasks, stats } = data;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('stats.totalProjects')}
            value={stats.totalProjects}
            icon={Briefcase}
            iconColor="text-blue-600"
          />
          <StatCard
            title={t('stats.activeProjects')}
            value={stats.activeProjects}
            icon={TrendingUp}
            iconColor="text-green-600"
          />
          <StatCard
            title={t('stats.pendingApprovals')}
            value={stats.pendingApprovals}
            icon={Clock}
            iconColor="text-orange-600"
          />
          <StatCard
            title={t('stats.pendingTasks')}
            value={stats.pendingTasks}
            icon={AlertCircle}
            iconColor="text-red-600"
          />
        </div>

        {/* 預算概覽 */}
        {stats.totalBudget > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('budget.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('budget.totalBudget')}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${stats.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('budget.usedBudget')}</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ${stats.usedBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('budget.remainingBudget')}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${(stats.totalBudget - stats.usedBudget).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 我負責的專案 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('projects.title')}</CardTitle>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                {t('projects.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('projects.empty')}</p>
                <Link href="/projects/new">
                  <Button className="mt-4">{t('projects.createFirst')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.slice(0, 5).map((project) => {
                  const latestProposal = project.proposals[0];
                  const config = getProjectStatusConfig(project.status);

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {project.name}
                            </h3>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            {/* 預算池 */}
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">{t('projects.budgetPool')}</p>
                                <p className="font-medium text-foreground">
                                  {t('projects.fiscalYear', { year: project.budgetPool.fiscalYear })}
                                </p>
                              </div>
                            </div>

                            {/* 最新提案 */}
                            {latestProposal && (
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">{t('projects.latestProposal')}</p>
                                  <Badge
                                    variant={getProposalStatusConfig(latestProposal.status).variant}
                                    className="text-xs"
                                  >
                                    {getProposalStatusConfig(latestProposal.status).label}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* 採購單數量 */}
                            <div className="flex items-center gap-2 text-sm">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">{t('projects.purchaseOrders')}</p>
                                <p className="font-medium text-foreground">
                                  {t('projects.purchaseOrdersCount', { count: project.purchaseOrders.length })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Calendar className="h-5 w-5 text-muted-foreground ml-4" />
                      </div>
                    </Link>
                  );
                })}

                {myProjects.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/projects">
                      <Button variant="outline">
                        {t('projects.viewAllCount', { count: myProjects.length })}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 等待我處理的任務 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tasks.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.proposalsNeedingInfo.length === 0 &&
            pendingTasks.draftExpenses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-3" />
                <p className="text-muted-foreground">{t('tasks.empty')}</p>
              </div>
            ) : (
              <Tabs defaultValue="proposals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="proposals">
                    {t('tasks.tabs.proposals')}
                    {pendingTasks.proposalsNeedingInfo.length > 0 && (
                      <Badge variant="warning" className="ml-2">
                        {pendingTasks.proposalsNeedingInfo.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="expenses">
                    {t('tasks.tabs.expenses')}
                    {pendingTasks.draftExpenses.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {pendingTasks.draftExpenses.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* 需補充資訊的提案 */}
                <TabsContent value="proposals" className="space-y-3">
                  {pendingTasks.proposalsNeedingInfo.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{t('tasks.proposals.empty')}</p>
                    </div>
                  ) : (
                    pendingTasks.proposalsNeedingInfo.map((proposal) => (
                      <Link
                        key={proposal.id}
                        href={`/proposals/${proposal.id}`}
                        className="block p-4 border border-orange-200 bg-orange-50 rounded-lg hover:border-orange-400 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <h4 className="font-semibold text-foreground">
                                {proposal.project.name}
                              </h4>
                              <Badge variant="warning">{t('tasks.proposals.badge')}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {t('tasks.proposals.lastUpdated', {
                                date: new Date(proposal.updatedAt).toLocaleDateString()
                              })}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-orange-600" />
                        </div>
                      </Link>
                    ))
                  )}
                </TabsContent>

                {/* 草稿費用 */}
                <TabsContent value="expenses" className="space-y-3">
                  {pendingTasks.draftExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{t('tasks.expenses.empty')}</p>
                    </div>
                  ) : (
                    pendingTasks.draftExpenses.map((expense) => (
                      <Link
                        key={expense.id}
                        href={`/expenses/${expense.id}`}
                        className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Receipt className="h-5 w-5 text-muted-foreground" />
                              <h4 className="font-semibold text-foreground">
                                ${expense.totalAmount.toLocaleString()}
                              </h4>
                              <Badge variant="secondary">{t('tasks.expenses.badge')}</Badge>
                            </div>
                            <p className="text-sm text-foreground">
                              {t('tasks.expenses.purchaseOrder', { poNumber: expense.purchaseOrder.poNumber })}
                            </p>
                            <p className="text-sm text-foreground">
                              {t('tasks.expenses.project', { projectName: expense.purchaseOrder.project.name })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('tasks.expenses.expenseDate', {
                                date: new Date(expense.expenseDate).toLocaleDateString()
                              })}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
