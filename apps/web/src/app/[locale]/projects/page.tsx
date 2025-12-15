/**
 * @fileoverview Projects List Page - 專案列表頁面
 *
 * @description
 * 顯示用戶有權訪問的所有專案列表，支援即時搜尋、多條件過濾、排序和分頁功能。
 * Project Manager 只能看到自己管理的專案，Supervisor 可以看到所有專案。
 * 整合 tRPC 查詢和 React Query 進行資料快取和即時更新，提供卡片和列表兩種視圖模式。
 *
 * @page /[locale]/projects
 *
 * @features
 * - 雙視圖模式（卡片視圖和列表視圖）
 * - 即時搜尋（防抖 300ms，專案名稱 OR 專案編號模糊搜尋）
 * - 多條件過濾（預算池、狀態、全域標誌、優先權、貨幣篩選）
 * - 排序功能（名稱、狀態、建立日期、專案編號、優先權）
 * - 分頁導航（每頁 9 項）
 * - CSV 導出功能（導出所有符合條件的專案）
 * - 快速操作（查看詳情、建立新專案）
 * - 響應式網格佈局（手機 1 欄、平板 2 欄、桌面 3 欄）
 * - 載入骨架屏和錯誤處理
 *
 * @permissions
 * - ProjectManager: 查看自己管理的專案
 * - Supervisor: 查看所有專案
 * - Admin: 查看所有專案 + 管理權限
 *
 * @routing
 * - 列表頁: /projects
 * - 建立頁: /projects/new
 * - 詳情頁: /projects/[id]
 * - 編輯頁: /projects/[id]/edit
 *
 * @stateManagement
 * - URL Query Params: 搜尋、過濾、排序、分頁狀態
 * - React Query: 資料快取和即時更新
 * - React State: 視圖模式（卡片/列表）、導出狀態
 * - useDebounce Hook: 搜尋防抖（300ms）
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Table, Input, Badge, Button, Breadcrumb
 * - lucide-react: 圖示庫
 * - @/hooks/useDebounce: 防抖 Hook
 * - @/lib/exportUtils: CSV 導出工具
 *
 * @related
 * - packages/api/src/routers/project.ts - 專案 API Router
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁面
 * - apps/web/src/app/[locale]/projects/new/page.tsx - 建立專案頁面
 * - apps/web/src/lib/exportUtils.ts - CSV 導出工具
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-12-15 (CHANGE-019: 批量刪除功能 - 複選框選擇 + AlertDialog 確認)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Trash2
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';

export default function ProjectsPage() {
  // ============================================================
  // Translations & State 管理
  // ============================================================
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');

  // Session and Toast
  const { data: session } = useSession();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'Draft' | 'InProgress' | 'Completed' | 'Archived' | undefined
  >(undefined);
  const [budgetPoolFilter, setBudgetPoolFilter] = useState<string | undefined>(undefined);
  // FEAT-001: 新增篩選器
  const [globalFlagFilter, setGlobalFlagFilter] = useState<'RCL' | 'Region' | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<'High' | 'Medium' | 'Low' | undefined>(undefined);
  const [currencyFilter, setCurrencyFilter] = useState<string | undefined>(undefined);
  // FEAT-010: 新增財務年度篩選器
  const [fiscalYearFilter, setFiscalYearFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt' | 'projectCode' | 'priority' | 'fiscalYear'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  // CHANGE-019: 批量選擇和刪除狀態
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 使用 ref 保持輸入框 focus
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

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
    // FEAT-001: 新增篩選參數
    globalFlag: globalFlagFilter,
    priority: priorityFilter,
    currencyId: currencyFilter,
    // FEAT-010: 財務年度篩選
    fiscalYear: fiscalYearFilter,
    sortBy,
    sortOrder,
  });

  // 在查詢完成後恢復搜索框焦點，避免用戶輸入時被打斷
  useEffect(() => {
    // 只在搜索框之前有焦點且查詢完成時才恢復焦點
    if (!isLoading && searchInputRef.current) {
      const activeElement = document.activeElement;
      // 如果當前焦點不在搜索框，且用戶正在輸入（search 不為空），則恢復焦點
      if (activeElement !== searchInputRef.current && search.length > 0) {
        const cursorPosition = searchInputRef.current.selectionStart;
        searchInputRef.current.focus();
        // 恢復光標位置
        if (cursorPosition !== null) {
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }
  }, [isLoading, debouncedSearch, search]);

  /**
   * 查詢所有預算池（用於篩選下拉選單）
   * 只獲取最近 5 年的預算池
   */
  const { data: budgetPoolsData } = api.budgetPool.getAll.useQuery({
    page: 1,
    limit: 100,
    financialYear: undefined,
    sortBy: 'year',
    sortOrder: 'desc',
  });

  const budgetPools = budgetPoolsData?.items ?? [];

  /**
   * 查詢啟用的貨幣列表（用於篩選下拉選單）
   * FEAT-001: 貨幣篩選器
   */
  const { data: currenciesData } = api.currency.getAll.useQuery({
    includeInactive: false, // 只顯示啟用的貨幣
  });

  const currencies = currenciesData ?? [];

  /**
   * 查詢系統中所有財務年度（用於篩選下拉選單）
   * FEAT-010: 財務年度篩選器
   */
  const { data: fiscalYearsData } = api.project.getFiscalYears.useQuery();
  const fiscalYears = fiscalYearsData?.fiscalYears ?? [];

  /**
   * CHANGE-019: 批量刪除專案 Mutation
   */
  const deleteManyMutation = api.project.deleteMany.useMutation({
    onSuccess: (result) => {
      toast({
        title: tToast('success.title'),
        description: t('list.batchDelete.success', { count: result.deletedCount }),
        variant: 'success',
      });
      setSelectedProjects([]);
      setIsDeleteDialogOpen(false);
      utils.project.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // CHANGE-019: 批量選擇輔助函數
  // ============================================================

  /**
   * 檢查專案是否可被刪除
   * - 狀態必須為 Draft
   * - 用戶必須是專案經理或 Admin
   */
  const canDeleteProject = (project: {
    id: string;
    status: string;
    managerId: string;
  }): boolean => {
    if (!session?.user) return false;

    const isDraft = project.status === 'Draft';
    const isManager = project.managerId === session.user.id;
    const isAdmin = session.user.role?.name === 'Admin';

    return isDraft && (isManager || isAdmin);
  };

  /**
   * 獲取可刪除的專案列表
   */
  const deletableProjects = (data?.items ?? []).filter(canDeleteProject);

  /**
   * 切換單個專案選擇
   */
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  /**
   * 切換全選/取消全選（僅可刪除的專案）
   */
  const toggleSelectAll = () => {
    if (selectedProjects.length === deletableProjects.length && deletableProjects.length > 0) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(deletableProjects.map(p => p.id));
    }
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = () => {
    if (selectedProjects.length > 0) {
      deleteManyMutation.mutate({ ids: selectedProjects });
    }
  };

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
      alert(t('messages.exportSuccess'));
    } catch (error) {
      // TODO: Add toast notification
      alert(t('messages.exportFailed'));
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
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-muted-foreground">{tCommon('loading')}</p>
          </div>
          {/* 骨架屏加載動畫 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
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
          {/* 麵包屑導航 */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">{tCommon('nav.dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          </div>
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{t('error.loadFailed', { message: error.message })}</p>
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
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tCommon('nav.dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={projects.length === 0 || isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? t('actions.exporting') : t('actions.exportCSV')}
            </Button>
            {/* CHANGE-019: 批量刪除按鈕 */}
            {selectedProjects.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteManyMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('list.batchDelete.button', { count: selectedProjects.length })}
              </Button>
            )}
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.createNew')}
              </Button>
            </Link>
          </div>
        </div>

        {/* CHANGE-019: 批量刪除確認對話框 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('list.batchDelete.dialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('list.batchDelete.dialogDescription', { count: selectedProjects.length })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteManyMutation.isPending
                  ? tCommon('actions.deleting')
                  : tCommon('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 搜尋和篩選欄 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜尋框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // 搜索時重置到第一頁
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 篩選選項 */}
              <div className="flex flex-wrap gap-2">
                {/* 狀態篩選 */}
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
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  <option value="Draft">{tCommon('status.draft')}</option>
                  <option value="InProgress">{tCommon('status.inProgress')}</option>
                  <option value="Completed">{tCommon('status.completed')}</option>
                  <option value="Archived">{tCommon('status.archived')}</option>
                </select>

                {/* 預算池篩選 */}
                <select
                  value={budgetPoolFilter ?? ''}
                  onChange={(e) => {
                    setBudgetPoolFilter(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.allBudgetPools')}</option>
                  {budgetPools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name} (FY {pool.financialYear})
                    </option>
                  ))}
                </select>

                {/* FEAT-010: 財務年度篩選 */}
                <select
                  value={fiscalYearFilter ?? ''}
                  onChange={(e) => {
                    setFiscalYearFilter(e.target.value ? parseInt(e.target.value) : undefined);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.fiscalYear.label')}：{t('filters.fiscalYear.all')}</option>
                  {fiscalYears.map((fy) => (
                    <option key={fy} value={fy}>
                      FY {fy}
                    </option>
                  ))}
                </select>

                {/* FEAT-001: 全域標誌篩選 */}
                <select
                  value={globalFlagFilter ?? ''}
                  onChange={(e) => {
                    setGlobalFlagFilter(
                      e.target.value ? (e.target.value as 'RCL' | 'Region') : undefined
                    );
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.globalFlag.label')}：{t('filters.globalFlag.all')}</option>
                  <option value="RCL">{t('filters.globalFlag.rcl')}</option>
                  <option value="Region">{t('filters.globalFlag.region')}</option>
                </select>

                {/* FEAT-001: 優先權篩選 */}
                <select
                  value={priorityFilter ?? ''}
                  onChange={(e) => {
                    setPriorityFilter(
                      e.target.value ? (e.target.value as 'High' | 'Medium' | 'Low') : undefined
                    );
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.priority.label')}：{t('filters.priority.all')}</option>
                  <option value="High">{t('filters.priority.high')}</option>
                  <option value="Medium">{t('filters.priority.medium')}</option>
                  <option value="Low">{t('filters.priority.low')}</option>
                </select>

                {/* FEAT-001: 貨幣篩選 */}
                <select
                  value={currencyFilter ?? ''}
                  onChange={(e) => {
                    setCurrencyFilter(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.currency.label')}：{t('filters.currency.all')}</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>

                {/* 排序選項 (FEAT-001: 新增 projectCode 和 priority 排序) */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                      'name' | 'status' | 'createdAt' | 'projectCode' | 'priority',
                      'asc' | 'desc'
                    ];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="createdAt-desc">{t('sort.createdAtDesc')}</option>
                  <option value="createdAt-asc">{t('sort.createdAtAsc')}</option>
                  <option value="name-asc">{t('sort.nameAsc')}</option>
                  <option value="name-desc">{t('sort.nameDesc')}</option>
                  <option value="projectCode-asc">{t('sort.projectCodeAsc')}</option>
                  <option value="projectCode-desc">{t('sort.projectCodeDesc')}</option>
                  <option value="priority-asc">{t('sort.priorityAsc')}</option>
                  <option value="priority-desc">{t('sort.priorityDesc')}</option>
                  <option value="status-asc">{t('sort.statusAsc')}</option>
                  <option value="status-desc">{t('sort.statusDesc')}</option>
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
          <div className="text-sm text-muted-foreground">
            {t('pagination.showing', {
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
        )}

        {/* 專案顯示區域 - 根據視圖模式切換 */}
        {projects.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {search || statusFilter || budgetPoolFilter || globalFlagFilter || priorityFilter || currencyFilter || fiscalYearFilter
                  ? t('empty.noResults')
                  : t('empty.noProjects')}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <Card className="h-full transition-all hover:border-primary hover:shadow-md">
                    <CardHeader>
                      {/* 專案標題 */}
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl flex-1">{project.name}</CardTitle>
                        {/* 狀態標籤 */}
                        <Badge
                          variant={
                            project.status === 'Draft' ? 'secondary' :
                            project.status === 'InProgress' ? 'info' :
                            project.status === 'Completed' ? 'success' : 'secondary'
                          }
                        >
                          {tCommon(`status.${project.status.charAt(0).toLowerCase() + project.status.slice(1)}`)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* 專案詳細資訊 */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {/* 預算池 */}
                        <div className="flex justify-between">
                          <span>{t('fields.budgetPool')}：</span>
                          <span className="font-medium text-right">
                            {project.budgetPool.name}
                          </span>
                        </div>

                        {/* 專案經理 */}
                        <div className="flex justify-between">
                          <span>{t('fields.manager')}：</span>
                          <span className="font-medium">{project.manager.name}</span>
                        </div>

                        {/* 主管 */}
                        <div className="flex justify-between">
                          <span>{t('fields.supervisor')}：</span>
                          <span className="font-medium">{project.supervisor.name}</span>
                        </div>

                        {/* 提案數量 */}
                        <div className="flex justify-between">
                          <span>{t('fields.proposals')}：</span>
                          <span className="font-medium">{project._count.proposals} {tCommon('units.items')}</span>
                        </div>

                        {/* 採購單數量 */}
                        <div className="flex justify-between">
                          <span>{t('fields.purchaseOrders')}：</span>
                          <span className="font-medium">{project._count.purchaseOrders} {tCommon('units.items')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* CHANGE-019: 批量選擇複選框 */}
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          deletableProjects.length > 0 &&
                          selectedProjects.length === deletableProjects.length
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={deletableProjects.length === 0}
                        aria-label={t('list.batchDelete.selectAll')}
                      />
                    </TableHead>
                    <TableHead>{t('table.name')}</TableHead>
                    <TableHead>{t('table.projectCode')}</TableHead>
                    <TableHead>{t('table.fiscalYear')}</TableHead>
                    <TableHead>{t('table.globalFlag')}</TableHead>
                    <TableHead>{t('table.priority')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.budgetPool')}</TableHead>
                    <TableHead>{t('table.manager')}</TableHead>
                    <TableHead>{t('table.supervisor')}</TableHead>
                    <TableHead className="text-center">{t('table.proposals')}</TableHead>
                    <TableHead className="text-center">{t('table.purchaseOrders')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const isDeletable = canDeleteProject(project);
                    const isSelected = selectedProjects.includes(project.id);
                    return (
                    <TableRow key={project.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                      {/* CHANGE-019: 批量選擇複選框 */}
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProjectSelection(project.id)}
                          disabled={!isDeletable}
                          aria-label={t('list.batchDelete.selectProject', { name: project.name })}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      {/* FEAT-001: 專案編號 */}
                      <TableCell>
                        <span className="font-mono text-sm">{project.projectCode}</span>
                      </TableCell>
                      {/* FEAT-010: 財務年度 */}
                      <TableCell>
                        {project.fiscalYear ? (
                          <Badge variant="outline">FY {project.fiscalYear}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {/* FEAT-001: 全域標誌 */}
                      <TableCell>
                        <Badge variant={project.globalFlag === 'RCL' ? 'default' : 'secondary'}>
                          {project.globalFlag}
                        </Badge>
                      </TableCell>
                      {/* FEAT-001: 優先權 */}
                      <TableCell>
                        <Badge
                          variant={
                            project.priority === 'High' ? 'destructive' :
                            project.priority === 'Medium' ? 'warning' : 'secondary'
                          }
                        >
                          {t(`fields.priority.${project.priority.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            project.status === 'Draft' ? 'secondary' :
                            project.status === 'InProgress' ? 'info' :
                            project.status === 'Completed' ? 'success' : 'secondary'
                          }
                        >
                          {tCommon(`status.${project.status.charAt(0).toLowerCase() + project.status.slice(1)}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.budgetPool.name}</TableCell>
                      <TableCell>{project.manager.name}</TableCell>
                      <TableCell>{project.supervisor.name}</TableCell>
                      <TableCell className="text-center">{project._count.proposals}</TableCell>
                      <TableCell className="text-center">{project._count.purchaseOrders}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {tCommon('actions.view')}
                        </Link>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* 分頁控件 */}
        {projects.length > 0 && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('pagination.pageInfo', { current: pagination.page, total: pagination.totalPages })}
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
      </div>
    </DashboardLayout>
  );
}
