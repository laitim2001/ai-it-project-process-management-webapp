'use client';

/**
 * 主管儀表板頁面
 *
 * Epic 7 - Story 7.2: 主管儀表板 - 專案總覽視圖
 * Epic 7 - Story 7.4: 預算池概覽視圖
 *
 * 功能說明:
 * - 顯示所有專案總覽
 * - 支援按狀態和專案經理篩選
 * - 分頁功能
 * - 預算池財務摘要
 * - 數據導出功能
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetPoolOverview } from '@/components/dashboard/BudgetPoolOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
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
                <Select
                  value={status || ''}
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
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('filters.manager.label')}
                </label>
                <Select
                  value={managerId || ''}
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
                </Select>
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
