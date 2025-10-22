'use client';

/**
 * 報價單上傳表單組件
 *
 * Epic 5 - Story 5.2: 為已批准的專案上傳並關聯報價單
 *
 * 功能說明:
 * - 文件選擇和預覽
 * - 供應商選擇
 * - 報價金額輸入
 * - 文件上傳處理
 * - 上傳進度顯示
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface QuoteUploadFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function QuoteUploadForm({ projectId, onSuccess }: QuoteUploadFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

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
   * 上傳報價單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!file) {
      showToast('請選擇要上傳的文件', 'error');
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

      showToast('報價單上傳成功！', 'success');

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
      showToast(
        error instanceof Error ? error.message : '上傳失敗，請稍後再試',
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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上傳報價單
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文件選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              報價文件 <span className="text-red-500">*</span>
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
                選擇文件
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
              支援格式: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)，最大 10MB
            </p>
          </div>

          {/* 供應商選擇 */}
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
              供應商 <span className="text-red-500">*</span>
            </label>
            <Select
              id="vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
              disabled={uploading}
            >
              <option value="">請選擇供應商</option>
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
              報價金額 (TWD) <span className="text-red-500">*</span>
            </label>
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

          {/* 提示訊息 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">上傳須知</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>只有已批准提案的專案才能上傳報價</li>
                <li>請確保報價文件內容完整清晰</li>
                <li>上傳後可在報價比較頁面查看和選擇</li>
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
                  上傳中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  上傳報價單
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
