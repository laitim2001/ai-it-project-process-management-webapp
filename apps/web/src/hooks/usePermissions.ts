/**
 * @fileoverview usePermissions Hook - 權限管理 Hook
 *
 * @description
 * 提供前端權限檢查功能，實現 FEAT-011 的 Sidebar 菜單權限過濾。
 * 整合 tRPC 查詢用戶有效權限，提供便捷的權限檢查方法。
 * 使用 React Query 緩存策略，避免重複查詢。
 *
 * @hook usePermissions
 *
 * @features
 * - 獲取當前用戶有效權限列表
 * - 檢查單一權限 (hasPermission)
 * - 檢查任一權限 (hasAnyPermission)
 * - 檢查所有權限 (hasAllPermissions)
 * - 自動緩存和刷新
 * - 類型安全的權限代碼常量
 *
 * @example
 * ```tsx
 * import { usePermissions, MENU_PERMISSIONS } from '@/hooks/usePermissions';
 *
 * function Sidebar() {
 *   const { hasPermission, isLoading } = usePermissions();
 *
 *   if (isLoading) return <SidebarSkeleton />;
 *
 *   return (
 *     <nav>
 *       {hasPermission(MENU_PERMISSIONS.DASHBOARD) && (
 *         <NavItem href="/dashboard">儀表板</NavItem>
 *       )}
 *       {hasPermission(MENU_PERMISSIONS.PROJECTS) && (
 *         <NavItem href="/projects">專案</NavItem>
 *       )}
 *     </nav>
 *   );
 * }
 * ```
 *
 * @dependencies
 * - @/lib/trpc: tRPC 客戶端
 * - react: useMemo
 *
 * @related
 * - packages/api/src/routers/permission.ts - 權限管理 API
 * - apps/web/src/components/layout/Sidebar.tsx - Sidebar 權限過濾
 * - packages/db/prisma/schema.prisma - Permission 資料模型
 *
 * @author IT Department
 * @since FEAT-011 - Permission Management
 * @lastModified 2025-12-14
 */

'use client';

import { useMemo } from 'react';
import { api } from '@/lib/trpc';

/**
 * 菜單權限代碼常量
 * 與資料庫種子數據保持一致
 */
export const MENU_PERMISSIONS = {
  // Overview
  DASHBOARD: 'menu:dashboard',

  // Project Budget
  BUDGET_POOLS: 'menu:budget-pools',
  PROJECTS: 'menu:projects',
  PROPOSALS: 'menu:proposals',

  // Procurement
  VENDORS: 'menu:vendors',
  QUOTES: 'menu:quotes',
  PURCHASE_ORDERS: 'menu:purchase-orders',
  EXPENSES: 'menu:expenses',
  OM_EXPENSES: 'menu:om-expenses',
  OM_SUMMARY: 'menu:om-summary',
  CHARGE_OUTS: 'menu:charge-outs',

  // System
  USERS: 'menu:users',
  OPERATING_COMPANIES: 'menu:operating-companies',
  OM_EXPENSE_CATEGORIES: 'menu:om-expense-categories',
  CURRENCIES: 'menu:currencies',
  DATA_IMPORT: 'menu:data-import',
  PROJECT_DATA_IMPORT: 'menu:project-data-import',

  // Settings
  SETTINGS: 'menu:settings',
} as const;

/**
 * 權限代碼類型
 */
export type MenuPermissionCode = (typeof MENU_PERMISSIONS)[keyof typeof MENU_PERMISSIONS];

/**
 * 路由到權限代碼的映射
 * 用於路由保護 Middleware
 */
