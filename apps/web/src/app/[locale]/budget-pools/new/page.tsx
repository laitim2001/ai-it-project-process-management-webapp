/**
 * @fileoverview New Budget Pool Page - 建立預算池頁面
 *
 * @description
 * 建立新預算池的表單頁面，使用動態載入優化初始 bundle 大小。
 * 整合 BudgetPoolForm 組件，提供完整的預算池建立流程和驗證。
 *
 * @page /[locale]/budget-pools/new
 *
 * @features
 * - 動態表單載入：使用 next/dynamic 延遲載入 BudgetPoolForm
 * - 骨架屏優化：表單載入時顯示骨架屏
 * - 麵包屑導航：Dashboard > Budget Pools > 建立新預算池
 * - 國際化支援：標題和說明文字多語言
 * - 表單模式：mode="create" 創建模式
 * - 響應式設計：適配各種設備尺寸
 *
 * @permissions
 * - Admin: 可建立預算池
 * - Supervisor: 可建立預算池（需確認權限）
 *
 * @routing
 * - 當前頁: /budget-pools/new
 * - 建立成功後: 重定向至 /budget-pools/[id] 或 /budget-pools
 * - 取消操作: 返回 /budget-pools
 *
 * @dependencies
 * - next-intl: 國際化翻譯支援
 * - next/dynamic: 動態組件載入
 * - shadcn/ui: Card, Breadcrumb, Skeleton
 * - BudgetPoolForm: 預算池表單組件（動態載入）
 *
 * @related
 * - apps/web/src/components/budget-pool/BudgetPoolForm.tsx - 預算池表單組件
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池列表頁
 * - packages/api/src/routers/budgetPool.ts - create procedure
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14
 */

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetPoolForm = dynamic(
  () => import('@/components/budget-pool/BudgetPoolForm').then((mod) => ({ default: mod.BudgetPoolForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function NewBudgetPoolPage() {
  const t = useTranslations('budgetPools');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
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
              <BreadcrumbPage>{t('new.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('new.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('new.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetPoolForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
