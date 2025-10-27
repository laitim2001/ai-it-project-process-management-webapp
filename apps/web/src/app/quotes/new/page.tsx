'use client';

/**
 * 新增報價單頁面
 *
 * 功能說明：
 * - 選擇專案（只顯示有已批准提案的專案）
 * - 選擇供應商
 * - 輸入報價金額
 * - 上傳報價文件
 *
 * Epic 5 - Story 5.2: 報價管理
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/Toast';
import { Upload, FileText, AlertCircle, Save } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const { showToast } = useToast();

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
        showToast('不支援的文件類型。請上傳 PDF, Word 或 Excel 文件。', 'error');
        return;
      }

      // 驗證文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('文件大小超過限制（最大 10MB）', 'error');
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
      showToast('請選擇專案', 'error');
      return;
    }

    if (!vendorId) {
      showToast('請選擇供應商', 'error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast('請輸入有效的報價金額', 'error');
      return;
    }

    if (!file) {
      showToast('請選擇要上傳的文件', 'error');
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
        throw new Error(result.error || '上傳失敗');
      }

      showToast('報價單創建成功！', 'success');

      // 跳轉到報價單列表頁
      router.push('/quotes');
    } catch (error) {
      console.error('創建報價單錯誤:', error);
      showToast(
        error instanceof Error ? error.message : '創建失敗，請稍後再試',
        'error'
      );
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
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/quotes">報價單管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>新增報價單</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">新增報價單</h1>
          <p className="mt-2 text-muted-foreground">上傳供應商報價文件並記錄報價資訊</p>
        </div>

        {/* 表單卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              報價單資訊
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 專案選擇 */}
              <div className="space-y-2">
                <Label htmlFor="project">
                  專案 <span className="text-destructive">*</span>
                </Label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  disabled={uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">請選擇專案</option>
                  {projects?.items.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  只能為已批准提案的專案上傳報價單
                </p>
              </div>

              {/* 供應商選擇 */}
              <div className="space-y-2">
                <Label htmlFor="vendor">
                  供應商 <span className="text-destructive">*</span>
                </Label>
                <select
                  id="vendor"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  disabled={uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">請選擇供應商</option>
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
                  報價金額 (TWD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="請輸入報價金額"
                  required
                  disabled={uploading}
                />
              </div>

              {/* 文件選擇 */}
              <div className="space-y-2">
                <Label htmlFor="file">
                  報價文件 <span className="text-destructive">*</span>
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
                    選擇文件
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
                  支援格式: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)，最大 10MB
                </p>
              </div>

              {/* 提示訊息 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">上傳須知</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>只有已批准提案的專案才能上傳報價</li>
                    <li>請確保報價文件內容完整清晰</li>
                    <li>上傳後可在報價比較頁面查看和選擇</li>
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
                  取消
                </Button>
                <Button type="submit" disabled={uploading || !file || !vendorId || !amount || !projectId}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      創建中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      創建報價單
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
