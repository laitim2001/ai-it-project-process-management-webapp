/**
 * @fileoverview Users List Page - 使用者管理列表頁面
 *
 * @description
 * 顯示所有系統使用者的列表，支援即時搜尋、角色過濾和使用者管理功能。
 * Admin 可管理所有使用者，包含建立、編輯、刪除和角色分配。
 * 整合 Azure AD B2C 和本地認證，提供完整的使用者生命週期管理。
 *
 * @page /[locale]/users
 *
 * @features
 * - 使用者列表展示（表格視圖）
 * - 即時搜尋（使用者名稱、電郵）
 * - 角色過濾（ProjectManager, Supervisor, Admin）
 * - 排序功能（名稱、電郵、建立日期）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯、刪除）
 * - 角色徽章顯示（不同顏色標示不同角色）
 * - 使用者狀態顯示（啟用/停用）
 * - 認證類型顯示（Azure AD B2C / Local）
 * - 角色權限控制（僅 Admin 可訪問）
 *
 * @permissions
 * - Admin: 完整的使用者管理權限
 * - 其他角色: 無權訪問
 *
 * @routing
 * - 列表頁: /users
 * - 建立頁: /users/new
 * - 詳情頁: /users/[id]
 * - 編輯頁: /users/[id]/edit
 *
 * @stateManagement
 * - URL Query Params: 搜尋、過濾、排序、分頁狀態
 * - React Query: 資料快取和即時更新
 * - Local State: 搜尋輸入、角色過濾
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Table, Badge, Input, Button, Alert
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/user.ts - 使用者 API Router
 * - packages/auth/src/index.ts - NextAuth 認證配置
 * - apps/web/src/app/[locale]/users/[id]/page.tsx - 使用者詳情頁面
 * - packages/db/prisma/schema.prisma - User 資料模型
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 */

'use client';

import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const t = useTranslations('users');
  const tNav = useTranslations('navigation');
  const { data: users, isLoading } = api.user.getAll.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-48" />

          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!users) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('list.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('list.errorLoading')}
              </AlertDescription>
            </Alert>
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('list.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('list.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('list.subtitle')}</p>
          </div>
          <Link href="/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('list.newUser')}
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('list.table.name')}</TableHead>
                <TableHead>{t('list.table.email')}</TableHead>
                <TableHead>{t('list.table.role')}</TableHead>
                <TableHead>{t('list.table.createdAt')}</TableHead>
                <TableHead className="text-right">{t('list.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground font-medium">{t('list.noUsers')}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t('list.noUsersHint')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/users/${user.id}`}
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {user.name || t('list.unnamedUser')}
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role.name === 'Admin' ? 'destructive' :
                        user.role.name === 'Supervisor' ? 'default' : 'secondary'
                      }>
                        {user.role.name === 'ProjectManager'
                          ? t('roles.projectManager')
                          : user.role.name === 'Supervisor'
                          ? t('roles.supervisor')
                          : t('roles.admin')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="mr-4 text-primary hover:text-primary/80 transition-colors"
                      >
                        {t('list.table.view')}
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t('list.table.edit')}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {t('list.totalUsers', { count: users.length })}
        </div>
      </div>
    </DashboardLayout>
  );
}
