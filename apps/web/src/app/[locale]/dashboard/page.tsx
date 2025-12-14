/**
 * @fileoverview Dashboard Welcome Page - 儀表板歡迎頁面
 *
 * @description
 * 簡化版儀表板歡迎頁面，提供專業的登入後首頁。
 * 不顯示任何敏感數據，僅展示歡迎信息和導航提示。
 *
 * @page /[locale]/dashboard
 *
 * @features
 * - 系統名稱展示：IT Project Management Platform
 * - 個人化歡迎訊息：顯示用戶名稱
 * - 用戶角色顯示
 * - 格式化日期顯示
 * - 導航提示
 * - 響應式佈局：桌面/平板/手機自適應
 * - 國際化支援：繁體中文/英文雙語切換
 * - 主題支援：Light/Dark 模式兼容
 *
 * @permissions
 * - 所有已登入用戶可訪問（CHANGE-015: 通用登陸頁面）
 *
 * @routing
 * - 主頁: /dashboard
 * - PM Dashboard: /dashboard/pm
 * - Supervisor Dashboard: /dashboard/supervisor
 *
 * @dependencies
 * - next-intl: 國際化翻譯支援
 * - next-auth: Session 用戶資訊
 * - lucide-react: 圖示庫
 * - shadcn/ui: Card UI 組件
 * - DashboardLayout: 統一的儀表板佈局容器
 *
 * @related
 * - apps/web/src/app/[locale]/dashboard/page-full-version.tsx.bak - 完整版備份
 * - apps/web/src/app/[locale]/dashboard/pm/page.tsx - PM 專用儀表板
 * - apps/web/src/app/[locale]/dashboard/supervisor/page.tsx - Supervisor 儀表板
 * - apps/web/src/components/layout/dashboard-layout.tsx - Dashboard 佈局組件
 *
 * @changelog
 * - CHANGE-015: Dashboard 作為通用登陸頁面
 * - CHANGE-016: 簡化版歡迎頁面（移除敏感數據顯示）
 *
 * @author IT Department
 * @since Epic 7 - Dashboard & Basic Reporting
 * @lastModified 2025-12-14
 */

'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, User } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tUsers = useTranslations('users');
  const locale = useLocale();
  const { data: session } = useSession();

  // 獲取用戶資訊
  const userName = session?.user?.name || t('welcome.defaultUser');
  const userRole = session?.user?.role?.name || t('welcome.defaultRole');

  // 格式化日期
  const today = new Date();
  const formattedDate = today.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 角色翻譯映射
  const getRoleDisplayName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      'Admin': tUsers('roles.admin'),
      'Supervisor': tUsers('roles.supervisor'),
      'ProjectManager': tUsers('roles.projectManager'),
      'admin': tUsers('roles.admin'),
      'supervisor': tUsers('roles.supervisor'),
      'projectManager': tUsers('roles.projectManager'),
    };
    return roleMap[roleName] || roleName;
  };

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Card className="w-full max-w-lg border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            {/* 系統圖標 */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>

            {/* 系統名稱 */}
            <h1 className="text-2xl font-bold text-foreground">
              {t('welcome.systemName')}
            </h1>

            {/* 分隔線 */}
            <div className="mx-auto my-6 h-px w-24 bg-border" />

            {/* 歡迎訊息 */}
            <p className="text-xl text-muted-foreground">
              {t('welcome.greeting', { name: userName })}
            </p>

            {/* 用戶角色 */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {getRoleDisplayName(userRole)}
              </span>
            </div>

            {/* 日期 */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>

            {/* 分隔線 */}
            <div className="mx-auto my-6 h-px w-32 bg-border" />

            {/* 導航提示 */}
            <p className="text-sm text-muted-foreground">
              {t('welcome.navigationHint')}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
