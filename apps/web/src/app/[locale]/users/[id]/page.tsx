'use client';

/**
 * @fileoverview User Detail Page - 使用者詳情頁面
 *
 * @description
 * 顯示單一使用者的完整資訊，包含基本資料、角色和關聯的專案記錄。
 * 提供編輯操作和查看使用者管理的專案、監督的專案列表。
 * 整合專案關聯資料，提供完整的使用者檔案視圖。
 *
 * @page /[locale]/users/[id]
 *
 * @features
 * - 使用者詳情展示（名稱、電郵、角色、建立日期、更新日期）
 * - 角色徽章顯示（不同顏色標示不同角色）
 * - 管理的專案列表（ProjectManager 角色）
 * - 監督的專案列表（Supervisor 角色）
 * - 專案狀態徽章（Draft, InProgress, Completed, Archived）
 * - 編輯操作按鈕（導向編輯頁）
 * - 麵包屑導航支援
 * - 國際化標籤和訊息
 *
 * @permissions
 * - Admin: 查看所有使用者詳情
 * - 其他角色: 無權訪問（或僅查看自己的資料）
 *
 * @routing
 * - 詳情頁: /users/[id]
 * - 編輯頁: /users/[id]/edit
 * - 返回列表: /users
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Badge, Button
 *
 * @related
 * - packages/api/src/routers/user.ts - 使用者 API Router (getById)
 * - apps/web/src/app/[locale]/users/page.tsx - 使用者列表頁面
 * - apps/web/src/app/[locale]/users/[id]/edit/page.tsx - 編輯頁面
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁面
 * - packages/db/prisma/schema.prisma - User, Role, Project 資料模型
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 */

import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { User as UserIcon, Mail, Calendar, Shield, Folder, Edit } from 'lucide-react';

/**
 * 角色顯示配置 - 將使用 i18n 翻譯
 */
const ROLE_CONFIG = {
  Admin: { variant: 'error' as const },
  Supervisor: { variant: 'warning' as const },
  ProjectManager: { variant: 'success' as const },
} as const;

/**
 * 專案狀態顯示配置 - 將使用 i18n 翻譯
 */
const PROJECT_STATUS_CONFIG = {
  Draft: { variant: 'default' as const },
  InProgress: { variant: 'info' as const },
  Completed: { variant: 'success' as const },
  Archived: { variant: 'default' as const },
} as const;

export default function UserDetailPage() {
  const t = useTranslations('users');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = api.user.getById.useQuery({ id: userId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-muted-foreground">{t('detail.loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('detail.notFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('detail.notFoundDesc')}</p>
            <Link href="/users">
              <Button>{t('detail.backToList')}</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role.name as keyof typeof ROLE_CONFIG] || { variant: 'default' as const };
  const getRoleLabel = (roleName: string) => {
    const roleKey = roleName.charAt(0).toLowerCase() + roleName.slice(1) as 'admin' | 'supervisor' | 'projectManager';
    return t(`roles.${roleKey}`);
  };

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
              <BreadcrumbLink asChild><Link href="/users">{t('title')}</Link></BreadcrumbLink>
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
              {user.name || t('list.unnamedUser')}
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
                {t('list.table.edit')}
              </Button>
            </Link>
            <Link href="/users">
              <Button variant="outline">{t('detail.backToList')}</Button>
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
                  {t('detail.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {t('detail.email')}
                    </dt>
                    <dd className="text-foreground font-medium">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {t('detail.role')}
                    </dt>
                    <dd>
                      <Badge variant={roleConfig.variant}>
                        {getRoleLabel(user.role.name)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('detail.createdAt')}
                    </dt>
                    <dd className="text-foreground font-medium">
                      {new Date(user.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('detail.updatedAt')}
                    </dt>
                    <dd className="text-foreground font-medium">
                      {new Date(user.updatedAt).toLocaleString()}
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
                    {t('detail.managedProjects')} ({user.projects.length})
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
                              {tNav('menu.budgetPools')}: {project.budgetPool.name}
                            </p>
                          </div>
                          <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                            {t(`projectStatus.${project.status}`)}
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
                    {t('detail.supervisedProjects')} ({user.approvals.length})
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
                          {tNav('menu.budgetPools')}: {project.budgetPool.name}
                        </p>
                        <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                          {t(`projectStatus.${project.status}`)}
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
