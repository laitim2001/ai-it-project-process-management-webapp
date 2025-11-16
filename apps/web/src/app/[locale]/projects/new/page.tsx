/**
 * @fileoverview New Project Page - 建立專案頁面
 *
 * @description
 * 提供建立新專案的表單頁面，支援預算池選擇、預算類別選擇和專案資訊輸入。
 * 使用動態載入優化表單組件，整合 React Hook Form + Zod 進行表單驗證。
 * 提供完整的專案建立流程，包含預算分配、負責人指派和時程規劃。
 *
 * @page /[locale]/projects/new
 *
 * @features
 * - 完整的專案建立表單（名稱、描述、預算、負責人、時程）
 * - 預算池選擇（Combobox 組件）
 * - 預算類別選擇（從預算池載入可用類別）
 * - 請求預算輸入（自動格式化，貨幣符號）
 * - 專案經理選擇（User Combobox）
 * - 主管選擇（User Combobox，限 Supervisor 角色）
 * - 專案時程選擇（開始日期、結束日期，Date Picker）
 * - 即時表單驗證（Zod schema）
 * - 動態載入表單組件（優化初始載入時間）
 * - 錯誤處理和成功提示（Toast）
 * - 麵包屑導航（清晰的頁面層級結構）
 *
 * @permissions
 * - ProjectManager: 可建立專案（自己擔任 PM）
 * - Supervisor: 可建立專案（可指定任意 PM）
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /projects/new
 * - 成功後導向: /projects/[id] (新建立的專案詳情頁)
 * - 取消後返回: /projects (專案列表頁)
 *
 * @stateManagement
 * - Form State: React Hook Form (ProjectForm 組件內部)
 * - Data Mutation: tRPC useMutation (ProjectForm 組件內部)
 * - Related Data: tRPC useQuery (預算池、用戶列表，ProjectForm 內部)
 *
 * @dependencies
 * - next/dynamic: 動態導入優化
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC mutation
 * - shadcn/ui: Card, Skeleton, Breadcrumb
 *
 * @related
 * - packages/api/src/routers/project.ts - Project API Router
 * - apps/web/src/components/project/ProjectForm.tsx - 專案表單組件
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案列表頁
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-11-16 (FEAT-001: 專案表單新增專案編號、全域標誌、優先權、貨幣欄位)
 */

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 動態導入表單元件以減少初始 bundle size
const ProjectForm = dynamic(() => import('@/components/project/ProjectForm').then(mod => ({ default: mod.ProjectForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

export default function NewProjectPage() {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tCommon('nav.dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/projects">{t('title')}</Link></BreadcrumbLink>
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
            {t('new.description')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <ProjectForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
