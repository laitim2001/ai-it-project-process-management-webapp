/**
 * Project 列表頁面
 *
 * 功能說明：
 * - 顯示所有專案的列表，支援卡片式檢視
 * - 提供搜尋、篩選、排序功能
 * - 支援分頁瀏覽
 * - 提供導出 CSV 功能
 * - 支援快速創建新專案
 *
 * 篩選條件：
 * - 搜尋：專案名稱模糊搜尋
 * - 狀態：Draft, InProgress, Completed, Archived
 * - 預算池：根據預算池 ID 篩選
 * - 排序：名稱、狀態、創建時間
 *
 * UI 特性：
 * - 響應式網格佈局（手機 1列、平板 2列、桌面 3列）
 * - 懸停效果提升用戶體驗
 * - 加載中顯示骨架屏
 * - 錯誤狀態友好提示
 */

'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';

/**
 * 專案狀態顯示配置
 * 用於統一管理專案狀態的顯示樣式和文字
 */
const PROJECT_STATUS_CONFIG = {
  Draft: {
    label: '草稿',
    variant: 'secondary' as const,
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
    variant: 'secondary' as const,
  },
} as const;

export default function ProjectsPage() {
  // ============================================================
  // State 管理
  // ============================================================

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'Draft' | 'InProgress' | 'Completed' | 'Archived' | undefined
  >(undefined);
  const [budgetPoolFilter, setBudgetPoolFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const utils = api.useContext();

  // Debounce 搜尋，避免過多 API 請求
  const debouncedSearch = useDebounce(search, 300);

  // ============================================================
  // API 查詢
  // ============================================================

  /**
   * 查詢專案列表
   * 使用 tRPC 的 useQuery hook 進行數據獲取
   */
  const { data, isLoading, error } = api.project.getAll.useQuery({
    page,
    limit: 9,
    search: debouncedSearch || undefined,
    status: statusFilter,
    budgetPoolId: budgetPoolFilter,
    sortBy,
    sortOrder,
  });

  /**
   * 查詢所有預算池（用於篩選下拉選單）
   * 只獲取最近 5 年的預算池
   */
  const currentYear = new Date().getFullYear();
  const { data: budgetPoolsData } = api.budgetPool.getAll.useQuery({
    page: 1,
    limit: 100,
    year: undefined,
    sortBy: 'year',
    sortOrder: 'desc',
  });

  const budgetPools = budgetPoolsData?.items ?? [];

  // ============================================================
  // 事件處理函數
  // ============================================================

  /**
   * 處理導出 CSV 功能
   * 根據當前篩選條件導出所有符合條件的專案
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // 使用 tRPC 客戶端獲取導出數據
      const exportData = await utils.client.project.export.query({
        search: debouncedSearch || undefined,
        status: statusFilter,
        budgetPoolId: budgetPoolFilter,
      });

      // 轉換為 CSV 並下載
      const csvContent = convertToCSV(exportData);
      const filename = generateExportFilename('projects');
      downloadCSV(csvContent, filename);

      // TODO: Add toast notification
      alert('專案資料導出成功！');
    } catch (error) {
      // TODO: Add toast notification
      alert('導出失敗，請重試。');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================
  // 加載狀態渲染
  // ============================================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">專案管理</h1>
            <p className="mt-1 text-gray-500">載入中...</p>
          </div>
          {/* 骨架屏加載動畫 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // 錯誤狀態渲染
  // ============================================================

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">專案管理</h1>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-center">載入專案時發生錯誤：{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const projects = data?.items ?? [];
  const pagination = data?.pagination;

  // ============================================================
  // 主要內容渲染
  // ============================================================

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">專案管理</h1>
            <p className="mt-1 text-gray-500">管理所有 IT 專案</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={projects.length === 0 || isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? '導出中...' : '導出 CSV'}
            </Button>
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                創建新專案
              </Button>
            </Link>
          </div>
        </div>

        {/* 搜尋和篩選欄 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜尋框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="搜尋專案名稱..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 篩選選項 */}
              <div className="flex gap-2">
                <select
                  value={statusFilter ?? ''}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                        ? (e.target.value as 'Draft' | 'InProgress' | 'Completed' | 'Archived')
                        : undefined
                    );
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">所有狀態</option>
                  <option value="Draft">草稿</option>
                  <option value="InProgress">進行中</option>
                  <option value="Completed">已完成</option>
                  <option value="Archived">已歸檔</option>
                </select>

                <select
                  value={budgetPoolFilter ?? ''}
                  onChange={(e) => {
                    setBudgetPoolFilter(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">所有預算池</option>
                  {budgetPools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name} (FY {pool.financialYear})
                    </option>
                  ))}
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                      'name' | 'status' | 'createdAt',
                      'asc' | 'desc'
                    ];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                >
                  <option value="createdAt-desc">創建時間（最新優先）</option>
                  <option value="createdAt-asc">創建時間（最舊優先）</option>
                  <option value="name-asc">名稱（A-Z）</option>
                  <option value="name-desc">名稱（Z-A）</option>
                  <option value="status-asc">狀態（升序）</option>
                  <option value="status-desc">狀態（降序）</option>
                </select>

                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 結果數量統計 */}
        {pagination && (
          <div className="text-sm text-gray-500">
            顯示第 {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} 項，共{' '}
            {pagination.total} 個專案
          </div>
        )}

        {/* 專案卡片網格 */}
        {projects.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center">
                {search || statusFilter || budgetPoolFilter
                  ? '沒有找到符合條件的專案。'
                  : '尚未有任何專案。點擊「創建新專案」開始。'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <Card className="h-full transition-all hover:border-blue-500 hover:shadow-md">
                    <CardHeader>
                      {/* 專案標題 */}
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl flex-1">{project.name}</CardTitle>
                        {/* 狀態標籤 */}
                        <Badge
                          variant={
                            PROJECT_STATUS_CONFIG[
                              project.status as keyof typeof PROJECT_STATUS_CONFIG
                            ].variant
                          }
                        >
                          {
                            PROJECT_STATUS_CONFIG[
                              project.status as keyof typeof PROJECT_STATUS_CONFIG
                            ].label
                          }
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* 專案詳細資訊 */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {/* 預算池 */}
                        <div className="flex justify-between">
                          <span>預算池：</span>
                          <span className="font-medium text-right">
                            {project.budgetPool.name}
                          </span>
                        </div>

                        {/* 專案經理 */}
                        <div className="flex justify-between">
                          <span>專案經理：</span>
                          <span className="font-medium">{project.manager.name}</span>
                        </div>

                        {/* 主管 */}
                        <div className="flex justify-between">
                          <span>主管：</span>
                          <span className="font-medium">{project.supervisor.name}</span>
                        </div>

                        {/* 提案數量 */}
                        <div className="flex justify-between">
                          <span>提案：</span>
                          <span className="font-medium">{project._count.proposals} 個</span>
                        </div>

                        {/* 採購單數量 */}
                        <div className="flex justify-between">
                          <span>採購單：</span>
                          <span className="font-medium">{project._count.purchaseOrders} 個</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 分頁控件 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  第 {pagination.page} / {pagination.totalPages} 頁
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* 頁碼按鈕 */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPage(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
