/**
 * @fileoverview New User Page - 建立使用者頁面
 *
 * @description
 * 提供建立新使用者的表單頁面，支援完整的使用者資訊輸入和角色分配。
 * 使用動態載入優化初始頁面載入性能，提供即時表單驗證。
 * 僅 Admin 角色可訪問此頁面進行使用者建立操作。
 *
 * @page /[locale]/users/new
 *
 * @features
 * - 完整的使用者建立表單（電郵、名稱、密碼、角色）
 * - 角色選擇（ProjectManager, Supervisor, Admin）
 * - 即時表單驗證（Zod schema）
 * - 電郵格式驗證（RFC 5322）
 * - 密碼強度驗證（最少 8 位）
 * - 動態載入表單組件（提升初始載入性能）
 * - 錯誤處理和成功提示（Toast）
 * - 麵包屑導航支援
 * - 國際化表單標籤和錯誤訊息
 *
 * @permissions
 * - Admin: 可建立使用者
 * - 其他角色: 無權訪問
 *
 * @routing
 * - 建立頁: /users/new
 * - 成功後導向: /users (使用者列表頁)
 * - 取消後返回: /users (使用者列表頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next/dynamic: 動態載入組件
 * - @tanstack/react-query: tRPC mutation 和快取更新
 * - shadcn/ui: Card, Breadcrumb, Skeleton
 *
 * @related
 * - apps/web/src/components/user/UserForm.tsx - 使用者表單組件
 * - packages/api/src/routers/user.ts - 使用者 API Router (create)
 * - apps/web/src/app/[locale]/users/page.tsx - 使用者列表頁面
 * - packages/db/prisma/schema.prisma - User, Role 資料模型
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 */

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const UserForm = dynamic(
  () => import('@/components/user/UserForm').then((mod) => ({ default: mod.UserForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function NewUserPage() {
  const t = useTranslations('users');
  const tNav = useTranslations('navigation');
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
              <BreadcrumbPage>{t('form.create.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('form.create.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('form.create.subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <UserForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
