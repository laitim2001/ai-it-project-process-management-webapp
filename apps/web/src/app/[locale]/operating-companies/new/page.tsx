/**
 * @fileoverview Create Operating Company Page - 建立營運公司頁面
 *
 * @description
 * 建立新營運公司的頁面，使用 OperatingCompanyForm 組件。
 *
 * @page /[locale]/operating-companies/new
 *
 * @permissions
 * - Supervisor: 可建立
 * - Admin: 可建立
 *
 * @author IT Department
 * @since FEAT-004 - Operating Company Management
 * @lastModified 2025-12-01
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OperatingCompanyForm } from '@/components/operating-company';

export default function CreateOperatingCompanyPage() {
  const t = useTranslations('operatingCompanies');
  const tNav = useTranslations('navigation');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{tNav('dashboard')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/operating-companies">{t('title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('form.createTitle')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 表單卡片 */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('form.createTitle')}</CardTitle>
            <CardDescription>{t('form.createDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <OperatingCompanyForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
