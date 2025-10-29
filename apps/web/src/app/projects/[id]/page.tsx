/**
 * Project 詳情頁面
 *
 * 功能說明：
 * - 顯示專案的完整資訊（名稱、描述、狀態、預算池、專案經理、主管）
 * - 顯示專案統計數據（提案數量和金額、採購單數量和金額、費用統計）
 * - 顯示關聯的提案列表
 * - 顯示關聯的採購單列表
 * - 提供編輯和刪除操作
 *
 * 頁面佈局：
 * - 左側 2/3：專案資訊、統計數據、提案列表、採購單列表
 * - 右側 1/3：快速操作、專案團隊資訊、預算池資訊
 *
 * 業務邏輯：
 * - 刪除前檢查是否有關聯的提案或採購單
 * - 狀態變更影響專案生命週期
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowLeft, Edit, Trash2, Plus, FileText, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Package, PieChart, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

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

/**
 * 提案狀態顯示配置
 */
const PROPOSAL_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'default' as const },
  PendingApproval: { label: '待審批', variant: 'warning' as const },
  Approved: { label: '已批准', variant: 'success' as const },
  Rejected: { label: '已拒絕', variant: 'error' as const },
  MoreInfoRequired: { label: '需補充資訊', variant: 'warning' as const },
} as const;

