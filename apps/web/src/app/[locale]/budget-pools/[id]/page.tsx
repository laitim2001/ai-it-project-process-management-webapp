'use client';

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useParams } from "next/navigation";
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DollarSign, Calendar, TrendingUp, Folder, Edit, Trash2, User, AlertCircle, ListTree } from 'lucide-react';

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
    variant: 'default' as const,
  },
  Completed: {
    label: '已完成',
    variant: 'secondary' as const,
  },
  Archived: {
    label: '已歸檔',
    variant: 'outline' as const,
  },
} as const;

export default function BudgetPoolDetailPage() {
  const t = useTranslations('budgetPools');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });
  const { data: stats } = api.budgetPool.getStats.useQuery({ id });

  const deleteMutation = api.budgetPool.delete.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '預算池已成功刪除！',
        variant: 'success',
      });
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
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
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-96" />

          {/* Header Skeleton */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budgetPool) {
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
                <BreadcrumbPage>詳情</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到預算池。此預算池可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/budget-pools">
                <Button>返回預算池列表</Button>
              </Link>
            </div>
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
            <h1 className="text-3xl font-bold text-foreground">{budgetPool.name}</h1>
            <p className="text-muted-foreground mt-2">財務年度 {budgetPool.financialYear}</p>
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
                    <dt className="text-sm font-medium text-muted-foreground mb-1">財務年度</dt>
                    <dd className="text-xl font-bold text-foreground">FY {budgetPool.financialYear}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">類別數量</dt>
                    <dd className="text-xl font-bold text-foreground">{budgetPool.categories.length} 個類別</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">總預算</dt>
                    <dd className="text-xl font-bold text-foreground">
                      ${(budgetPool.computedTotalAmount ?? budgetPool.totalAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">已使用金額</dt>
                    <dd className="text-xl font-bold text-orange-600">
                      ${(budgetPool.computedUsedAmount ?? 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">創建時間</dt>
                    <dd className="text-foreground font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.createdAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">最後更新</dt>
                    <dd className="text-foreground font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.updatedAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 預算類別詳細資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTree className="h-5 w-5" />
                  預算類別 ({budgetPool.categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetPool.categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">尚未有任何預算類別</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">排序</TableHead>
                          <TableHead>類別名稱</TableHead>
                          <TableHead>類別代碼</TableHead>
                          <TableHead className="text-right">總預算</TableHead>
                          <TableHead className="text-right">已使用</TableHead>
                          <TableHead className="text-right">使用率</TableHead>
                          <TableHead className="text-center">專案數</TableHead>
                          <TableHead className="text-center">支出數</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetPool.categories.map((category) => {
                          const utilizationRate = category.utilizationRate ?? 0;

                          return (
                            <TableRow key={category.id}>
                              <TableCell className="text-center text-muted-foreground">
                                {category.sortOrder}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-medium text-foreground">{category.categoryName}</div>
                                  {category.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {category.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {category.categoryCode || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${category.totalAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                ${category.usedAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${
                                  utilizationRate > 90 ? 'text-destructive' :
                                  utilizationRate > 75 ? 'text-yellow-600 dark:text-yellow-500' :
                                  'text-green-600 dark:text-green-500'
                                }`}>
                                  {utilizationRate.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {category._count.projects}
                              </TableCell>
                              <TableCell className="text-center">
                                {category._count.expenses}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
                      <dt className="text-sm font-medium text-muted-foreground mb-1">已分配金額</dt>
                      <dd className="text-lg font-bold text-primary">
                        ${stats.totalAllocated.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">已支出金額</dt>
                      <dd className="text-lg font-bold text-orange-600">
                        ${stats.totalSpent.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">剩餘預算</dt>
                      <dd className="text-lg font-bold text-green-600">
                        ${stats.remaining.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">使用率</dt>
                      <dd className="text-lg font-bold text-foreground">
                        {stats.utilizationRate.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>

                  {/* 進度條 */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">預算使用進度</span>
                      <span className="text-sm font-medium text-foreground">
                        {stats.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
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
                  <p className="text-muted-foreground text-center py-8">尚未有任何專案</p>
                ) : (
                  <div className="space-y-3">
                    {budgetPool.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <h3 className="font-medium text-foreground mb-2">{project.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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
