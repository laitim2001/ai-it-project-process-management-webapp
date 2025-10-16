'use client';

/**
 * User 列表頁面
 *
 * 顯示所有使用者的列表，包含以下功能：
 * - 顯示使用者資訊（名稱、Email、角色）
 * - 根據角色篩選
 * - 新增使用者
 * - 編輯使用者
 * - 刪除使用者
 */

import Link from 'next/link';
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
                <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>使用者管理</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                無法載入使用者資料，請稍後再試或聯繫系統管理員。
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
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>使用者管理</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">使用者管理</h1>
            <p className="mt-2 text-muted-foreground">管理系統中的所有使用者</p>
          </div>
          <Link href="/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增使用者
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>電子郵件</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground font-medium">尚無使用者資料</p>
                      <p className="text-sm text-muted-foreground mt-2">點擊上方「新增使用者」按鈕開始</p>
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
                        {user.name || '(未設定名稱)'}
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
                          ? '專案管理者'
                          : user.role.name === 'Supervisor'
                          ? '監督者'
                          : '管理員'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="mr-4 text-primary hover:text-primary/80 transition-colors"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        編輯
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
          總共 {users.length} 位使用者
        </div>
      </div>
    </DashboardLayout>
  );
}
