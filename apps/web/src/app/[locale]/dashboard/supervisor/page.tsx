/**
 * @fileoverview Supervisor Dashboard Page - 主管儀表板
 *
 * @description
 * 主管專屬的戰略級儀表板頁面，提供全組織的專案總覽和預算池財務分析。
 * 支持多維度篩選（狀態、專案經理）、數據導出（CSV）、預算池健康狀態監控。
 * 設計為高層決策者提供關鍵業務指標和資源分配洞察。
 *
 * @page /[locale]/dashboard/supervisor
 *
 * @features
 * - 全局統計卡片：總專案數、活躍專案、已完成專案、待審批數
 * - 預算池概覽：顯示所有預算池的健康狀態和使用率
 * - 專案列表（分頁）：顯示所有專案，支持每頁 10/20/50 項
 * - 多維度篩選：按狀態（Draft/InProgress/Completed/Archived）、專案經理篩選
 * - 專案經理下拉選單：顯示每位 PM 管理的專案數量
 * - CSV 數據導出：根據當前篩選條件導出專案列表
 * - 預算池詳細資訊：財年、總預算、使用率、健康指標
 * - 專案詳細卡片：PM、預算池、最新提案狀態、費用總額
 * - 響應式網格佈局：適配桌面和移動設備
 * - 即時數據同步：tRPC 查詢自動更新
 *
 * @permissions
 * - Supervisor: 可查看（全局數據，所有專案和預算池）
 * - Admin: 可查看（系統級全局數據）
 *
 * @routing
 * - Supervisor Dashboard: /dashboard/supervisor
 * - 專案詳情: /projects/[id]
 * - 預算池詳情: /budget-pools/[id]
 *
 * @dependencies
 * - next-intl: 國際化翻譯支援
 * - @tanstack/react-query: tRPC 數據查詢和快取
 * - lucide-react: 圖示庫 (Briefcase, TrendingUp, CheckCircle2, Clock, Download, etc.)
 * - shadcn/ui: Card, Badge, Button, Select, Skeleton, Alert, Table
 * - BudgetPoolOverview: 預算池概覽組件
 * - PaginationControls: 分頁控制組件
 *
 * @related
 * - packages/api/src/routers/dashboard.ts - getSupervisorDashboard procedure
 * - apps/web/src/app/[locale]/dashboard/pm/page.tsx - PM 儀表板
 * - apps/web/src/components/dashboard/BudgetPoolOverview.tsx - 預算池概覽組件
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁
 * - apps/web/src/app/[locale]/budget-pools/[id]/page.tsx - 預算池詳情頁
 *
 * @author IT Department
 * @since Epic 7 - Story 7.2: Supervisor Dashboard & Story 7.4: Budget Pool Overview
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetPoolOverview } from '@/components/dashboard/BudgetPoolOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  DollarSign,
  Calendar,
  User,
  FileText,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SupervisorDashboard() {
  const t = useTranslations('dashboardSupervisor');
  const tCommon = useTranslations('common');

  // 狀態管理
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);

  // 專案狀態配置
  const getProjectStatusConfig = (status: string) => {
    const configs = {
      Draft: { variant: 'outline' as const, icon: FileText },
      InProgress: { variant: 'secondary' as const, icon: TrendingUp },
      Completed: { variant: 'default' as const, icon: CheckCircle2 },
      Archived: { variant: 'outline' as const, icon: XCircle },
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

  // 查詢儀表板數據
  const { data, isLoading, error } = api.dashboard.getSupervisorDashboard.useQuery({
    page,
    limit: 10,
    status: status as 'Draft' | 'InProgress' | 'Completed' | 'Archived' | null,
    managerId,
  });

  // 查詢所有專案經理（用於篩選）
  const { data: managers } = api.dashboard.getProjectManagers.useQuery();

  // CSV 導出函數
  const handleExport = async () => {
    try {
      const exportData = await api.dashboard.exportProjects.query({
        role: 'Supervisor',
        status,
        managerId,
      });

      // 生成 CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers.map((h) => `"${row[h] || ''}"`).join(',')
        ),
      ].join('\n');

      // 下載文件
      const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `projects_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error(t('error.exportFailed'), error);
      alert(t('error.exportFailed'));
    }
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
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
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
                {error.message.includes('主管') && (
                  <div className="mt-2 text-sm">
                    {t('error.supervisorOnly')}
                  </div>
                )}
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

  const { projects, stats, budgetPoolOverview, pagination } = data;

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
            title={t('stats.completedProjects')}
            value={stats.completedProjects}
            icon={CheckCircle2}
            iconColor="text-gray-600"
          />
          <StatCard
            title={t('stats.pendingApprovals')}
            value={stats.pendingApprovals}
            icon={Clock}
            iconColor="text-orange-600"
          />
        </div>

        {/* Story 7.4: 預算池概覽 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('budgetPools.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetPoolOverview budgetPools={budgetPoolOverview} />
          </CardContent>
        </Card>

        {/* 專案列表區塊 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('projects.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 篩選欄 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('filters.status.label')}
                </label>
                <NativeSelect value={status || ''}
                  onChange={(e) => {
                    setStatus(e.target.value || null);
                    setPage(1);
                  }}
                >
                  <option value="">{t('filters.status.all')}</option>
                  <option value="Draft">{t('projectStatus.Draft')}</option>
                  <option value="InProgress">{t('projectStatus.InProgress')}</option>
                  <option value="Completed">{t('projectStatus.Completed')}</option>
                  <option value="Archived">{t('projectStatus.Archived')}</option>
                </NativeSelect>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('filters.manager.label')}
                </label>
                <NativeSelect value={managerId || ''}
                  onChange={(e) => {
                    setManagerId(e.target.value || null);
                    setPage(1);
                  }}
                >
                  <option value="">{t('filters.manager.all')}</option>
                  {managers?.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {t('filters.manager.projectCount', {
                        name: manager.name,
                        count: manager._count.managedProjects
                      })}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {t('filters.export')}
                </Button>
              </div>
            </div>

            {/* 結果計數 */}
            {pagination && (
              <div className="text-sm text-muted-foreground">
                {t('projects.showing', {
                  start: ((pagination.page - 1) * pagination.limit) + 1,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total
                })}
              </div>
            )}

            {/* 專案列表 */}
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {status || managerId ? t('projects.emptyFiltered') : t('projects.empty')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const config = getProjectStatusConfig(project.status);
                  const latestProposal = project.proposals[0];
                  const totalExpenses = project.purchaseOrders.reduce(
                    (sum, po) =>
                      sum +
                      po.expenses.reduce((expSum, exp) => expSum + exp.amount, 0),
                    0
                  );

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-6 border border-border rounded-lg hover:border-primary hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* 專案標題 */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-foreground">
                              {project.name}
                            </h3>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </div>

                          {/* 專案資訊網格 */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* 專案經理 */}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">{t('projects.manager')}</p>
                                <p className="text-sm font-medium text-foreground">
                                  {project.manager.name}
                                </p>
                              </div>
                            </div>

                            {/* 預算池 */}
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">{t('projects.budgetPool')}</p>
                                <p className="text-sm font-medium text-foreground">
                                  {t('projects.fiscalYear', { year: project.budgetPool.fiscalYear })}
                                </p>
                              </div>
                            </div>

                            {/* 最新提案 */}
                            {latestProposal && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('projects.latestProposal')}</p>
                                  <Badge
                                    variant={getProposalStatusConfig(latestProposal.status).variant}
                                    className="text-xs"
                                  >
                                    {getProposalStatusConfig(latestProposal.status).label}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* 費用總額 */}
                            {totalExpenses > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('projects.approvedExpenses')}</p>
                                  <p className="text-sm font-medium text-green-600">
                                    ${totalExpenses.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 採購單數量 */}
                          {project.purchaseOrders.length > 0 && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              {t('projects.purchaseOrders')}: {t('projects.purchaseOrdersCount', {
                                count: project.purchaseOrders.length
                              })}
                            </div>
                          )}
                        </div>

                        {/* 最後更新時間 */}
                        <div className="ml-4 text-right text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
