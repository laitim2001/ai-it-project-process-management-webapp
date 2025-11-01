'use client';

/**
 * 報價單列表頁面
 *
 * 功能說明:
 * - 顯示所有報價單列表（分頁）
 * - 按專案、供應商篩選
 * - 搜尋功能
 * - 導航到專案報價詳情頁面
 *
 * Epic 5 - Story 5.2: 報價管理
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { FileCheck, Building2, FolderKanban, DollarSign, Calendar, AlertCircle, LayoutGrid, List, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function QuotesPage() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 查詢報價列表
  const { data, isLoading, error } = api.quote.getAll.useQuery({
    page,
    limit: 10,
    projectId,
    vendorId,
  });

  // 查詢所有專案（用於篩選下拉選單）
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢所有供應商（用於篩選下拉選單）
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 載入骨架屏
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-64" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
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
        <div className="space-y-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>報價單管理</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  載入報價單失敗: {error.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const quotes = data?.items ?? [];
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
              <BreadcrumbPage>報價單管理</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">報價單管理</h1>
            <p className="mt-2 text-muted-foreground">查看和管理所有供應商報價</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
                aria-label="卡片視圖"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label="列表視圖"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {/* 新增報價單按鈕 */}
            <Link href="/quotes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增報價單
              </Button>
            </Link>
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
          <div className="text-sm text-muted-foreground">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 張報價單
          </div>
        )}

        {/* 報價單顯示 - 根據視圖模式切換 */}
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-foreground">尚無報價單</h3>
                <p className="mt-1 text-muted-foreground">
                  {projectId || vendorId ? '該篩選條件下沒有報價單' : '請從專案頁面上傳報價單'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/projects/${quote.projectId}/quotes`}
                  className="block"
                >
                  <Card className="hover:border-primary hover:shadow-md transition cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* 左側：主要資訊 */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-6 w-6 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {quote.vendor.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                            {/* 專案 */}
                            <div className="flex items-center gap-2">
                              <FolderKanban className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">專案</p>
                                <p className="text-sm font-medium text-foreground">
                                  {quote.project.name}
                                </p>
                              </div>
                            </div>

                            {/* 供應商 */}
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">供應商</p>
                                <p className="text-sm font-medium text-foreground">
                                  {quote.vendor.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 右側：金額 */}
                        <div className="text-right space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">報價金額</p>
                            <p className="text-2xl font-bold text-primary">
                              ${quote.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>供應商</TableHead>
                    <TableHead>專案</TableHead>
                    <TableHead className="text-right">報價金額</TableHead>
                    <TableHead>上傳日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/projects/${quote.projectId}/quotes`}
                          className="font-medium text-primary hover:underline flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          {quote.vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.project.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${quote.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/projects/${quote.projectId}/quotes`}
                          className="text-primary hover:underline"
                        >
                          查看
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
