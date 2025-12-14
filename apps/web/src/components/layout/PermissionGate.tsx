/**
 * @fileoverview Permission Gate Component - 權限閘門組件
 *
 * @description
 * FEAT-011: 提供客戶端路由權限保護。
 * 用於包裹頁面內容，根據用戶權限決定是否顯示內容或重定向。
 * 由於 Edge Runtime 無法使用 Prisma，此組件在客戶端執行權限檢查。
 *
 * @component PermissionGate
 *
 * @features
 * - 根據權限代碼保護頁面內容
 * - 無權限時顯示拒絕訪問訊息或重定向
 * - 載入狀態處理（權限查詢中）
 * - 支援多種權限檢查模式（單一、任一、全部）
 * - 可自定義未授權時的行為（顯示訊息 / 重定向）
 *
 * @props
 * @param {string} [permission] - 單一權限代碼檢查
 * @param {string[]} [anyPermissions] - 檢查是否有任一權限
 * @param {string[]} [allPermissions] - 檢查是否有所有權限
 * @param {string} [fallbackUrl="/dashboard"] - 無權限時重定向的 URL
 * @param {boolean} [showAccessDenied=true] - 是否顯示拒絕訪問訊息（否則重定向）
 * @param {React.ReactNode} children - 受保護的內容
 *
 * @example
 * ```tsx
 * // 單一權限檢查
 * <PermissionGate permission="menu:users">
 *   <UsersPage />
 * </PermissionGate>
 *
 * // 任一權限檢查
 * <PermissionGate anyPermissions={['menu:projects', 'menu:proposals']}>
 *   <ProjectsContent />
 * </PermissionGate>
 *
 * // 無權限時重定向
 * <PermissionGate permission="menu:users" showAccessDenied={false}>
 *   <UsersPage />
 * </PermissionGate>
 * ```
 *
 * @dependencies
 * - @/hooks/usePermissions: 權限管理 Hook
 * - next/navigation: 路由操作
 * - @/components/ui: shadcn/ui 組件
 *
 * @related
 * - apps/web/src/hooks/usePermissions.ts - 權限 Hook
 * - apps/web/src/components/layout/Sidebar.tsx - Sidebar 權限過濾
 *
 * @author IT Department
 * @since FEAT-011 - Permission Management
 * @lastModified 2025-12-14
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface PermissionGateProps {
  /** 單一權限代碼檢查 */
  permission?: string;
  /** 檢查是否有任一權限 */
  anyPermissions?: string[];
  /** 檢查是否有所有權限 */
  allPermissions?: string[];
  /** 無權限時重定向的 URL */
  fallbackUrl?: string;
  /** 是否顯示拒絕訪問訊息（否則重定向） */
  showAccessDenied?: boolean;
  /** 受保護的內容 */
  children: React.ReactNode;
}

/**
 * Permission Gate Loading Skeleton
 * 權限檢查中的載入狀態
 */
function PermissionGateLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Access Denied Component
 * 拒絕訪問訊息組件
 */
function AccessDenied({ fallbackUrl }: { fallbackUrl: string }) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{t('errors.accessDenied')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('errors.noPermission')}
          </p>
          <div className="flex justify-center gap-2">
            <Link href={fallbackUrl}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('actions.goBack')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>{t('actions.goToDashboard')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Permission Gate Component
 * 權限閘門組件
 */
export function PermissionGate({
  permission,
  anyPermissions,
  allPermissions,
  fallbackUrl = '/dashboard',
  showAccessDenied = true,
  children,
}: PermissionGateProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // 計算是否有權限
  const checkPermission = (): boolean => {
    // 如果沒有指定任何權限要求，預設允許
    if (!permission && !anyPermissions && !allPermissions) {
      return true;
    }

    // 單一權限檢查
    if (permission && !hasPermission(permission)) {
      return false;
    }

    // 任一權限檢查
    if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
      return false;
    }

    // 全部權限檢查
    if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
      return false;
    }

    return true;
  };

  const hasAccess = !isLoading && checkPermission();
  const accessDenied = !isLoading && !checkPermission();

  // 無權限且不顯示拒絕訊息時，重定向
  useEffect(() => {
    if (accessDenied && !showAccessDenied) {
      router.replace(fallbackUrl);
    }
  }, [accessDenied, showAccessDenied, fallbackUrl, router]);

  // 載入中
  if (isLoading) {
    return <PermissionGateLoading />;
  }

  // 無權限且顯示拒絕訊息
  if (accessDenied && showAccessDenied) {
    return <AccessDenied fallbackUrl={fallbackUrl} />;
  }

  // 無權限且等待重定向
  if (accessDenied && !showAccessDenied) {
    return <PermissionGateLoading />;
  }

  // 有權限，顯示內容
  return <>{children}</>;
}

export default PermissionGate;
