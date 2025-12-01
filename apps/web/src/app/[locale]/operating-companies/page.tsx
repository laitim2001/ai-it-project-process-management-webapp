/**
 * @fileoverview Operating Companies List Page - 營運公司列表頁面
 *
 * @description
 * 顯示所有營運公司的列表，支援搜尋和狀態過濾功能。
 * Supervisor 和 Admin 可以管理營運公司資訊。
 *
 * @page /[locale]/operating-companies
 *
 * @features
 * - 營運公司列表展示（表格視圖）
 * - 搜尋功能（代碼、名稱）
 * - 狀態過濾（全部、僅啟用、僅停用）
 * - 快速操作（編輯、切換狀態、刪除）
 * - 關聯資料計數（費用轉嫁數、OM費用數）
 * - 角色權限控制（RBAC）
 *
 * @permissions
 * - ProjectManager: 可查看
 * - Supervisor: 完整權限
 * - Admin: 完整權限
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Table, Card, Input, Select, Badge
 *
 * @related
 * - packages/api/src/routers/operatingCompany.ts - 營運公司 API Router
 * - apps/web/src/components/operating-company/OperatingCompanyActions.tsx - 操作按鈕組件
 *
 * @author IT Department
 * @since FEAT-004 - Operating Company Management
 * @lastModified 2025-12-01
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Plus, Building2, AlertCircle, Search } from 'lucide-react';
import { OperatingCompanyActions } from '@/components/operating-company';

type FilterStatus = 'all' | 'active' | 'inactive';

export default function OperatingCompaniesPage() {
  const t = useTranslations('operatingCompanies');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  // 狀態管理
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // 查詢營運公司列表
  const { data, isLoading, error, refetch } = api.operatingCompany.getAll.useQuery({
    includeInactive: true, // 獲取所有（包含停用）
  });

  // 根據過濾條件篩選資料
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((opCo) => {
      // 搜尋過濾
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        opCo.code.toLowerCase().includes(searchLower) ||
        opCo.name.toLowerCase().includes(searchLower);

      // 狀態過濾
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && opCo.isActive) ||
        (statusFilter === 'inactive' && !opCo.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

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
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-96" />
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
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">{tNav('dashboard')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {tCommon('messages.loadError')}: {error.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{tNav('dashboard')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
          <Link href="/operating-companies/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.create')}
            </Button>
          </Link>
        </div>

        {/* 搜尋和過濾欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('filters.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="w-[180px]"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="active">{t('filters.activeOnly')}</option>
            <option value="inactive">{t('filters.inactiveOnly')}</option>
          </Select>
        </div>

        {/* 結果計數 */}
        <div className="text-sm text-muted-foreground">
          {tCommon('pagination.total', { count: filteredData.length })}
        </div>

        {/* 營運公司列表 */}
        {filteredData.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' ? t('list.noResults') : t('empty')}
            </p>
          </Card>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.code')}</TableHead>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.description')}</TableHead>
                  <TableHead className="text-center">{t('table.status')}</TableHead>
                  <TableHead className="text-center">{t('table.chargeOuts')}</TableHead>
                  <TableHead className="text-center">{t('table.omExpenses')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((opCo) => (
                  <TableRow key={opCo.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/operating-companies/${opCo.id}/edit`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Building2 className="h-4 w-4" />
                        {opCo.code}
                      </Link>
                    </TableCell>
                    <TableCell>{opCo.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {opCo.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={opCo.isActive ? 'default' : 'secondary'}>
                        {opCo.isActive ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {opCo._count.chargeOuts}
                    </TableCell>
                    <TableCell className="text-center">
                      {opCo._count.omExpenses}
                    </TableCell>
                    <TableCell className="text-right">
                      <OperatingCompanyActions
                        opCo={opCo}
                        onSuccess={() => refetch()}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
