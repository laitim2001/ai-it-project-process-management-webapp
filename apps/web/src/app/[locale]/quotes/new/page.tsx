/**
 * @fileoverview New Quote Page - 新增報價單頁面
 *
 * @description
 * 提供報價單建立功能的頁面，支援專案選擇、供應商選擇、金額輸入和文件上傳。
 * 包含完整的表單驗證（文件類型、大小限制）和錯誤處理。
 * 上傳成功後自動跳轉到報價列表頁面。
 *
 * @page /[locale]/quotes/new
 *
 * @features
 * - 專案選擇下拉選單（僅顯示有已批准提案的專案）
 * - 供應商選擇下拉選單
 * - 報價金額輸入（支援小數點）
 * - 報價文件上傳（支援 PDF, DOC, DOCX, XLS, XLSX）
 * - 文件類型驗證（允許的 MIME types）
 * - 文件大小驗證（最大 10MB）
 * - 即時文件資訊顯示（名稱、大小）
 * - 表單驗證和錯誤提示
 * - 上傳進度狀態顯示
 *
 * @routing
 * - 當前頁: /quotes/new
 * - 成功後: /quotes
 * - 返回: /quotes (取消按鈕)
 *
 * @stateManagement
 * - React State: projectId, vendorId, amount, file, uploading
 * - tRPC: 專案列表查詢、供應商列表查詢
 * - Form State: 表單輸入和驗證狀態
 * - Toast: 操作結果提示
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢
 * - shadcn/ui: Card, Button, Input, Label, Alert, Breadcrumb
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/quote.ts - 報價 API Router
 * - apps/web/src/app/api/upload/quote/route.ts - 報價上傳 API 端點
 * - apps/web/src/app/[locale]/quotes/page.tsx - 報價列表頁面
 * - apps/web/src/app/[locale]/quotes/[id]/edit/page.tsx - 編輯報價頁面
 *
 * @validation
 * - 專案: 必填
 * - 供應商: 必填
 * - 金額: 必填，大於 0
 * - 文件: 必填，類型限制（PDF, DOC, XLS），大小限制（10MB）
 *
 * @author IT Department
 * @since Epic 5 - Procurement and Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui';
import { Upload, FileText, AlertCircle, Save } from 'lucide-react';

export default function NewQuotePage() {
  const t = useTranslations('quotes');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const tToast = useTranslations('toast');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  // 表單狀態
  const [projectId, setProjectId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 查詢所有專案
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢所有供應商
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  /**
   * 文件選擇處理
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 驗證文件類型
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({ title: tToast('error.title'), description: t('validation.invalidFileType'), variant: "destructive" });
        return;
      }

      // 驗證文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: tToast('error.title'), description: t('validation.fileTooLarge'), variant: "destructive" });
        return;
      }

      setFile(selectedFile);
    }
  };

  /**
   * 提交表單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!projectId) {
      toast({ title: tToast('error.title'), description: t('validation.projectRequired'), variant: "destructive" });
      return;
    }

    if (!vendorId) {
      toast({ title: tToast('error.title'), description: t('validation.vendorRequired'), variant: "destructive" });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: tToast('error.title'), description: t('validation.amountRequired'), variant: "destructive" });
      return;
    }

    if (!file) {
      toast({ title: tToast('error.title'), description: t('validation.fileRequired'), variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // 構建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('vendorId', vendorId);
      formData.append('amount', amount);

      // 調用上傳 API
      const response = await fetch('/api/upload/quote', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tToast('error.general'));
      }

      toast({ title: tToast('success.title'), description: t('messages.createSuccess'), variant: "success" });

      // 跳轉到報價單列表頁
      router.push('/quotes');
    } catch (error) {
      console.error('創建報價單錯誤:', error);
      toast({
        title: tToast('error.title'),
        description: error instanceof Error ? error.message : tToast('error.general'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/quotes">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('actions.create')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('actions.create')}</h1>
          <p className="mt-2 text-muted-foreground">{t('new.description')}</p>
        </div>

        {/* 表單卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('form.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 專案選擇 */}
              <div className="space-y-2">
                <Label htmlFor="project">
                  {t('form.project.label')} <span className="text-destructive">*</span>
                </Label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  disabled={uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t('form.project.placeholder')}</option>
                  {projects?.items.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  {t('form.project.hint')}
                </p>
              </div>

              {/* 供應商選擇 */}
              <div className="space-y-2">
                <Label htmlFor="vendor">
                  {t('form.vendor.label')} <span className="text-destructive">*</span>
                </Label>
                <select
                  id="vendor"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  disabled={uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t('form.vendor.placeholder')}</option>
                  {vendors?.items.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 報價金額 */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {t('form.amount.label')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('form.amount.placeholder')}
                  required
                  disabled={uploading}
                />
              </div>

              {/* 文件選擇 */}
              <div className="space-y-2">
                <Label htmlFor="file">
                  {t('form.file.label')} <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file"
                    className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-muted transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {t('form.file.select')}
                  </label>
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('form.file.hint')}
                </p>
              </div>

              {/* 提示訊息 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">{t('form.uploadNotice.title')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t('form.uploadNotice.approvedOnly')}</li>
                    <li>{t('form.uploadNotice.contentQuality')}</li>
                    <li>{t('form.uploadNotice.comparison')}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* 操作按鈕 */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={uploading}
                >
                  {tCommon('actions.cancel')}
                </Button>
                <Button type="submit" disabled={uploading || !file || !vendorId || !amount || !projectId}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      {tToast('creating')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('actions.create')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
