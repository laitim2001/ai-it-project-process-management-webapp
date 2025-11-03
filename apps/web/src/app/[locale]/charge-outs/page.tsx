'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { Plus } from 'lucide-react';
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

/**
 * ChargeOut 列表頁
 *
 * 功能：
 * 1. 顯示所有 ChargeOut 記錄
 * 2. 支持狀態、OpCo、項目過濾
 * 3. 卡片式展示（項目、OpCo、總金額、狀態）
 * 4. 創建新 ChargeOut
 * 5. 分頁支持
 */

export default function ChargeOutsPage() {
  const t = useTranslations('chargeOuts');
  const router = useRouter();

  // 過濾狀態
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOpCo, setSelectedOpCo] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // 獲取 OpCo 列表（用於過濾器）
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // 獲取項目列表（用於過濾器）
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 獲取 ChargeOut 列表
  const { data: chargeOuts, isLoading } = api.chargeOut.getAll.useQuery({
    status: selectedStatus || undefined,
    opCoId: selectedOpCo || undefined,
    projectId: selectedProject || undefined,
    page,
    limit,
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

  // 狀態選項
  const statusOptions = ['Draft', 'Submitted', 'Confirmed', 'Paid', 'Rejected'];

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
            <BreadcrumbPage>費用轉嫁 (ChargeOut)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">費用轉嫁管理 (ChargeOut)</h1>
            <p className="mt-2 text-muted-foreground">
              管理 IT 部門費用轉嫁至營運公司 (OpCo) 的記錄
            </p>
          </div>
          <Button onClick={() => router.push('/charge-outs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新增 ChargeOut
          </Button>
        </div>
      </div>

      {/* 過濾器 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 狀態選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">狀態</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部狀態</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* OpCo 選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">營運公司 (OpCo)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedOpCo}
                onChange={(e) => {
                  setSelectedOpCo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部 OpCo</option>
                {opCos?.map((opCo) => (
                  <option key={opCo.id} value={opCo.id}>
                    {opCo.code} - {opCo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 項目選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">項目</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部項目</option>
                {projects?.items?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ChargeOut 列表 */}
      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : chargeOuts && chargeOuts.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chargeOuts.items.map((chargeOut) => (
              <Card
                key={chargeOut.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/charge-outs/${chargeOut.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{chargeOut.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {chargeOut.description || '無描述'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(chargeOut.status)}>
                      {getStatusText(chargeOut.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 項目和 OpCo */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">項目: </span>
                      <span className="font-medium">{chargeOut.project.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">OpCo: </span>
                      <span className="font-medium">
                        {chargeOut.opCo.code} - {chargeOut.opCo.name}
                      </span>
                    </div>

                    {/* 總金額 */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">總金額</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(chargeOut.totalAmount)}
                      </span>
                    </div>

                    {/* 費用明細數 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">費用明細</span>
                      <span className="text-sm font-medium">{chargeOut._count.items} 筆</span>
                    </div>

                    {/* 日期信息 */}
                    {chargeOut.issueDate && (
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        發單日期: {formatDate(chargeOut.issueDate)}
                      </div>
                    )}
                    {chargeOut.paymentDate && (
                      <div className="text-xs text-muted-foreground">
                        付款日期: {formatDate(chargeOut.paymentDate)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分頁控制 */}
          {chargeOuts.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一頁
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} 頁，共 {chargeOuts.totalPages} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(chargeOuts.totalPages, p + 1))}
                disabled={page === chargeOuts.totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {selectedStatus || selectedOpCo || selectedProject
                ? '沒有符合條件的 ChargeOut 記錄'
                : '尚無 ChargeOut 記錄，請創建新的 ChargeOut'}
            </p>
            {!selectedStatus && !selectedOpCo && !selectedProject && (
              <Button className="mt-4" onClick={() => router.push('/charge-outs/new')}>
                <Plus className="mr-2 h-4 w-4" />
                創建第一筆 ChargeOut
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
