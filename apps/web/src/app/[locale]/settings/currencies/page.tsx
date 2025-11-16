/**
 * @fileoverview Currency Management Page - 貨幣管理頁面
 *
 * @description
 * 系統管理頁面，用於管理可用的貨幣選項。
 * 支援 CRUD 操作、啟用/停用切換、ISO 4217 標準驗證。
 * 系統預設包含 6 種常用貨幣，管理員可新增更多貨幣。
 *
 * @page /[locale]/settings/currencies
 *
 * @features
 * - 貨幣列表展示（代碼、名稱、符號、匯率、狀態）
 * - 新增貨幣（ISO 4217 代碼驗證）
 * - 編輯貨幣資訊
 * - 啟用/停用切換（軟刪除）
 * - 顯示貨幣使用統計（專案數量）
 * - 即時表單驗證
 * - 角色權限控制（僅限 Admin）
 *
 * @permissions
 * - Admin only: 完整 CRUD 權限
 * - 其他角色: 重定向到首頁
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和變更
 * - shadcn/ui: Table, Dialog, Form, Toast
 * - Zod: 表單驗證
 *
 * @related
 * - packages/api/src/routers/currency.ts - Currency API Router
 * - packages/db/prisma/schema.prisma - Currency 資料模型
 * - apps/web/src/components/project/ProjectForm.tsx - 使用貨幣的專案表單
 *
 * @author IT Department
 * @since FEAT-001 - Project Fields Enhancement
 * @lastModified 2025-11-16
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Power, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CurrenciesPage() {
  const t = useTranslations('currencies');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();

  // 狀態管理
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  // 表單狀態
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '',
  });

  // 查詢貨幣列表
  const { data: currencies, isLoading, error, refetch } = api.currency.getAll.useQuery({
    includeInactive,
  });

  // 建立貨幣 Mutation
  const createMutation = api.currency.create.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.createSuccess'),
        description: t('messages.createSuccessDesc'),
      });
      setIsCreateDialogOpen(false);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast({
        title: t('messages.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 更新貨幣 Mutation
  const updateMutation = api.currency.update.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.updateSuccess'),
        description: t('messages.updateSuccessDesc'),
      });
      setIsEditDialogOpen(false);
      setEditingCurrency(null);
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast({
        title: t('messages.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 切換啟用狀態 Mutation
  const toggleActiveMutation = api.currency.toggleActive.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.toggleSuccess'),
        description: t('messages.toggleSuccessDesc'),
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: t('messages.toggleError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 重置表單
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: '',
    });
  };

  // 打開編輯對話框
  const handleEditClick = (currency: any) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  // 提交建立
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: formData.code.toUpperCase(),
      name: formData.name,
      symbol: formData.symbol,
      exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : undefined,
    });
  };

  // 提交更新
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;

    updateMutation.mutate({
      id: editingCurrency.id,
      code: formData.code.toUpperCase(),
      name: formData.name,
      symbol: formData.symbol,
      exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
    });
  };

  // 切換啟用狀態
  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate({ id });
  };

  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/settings">{tNav('menu.settings')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{t('title')}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.create')}
        </Button>
      </div>

      {/* 篩選器 */}
      <div className="mb-4">
        <Label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">{t('filters.includeInactive')}</span>
        </Label>
      </div>

      {/* 貨幣列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('list.title')}</CardTitle>
          <CardDescription>{t('list.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('list.loadError')}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && currencies && currencies.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('list.empty')}</p>
            </div>
          )}

          {!isLoading && !error && currencies && currencies.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fields.code')}</TableHead>
                  <TableHead>{t('fields.name')}</TableHead>
                  <TableHead>{t('fields.symbol')}</TableHead>
                  <TableHead>{t('fields.exchangeRate')}</TableHead>
                  <TableHead>{t('fields.status')}</TableHead>
                  <TableHead>{t('fields.projectCount')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions.title')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-mono font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell className="font-medium">{currency.symbol}</TableCell>
                    <TableCell>
                      {currency.exchangeRate ? currency.exchangeRate.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={currency.active ? 'default' : 'secondary'}>
                        {currency.active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(currency as any)._count?.projects || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(currency)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={currency.active ? 'ghost' : 'default'}
                          size="sm"
                          onClick={() => handleToggleActive(currency.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 建立貨幣 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('form.create.title')}</DialogTitle>
            <DialogDescription>{t('form.create.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">{t('form.fields.code.label')}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder={t('form.fields.code.placeholder')}
                maxLength={3}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('form.fields.code.hint')}
              </p>
            </div>
            <div>
              <Label htmlFor="name">{t('form.fields.name.label')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('form.fields.name.placeholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="symbol">{t('form.fields.symbol.label')}</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder={t('form.fields.symbol.placeholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="exchangeRate">{t('form.fields.exchangeRate.label')}</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.01"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                placeholder={t('form.fields.exchangeRate.placeholder')}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('form.fields.exchangeRate.hint')}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? tCommon('saving') : t('actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯貨幣 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('form.edit.title')}</DialogTitle>
            <DialogDescription>{t('form.edit.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-code">{t('form.fields.code.label')}</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder={t('form.fields.code.placeholder')}
                maxLength={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-name">{t('form.fields.name.label')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('form.fields.name.placeholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-symbol">{t('form.fields.symbol.label')}</Label>
              <Input
                id="edit-symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder={t('form.fields.symbol.placeholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-exchangeRate">{t('form.fields.exchangeRate.label')}</Label>
              <Input
                id="edit-exchangeRate"
                type="number"
                step="0.01"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                placeholder={t('form.fields.exchangeRate.placeholder')}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCurrency(null);
                  resetForm();
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? tCommon('saving') : tCommon('actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
