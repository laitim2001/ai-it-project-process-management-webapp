/**
 * BudgetProposal 詳情頁面
 *
 * 顯示預算提案的完整資訊，包含：
 * - 基本資訊
 * - 審批功能（提交、審批）
 * - 評論系統
 * - 審批歷史
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { notFound, useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import { ProposalActions } from '@/components/proposal/ProposalActions';
import { CommentSection } from '@/components/proposal/CommentSection';
import { ProposalFileUpload } from '@/components/proposal/ProposalFileUpload';
import { ProposalMeetingNotes } from '@/components/proposal/ProposalMeetingNotes';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { FileText, DollarSign, Calendar, User, History, Building2, AlertCircle, Upload, Download, Edit, Save, X } from 'lucide-react';

export default function ProposalDetailPage() {
  const t = useTranslations('proposals');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const id = params.id as string;
  const locale = params.locale as string;

  /**
   * 提案狀態顯示配置
   */
  const PROPOSAL_STATUS_CONFIG = {
    Draft: { label: t('status.draft'), variant: 'outline' as const },
    PendingApproval: { label: t('status.pendingApproval'), variant: 'default' as const },
    Approved: { label: t('status.approved'), variant: 'secondary' as const },
    Rejected: { label: t('status.rejected'), variant: 'destructive' as const },
    MoreInfoRequired: { label: t('status.moreInfoRequired'), variant: 'default' as const },
  } as const;

  /**
   * 審批動作標籤映射
   */
  const ACTION_LABELS: Record<string, string> = {
    SUBMITTED: t('actions.submit'),
    APPROVED: t('actions.approve'),
    REJECTED: t('actions.reject'),
    MORE_INFO_REQUIRED: t('actions.requestInfo'),
  };

  const { data: proposal, isLoading } = api.budgetProposal.getById.useQuery({ id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-[420px]" />

          {/* Header Skeleton */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${locale}/dashboard`}>{tNav('dashboard')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${locale}/proposals`}>{t('title')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('detail.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('detail.notFound')}
                </AlertDescription>
              </Alert>
              <Link href={`/${locale}/proposals`}>
                <Button>{tCommon('actions.back')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/dashboard`}>{tNav('dashboard')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/proposals`}>{t('title')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{proposal.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{proposal.title}</h1>
              <Badge variant={PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].variant}>
                {PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t('fields.project')}：
              <Link
                href={`/${locale}/projects/${proposal.project.id}`}
                className="ml-1 text-primary hover:text-primary font-medium"
              >
                {proposal.project.name}
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
              <Link href={`/${locale}/proposals/${proposal.id}/edit`}>
                <Button variant="outline">{tCommon('actions.edit')}</Button>
              </Link>
            )}
            <Link href={`/${locale}/proposals`}>
              <Button variant="outline">{tCommon('actions.back')}</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側主要內容 */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tabs 導航 */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('detail.tabs.basic')}</TabsTrigger>
                <TabsTrigger value="project">{t('detail.tabs.project')}</TabsTrigger>
                <TabsTrigger value="file">{t('detail.tabs.file')}</TabsTrigger>
                <TabsTrigger value="meeting">{t('detail.tabs.meeting')}</TabsTrigger>
              </TabsList>

              {/* Tab 1: 基本資訊 */}
              <TabsContent value="basic" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t('detail.info.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.amount')}</dt>
                        <dd className="text-2xl font-bold text-foreground flex items-center gap-1">
                          <DollarSign className="h-5 w-5" />
                          ${proposal.amount.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.status')}</dt>
                        <dd>
                          <Badge variant={PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].variant}>
                            {PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].label}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground mb-1">{tCommon('fields.createdAt')}</dt>
                        <dd className="text-sm text-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(proposal.createdAt).toLocaleString('zh-TW')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground mb-1">{tCommon('fields.updatedAt')}</dt>
                        <dd className="text-sm text-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(proposal.updatedAt).toLocaleString('zh-TW')}
                        </dd>
                      </div>
                      {proposal.approvedAmount && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.approvedAmount')}</dt>
                          <dd className="text-2xl font-bold text-green-600 flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            ${proposal.approvedAmount.toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {proposal.approvedAt && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.approvedAt')}</dt>
                          <dd className="text-sm text-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(proposal.approvedAt).toLocaleString('zh-TW')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: 相關專案 */}
              <TabsContent value="project" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {t('detail.project.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t('fields.projectName')}：</span>
                      <Link
                        href={`/${locale}/projects/${proposal.project.id}`}
                        className="ml-2 text-primary hover:text-primary font-medium"
                      >
                        {proposal.project.name}
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block mb-2">{t('fields.manager')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">
                            {proposal.project.manager.name || proposal.project.manager.email}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block mb-2">{t('fields.supervisor')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm text-foreground">
                            {proposal.project.supervisor.name || proposal.project.supervisor.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t('fields.budgetPool')}：</span>
                      <Link
                        href={`/${locale}/budget-pools/${proposal.project.budgetPool.id}`}
                        className="ml-2 text-primary hover:text-primary font-medium"
                      >
                        {proposal.project.budgetPool.name}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: 項目計劃書文件 */}
              <TabsContent value="file" className="mt-6">
                <ProposalFileUpload
                  proposalId={proposal.id}
                  proposalFilePath={proposal.proposalFilePath}
                  proposalFileName={proposal.proposalFileName}
                  proposalFileSize={proposal.proposalFileSize}
                />
              </TabsContent>

              {/* Tab 4: 會議記錄 */}
              <TabsContent value="meeting" className="mt-6">
                <ProposalMeetingNotes
                  proposalId={proposal.id}
                  meetingDate={proposal.meetingDate}
                  meetingNotes={proposal.meetingNotes}
                  presentedBy={proposal.presentedBy}
                />
              </TabsContent>
            </Tabs>

            {/* 評論區 */}
            <CommentSection
              proposalId={proposal.id}
              comments={proposal.comments}
            />
          </div>

          {/* 右側邊欄 */}
          <div className="space-y-6">
            {/* 操作區 */}
            <ProposalActions
              proposalId={proposal.id}
              status={proposal.status}
            />

            {/* 審批歷史 */}
            {proposal.historyItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {t('detail.history.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposal.historyItems.map((history) => (
                      <div
                        key={history.id}
                        className="border-l-2 border-primary pl-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {getActionLabel(history.action)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(history.createdAt).toLocaleString('zh-TW')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {history.user.name || history.user.email}
                        </p>
                        {history.details && (
                          <p className="mt-1 text-sm text-muted-foreground">{history.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
