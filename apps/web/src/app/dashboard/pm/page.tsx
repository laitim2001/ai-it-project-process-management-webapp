'use client';

/**
 * 專案經理儀表板頁面
 *
 * Epic 7 - Story 7.1: 專案經理儀表板核心視圖
 *
 * 功能說明:
 * - 顯示我負責的專案列表
 * - 顯示待處理的任務列表
 * - 統計數據展示
 * - 快速導航到詳情頁面
 */

import { api } from '@/lib/trpc';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

/**
 * 專案狀態配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'outline' as const, color: 'text-muted-foreground' },
  InProgress: { label: '進行中', variant: 'secondary' as const, color: 'text-green-600' },
  Completed: { label: '已完成', variant: 'default' as const, color: 'text-primary' },
  Archived: { label: '已歸檔', variant: 'outline' as const, color: 'text-muted-foreground' },
};

/**
 * 提案狀態配置
 */
const PROPOSAL_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'outline' as const },
  PendingApproval: { label: '待審批', variant: 'default' as const },
  Approved: { label: '已批准', variant: 'secondary' as const },
  Rejected: { label: '已拒絕', variant: 'destructive' as const },
  MoreInfoRequired: { label: '需補充資訊', variant: 'default' as const },
};

export default function ProjectManagerDashboard() {
  // 查詢儀表板數據
  const { data, isLoading, error } = api.dashboard.getProjectManagerDashboard.useQuery();

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
                載入儀表板失敗: {error.message}
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
          <h1 className="text-3xl font-bold text-foreground">我的儀表板</h1>
          <p className="mt-2 text-muted-foreground">專案經理工作概覽</p>
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
            title="進行中專案"
            value={stats.activeProjects}
            icon={TrendingUp}
            iconColor="text-green-600"
          />
          <StatCard
            title="待審批提案"
            value={stats.pendingApprovals}
            icon={Clock}
            iconColor="text-orange-600"
          />
          <StatCard
            title="待處理任務"
            value={stats.pendingTasks}
            icon={AlertCircle}
            iconColor="text-red-600"
          />
        </div>

        {/* 預算概覽 */}
        {stats.totalBudget > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>預算概覽</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">總預算額度</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${stats.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">已使用預算</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ${stats.usedBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">剩餘預算</p>
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
            <CardTitle>我負責的專案</CardTitle>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">尚無專案</p>
                <Link href="/projects/new">
                  <Button className="mt-4">創建第一個專案</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.slice(0, 5).map((project) => {
                  const latestProposal = project.proposals[0];
                  const config = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];

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
                                <p className="text-muted-foreground">預算池</p>
                                <p className="font-medium text-foreground">
                                  {project.budgetPool.fiscalYear} 年度
                                </p>
                              </div>
                            </div>

                            {/* 最新提案 */}
                            {latestProposal && (
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">最新提案</p>
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

                            {/* 採購單數量 */}
                            <div className="flex items-center gap-2 text-sm">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">採購單</p>
                                <p className="font-medium text-foreground">
                                  {project.purchaseOrders.length} 筆
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
                        查看全部 {myProjects.length} 個專案
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
            <CardTitle>等待我處理</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.proposalsNeedingInfo.length === 0 &&
            pendingTasks.draftExpenses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-3" />
                <p className="text-muted-foreground">太棒了！目前沒有待處理的任務</p>
              </div>
            ) : (
              <Tabs defaultValue="proposals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="proposals">
                    需補充資訊的提案
                    {pendingTasks.proposalsNeedingInfo.length > 0 && (
                      <Badge variant="warning" className="ml-2">
                        {pendingTasks.proposalsNeedingInfo.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="expenses">
                    草稿費用
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
                      <p className="text-muted-foreground">沒有需要補充資訊的提案</p>
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
                              <Badge variant="warning">需補充資訊</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              最後更新:{' '}
                              {new Date(proposal.updatedAt).toLocaleDateString('zh-TW')}
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
                      <p className="text-muted-foreground">沒有草稿費用</p>
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
                                ${expense.amount.toLocaleString()}
                              </h4>
                              <Badge variant="secondary">草稿</Badge>
                            </div>
                            <p className="text-sm text-foreground">
                              採購單: {expense.purchaseOrder.poNumber}
                            </p>
                            <p className="text-sm text-foreground">
                              專案: {expense.purchaseOrder.project.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              費用日期:{' '}
                              {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
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
