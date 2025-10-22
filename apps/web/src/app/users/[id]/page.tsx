'use client';

/**
 * User 詳情頁面
 *
 * 顯示單一使用者的詳細資訊
 */

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { User as UserIcon, Mail, Calendar, Shield, Folder, Edit } from 'lucide-react';

/**
 * 角色顯示配置
 */
const ROLE_CONFIG = {
  Admin: { label: '管理員', variant: 'error' as const },
  Supervisor: { label: '監督者', variant: 'warning' as const },
  ProjectManager: { label: '專案管理者', variant: 'success' as const },
} as const;

/**
 * 專案狀態顯示配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'default' as const },
  InProgress: { label: '進行中', variant: 'info' as const },
  Completed: { label: '已完成', variant: 'success' as const },
  Archived: { label: '已歸檔', variant: 'default' as const },
} as const;

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = api.user.getById.useQuery({ id: userId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-muted-foreground">載入中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">找不到使用者</h2>
            <p className="text-muted-foreground mb-4">此使用者不存在或已被刪除。</p>
            <Link href="/users">
              <Button>返回使用者列表</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role.name as keyof typeof ROLE_CONFIG] || { label: user.role.name, variant: 'default' as const };

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
              <BreadcrumbLink href="/users">使用者</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{user.name || user.email}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user.name || '(未設定名稱)'}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/users/${user.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </Button>
            </Link>
            <Link href="/users">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：主要資訊區域（2/3 寬度） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  基本資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      電子郵件
                    </dt>
                    <dd className="text-foreground font-medium">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      角色
                    </dt>
                    <dd>
                      <Badge variant={roleConfig.variant}>
                        {roleConfig.label}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      建立時間
                    </dt>
                    <dd className="text-foreground font-medium">
                      {new Date(user.createdAt).toLocaleString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      最後更新
                    </dt>
                    <dd className="text-foreground font-medium">
                      {new Date(user.updatedAt).toLocaleString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 管理的專案 */}
            {user.projects && user.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    管理的專案 ({user.projects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground mb-1">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              預算池: {project.budgetPool.name}
                            </p>
                          </div>
                          <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                            {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].label}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：監督的專案（1/3 寬度） */}
          <div className="lg:col-span-1">
            {user.approvals && user.approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    監督的專案 ({user.approvals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.approvals.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <h3 className="font-medium text-foreground mb-2">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          預算池: {project.budgetPool.name}
                        </p>
                        <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                          {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
