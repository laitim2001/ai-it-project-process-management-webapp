/**
 * @fileoverview O&M Expense Detail Page - 維運費用詳情頁面
 *
 * @description
 * 顯示單一維運費用的完整資訊，支援 FEAT-007 表頭-明細架構。
 * 包含表頭資訊、明細項目列表（支援拖曳排序）、每個項目的月度記錄。
 *
 * @page /[locale]/om-expenses/[id]
 *
 * @features
 * - FEAT-007 表頭-明細架構顯示
 * - 表頭資訊展示（名稱、財年、類別、預設 OpCo、供應商）
 * - 明細項目列表（OMExpenseItemList 組件）
 * - 拖曳排序功能（@dnd-kit）
 * - 項目新增、編輯、刪除操作
 * - 選定項目的月度記錄顯示（OMExpenseItemMonthlyGrid）
 * - 預算匯總卡片（總預算、總實際支出、使用率）
 * - YoY 增長率計算
 * - 編輯和刪除操作
 * - 麵包屑導航
 *
 * @permissions
 * - ProjectManager: 查看和編輯自己的維運費用
 * - Supervisor: 查看所有維運費用
 * - Admin: 完整權限
 *
 * @routing
 * - 詳情頁: /om-expenses/[id]
 * - 編輯頁: /om-expenses/[id]/edit
 * - 返回列表: /om-expenses
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 * - @dnd-kit: 拖曳排序
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OMExpense API Router
 * - apps/web/src/components/om-expense/OMExpenseItemList.tsx - 明細項目列表
 * - apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx - 項目月度記錄
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @modified FEAT-007 - Header-Detail Architecture (2025-12-05)
 * @lastModified 2025-12-05
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Minus, Layers } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

// FEAT-007 Components
import OMExpenseItemList, { type OMExpenseItemData } from '@/components/om-expense/OMExpenseItemList';
import OMExpenseItemMonthlyGrid from '@/components/om-expense/OMExpenseItemMonthlyGrid';
import OMExpenseItemForm from '@/components/om-expense/OMExpenseItemForm';

export default function OMExpenseDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('omExpenses');
  const tItems = useTranslations('omExpenses.items');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // Selected item for monthly grid display
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Active tab state for items section (controlled tabs)
  const [activeTab, setActiveTab] = useState<string>('items');
  // Item form state (for add/edit dialog)
  const [itemFormMode, setItemFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<OMExpenseItemData | null>(null);

  // Get OM expense details with items
  const { data: omExpense, isLoading, refetch } = api.omExpense.getById.useQuery({
    id: params.id,
  });

  // Calculate growth rate mutation
  const calculateGrowthMutation = api.omExpense.calculateYoYGrowth.useMutation({
    onSuccess: (data) => {
      if (data.yoyGrowthRate !== null) {
        toast({
          title: t('messages.growthCalculated'),
          description: t('messages.growthCalculationDesc', {
            current: formatCurrency(data.currentAmount),
            previous: formatCurrency(data.previousAmount ?? 0),
            rate: formatGrowthRate(data.yoyGrowthRate),
          }),
        });
        refetch();
      } else {
        toast({
          title: t('messages.cannotCalculateGrowth'),
          description: data.message || t('messages.noPreviousYearData'),
          variant: 'default',
        });
      }
    },
    onError: (error) => {
      toast({
        title: t('messages.calculationFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = api.omExpense.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: t('messages.deleteSuccess'),
      });
      router.push('/om-expenses');
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // FEAT-007: Item mutations (add/update handled by OMExpenseItemForm)
  const deleteItemMutation = api.omExpense.removeItem.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: tItems('deleteSuccess', { defaultValue: '明細項目已刪除' }),
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reorderItemsMutation = api.omExpense.reorderItems.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Format growth rate
  const formatGrowthRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // Growth rate icon
  const getGrowthIcon = (rate: number | null) => {
    if (rate === null) return <Minus className="h-4 w-4" />;
    if (rate > 0) return <TrendingUp className="h-4 w-4" />;
    if (rate < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  // Growth rate color
  const getGrowthRateColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-500';
    if (rate > 10) return 'bg-red-500';
    if (rate > 0) return 'bg-yellow-500';
    if (rate < 0) return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Delete confirmation
  const handleDelete = () => {
    if (confirm(t('messages.deleteConfirm'))) {
      deleteMutation.mutate({ id: params.id });
    }
  };

  // Handle item selection for monthly grid
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
  }, [selectedItemId]);

  // FEAT-007: Item handlers for OMExpenseItemList
  const handleAddItem = useCallback(() => {
    setItemFormMode('add');
    setEditingItem(null);
  }, []);

  const handleEditItem = useCallback((item: OMExpenseItemData) => {
    setItemFormMode('edit');
    setEditingItem(item);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    if (confirm(tItems('deleteConfirm', { defaultValue: '確定要刪除此明細項目嗎？刪除後將無法恢復。' }))) {
      deleteItemMutation.mutate({ id: itemId });
    }
  }, [deleteItemMutation, tItems]);

  const handleReorder = useCallback((newOrder: string[]) => {
    reorderItemsMutation.mutate({
      omExpenseId: params.id,
      itemIds: newOrder,
    });
  }, [reorderItemsMutation, params.id]);

  const handleEditMonthly = useCallback((item: OMExpenseItemData) => {
    setSelectedItemId(item.id);
    setActiveTab('monthly'); // 自動切換到月度記錄 tab
  }, []);

  const handleItemFormClose = useCallback(() => {
    setItemFormMode(null);
    setEditingItem(null);
  }, []);

  // Item form success handler (form handles its own mutations)
  const handleItemFormSuccess = useCallback(() => {
    setItemFormMode(null);
    setEditingItem(null);
    refetch();
  }, [refetch]);

  // FEAT-007: Transform API items to OMExpenseItemData format (Date to string conversion)
  // NOTE: This useMemo MUST be before any conditional returns to follow React hooks rules
  const transformedItems: OMExpenseItemData[] = useMemo(() => {
    if (!omExpense?.items) return [];
    return omExpense.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      sortOrder: item.sortOrder,
      budgetAmount: item.budgetAmount,
      actualSpent: item.actualSpent,
      opCoId: item.opCoId,
      currencyId: item.currencyId,
      // Convert Date to ISO string
      startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
      endDate: new Date(item.endDate).toISOString(),
      opCo: item.opCo ? {
        id: item.opCo.id,
        code: item.opCo.code,
        name: item.opCo.name,
      } : undefined,
      currency: item.currency ? {
        id: item.currency.id,
        code: item.currency.code,
        name: item.currency.name,
      } : null,
      monthlyRecords: item.monthlyRecords?.map((record) => ({
        month: record.month,
        actualAmount: record.actualAmount,
      })),
    }));
  }, [omExpense?.items]);

  // Get selected item for monthly grid (also before conditional returns)
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return transformedItems.find((item) => item.id === selectedItemId) || null;
  }, [selectedItemId, transformedItems]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">{t('detail.loading')}</div>
      </DashboardLayout>
    );
  }

  if (!omExpense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('list.empty.notFound')}</p>
          <Button className="mt-4" onClick={() => router.push('/om-expenses')}>
            {t('breadcrumb.backToList')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // FEAT-007: Use totalBudgetAmount and totalActualSpent from items aggregation
  const totalBudget = omExpense.totalBudgetAmount ?? omExpense.budgetAmount ?? 0;
  const totalActual = omExpense.totalActualSpent ?? omExpense.actualSpent ?? 0;
  const utilizationRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <DashboardLayout>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{tNav('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/om-expenses">{tNav('menu.omExpenses')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{omExpense.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header with Title and Actions */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/om-expenses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('breadcrumb.backToList')}
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{omExpense.name}</h1>
            <p className="mt-2 text-muted-foreground">
              FY{omExpense.financialYear} · {omExpense.category}
              {transformedItems.length > 0 && (
                <span className="ml-2">
                  · <Layers className="inline h-4 w-4" /> {transformedItems.length} {tItems('itemCount', { defaultValue: '個項目' })}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/om-expenses/${params.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('form.actions.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('form.actions.deleting') : t('form.actions.delete')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Basic Info and Budget Overview */}
        <div className="space-y-6 lg:col-span-1">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {omExpense.description && (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.description')}</div>
                  <div className="mt-1 text-sm">{omExpense.description}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">{t('detail.financialYear')}</div>
                <div className="mt-1 font-medium">FY{omExpense.financialYear}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">{t('detail.category')}</div>
                <div className="mt-1 font-medium">{omExpense.category}</div>
              </div>

              {/* FEAT-007: Show default OpCo if set */}
              {omExpense.defaultOpCo && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('detail.defaultOpCo', { defaultValue: '預設 OpCo' })}
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {omExpense.defaultOpCo.code}
                    </Badge>
                    <div className="mt-1 text-sm">{omExpense.defaultOpCo.name}</div>
                  </div>
                </div>
              )}

              {/* Legacy OpCo display for backward compatibility */}
              {!omExpense.defaultOpCo && omExpense.opCo && (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.opCo')}</div>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {omExpense.opCo.code}
                    </Badge>
                    <div className="mt-1 text-sm">{omExpense.opCo.name}</div>
                  </div>
                </div>
              )}

              {omExpense.vendor ? (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.vendor')}</div>
                  <div className="mt-1 font-medium">{omExpense.vendor.name}</div>
                  {omExpense.vendor.contactEmail && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {omExpense.vendor.contactEmail}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.vendor')}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t('detail.noVendor')}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview Card - FEAT-007: Use totals from items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.budgetOverview')}</CardTitle>
              <CardDescription>
                {tItems('totalFromItems', { count: transformedItems.length, defaultValue: `從 ${transformedItems.length} 個項目匯總` })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('detail.budgetAmount')}</span>
                <span className="font-semibold">{formatCurrency(totalBudget)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('detail.actualSpent')}</span>
                <span
                  className={`font-semibold ${
                    utilizationRate > 100
                      ? 'text-red-600'
                      : utilizationRate > 90
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {formatCurrency(totalActual)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('detail.remainingBudget')}</span>
                <span className="font-semibold">
                  {formatCurrency(totalBudget - totalActual)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">{t('detail.utilizationRate')}</span>
                <span
                  className={`text-sm font-medium ${
                    utilizationRate > 100
                      ? 'text-red-600'
                      : utilizationRate > 90
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {utilizationRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Year-over-Year Growth Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{t('detail.yoyGrowth')}</CardTitle>
                  <CardDescription>{t('detail.yoyGrowthDesc')}</CardDescription>
                </div>
                {omExpense.yoyGrowthRate !== null && (
                  <Badge className={getGrowthRateColor(omExpense.yoyGrowthRate)}>
                    {getGrowthIcon(omExpense.yoyGrowthRate)}
                    <span className="ml-1">{formatGrowthRate(omExpense.yoyGrowthRate)}</span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {omExpense.yoyGrowthRate !== null ? (
                <div className="text-sm text-muted-foreground">
                  {omExpense.yoyGrowthRate > 0
                    ? t('detail.increaseBy', { rate: omExpense.yoyGrowthRate.toFixed(1) })
                    : omExpense.yoyGrowthRate < 0
                    ? t('detail.decreaseBy', { rate: Math.abs(omExpense.yoyGrowthRate).toFixed(1) })
                    : t('detail.noChange')}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('detail.growthNotCalculated')}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => calculateGrowthMutation.mutate({ id: params.id })}
                    disabled={calculateGrowthMutation.isPending}
                  >
                    {calculateGrowthMutation.isPending ? t('detail.calculating') : t('detail.calculateGrowth')}
                  </Button>
                </div>
              )}
              {omExpense.yoyGrowthRate !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => calculateGrowthMutation.mutate({ id: params.id })}
                  disabled={calculateGrowthMutation.isPending}
                >
                  {calculateGrowthMutation.isPending ? t('detail.recalculating') : t('detail.recalculate')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Items and Monthly Grid - FEAT-007 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section with Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {tItems('title', { defaultValue: '明細項目' })}
                  </CardTitle>
                  <CardDescription>
                    {tItems('description', { defaultValue: '管理此 OM 費用的明細項目和月度記錄' })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transformedItems.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="items">
                      {tItems('listTab', { defaultValue: '項目列表' })} ({transformedItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="monthly">
                      {tItems('monthlyTab', { defaultValue: '月度記錄' })}
                      {selectedItem && ` - ${selectedItem.name}`}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="items" className="mt-4">
                    <OMExpenseItemList
                      omExpenseId={params.id}
                      items={transformedItems}
                      onAddItem={handleAddItem}
                      onEditItem={handleEditItem}
                      onDeleteItem={handleDeleteItem}
                      onReorder={handleReorder}
                      onEditMonthly={handleEditMonthly}
                      isLoading={isLoading}
                      canEdit={true}
                    />
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-4">
                    {/* 項目選擇器 */}
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">
                        {tItems('selectItem', { defaultValue: '選擇項目' })}
                      </label>
                      <Select
                        value={selectedItemId || '__none__'}
                        onValueChange={(value) => setSelectedItemId(value === '__none__' ? null : value)}
                      >
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder={tItems('selectItemPlaceholder', { defaultValue: '請選擇一個明細項目' })} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            {tItems('selectItemPlaceholder', { defaultValue: '請選擇一個明細項目' })}
                          </SelectItem>
                          {transformedItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {tCommon('currency.twd', { defaultValue: 'TWD' })} {item.budgetAmount?.toLocaleString() ?? '0'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 月度記錄表格 */}
                    {selectedItem ? (
                      <OMExpenseItemMonthlyGrid
                        item={selectedItem}
                        onSave={() => refetch()}
                        onClose={() => setSelectedItemId(null)}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        {tItems('selectItemForMonthly', { defaultValue: '請選擇一個項目以查看月度記錄' })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {tItems('noItems', { defaultValue: '尚無明細項目' })}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tItems('addFirstItemHint', { defaultValue: '點擊下方按鈕新增第一個明細項目' })}
                  </p>
                  <OMExpenseItemList
                    omExpenseId={params.id}
                    items={[]}
                    onAddItem={handleAddItem}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                    onReorder={handleReorder}
                    onEditMonthly={handleEditMonthly}
                    isLoading={isLoading}
                    canEdit={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FEAT-007: Item Form Dialog for Add/Edit */}
      <Dialog open={itemFormMode !== null} onOpenChange={(open) => !open && handleItemFormClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {itemFormMode === 'add'
                ? tItems('addItem', { defaultValue: '新增明細項目' })
                : tItems('editItem', { defaultValue: '編輯明細項目' })}
            </DialogTitle>
            <DialogDescription>
              {itemFormMode === 'add'
                ? tItems('addItemDescription', { defaultValue: '為此 OM 費用新增一個明細項目' })
                : tItems('editItemDescription', { defaultValue: '修改明細項目資訊' })}
            </DialogDescription>
          </DialogHeader>
          {itemFormMode && (
            <OMExpenseItemForm
              mode={itemFormMode === 'add' ? 'create' : 'edit'}
              omExpenseId={params.id}
              initialData={editingItem || undefined}
              defaultOpCoId={omExpense.defaultOpCoId || undefined}
              onSuccess={handleItemFormSuccess}
              onCancel={handleItemFormClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
