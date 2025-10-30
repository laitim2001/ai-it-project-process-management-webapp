'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, FolderOpen, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { api } from '@/lib/trpc';
import { ChargeOutActions } from '@/components/charge-out/ChargeOutActions';

/**
 * ChargeOut 詳情頁
 *
 * 功能：
 * 1. 顯示 ChargeOut 完整信息
 * 2. 顯示費用明細列表
 * 3. 狀態操作（submit, confirm, reject, markAsPaid, delete）
 * 4. 相關信息（項目、OpCo、確認人）
 *
 * Fixed: params is already unwrapped in Client Components (not Promise)
 * Trigger: Force recompilation after fix
 */

export default function ChargeOutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // 獲取 ChargeOut 詳情
  const { data: chargeOut, isLoading } = api.chargeOut.getById.useQuery({
    id: params.id,
  });

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 格式化日期時間
  const formatDateTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK').format(new Date(date));
  };

  // 狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-500';
      case 'Submitted':
        return 'bg-yellow-500';
      case 'Confirmed':
        return 'bg-green-500';
      case 'Paid':
        return 'bg-blue-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 狀態文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Draft':
        return '草稿';
      case 'Submitted':
        return '已提交';
      case 'Confirmed':
        return '已確認';
      case 'Paid':
        return '已付款';
      case 'Rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">載入中...</div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!chargeOut) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">找不到 ChargeOut 記錄</p>
          <Button className="mt-4" onClick={() => router.push('/charge-outs')}>
            返回列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/charge-outs">費用轉嫁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{chargeOut.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題和操作 */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/charge-outs')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{chargeOut.name}</h1>
                <p className="mt-2 text-muted-foreground">
                  {chargeOut.description || '無描述'}
                </p>
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(chargeOut.status)} text-lg px-4 py-2`}>
            {getStatusText(chargeOut.status)}
          </Badge>
        </div>
      </div>

      {/* 狀態操作按鈕 */}
      <div className="mb-6">
        <ChargeOutActions chargeOut={chargeOut} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左側：基本信息 + 費用明細 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ChargeOut ID</div>
                  <div className="font-mono text-sm">{chargeOut.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">狀態</div>
                  <div>
                    <Badge className={getStatusColor(chargeOut.status)}>
                      {getStatusText(chargeOut.status)}
                    </Badge>
                  </div>
                </div>
                {chargeOut.debitNoteNumber && (
                  <div>
                    <div className="text-sm text-muted-foreground">借方通知單號</div>
                    <div className="font-medium">{chargeOut.debitNoteNumber}</div>
                  </div>
                )}
                {chargeOut.issueDate && (
                  <div>
                    <div className="text-sm text-muted-foreground">發單日期</div>
                    <div className="font-medium">{formatDate(chargeOut.issueDate)}</div>
                  </div>
                )}
                {chargeOut.paymentDate && (
                  <div>
                    <div className="text-sm text-muted-foreground">付款日期</div>
                    <div className="font-medium">{formatDate(chargeOut.paymentDate)}</div>
                  </div>
                )}
              </div>

              {chargeOut.confirmer && (
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground">確認人</div>
                  <div className="font-medium">{chargeOut.confirmer.name || chargeOut.confirmer.email}</div>
                  {chargeOut.confirmedAt && (
                    <div className="text-xs text-muted-foreground">
                      確認時間: {formatDateTime(chargeOut.confirmedAt)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 費用明細卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                費用明細
              </CardTitle>
              <CardDescription>{chargeOut.items.length} 筆費用項目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-sm font-medium">#</th>
                      <th className="p-2 text-left text-sm font-medium">費用名稱</th>
                      <th className="p-2 text-left text-sm font-medium">發票號碼</th>
                      <th className="p-2 text-right text-sm font-medium">金額 (HKD)</th>
                      <th className="p-2 text-left text-sm font-medium">描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargeOut.items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm">{index + 1}</td>
                          <td className="p-2 text-sm">
                            <div className="font-medium">{item.expense.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.expense.expenseDate
                                ? formatDate(item.expense.expenseDate)
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            {item.expense.invoiceNumber || 'N/A'}
                          </td>
                          <td className="p-2 text-right text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {item.description || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={3} className="p-2 text-right">
                        總計
                      </td>
                      <td className="p-2 text-right text-lg text-primary">
                        {formatCurrency(chargeOut.totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側：相關信息 */}
        <div className="space-y-6">
          {/* 項目信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                項目信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">項目名稱</div>
                <div className="font-medium">{chargeOut.project.name}</div>
              </div>
              {chargeOut.project.description && (
                <div>
                  <div className="text-sm text-muted-foreground">項目描述</div>
                  <div className="text-sm">{chargeOut.project.description}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">項目經理</div>
                <div className="text-sm">
                  {chargeOut.project.manager.name || chargeOut.project.manager.email}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpCo 信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                營運公司 (OpCo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">OpCo 代碼</div>
                <div className="font-medium">{chargeOut.opCo.code}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">OpCo 名稱</div>
                <div className="font-medium">{chargeOut.opCo.name}</div>
              </div>
              {chargeOut.opCo.description && (
                <div>
                  <div className="text-sm text-muted-foreground">描述</div>
                  <div className="text-sm">{chargeOut.opCo.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 時間軸卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                時間軸
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">創建時間</div>
                <div className="text-sm">{formatDateTime(chargeOut.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">最後更新</div>
                <div className="text-sm">{formatDateTime(chargeOut.updatedAt)}</div>
              </div>
              {chargeOut.confirmedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">確認時間</div>
                  <div className="text-sm">{formatDateTime(chargeOut.confirmedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
