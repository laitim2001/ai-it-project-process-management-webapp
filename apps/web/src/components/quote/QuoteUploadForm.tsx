'use client';

/**
 * @fileoverview 報價單上傳表單組件
 *
 * @description
 * 報價單（Quote）文件上傳表單，用於為已批准的專案上傳並關聯供應商報價單。
 * 支援文件選擇、供應商選擇、報價金額輸入和文件上傳處理。
 *
 * @module apps/web/src/components/quote/QuoteUploadForm
 * @component QuoteUploadForm
 * @author IT Department
 * @since Epic 5 - Story 5.2 (Quote Upload)
 * @lastModified 2025-11-14
 *
 * @features
 * - 文件類型驗證（PDF, DOC, DOCX, XLS, XLSX）
 * - 文件大小限制（10MB）
 * - 供應商選擇下拉框（分頁加載，最大 100 筆）
 * - 報價金額輸入和驗證
 * - 文件上傳進度顯示
 * - 上傳成功後自動重置表單
 * - 文件大小格式化顯示
 *
 * @dependencies
 * - @/lib/trpc - tRPC client（vendor.getAll query）
 * - next-intl - 國際化
 * - @/components/ui - Card, Button, Input, Select 組件
 * - lucide-react - 圖標組件
 *
 * @related
 * - ../../app/api/upload/quote/route.ts - 文件上傳 API endpoint
 * - ../../../../packages/api/src/routers/quote.ts - Quote procedures
 * - ../../../../packages/db/prisma/schema.prisma - Quote model
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui';
import { useRouter } from "@/i18n/routing";

interface QuoteUploadFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function QuoteUploadForm({ projectId, onSuccess }: QuoteUploadFormProps) {
  const t = useTranslations('quotes');
  const tToast = useTranslations('toast');
  const router = useRouter();
  const { toast } = useToast();

  // 表單狀態
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 查詢所有供應商
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
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
        toast({
          title: tToast('error'),
          description: t('validation.invalidFileType'),
          variant: 'destructive',
        });
        return;
      }

      // 驗證文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: tToast('error'),
          description: t('validation.fileTooLarge'),
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  /**
   * 上傳報價單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!file) {
      toast({
        title: tToast('error'),
        description: t('validation.fileRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!vendorId) {
      toast({
        title: tToast('error'),
        description: t('validation.vendorRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: tToast('error'),
        description: t('validation.amountRequired'),
        variant: 'destructive',
      });
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
        throw new Error(result.error || tToast('error'));
      }

      toast({
        title: tToast('success'),
        description: t('messages.uploadSuccess'),
        variant: 'success',
      });

      // 重置表單
      setFile(null);
      setVendorId('');
      setAmount('');

      // 重置文件輸入
      const fileInput = document.getElementById('quote-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // 回調
      if (onSuccess) {
        onSuccess();
      }

      // 刷新頁面數據
      router.refresh();

    } catch (error) {
      console.error('上傳錯誤:', error);
      toast({
        title: tToast('error'),
        description: error instanceof Error ? error.message : tToast('error'),
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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文件選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.file.label')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                id="quote-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="quote-file-input"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              >
                <Upload className="h-4 w-4" />
                {t('form.file.select')}
              </label>
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({formatFileSize(file.size)})</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t('form.file.hint')}
            </p>
          </div>

          {/* 供應商選擇 */}
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.vendor.label')} <span className="text-red-500">*</span>
            </label>
            <Select
              id="vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
              disabled={uploading}
            >
              <option value="">{t('form.vendor.placeholder')}</option>
              {vendors?.items.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </div>

          {/* 報價金額 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.amount.label')} <span className="text-red-500">*</span>
            </label>
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

          {/* 提示訊息 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">{t('form.uploadNotice.title')}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>{t('form.uploadNotice.approvedOnly')}</li>
                <li>{t('form.uploadNotice.contentQuality')}</li>
                <li>{t('form.uploadNotice.comparison')}</li>
              </ul>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={uploading || !file || !vendorId || !amount}
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {tToast('uploading')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('actions.upload')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
