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
import { Button, Input, Select, Pagination, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';

/**
 * 專案狀態顯示配置
 * 用於統一管理專案狀態的顯示樣式和文字
 */
const PROJECT_STATUS_CONFIG = {
  Draft: {
    label: '草稿',
    color: 'bg-gray-100 text-gray-800',
  },
  InProgress: {
    label: '進行中',
    color: 'bg-blue-100 text-blue-800',
  },
  Completed: {
    label: '已完成',
    color: 'bg-green-100 text-green-800',
  },
  Archived: {
    label: '已歸檔',
    color: 'bg-gray-100 text-gray-600',
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

  const { showToast } = useToast();
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

      showToast('專案資料導出成功！', 'success');
    } catch (error) {
      showToast('導出失敗，請重試。', 'error');
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">專案管理</h1>
        </div>
        {/* 骨架屏加載動畫 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // 錯誤狀態渲染
  // ============================================================

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">載入專案時發生錯誤：{error.message}</p>
        </div>
      </div>
    );
  }

  const projects = data?.items ?? [];
  const pagination = data?.pagination;

  // ============================================================
  // 主要內容渲染
  // ============================================================

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題和操作按鈕 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">專案管理</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            isLoading={isExporting}
            disabled={projects.length === 0}
          >
            導出 CSV
          </Button>
          <Link href="/projects/new">
            <Button variant="primary">創建新專案</Button>
          </Link>
        </div>
      </div>

      {/* 搜尋和篩選欄 */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* 搜尋框 */}
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="搜尋專案名稱..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // 搜尋時重置到第一頁
            }}
            fullWidth
          />
        </div>

        {/* 狀態篩選 */}
        <Select
          value={statusFilter ?? ''}
          onChange={(e) => {
            setStatusFilter(
              e.target.value
                ? (e.target.value as 'Draft' | 'InProgress' | 'Completed' | 'Archived')
                : undefined
            );
            setPage(1);
          }}
        >
          <option value="">所有狀態</option>
          <option value="Draft">草稿</option>
          <option value="InProgress">進行中</option>
          <option value="Completed">已完成</option>
          <option value="Archived">已歸檔</option>
        </Select>

        {/* 預算池篩選 */}
        <Select
          value={budgetPoolFilter ?? ''}
          onChange={(e) => {
            setBudgetPoolFilter(e.target.value || undefined);
            setPage(1);
          }}
        >
          <option value="">所有預算池</option>
          {budgetPools.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.name} (FY {pool.financialYear})
            </option>
          ))}
        </Select>

        {/* 排序選項 */}
        <Select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-') as [
              'name' | 'status' | 'createdAt',
              'asc' | 'desc'
            ];
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
        >
          <option value="createdAt-desc">創建時間（最新優先）</option>
          <option value="createdAt-asc">創建時間（最舊優先）</option>
          <option value="name-asc">名稱（A-Z）</option>
          <option value="name-desc">名稱（Z-A）</option>
          <option value="status-asc">狀態（升序）</option>
          <option value="status-desc">狀態（降序）</option>
        </Select>
      </div>

      {/* 結果數量統計 */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          顯示第 {(pagination.page - 1) * pagination.limit + 1} -{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} 項，共{' '}
          {pagination.total} 個專案
        </div>
      )}

      {/* 專案卡片網格 */}
      {projects.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            {search || statusFilter || budgetPoolFilter
              ? '沒有找到符合條件的專案。'
              : '尚未有任何專案。點擊「創建新專案」開始。'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-md"
              >
                {/* 專案標題 */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold flex-1">{project.name}</h2>
                  {/* 狀態標籤 */}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      PROJECT_STATUS_CONFIG[
                        project.status as keyof typeof PROJECT_STATUS_CONFIG
                      ].color
                    }`}
                  >
                    {
                      PROJECT_STATUS_CONFIG[
                        project.status as keyof typeof PROJECT_STATUS_CONFIG
                      ].label
                    }
                  </span>
                </div>

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
              </Link>
            ))}
          </div>

          {/* 分頁控件 */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
