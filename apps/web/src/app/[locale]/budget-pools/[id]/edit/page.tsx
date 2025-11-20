/**
 * @fileoverview Edit Budget Pool Page - 編輯預算池頁面
 *
 * @description
 * 提供編輯現有預算池的表單頁面，支援修改預算池基本資訊和預算類別。
 * 使用動態載入優化表單組件，整合 React Hook Form + Zod 進行表單驗證。
 * 支援預算類別的新增、編輯、刪除和排序，提供即時驗證和錯誤處理。
 *
 * @page /[locale]/budget-pools/[id]/edit
 *
 * @features
 * - 完整的預算池編輯表單（預填充現有資料）
 * - 修改預算池名稱、描述、財年
 * - 預算類別管理（新增、編輯、刪除、排序）
 * - 即時表單驗證（Zod schema）
 * - 動態載入表單組件（優化初始載入時間）
 * - 錯誤處理（404 Not Found、權限錯誤、網路錯誤）
 * - 骨架屏載入狀態（提升用戶體驗）
 * - 麵包屑導航（清晰的頁面層級結構）
 *
 * @permissions
 * - ProjectManager: 不可編輯（僅查看權限）
 * - Supervisor: 不可編輯（僅查看權限）
 * - Admin: 完整編輯權限
 *
 * @routing
 * - 編輯頁: /budget-pools/[id]/edit
 * - 成功後導向: /budget-pools/[id] (預算池詳情頁)
 * - 取消後返回: /budget-pools/[id] (預算池詳情頁)
 * - Not Found 返回: /budget-pools (預算池列表頁)
 *
 * @stateManagement
 * - Form State: React Hook Form (BudgetPoolForm 組件內部)
 * - Data Fetching: tRPC useQuery (預算池詳情)
 * - Data Mutation: tRPC useMutation (BudgetPoolForm 組件內部)
 *
 * @dependencies
 * - next/dynamic: 動態導入優化
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Skeleton, Breadcrumb, Button, Alert
 * - lucide-react: AlertCircle 圖示
 *
 * @related
 * - packages/api/src/routers/budgetPool.ts - Budget Pool API Router
 * - apps/web/src/components/budget-pool/BudgetPoolForm.tsx - 預算池表單組件
 * - apps/web/src/app/[locale]/budget-pools/[id]/page.tsx - 預算池詳情頁
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池列表頁
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14
 */

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const BudgetPoolForm = dynamic(
  () => import('@/components/budget-pool/BudgetPoolForm').then((mod) => ({ default: mod.BudgetPoolForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditBudgetPoolPage() {
  const t = useTranslations('budgetPools');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });

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

  if (!budgetPool) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('home')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/budget-pools">{t('title')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('edit.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/budget-pools">
                <Button>{t('actions.backToList')}</Button>
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('home')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/budget-pools">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/budget-pools/${id}`}>{budgetPool.name}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('edit.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('edit.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('edit.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetPoolForm
              mode="edit"
              initialData={{
                id: budgetPool.id,
                name: budgetPool.name,
                description: budgetPool.description ?? undefined,
                financialYear: budgetPool.financialYear,
                categories: budgetPool.categories?.map((cat) => ({
                  id: cat.id,
                  categoryName: cat.categoryName,
                  categoryCode: cat.categoryCode ?? '',
                  totalAmount: cat.totalAmount,
                  description: cat.description ?? '',
                  sortOrder: cat.sortOrder,
                  isActive: cat.isActive,
                })),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
