'use client';

/**
 * 編輯報價單頁面
 *
 * 功能說明：
 * - 修改報價金額
 * - 添加/修改報價說明
 * - 不能修改：專案、供應商、報價文件
 * - 限制：如果報價單已關聯採購單，則不允許編輯
 *
 * Epic 5 - Story 5.2: 報價管理
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Save, FileText, Building2, FolderKanban, AlertCircle } from 'lucide-react';
import { Link } from "@/i18n/routing";

export default function EditQuotePage() {
  const t = useTranslations('quotes');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quoteId = params.id as string;

  // 表單狀態
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // 查詢報價單詳情
  const { data: quote, isLoading, error } = api.quote.getById.useQuery({ id: quoteId });

  // 更新報價單 mutation
  const updateMutation = api.quote.update.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '報價單更新成功！',
        variant: 'success',
      });
      router.push('/quotes');
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: `更新失敗: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 當報價單數據載入時，設置表單初始值
  useEffect(() => {
    if (quote) {
      setAmount(quote.amount.toString());
      setDescription(quote.description || '');
    }
  }, [quote]);

  /**
   * 提交表單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: '驗證錯誤',
        description: '請輸入有效的報價金額',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({
      id: quoteId,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
    });
  };

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[520px]" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤狀態
  if (error || !quote) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
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
                <BreadcrumbPage>編輯</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到報價單。此報價單可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/quotes">
                <Button>返回報價單列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 檢查是否已關聯採購單
  const hasPurchaseOrder = quote.purchaseOrders && quote.purchaseOrders.length > 0;

  if (hasPurchaseOrder) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
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
                <BreadcrumbPage>編輯</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  該報價單已被選為採購單，無法修改。
                </AlertDescription>
              </Alert>
              <Link href="/quotes">
                <Button>返回報價單列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              <BreadcrumbPage>編輯報價單</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯報價單</h1>
          <p className="mt-2 text-muted-foreground">修改報價金額和說明資訊</p>
        </div>

        {/* 報價單基本資訊（只讀） */}
        <Card>
          <CardHeader>
            <CardTitle>報價單資訊（不可修改）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 專案 */}
              <div className="flex items-start gap-3">
                <FolderKanban className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">專案</p>
                  <p className="text-base text-foreground">{quote.project.name}</p>
                </div>
              </div>

              {/* 供應商 */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">供應商</p>
                  <p className="text-base text-foreground">{quote.vendor.name}</p>
                </div>
              </div>

              {/* 報價文件 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">報價文件</p>
                  <p className="text-sm text-foreground">{quote.filePath.split('/').pop()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 編輯表單 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              可編輯資訊
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={updateMutation.isLoading}
                />
              </div>

              {/* 報價說明 */}
              <div className="space-y-2">
                <Label htmlFor="description">報價說明（選填）</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="請輸入報價說明或備註"
                  rows={4}
                  disabled={updateMutation.isLoading}
                />
              </div>

              {/* 提示訊息 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm">
                    專案、供應商和報價文件不可修改。如需更改，請刪除此報價單並重新上傳。
                  </p>
                </AlertDescription>
              </Alert>

              {/* 操作按鈕 */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateMutation.isLoading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isLoading || !amount || parseFloat(amount) <= 0}
                >
                  {updateMutation.isLoading ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
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
