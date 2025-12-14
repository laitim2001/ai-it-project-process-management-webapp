/**
 * @fileoverview User Permissions Config Component - 用戶權限配置組件
 *
 * @description
 * FEAT-011: 提供管理員配置單一用戶權限的 UI。
 * 顯示所有可用權限，標示角色預設與用戶覆蓋狀態，
 * 支援批量更新用戶權限配置。
 *
 * @component UserPermissionsConfig
 *
 * @features
 * - 按類別分組顯示所有權限
 * - 標示角色預設權限（鎖定圖示）
 * - 標示用戶覆蓋狀態（新增/撤銷）
 * - 開關切換權限授予/撤銷
 * - 批量保存更新
 * - 重置為角色預設按鈕
 * - 載入狀態和錯誤處理
 *
 * @props
 * @param {string} userId - 要配置權限的用戶 ID
 *
 * @dependencies
 * - @/lib/trpc: tRPC 客戶端
 * - @/components/ui: shadcn/ui 組件
 * - lucide-react: 圖示
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/permission.ts - 權限 API
 * - apps/web/src/app/[locale]/users/[id]/page.tsx - 用戶詳情頁
 *
 * @author IT Department
 * @since FEAT-011 - Permission Management
 * @lastModified 2025-12-14
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Shield,
  Lock,
  Unlock,
  Plus,
  Minus,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface UserPermissionsConfigProps {
  userId: string;
}

/**
 * 權限類別配置 - 用於 UI 顯示
 */
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  menu: { label: '菜單權限', icon: <Shield className="h-4 w-4" /> },
  project: { label: '專案權限', icon: <Shield className="h-4 w-4" /> },
  proposal: { label: '提案權限', icon: <Shield className="h-4 w-4" /> },
  expense: { label: '費用權限', icon: <Shield className="h-4 w-4" /> },
  system: { label: '系統權限', icon: <Shield className="h-4 w-4" /> },
};

export function UserPermissionsConfig({ userId }: UserPermissionsConfigProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  // 本地權限狀態（用於追蹤變更）
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 查詢用戶權限配置
  const {
    data: permissionData,
    isLoading,
    isError,
    error,
    refetch,
  } = api.permission.getUserPermissions.useQuery(
    { userId },
    {
      enabled: !!userId,
      refetchOnWindowFocus: false,
    }
  );

  // 批量更新權限 mutation
  const updatePermissions = api.permission.setUserPermissions.useMutation({
    onSuccess: () => {
      toast({
        title: t('permissions.saveSuccess'),
        description: t('permissions.saveSuccessDesc'),
      });
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: t('permissions.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 初始化本地權限狀態
  useEffect(() => {
    if (permissionData?.permissions) {
      const initial: Record<string, boolean> = {};
      permissionData.permissions.forEach((p) => {
        initial[p.id] = p.isGranted;
      });
      setLocalPermissions(initial);
      setHasChanges(false);
    }
  }, [permissionData]);

  // 按類別分組權限
  const groupedPermissions = useMemo(() => {
    if (!permissionData?.permissions) return {};

    const groups: Record<string, typeof permissionData.permissions> = {};
    permissionData.permissions.forEach((p) => {
      const category = p.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category]!.push(p);
    });

    return groups;
  }, [permissionData]);

  // 處理權限切換
  const handleToggle = (permissionId: string, granted: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [permissionId]: granted,
    }));
    setHasChanges(true);
  };

  // 重置為角色預設
  const handleReset = () => {
    if (!permissionData?.permissions) return;

    const resetState: Record<string, boolean> = {};
    permissionData.permissions.forEach((p) => {
      // 重置為角色預設值
      resetState[p.id] = p.isRoleDefault;
    });
    setLocalPermissions(resetState);
    setHasChanges(true);
  };

  // 保存變更
  const handleSave = () => {
    if (!permissionData?.permissions) return;

    const permissionsToUpdate = permissionData.permissions.map((p) => ({
      permissionId: p.id,
      granted: localPermissions[p.id] ?? p.isGranted,
    }));

    updatePermissions.mutate({
      userId,
      permissions: permissionsToUpdate,
    });
  };

  // 載入狀態
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2 pl-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // 錯誤狀態
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('permissions.loadError')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error?.message}</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            {tCommon('actions.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('permissions.title')}
        </CardTitle>
        <CardDescription>
          {t('permissions.description', { role: permissionData?.user?.role?.name || '' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 圖例說明 */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>{t('permissions.legend.roleDefault')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Plus className="h-3 w-3 text-green-600" />
            <span>{t('permissions.legend.userGranted')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="h-3 w-3 text-red-600" />
            <span>{t('permissions.legend.userRevoked')}</span>
          </div>
        </div>

        {/* 按類別顯示權限 */}
        {Object.entries(groupedPermissions).map(([category, permissions]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              {CATEGORY_CONFIG[category]?.icon}
              {CATEGORY_CONFIG[category]?.label || category}
            </h4>
            <div className="space-y-2 pl-6">
              {permissions.map((permission) => {
                const isCurrentlyGranted = localPermissions[permission.id] ?? permission.isGranted;
                const isRoleDefault = permission.isRoleDefault;
                const hasUserOverride = permission.userOverride !== null;
                const isChanged = isCurrentlyGranted !== permission.isGranted;

                // 決定狀態標記
                let statusBadge = null;
                if (hasUserOverride && !isChanged) {
                  if (permission.userOverride) {
                    statusBadge = (
                      <Badge variant="success" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        {t('permissions.status.granted')}
                      </Badge>
                    );
                  } else {
                    statusBadge = (
                      <Badge variant="destructive" className="text-xs">
                        <Minus className="h-3 w-3 mr-1" />
                        {t('permissions.status.revoked')}
                      </Badge>
                    );
                  }
                } else if (isChanged) {
                  statusBadge = (
                    <Badge variant="warning" className="text-xs">
                      {t('permissions.status.modified')}
                    </Badge>
                  );
                } else if (isRoleDefault) {
                  statusBadge = (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      {t('permissions.status.roleDefault')}
                    </Badge>
                  );
                }

                return (
                  <div
                    key={permission.id}
                    className={cn(
                      'flex items-center justify-between py-2 px-3 rounded-lg border',
                      isChanged ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-border'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{permission.name}</span>
                        {statusBadge}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {permission.code}
                        {permission.description && ` - ${permission.description}`}
                      </p>
                    </div>
                    <Switch
                      checked={isCurrentlyGranted}
                      onCheckedChange={(checked) => handleToggle(permission.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges && !permissionData}>
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('permissions.resetToDefault')}
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || updatePermissions.isPending}>
          {updatePermissions.isPending ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {t('permissions.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('permissions.saveChanges')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default UserPermissionsConfig;
