'use client';

/**
 * 費用詳情頁面
 *
 * 功能說明:
 * - 顯示費用完整資訊
 * - 顯示關聯的採購單和專案
 * - 審批操作（提交、批准、拒絕、標記已支付）
 * - 編輯和刪除操作
 *
 * Epic 6 - Story 6.1 & 6.2: 費用記錄與審批
 */

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Receipt, FileText, ShoppingCart, Calendar, DollarSign, Edit, Trash2, Send, CheckCircle, XCircle, Banknote, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * 費用狀態配置
 */
const EXPENSE_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'outline' as const },
  PendingApproval: { label: '待審批', variant: 'default' as const },
  Approved: { label: '已批准', variant: 'secondary' as const },
  Paid: { label: '已支付', variant: 'default' as const },
};

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [rejectComment, setRejectComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // 查詢費用詳情
  const { data: expense, isLoading, refetch } = api.expense.getById.useQuery({ id });

  // 刪除 Mutation
  const deleteMutation = api.expense.delete.useMutation({
    onSuccess: () => {
      showToast('費用已成功刪除！', 'success');
      router.push('/expenses');
      router.refresh();
    },
    onError: (error) => {
      showToast(`刪除失敗: ${error.message}`, 'error');
    },
  });

  // 提交審批 Mutation
  const submitMutation = api.expense.submit.useMutation({
    onSuccess: () => {
      showToast('費用已提交審批！', 'success');
      refetch();
      router.refresh();
    },
    onError: (error) => {
      showToast(`提交失敗: ${error.message}`, 'error');
    },
  });

  // 批准 Mutation
  const approveMutation = api.expense.approve.useMutation({
    onSuccess: () => {
      showToast('費用已批准！預算池已扣款。', 'success');
      refetch();
      router.refresh();
    },
    onError: (error) => {
      showToast(`批准失敗: ${error.message}`, 'error');
    },
  });

  // 拒絕 Mutation
  const rejectMutation = api.expense.reject.useMutation({
    onSuccess: () => {
      showToast('費用已拒絕', 'success');
      setShowRejectDialog(false);
      setRejectComment('');
      refetch();
      router.refresh();
    },
    onError: (error) => {
      showToast(`拒絕失敗: ${error.message}`, 'error');
    },
  });

  // 標記已支付 Mutation
  const markAsPaidMutation = api.expense.markAsPaid.useMutation({
    onSuccess: () => {
      showToast('費用已標記為已支付！', 'success');
      refetch();
      router.refresh();
    },
    onError: (error) => {
      showToast(`操作失敗: ${error.message}`, 'error');
    },
  });

  /**
   * 操作處理函數
   */
  const handleDelete = () => {
    if (confirm('確定要刪除此費用嗎？\n\n注意: 只有草稿狀態的費用才能刪除。')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = () => {
    if (confirm('確定要提交此費用審批嗎？')) {
      submitMutation.mutate({ id });
    }
  };

  const handleApprove = () => {
    if (confirm('確定要批准此費用嗎？\n\n批准後將從預算池扣款。')) {
      approveMutation.mutate({ id });
    }
  };

  const handleReject = () => {
    if (!rejectComment.trim()) {
      showToast('請輸入拒絕原因', 'error');
      return;
    }
    rejectMutation.mutate({ id, comment: rejectComment });
  };

  const handleMarkAsPaid = () => {
    if (confirm('確定要標記此費用為已支付嗎？')) {
      markAsPaidMutation.mutate({ id });
    }
  };

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[420px]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 找不到費用
  if (!expense) {
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
                <BreadcrumbLink href="/expenses">費用管理</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>詳情</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到費用記錄。此費用可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/expenses">
                <Button>返回費用列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = expense.status === 'Draft';
  const canDelete = expense.status === 'Draft';
  const canSubmit = expense.status === 'Draft';
  const canApprove = expense.status === 'PendingApproval';
  const canReject = expense.status === 'PendingApproval';
  const canMarkAsPaid = expense.status === 'Approved';

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
              <BreadcrumbLink href="/expenses">費用管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>費用詳情</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                ${expense.totalAmount.toLocaleString()}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={EXPENSE_STATUS_CONFIG[expense.status as keyof typeof EXPENSE_STATUS_CONFIG].variant}>
                  {EXPENSE_STATUS_CONFIG[expense.status as keyof typeof EXPENSE_STATUS_CONFIG].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  創建於 {new Date(expense.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Link href={`/expenses/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  編輯
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isLoading ? '刪除中...' : '刪除'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側 2/3: 費用資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>費用資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 費用日期 */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">費用日期</p>
                    <p className="text-base text-foreground">
                      {new Date(expense.expenseDate).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* 費用金額 */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">費用金額</p>
                    <p className="text-2xl font-bold text-primary">
                      ${expense.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 發票文件 */}
                {expense.invoiceFilePath && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">發票文件</p>
                      <a
                        href={expense.invoiceFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-primary hover:underline"
                      >
                        {expense.invoiceFilePath.split('/').pop()}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 關聯資訊卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>關聯資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 採購單 */}
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">採購單</p>
                    <Link
                      href={`/purchase-orders/${expense.purchaseOrder.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.purchaseOrder.poNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      金額: ${expense.purchaseOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 專案 */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">專案</p>
                    <Link
                      href={`/projects/${expense.purchaseOrder.project.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.purchaseOrder.project.name}
                    </Link>
                  </div>
                </div>

                {/* 供應商 */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">供應商</p>
                    <Link
                      href={`/vendors/${expense.purchaseOrder.vendor.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.purchaseOrder.vendor.name}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側 1/3: 操作區 */}
          <div className="space-y-6">
            {/* 審批操作卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>審批操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canSubmit && (
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitMutation.isLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isLoading ? '提交中...' : '提交審批'}
                  </Button>
                )}

                {canApprove && (
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={handleApprove}
                    disabled={approveMutation.isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveMutation.isLoading ? '批准中...' : '批准費用'}
                  </Button>
                )}

                {canReject && (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    拒絕費用
                  </Button>
                )}

                {canMarkAsPaid && (
                  <Button
                    className="w-full"
                    onClick={handleMarkAsPaid}
                    disabled={markAsPaidMutation.isLoading}
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    {markAsPaidMutation.isLoading ? '處理中...' : '標記已支付'}
                  </Button>
                )}

                {!canSubmit && !canApprove && !canReject && !canMarkAsPaid && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    當前狀態下無可用操作
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 狀態說明卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">狀態說明</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>草稿:</strong> 可編輯、提交審批</p>
                <p><strong>待審批:</strong> 等待主管批准或拒絕</p>
                <p><strong>已批准:</strong> 已從預算池扣款，可標記已支付</p>
                <p><strong>已支付:</strong> 費用流程完成</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 拒絕對話框 */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>拒絕費用</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    拒絕原因 <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:border-ring"
                    rows={4}
                    placeholder="請輸入拒絕原因..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectComment('');
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isLoading || !rejectComment.trim()}
                  >
                    {rejectMutation.isLoading ? '處理中...' : '確認拒絕'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
