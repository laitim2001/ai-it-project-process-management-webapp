'use client';

/**
 * 費用列表頁面
 *
 * 功能說明:
 * - 費用列表展示（分頁）
 * - 按狀態篩選（Draft, PendingApproval, Approved, Paid）
 * - 按採購單篩選
 * - 搜尋功能
 * - 導航到詳情/新增/編輯頁面
 *
 * Epic 6 - Story 6.1 & 6.2: 費用記錄與審批
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Pagination, useToast } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Calendar, DollarSign, FileText, ShoppingCart } from 'lucide-react';

/**
 * 費用狀態配置
 */
const EXPENSE_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'secondary' as const },
  PendingApproval: { label: '待審批', variant: 'warning' as const },
  Approved: { label: '已批准', variant: 'success' as const },
  Paid: { label: '已支付', variant: 'default' as const },
};

export default function ExpensesPage() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

  // 查詢費用列表
  const { data, isLoading, error } = api.expense.getAll.useQuery({
    page,
    limit: 10,
    status: status as 'Draft' | 'PendingApproval' | 'Approved' | 'Paid' | undefined,
    purchaseOrderId,
  });

  // 查詢所有採購單（用於篩選）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: purchaseOrders } = api.purchaseOrder.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢統計資訊
  const { data: stats } = api.expense.getStats.useQuery();

  // 載入骨架屏
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">費用管理</h1>
          </div>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
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
          <p className="text-red-600">載入費用失敗: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  const expenses = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>費用管理</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">費用管理</h1>
            <p className="mt-2 text-gray-600">管理和審批所有費用記錄</p>
          </div>
          <Link href="/expenses/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增費用
            </Button>
          </Link>
        </div>

        {/* 統計卡片 */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總費用記錄</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總金額</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${stats.totalAmount?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">待審批</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.statusCounts?.PendingApproval ?? 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已支付</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.statusCounts?.Paid ?? 0}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 篩選欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={status || ''}
              onChange={(e) => {
                setStatus(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">所有狀態</option>
              <option value="Draft">草稿</option>
              <option value="PendingApproval">待審批</option>
              <option value="Approved">已批准</option>
              <option value="Paid">已支付</option>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select
              value={purchaseOrderId || ''}
              onChange={(e) => {
                setPurchaseOrderId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">所有採購單</option>
              {purchaseOrders?.items.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} - {po.project.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 結果計數 */}
        {pagination && (
          <div className="text-sm text-gray-600">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 筆費用
          </div>
        )}

        {/* 費用列表 */}
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">尚無費用記錄</h3>
                <p className="mt-1 text-gray-600">
                  {status || purchaseOrderId ? '該篩選條件下沒有費用記錄' : '開始記錄專案費用'}
                </p>
                <Link href="/expenses/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    新增第一筆費用
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Link key={expense.id} href={`/expenses/${expense.id}`} className="block">
                <Card className="hover:border-blue-500 hover:shadow-md transition cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* 左側：主要資訊 */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-6 w-6 text-blue-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                ${expense.amount.toLocaleString()}
                              </h3>
                              <Badge variant={EXPENSE_STATUS_CONFIG[expense.status as keyof typeof EXPENSE_STATUS_CONFIG].variant}>
                                {EXPENSE_STATUS_CONFIG[expense.status as keyof typeof EXPENSE_STATUS_CONFIG].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                          {/* 採購單 */}
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">採購單</p>
                              <p className="text-sm font-medium text-gray-900">
                                {expense.purchaseOrder.poNumber}
                              </p>
                            </div>
                          </div>

                          {/* 專案 */}
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">專案</p>
                              <p className="text-sm font-medium text-gray-900">
                                {expense.purchaseOrder.project.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 發票 */}
                        {expense.invoiceFilePath && (
                          <div className="flex items-center gap-2 pl-9 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>{expense.invoiceFilePath.split('/').pop()}</span>
                          </div>
                        )}
                      </div>

                      {/* 右側：日期 */}
                      <div className="text-right text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(expense.createdAt).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
      </div>
    </DashboardLayout>
  );
}
