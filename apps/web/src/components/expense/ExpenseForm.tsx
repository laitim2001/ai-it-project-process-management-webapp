'use client';

/**
 * 費用表單組件
 *
 * Epic 6 - Story 6.1: 針對採購單記錄發票與費用
 *
 * 功能說明:
 * - 選擇採購單
 * - 輸入費用金額和日期
 * - 上傳發票文件
 * - 創建和更新費用記錄
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ExpenseFormProps {
  expenseId?: string;
  defaultPurchaseOrderId?: string;
}

export function ExpenseForm({ expenseId, defaultPurchaseOrderId }: ExpenseFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // 表單狀態
  const [purchaseOrderId, setPurchaseOrderId] = useState(defaultPurchaseOrderId || '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [invoiceFilePath, setInvoiceFilePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 查詢現有費用（編輯模式）
  const { data: existingExpense } = api.expense.getById.useQuery(
    { id: expenseId! },
    { enabled: !!expenseId }
  );

  // 查詢所有採購單
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: purchaseOrders } = api.purchaseOrder.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 創建費用 Mutation
  const createMutation = api.expense.create.useMutation({
    onSuccess: (data) => {
      showToast('費用已成功創建！', 'success');
      router.push(`/expenses/${data.id}`);
      router.refresh();
    },
    onError: (error) => {
      showToast(`創建失敗: ${error.message}`, 'error');
    },
  });

  // 更新費用 Mutation
  const updateMutation = api.expense.update.useMutation({
    onSuccess: (data) => {
      showToast('費用已成功更新！', 'success');
      router.push(`/expenses/${data.id}`);
      router.refresh();
    },
    onError: (error) => {
      showToast(`更新失敗: ${error.message}`, 'error');
    },
  });

  // 加載現有費用數據
  useEffect(() => {
    if (existingExpense) {
      setPurchaseOrderId(existingExpense.purchaseOrderId);
      setName(existingExpense.name || '');
      setAmount(existingExpense.totalAmount.toString());
      setExpenseDate(new Date(existingExpense.expenseDate).toISOString().split('T')[0]);
      setInvoiceDate(new Date(existingExpense.invoiceDate).toISOString().split('T')[0]);
      setInvoiceNumber(existingExpense.invoiceNumber || '');
      setDescription(existingExpense.description || '');
      setInvoiceFilePath(existingExpense.invoiceFilePath);
    }
  }, [existingExpense]);

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
        'image/jpeg',
        'image/png',
        'image/jpg',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        showToast('不支援的文件類型。請上傳 PDF, Word, Excel 或圖片文件。', 'error');
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
   * 上傳發票
   */
  const handleUploadInvoice = async (): Promise<string | null> => {
    if (!file || !purchaseOrderId) return null;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purchaseOrderId', purchaseOrderId);

      const response = await fetch('/api/upload/invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '上傳失敗');
      }

      return result.filePath;

    } catch (error) {
      console.error('上傳錯誤:', error);
      showToast(
        error instanceof Error ? error.message : '上傳失敗，請稍後再試',
        'error'
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * 提交表單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!name.trim()) {
      showToast('請輸入費用名稱', 'error');
      return;
    }

    if (!purchaseOrderId) {
      showToast('請選擇採購單', 'error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast('請輸入有效的費用金額', 'error');
      return;
    }

    if (!expenseDate) {
      showToast('請選擇費用日期', 'error');
      return;
    }

    if (!invoiceDate) {
      showToast('請選擇發票日期', 'error');
      return;
    }

    // 如果有新文件，先上傳
    let finalInvoicePath = invoiceFilePath;
    if (file) {
      const uploadedPath = await handleUploadInvoice();
      if (!uploadedPath) {
        return; // 上傳失敗，不繼續
      }
      finalInvoicePath = uploadedPath;
    }

    // 構建數據
    const data = {
      name: name.trim(),
      purchaseOrderId,
      amount: parseFloat(amount),
      expenseDate: new Date(expenseDate),
      invoiceDate: new Date(invoiceDate),
      invoiceNumber: invoiceNumber.trim() || undefined,
      description: description.trim() || undefined,
      invoiceFilePath: finalInvoicePath || undefined,
    };

    // 創建或更新
    if (expenseId) {
      updateMutation.mutate({ id: expenseId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading || uploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expenseId ? '編輯費用' : '新增費用'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 採購單選擇 */}
          <div>
            <label htmlFor="purchaseOrder" className="block text-sm font-medium text-gray-700 mb-2">
              採購單 <span className="text-red-500">*</span>
            </label>
            <Select
              id="purchaseOrder"
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              required
              disabled={isSubmitting || !!expenseId} // 編輯時不能改採購單
            >
              <option value="">請選擇採購單</option>
              {purchaseOrders?.items.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} - {po.project.name} (${po.totalAmount.toLocaleString()})
                </option>
              ))}
            </Select>
            {expenseId && (
              <p className="mt-1 text-sm text-gray-500">編輯時無法更改採購單</p>
            )}
          </div>

          {/* 費用名稱 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              費用名稱 <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：伺服器租賃費用、軟體授權費"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 費用金額 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              費用金額 (TWD) <span className="text-red-500">*</span>
            </label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="請輸入費用金額"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 費用日期 */}
          <div>
            <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
              費用日期 <span className="text-red-500">*</span>
            </label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 發票號碼 */}
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
              發票號碼
            </label>
            <Input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="例如：AB12345678"
              disabled={isSubmitting}
            />
          </div>

          {/* 發票日期 */}
          <div>
            <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-2">
              發票日期 <span className="text-red-500">*</span>
            </label>
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 發票上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              發票文件
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  id="invoice-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="invoice-file-input"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <Upload className="h-4 w-4" />
                  選擇文件
                </label>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              {/* 顯示現有發票 */}
              {invoiceFilePath && !file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>當前發票: </span>
                  <a
                    href={invoiceFilePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {invoiceFilePath.split('/').pop()}
                  </a>
                </div>
              )}

              <p className="text-sm text-gray-500">
                支援格式: PDF, Word, Excel, 圖片 (.jpg, .png)，最大 10MB
              </p>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              備註說明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="請輸入費用相關的補充說明"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 提示訊息 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">費用記錄須知</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>費用金額不應超過採購單總金額</li>
                <li>建議上傳發票文件以便審核</li>
                <li>保存後可提交審批</li>
              </ul>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {expenseId ? '更新費用' : '創建費用'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