export default function ProjectDetailPage() {
  // ============================================================
  // Hooks 和 Router
  // ============================================================

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  // ============================================================
  // API 查詢
  // ============================================================

  /**
   * 查詢專案詳細資訊
   * 包含預算池、專案經理、主管、提案、採購單等關聯數據
   */
  const { data: project, isLoading } = api.project.getById.useQuery({ id });

  /**
   * 查詢專案統計數據
   * 包含提案統計、採購統計、費用統計
   */
  const { data: stats } = api.project.getStats.useQuery({ id });

  /**
   * Module 2: 查詢專案預算使用情況
   * 包含請求預算、批准預算、實際支出、使用率、剩餘預算
   */
  const { data: budgetUsage } = api.project.getBudgetUsage.useQuery({ projectId: id });

  /**
   * 刪除專案 Mutation
   * 成功後跳轉回專案列表頁面
   */
  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '專案已成功刪除！',
        variant: 'success',
      });
      router.push('/projects');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // 事件處理函數
  // ============================================================

  /**
   * 處理刪除專案
   * 顯示確認對話框，確認後執行刪除操作
   */
  const handleDelete = () => {
    if (
      confirm(
        '確定要刪除此專案嗎？\n\n注意：如果專案有關聯的提案或採購單，將無法刪除。'
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  // ============================================================
  // 加載狀態渲染
  // ============================================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-muted-foreground">載入中...</div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // 錯誤狀態渲染
  // ============================================================

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">找不到專案</h2>
            <p className="text-muted-foreground mb-4">此專案不存在或已被刪除。</p>
            <Link href="/projects">
              <Button>返回專案列表</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // 主要內容渲染
  // ============================================================

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
              <BreadcrumbLink href="/projects">專案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                  {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline" size="default">
                <Edit className="h-4 w-4 mr-2" />
                編輯專案
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? '刪除中...' : '刪除專案'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：主要資訊區域（2/3 寬度） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 專案基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle>專案資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">專案描述</dt>
                    <dd className="text-foreground">{project.description}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">創建時間</dt>
                    <dd className="text-foreground font-medium mt-1">
                      {new Date(project.createdAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">最後更新</dt>
                    <dd className="text-foreground font-medium mt-1">
                      {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 專案統計數據 */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    專案統計
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* 提案統計 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        預算提案
                      </h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">提案總數</dt>
                          <dd className="font-medium text-foreground">{stats.totalProposals}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">已批准</dt>
                          <dd className="font-medium text-green-600">
                            {stats.approvedProposals}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">提案總金額</dt>
                          <dd className="font-medium text-foreground">
                            ${stats.totalProposedAmount.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">已批准金額</dt>
                          <dd className="font-medium text-green-600">
                            ${stats.approvedAmount.toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* 採購與費用統計 */}
                    <div className="space-y-3 border-l pl-6">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        採購與費用
                      </h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">採購單數量</dt>
                          <dd className="font-medium text-foreground">{stats.totalPurchaseOrders}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">採購總金額</dt>
                          <dd className="font-medium text-foreground">
                            ${stats.totalPurchaseAmount.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">費用記錄數</dt>
                          <dd className="font-medium text-foreground">{stats.totalExpenses}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">已支付金額</dt>
                          <dd className="font-medium text-primary">
                            ${stats.paidExpenseAmount.toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 提案列表 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    預算提案 ({project.proposals.length})
                  </CardTitle>
                  <Link href={`/proposals/new?projectId=${id}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      新增提案
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.proposals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">尚未有任何提案</p>
                ) : (
                  <div className="space-y-3">
                    {project.proposals.map((proposal) => (
                      <Link
                        key={proposal.id}
                        href={`/proposals/${proposal.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{proposal.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${proposal.amount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].variant}>
                            {PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].label}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 報價管理區塊 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    報價管理
                  </CardTitle>
                  <Link href={`/projects/${id}/quotes`}>
                    <Button variant="outline" size="sm">
                      查看報價
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    在報價管理頁面中可以上傳供應商報價、比較報價，並選擇最終供應商生成採購單
                  </p>
                  <Link href={`/projects/${id}/quotes`}>
                    <Button>
                      管理報價
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 採購單列表 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    採購單 ({project.purchaseOrders.length})
                  </CardTitle>
                  <Link href={`/purchase-orders/new?projectId=${id}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      新增採購單
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.purchaseOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">尚未有任何採購單</p>
                ) : (
                  <div className="space-y-3">
                    {project.purchaseOrders.map((po) => (
                      <Link
                        key={po.id}
                        href={`/purchase-orders/${po.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground">PO #{po.poNumber}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>供應商：{po.vendor.name}</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${po.totalAmount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(po.date).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右側：快速資訊欄（1/3 寬度） */}
          <div className="lg:col-span-1 space-y-6">
            {/* 預算池資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  預算池
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/budget-pools/${project.budgetPool.id}`}
                  className="block hover:text-primary transition"
                >
                  <p className="font-medium text-lg text-foreground mb-3">{project.budgetPool.name}</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">財務年度</dt>
                      <dd className="font-medium text-foreground">{project.budgetPool.financialYear}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">總預算</dt>
                      <dd className="font-medium text-foreground">
                        ${project.budgetPool.totalAmount.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </CardContent>
            </Card>

            {/* Module 2: 預算使用情況 */}
            {budgetUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    預算使用情況
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 預算類別 */}
                  {budgetUsage.budgetCategory && (
                    <div className="pb-3 border-b border-border">
                      <dt className="text-sm font-medium text-muted-foreground mb-1">預算類別</dt>
                      <dd className="text-foreground font-medium">{budgetUsage.budgetCategory.categoryName}</dd>
                    </div>
                  )}

                  {/* 預算金額資訊 */}
                  <dl className="space-y-3">
                    {budgetUsage.requestedBudget > 0 && (
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">請求預算</dt>
                        <dd className="font-medium text-foreground">
                          ${budgetUsage.requestedBudget.toLocaleString()}
                        </dd>
                      </div>
                    )}

                    {budgetUsage.approvedBudget > 0 && (
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">批准預算</dt>
                        <dd className="font-semibold text-primary text-lg">
                          ${budgetUsage.approvedBudget.toLocaleString()}
                        </dd>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-muted-foreground">實際支出</dt>
                      <dd className="font-medium text-foreground">
                        ${budgetUsage.actualSpent.toLocaleString()}
                      </dd>
                    </div>

                    {budgetUsage.approvedBudget > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">剩餘預算</dt>
                          <dd className={`font-medium ${budgetUsage.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${budgetUsage.remainingBudget.toLocaleString()}
                          </dd>
                        </div>

                        {/* 使用率進度條 */}
                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <dt className="text-sm text-muted-foreground">預算使用率</dt>
                            <dd className={`font-semibold ${
                              budgetUsage.utilizationRate > 100 ? 'text-red-600' :
                              budgetUsage.utilizationRate > 90 ? 'text-orange-500' :
                              budgetUsage.utilizationRate > 75 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {budgetUsage.utilizationRate.toFixed(1)}%
                            </dd>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                budgetUsage.utilizationRate > 100 ? 'bg-red-600' :
                                budgetUsage.utilizationRate > 90 ? 'bg-orange-500' :
                                budgetUsage.utilizationRate > 75 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUsage.utilizationRate, 100)}%` }}
                            />
                          </div>
                          {budgetUsage.utilizationRate > 90 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>預算使用率較高，請注意控制支出</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {budgetUsage.approvedBudget === 0 && budgetUsage.requestedBudget === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">尚未設定預算</p>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* 專案團隊 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  專案團隊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 專案經理 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">專案經理</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium">
                        {project.manager.name?.charAt(0) || 'M'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{project.manager.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{project.manager.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.manager.role.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 主管 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">主管</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-medium">
                        {project.supervisor.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{project.supervisor.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{project.supervisor.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.supervisor.role.name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/proposals/new?projectId=${id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    新增預算提案
                  </Button>
                </Link>
                <Link href={`/purchase-orders/new?projectId=${id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    新增採購單
                  </Button>
                </Link>
                <Link href={`/projects/${id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    編輯專案資訊
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
