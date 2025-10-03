'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { DollarSign, Calendar, TrendingUp, Folder, Edit, Trash2, User } from 'lucide-react';

/**
 * 專案狀態顯示配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: {
    label: '草稿',
    variant: 'default' as const,
  },
  InProgress: {
    label: '進行中',
    variant: 'info' as const,
  },
  Completed: {
    label: '已完成',
    variant: 'success' as const,
  },
  Archived: {
    label: '已歸檔',
    variant: 'default' as const,
  },
} as const;

export default function BudgetPoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });
  const { data: stats } = api.budgetPool.getStats.useQuery({ id });

  const deleteMutation = api.budgetPool.delete.useMutation({
    onSuccess: () => {
      showToast('預算池已成功刪除！', 'success');
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      showToast(`錯誤：${error.message}`, 'error');
    },
  });

  const handleDelete = () => {
    if (confirm('確定要刪除此預算池嗎？\n\n注意：如果預算池有關聯的專案，將無法刪除。')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-gray-600">載入中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budgetPool) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到預算池</h2>
            <p className="text-gray-600 mb-4">此預算池不存在或已被刪除。</p>
            <Link href="/budget-pools">
              <Button>返回預算池列表</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/budget-pools">預算池</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{budgetPool.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{budgetPool.name}</h1>
            <p className="text-gray-600 mt-2">財務年度 {budgetPool.financialYear}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/budget-pools/${id}/edit`}>
              <Button variant="outline" size="default">
                <Edit className="h-4 w-4 mr-2" />
                編輯預算池
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? '刪除中...' : '刪除預算池'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：主要資訊區域（2/3 寬度） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 預算池基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  預算池資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">財務年度</dt>
                    <dd className="text-xl font-bold text-gray-900">{budgetPool.financialYear}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">總預算</dt>
                    <dd className="text-xl font-bold text-gray-900">
                      ${budgetPool.totalAmount.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">創建時間</dt>
                    <dd className="text-gray-900 font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.createdAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">最後更新</dt>
                    <dd className="text-gray-900 font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.updatedAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 預算統計數據 */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    預算統計
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">已分配金額</dt>
                      <dd className="text-lg font-bold text-blue-600">
                        ${stats.totalAllocated.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">已支出金額</dt>
                      <dd className="text-lg font-bold text-orange-600">
                        ${stats.totalSpent.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">剩餘預算</dt>
                      <dd className="text-lg font-bold text-green-600">
                        ${stats.remaining.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">使用率</dt>
                      <dd className="text-lg font-bold text-gray-900">
                        {stats.utilizationRate.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>

                  {/* 進度條 */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">預算使用進度</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：專案列表（1/3 寬度） */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  關聯專案 ({budgetPool.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetPool.projects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">尚未有任何專案</p>
                ) : (
                  <div className="space-y-3">
                    {budgetPool.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-sm transition"
                      >
                        <h3 className="font-medium text-gray-900 mb-2">{project.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="h-3 w-3" />
                          <span>{project.manager.name || project.manager.email}</span>
                        </div>
                        <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                          {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
