'use client';

/**
 * @fileoverview Edit User Page - 編輯使用者頁面
 *
 * @description
 * 提供編輯現有使用者的表單頁面，支援修改使用者資訊和角色分配。
 * 使用動態載入優化初始頁面載入性能，預填充現有資料。
 * 僅 Admin 角色可訪問此頁面進行使用者編輯操作。
 *
 * @page /[locale]/users/[id]/edit
 *
 * @features
 * - 完整的使用者編輯表單（預填充現有資料）
 * - 修改使用者名稱、電郵和角色
 * - 即時表單驗證（Zod schema）
 * - 電郵格式驗證（RFC 5322）
 * - 角色選擇（ProjectManager, Supervisor, Admin）
 * - 動態載入表單組件（提升初始載入性能）
 * - 錯誤處理（使用者不存在、權限錯誤、網路錯誤）
 * - 載入狀態骨架屏
 * - 麵包屑導航支援
 * - 國際化表單標籤和錯誤訊息
 *
 * @permissions
 * - Admin: 可編輯使用者
 * - 其他角色: 無權訪問
 *
 * @routing
 * - 編輯頁: /users/[id]/edit
 * - 成功後導向: /users/[id] (使用者詳情頁)
 * - 取消後返回: /users/[id] (使用者詳情頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next/dynamic: 動態載入組件
 * - @tanstack/react-query: tRPC 查詢、mutation 和快取
 * - shadcn/ui: Card, Skeleton, Alert, Breadcrumb
 *
 * @related
 * - apps/web/src/components/user/UserForm.tsx - 使用者表單組件
 * - packages/api/src/routers/user.ts - 使用者 API Router (getById, update)
 * - apps/web/src/app/[locale]/users/[id]/page.tsx - 使用者詳情頁面
 * - apps/web/src/app/[locale]/users/page.tsx - 使用者列表頁面
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 */

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const UserForm = dynamic(
  () => import('@/components/user/UserForm').then((mod) => ({ default: mod.UserForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditUserPage() {
  const t = useTranslations('users');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading } = api.user.getById.useQuery({ id: userId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-96" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Form Card Skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
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
                <BreadcrumbPage>{t('list.table.edit')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('detail.notFoundDesc')}
                </AlertDescription>
              </Alert>
              <Link href="/users">
                <Button>{t('detail.backToList')}</Button>
              </Link>
            </div>
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
              <BreadcrumbLink asChild><Link href="/users">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/users/${userId}`}>{user.name || user.email}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('list.table.edit')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('form.edit.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('form.edit.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <UserForm
              mode="edit"
              initialData={{
                id: user.id,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