export const ROUTE_PERMISSION_MAP: Record<string, MenuPermissionCode> = {
  '/dashboard': MENU_PERMISSIONS.DASHBOARD,
  '/budget-pools': MENU_PERMISSIONS.BUDGET_POOLS,
  '/projects': MENU_PERMISSIONS.PROJECTS,
  '/proposals': MENU_PERMISSIONS.PROPOSALS,
  '/vendors': MENU_PERMISSIONS.VENDORS,
  '/quotes': MENU_PERMISSIONS.QUOTES,
  '/purchase-orders': MENU_PERMISSIONS.PURCHASE_ORDERS,
  '/expenses': MENU_PERMISSIONS.EXPENSES,
  '/om-expenses': MENU_PERMISSIONS.OM_EXPENSES,
  '/om-summary': MENU_PERMISSIONS.OM_SUMMARY,
  '/charge-outs': MENU_PERMISSIONS.CHARGE_OUTS,
  '/users': MENU_PERMISSIONS.USERS,
  '/operating-companies': MENU_PERMISSIONS.OPERATING_COMPANIES,
  '/om-expense-categories': MENU_PERMISSIONS.OM_EXPENSE_CATEGORIES,
  '/currencies': MENU_PERMISSIONS.CURRENCIES,
  '/data-import': MENU_PERMISSIONS.DATA_IMPORT,
  '/project-data-import': MENU_PERMISSIONS.PROJECT_DATA_IMPORT,
  '/settings': MENU_PERMISSIONS.SETTINGS,
};

/**
 * usePermissions Hook 返回類型
 */
export interface UsePermissionsReturn {
  /** 用戶有效權限代碼列表 */
  permissionCodes: string[];
  /** 用戶有效權限詳情列表 */
  permissions: Array<{ code: string; name: string; category: string }>;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否發生錯誤 */
  isError: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 檢查是否有指定權限 */
  hasPermission: (code: string) => boolean;
  /** 檢查是否有任一指定權限 */
  hasAnyPermission: (codes: string[]) => boolean;
  /** 檢查是否有所有指定權限 */
  hasAllPermissions: (codes: string[]) => boolean;
  /** 重新獲取權限 */
  refetch: () => void;
}

/**
 * usePermissions Hook
 *
 * @description
 * 獲取當前用戶的有效權限並提供便捷的權限檢查方法。
 * 權限計算邏輯：角色預設權限 + 用戶自訂覆蓋（granted=true 新增, granted=false 移除）
 *
 * @returns {UsePermissionsReturn} 權限資訊和檢查方法
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasPermission, isLoading } = usePermissions();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       {hasPermission('menu:dashboard') && <DashboardLink />}
 *       {hasPermission('menu:projects') && <ProjectsLink />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  // 使用 tRPC 查詢當前用戶權限
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = api.permission.getMyPermissions.useQuery(undefined, {
    // 權限資料緩存策略
    staleTime: 5 * 60 * 1000, // 5 分鐘內視為新鮮
    cacheTime: 30 * 60 * 1000, // 緩存 30 分鐘
    refetchOnWindowFocus: false, // 切換視窗不自動重新查詢
    refetchOnMount: false, // 組件掛載不自動重新查詢（使用緩存）
    retry: 2, // 失敗重試 2 次
  });

  // 權限代碼 Set（用於快速查找）
  const permissionSet = useMemo(() => {
    return new Set(data?.permissionCodes || []);
  }, [data?.permissionCodes]);

  /**
   * 檢查是否有指定權限
   */
  const hasPermission = useMemo(() => {
    return (code: string): boolean => {
      return permissionSet.has(code);
    };
  }, [permissionSet]);

  /**
   * 檢查是否有任一指定權限
   */
  const hasAnyPermission = useMemo(() => {
    return (codes: string[]): boolean => {
      return codes.some((code) => permissionSet.has(code));
    };
  }, [permissionSet]);

  /**
   * 檢查是否有所有指定權限
   */
  const hasAllPermissions = useMemo(() => {
    return (codes: string[]): boolean => {
      return codes.every((code) => permissionSet.has(code));
    };
  }, [permissionSet]);

  return {
    permissionCodes: data?.permissionCodes || [],
    permissions: data?.permissions || [],
    isLoading,
    isError,
    error: error as Error | null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch,
  };
}

/**
 * 導出默認 hook
 */
export default usePermissions;
