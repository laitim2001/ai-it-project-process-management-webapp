/**
 * @fileoverview Edit Project Page - 編輯專案頁面
 *
 * @description
 * 提供編輯現有專案的表單頁面，支援修改專案基本資訊、預算分配和負責人。
 * 使用動態載入優化表單組件，整合 React Hook Form + Zod 進行表單驗證。
 * 支援預算類別變更、請求預算調整和專案時程修改，提供完整的專案管理功能。
 *
 * @page /[locale]/projects/[id]/edit
 *
 * @features
 * - 完整的專案編輯表單（預填充現有資料）
 * - 修改專案名稱、描述
 * - 變更預算池和預算類別
 * - 調整請求預算和已批准預算
 * - 變更專案經理和主管
 * - 修改專案時程（開始/結束日期）
 * - 即時表單驗證（Zod schema）
 * - 動態載入表單組件（優化初始載入時間）
 * - 錯誤處理（404 Not Found、權限錯誤、網路錯誤）
 * - 骨架屏載入狀態（提升用戶體驗）
 * - 麵包屑導航（清晰的頁面層級結構）
 *
 * @permissions
 * - ProjectManager: 可編輯自己管理的專案（受限功能）
 * - Supervisor: 可編輯所有專案
 * - Admin: 完整編輯權限
 *
 * @routing
 * - 編輯頁: /projects/[id]/edit
 * - 成功後導向: /projects/[id] (專案詳情頁)
 * - 取消後返回: /projects/[id] (專案詳情頁)
 * - Not Found 返回: /projects (專案列表頁)
 *
 * @stateManagement
 * - Form State: React Hook Form (ProjectForm 組件內部)
 * - Data Fetching: tRPC useQuery (專案詳情)
 * - Data Mutation: tRPC useMutation (ProjectForm 組件內部)
 *
 * @dependencies
 * - next/dynamic: 動態導入優化
 * - next/navigation: useParams
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Skeleton, Breadcrumb, Button, Alert
 * - lucide-react: AlertCircle 圖示
 *
 * @related
 * - packages/api/src/routers/project.ts - Project API Router
 * - apps/web/src/components/project/ProjectForm.tsx - 專案表單組件
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案列表頁
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-11-14 (FIX-093: 修復 Combobox 選取功能)
 */

'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const ProjectForm = dynamic(
  () => import('@/components/project/ProjectForm').then((mod) => ({ default: mod.ProjectForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditProjectPage() {
  const t = useTranslations('projects.form.edit');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation.menu');

  const params = useParams();
  const projectId = params.id as string;
  const { data: project, isLoading } = api.project.getById.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-[480px]" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Form Card Skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
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

  if (!project) {
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
                <BreadcrumbLink asChild><Link href="/projects">{tNav('projects')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tCommon('actions.edit')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/projects">
                <Button>{t('backToList')}</Button>
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
              <BreadcrumbLink asChild><Link href="/projects">{tNav('projects')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/projects/${projectId}">{project.name}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tCommon('actions.edit')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <ProjectForm
              mode="edit"
              initialData={{
                id: project.id,
                name: project.name,
                description: project.description,
                budgetPoolId: project.budgetPoolId,
                budgetCategoryId: project.budgetCategoryId,
                requestedBudget: project.requestedBudget,
                approvedBudget: project.approvedBudget,
                managerId: project.managerId,
                supervisorId: project.supervisorId,
                startDate: project.startDate,
                endDate: project.endDate,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
