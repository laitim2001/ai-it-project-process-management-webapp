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
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetPoolOverview } from '@/components/dashboard/BudgetPoolOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
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

/**
 * 專案狀態配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'secondary' as const, icon: FileText },
  InProgress: { label: '進行中', variant: 'success' as const, icon: TrendingUp },
  Completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle2 },
  Archived: { label: '已歸檔', variant: 'secondary' as const, icon: XCircle },
};

/**
 * 提案狀態配置
 */
const PROPOSAL_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'secondary' as const },
  PendingApproval: { label: '待審批', variant: 'warning' as const },
  Approved: { label: '已批准', variant: 'success' as const },
  Rejected: { label: '已拒絕', variant: 'destructive' as const },
  MoreInfoRequired: { label: '需補充資訊', variant: 'warning' as const },
};

export default function SupervisorDashboard() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);

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
      console.error('導出失敗:', error);
      alert('導出失敗，請稍後再試');
    }
  };

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">主管儀表板</h1>
            <p className="mt-2 text-gray-600">部門專案總覽</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤處理
  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">載入失敗</h2>
          <p className="text-red-600">{error.message}</p>
          {error.message.includes('主管') && (
            <p className="text-sm text-red-500 mt-2">
              此頁面僅限部門主管訪問
            </p>
          )}
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
          <h1 className="text-3xl font-bold text-gray-900">主管儀表板</h1>
          <p className="mt-2 text-gray-600">部門專案總覽與預算監控</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="總專案數"
            value={stats.totalProjects}
            icon={Briefcase}
            iconColor="text-blue-600"
          />
          <StatCard
            title="進行中"
            value={stats.activeProjects}
            icon={TrendingUp}
            iconColor="text-green-600"
          />
          <StatCard
            title="已完成"
            value={stats.completedProjects}
            icon={CheckCircle2}
            iconColor="text-gray-600"
          />
          <StatCard
            title="待審批提案"
            value={stats.pendingApprovals}
            icon={Clock}
            iconColor="text-orange-600"
          />
        </div>

        {/* Story 7.4: 預算池概覽 */}
        <Card>
          <CardHeader>
            <CardTitle>預算池概覽</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetPoolOverview budgetPools={budgetPoolOverview} />
          </CardContent>
        </Card>

        {/* 專案列表區塊 */}
        <Card>
          <CardHeader>
            <CardTitle>部門專案總覽</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 篩選欄 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  專案狀態
                </label>
                <Select
                  value={status || ''}
                  onChange={(e) => {
                    setStatus(e.target.value || null);
                    setPage(1);
                  }}
                >
                  <option value="">所有狀態</option>
                  <option value="Draft">草稿</option>
                  <option value="InProgress">進行中</option>
                  <option value="Completed">已完成</option>
                  <option value="Archived">已歸檔</option>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  專案經理
                </label>
                <Select
                  value={managerId || ''}
                  onChange={(e) => {
                    setManagerId(e.target.value || null);
                    setPage(1);
                  }}
                >
                  <option value="">所有專案經理</option>
                  {managers?.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager._count.managedProjects} 個專案)
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  導出數據
                </Button>
              </div>
            </div>

            {/* 結果計數 */}
            {pagination && (
              <div className="text-sm text-gray-600">
                顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} /{' '}
                {pagination.total} 個專案
              </div>
            )}

            {/* 專案列表 */}
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">
                  {status || managerId ? '該篩選條件下沒有專案' : '尚無專案'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const config =
                    PROJECT_STATUS_CONFIG[
                      project.status as keyof typeof PROJECT_STATUS_CONFIG
                    ];
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
                      className="block p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* 專案標題 */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </div>

                          {/* 專案資訊網格 */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* 專案經理 */}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">專案經理</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {project.manager.name}
                                </p>
                              </div>
                            </div>

                            {/* 預算池 */}
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">預算池</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {project.budgetPool.fiscalYear} 年度
                                </p>
                              </div>
                            </div>

                            {/* 最新提案 */}
                            {latestProposal && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">最新提案</p>
                                  <Badge
                                    variant={
                                      PROPOSAL_STATUS_CONFIG[
                                        latestProposal.status as keyof typeof PROPOSAL_STATUS_CONFIG
                                      ].variant
                                    }
                                    className="text-xs"
                                  >
                                    {
                                      PROPOSAL_STATUS_CONFIG[
                                        latestProposal.status as keyof typeof PROPOSAL_STATUS_CONFIG
                                      ].label
                                    }
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* 費用總額 */}
                            {totalExpenses > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">已批准費用</p>
                                  <p className="text-sm font-medium text-green-600">
                                    ${totalExpenses.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 採購單數量 */}
                          {project.purchaseOrders.length > 0 && (
                            <div className="mt-3 text-sm text-gray-600">
                              採購單: {project.purchaseOrders.length} 筆
                            </div>
                          )}
                        </div>

                        {/* 最後更新時間 */}
                        <div className="ml-4 text-right text-sm text-gray-500">
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
              <Pagination
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
