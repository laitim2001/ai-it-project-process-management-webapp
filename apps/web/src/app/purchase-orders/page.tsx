'use client';

/**
 * PurchaseOrder 列表頁面
 *
 * 功能說明:
 * - 採購單列表展示(分頁)
 * - 按專案/供應商篩選
 * - 搜尋和排序功能
 * - 導航到詳情頁面
 *
 * Epic 5 - Story 5.4: 生成採購單記錄
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Building2, FileText, Calendar, DollarSign } from 'lucide-react';

export default function PurchaseOrdersPage() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

  // Debounce 搜尋避免過多 API 請求
  const debouncedSearch = useDebounce(search, 300);

  // 查詢採購單列表
  const { data, isLoading, error } = api.purchaseOrder.getAll.useQuery({
    page,
    limit: 10,
    projectId,
    vendorId,
  });

  // 查詢所有專案（用於篩選下拉選單）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢所有供應商（用於篩選下拉選單）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 載入骨架屏
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">採購單管理</h1>
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
          <p className="text-red-600">載入採購單失敗: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  const purchaseOrders = data?.items ?? [];
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
              <BreadcrumbPage>採購單管理</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">採購單管理</h1>
            <p className="mt-2 text-gray-600">查看和管理所有採購單記錄</p>
          </div>
        </div>

        {/* 篩選欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={projectId || ''}
              onChange={(e) => {
                setProjectId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">所有專案</option>
              {projects?.items.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select
              value={vendorId || ''}
              onChange={(e) => {
                setVendorId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">所有供應商</option>
              {vendors?.items.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 結果計數 */}
        {pagination && (
          <div className="text-sm text-gray-600">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 張採購單
          </div>
        )}

        {/* 採購單列表 */}
        {purchaseOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">尚無採購單</h3>
                <p className="mt-1 text-gray-600">
                  {projectId || vendorId ? '該篩選條件下沒有採購單' : '系統中還沒有任何採購單記錄'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchaseOrders.map((po) => (
              <Link
                key={po.id}
                href={`/purchase-orders/${po.id}`}
                className="block"
              >
                <Card className="hover:border-blue-500 hover:shadow-md transition cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* 左側：主要資訊 */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {po.poNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(po.date).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                          {/* 專案 */}
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">專案</p>
                              <p className="text-sm font-medium text-gray-900">
                                {po.project.name}
                              </p>
                            </div>
                          </div>

                          {/* 供應商 */}
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">供應商</p>
                              <p className="text-sm font-medium text-gray-900">
                                {po.vendor.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 右側：金額和費用統計 */}
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">總金額</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${po.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        {po._count && (
                          <div className="text-sm text-gray-600">
                            {po._count.expenses} 筆費用記錄
                          </div>
                        )}
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
