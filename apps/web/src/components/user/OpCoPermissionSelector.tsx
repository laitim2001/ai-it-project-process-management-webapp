/**
 * @fileoverview OpCoPermissionSelector - 營運公司權限選擇器組件
 *
 * @description
 * FEAT-009: Operating Company 數據權限管理
 * 提供多選 Checkbox 列表，讓管理員為用戶分配可訪問的營運公司。
 * 支援全選/清除功能，以及載入和儲存狀態顯示。
 *
 * @component OpCoPermissionSelector
 *
 * @features
 * - 多選 Checkbox 列表顯示所有啟用的 OpCo
 * - 全選/清除全部快捷按鈕
 * - 自動載入用戶現有權限
 * - 即時保存權限變更
 * - 載入和儲存狀態提示
 * - 國際化支援
 *
 * @props
 * - userId: string - 要設定權限的用戶 ID
 * - disabled?: boolean - 是否禁用編輯
 *
 * @related
 * - packages/api/src/routers/operatingCompany.ts - getUserPermissions, setUserPermissions API
 * - apps/web/src/app/[locale]/users/[id]/edit/page.tsx - 用戶編輯頁面
 *
 * @author IT Department
 * @since FEAT-009 - Operating Company 數據權限管理
 * @lastModified 2025-12-12
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { CheckSquare, Square, Loader2 } from 'lucide-react';

interface OpCoPermissionSelectorProps {
  userId: string;
  disabled?: boolean;
}

export function OpCoPermissionSelector({
  userId,
  disabled = false,
}: OpCoPermissionSelectorProps) {
  const t = useTranslations('users.permissions');
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 獲取 tRPC utils 用於 invalidate 查詢
  const utils = api.useUtils();

  // 獲取所有啟用的 OpCo
  const { data: allOpCos, isLoading: isLoadingOpCos } =
    api.operatingCompany.getAll.useQuery({
      includeInactive: false,
    });

  // 獲取用戶現有權限
  const { data: userPermissions, isLoading: isLoadingPermissions } =
    api.operatingCompany.getUserPermissions.useQuery(
      { userId },
      { enabled: !!userId }
    );

  // 設定權限 mutation
  const setPermissionsMutation =
    api.operatingCompany.setUserPermissions.useMutation({
      onSuccess: () => {
        // 重新獲取用戶權限資料，確保 UI 顯示最新狀態
        utils.operatingCompany.getUserPermissions.invalidate({ userId });
        toast({
          title: t('permissionsUpdated'),
          variant: 'default',
        });
      },
      onError: (error) => {
        toast({
          title: t('permissionsUpdateFailed'),
          description: error.message,
          variant: 'destructive',
        });
      },
    });

  // 初始化已選中的 OpCo
  useEffect(() => {
    if (userPermissions && !isInitialized) {
      setSelectedIds(userPermissions.map((p) => p.operatingCompanyId));
      setIsInitialized(true);
    }
  }, [userPermissions, isInitialized]);

  // 處理 Checkbox 變更
  const handleCheckboxChange = (opCoId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, opCoId]
      : selectedIds.filter((id) => id !== opCoId);

    setSelectedIds(newSelectedIds);

    // 自動保存
    setPermissionsMutation.mutate({
      userId,
      operatingCompanyIds: newSelectedIds,
    });
  };

  // 全選
  const handleSelectAll = () => {
    if (!allOpCos) return;
    const allIds = allOpCos.map((opCo) => opCo.id);
    setSelectedIds(allIds);
    setPermissionsMutation.mutate({
      userId,
      operatingCompanyIds: allIds,
    });
  };

  // 清除全部
  const handleSelectNone = () => {
    setSelectedIds([]);
    setPermissionsMutation.mutate({
      userId,
      operatingCompanyIds: [],
    });
  };

  // 載入狀態
  if (isLoadingOpCos || isLoadingPermissions) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 無 OpCo 資料
  if (!allOpCos || allOpCos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('noPermissions')}</p>
    );
  }

  const isSaving = setPermissionsMutation.isPending;

  return (
    <div className="space-y-4">
      {/* 快捷按鈕 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled || isSaving}
        >
          <CheckSquare className="mr-1 h-4 w-4" />
          {t('selectAll')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectNone}
          disabled={disabled || isSaving}
        >
          <Square className="mr-1 h-4 w-4" />
          {t('selectNone')}
        </Button>
        {isSaving && (
          <span className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            {t('saving')}
          </span>
        )}
      </div>

      {/* OpCo Checkbox 列表 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allOpCos.map((opCo) => (
          <div key={opCo.id} className="flex items-center space-x-2">
            <Checkbox
              id={`opco-${opCo.id}`}
              checked={selectedIds.includes(opCo.id)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(opCo.id, checked === true)
              }
              disabled={disabled || isSaving}
            />
            <Label
              htmlFor={`opco-${opCo.id}`}
              className="cursor-pointer text-sm font-normal"
            >
              {opCo.code} - {opCo.name}
            </Label>
          </div>
        ))}
      </div>

      {/* 已選數量提示 */}
      <p className="text-sm text-muted-foreground">
        {selectedIds.length} / {allOpCos.length} selected
      </p>
    </div>
  );
}
