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
import { Plus } from 'lucide-react';

export default async function UsersPage() {
  const users = await api.user.getAll.query();

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
            <h1 className="text-3xl font-bold text-gray-900">使用者管理</h1>
            <p className="mt-2 text-gray-600">管理系統中的所有使用者</p>
          </div>
          <Link href="/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增使用者
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white shadow-sm">
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
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    尚無使用者資料
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/users/${user.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {user.name || '(未設定名稱)'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role.name === 'Admin' ? 'error' :
                        user.role.name === 'Supervisor' ? 'info' : 'success'
                      }>
                        {user.role.name === 'ProjectManager'
                          ? '專案管理者'
                          : user.role.name === 'Supervisor'
                          ? '監督者'
                          : '管理員'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="mr-4 text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="text-gray-600 hover:text-gray-800"
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
        <div className="text-sm text-gray-600">
          總共 {users.length} 位使用者
        </div>
      </div>
    </DashboardLayout>
  );
}
