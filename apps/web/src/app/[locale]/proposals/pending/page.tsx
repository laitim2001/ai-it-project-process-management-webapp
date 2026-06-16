/**
 * @fileoverview Pending Approvals Page - 待我審批視圖（FEAT-014）
 *
 * @description
 * 列出「當前審批步驟之審批角色 == 登入者角色」且狀態 Pending 的預算提案。
 * 對應原始需求 #4「主管專屬待審視圖」，以角色判定（D9）。
 * 顯示提案關鍵資訊（標題、類型、Requested/Approved、Vendor、會議記錄連結、卡在第幾步）。
 *
 * @page /[locale]/proposals/pending
 *
 * @permissions 所有登入者皆可（依角色顯示對應待審項；procedure 為 protectedProcedure）
 *
 * @related
 * - packages/api/src/routers/budgetProposal.ts - getPendingForMe
 *
 * @since FEAT-014 - 可配置序列審批流程
 */

'use client';

import { ClipboardCheck, AlertCircle, ExternalLink, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';

export default function PendingApprovalsPage() {
  const t = useTranslations('proposals');

  const { data: proposals, isLoading } = api.budgetProposal.getPendingForMe.useQuery();

  return (
    <DashboardLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/proposals">{t('title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{t('pending.title')}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ClipboardCheck className="h-7 w-7" />
          {t('pending.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('pending.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('pending.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!isLoading && (!proposals || proposals.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">{t('pending.empty')}</p>
            </div>
          )}

          {!isLoading && proposals && proposals.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('fields.title')}</TableHead>
                    <TableHead>{t('fields.proposalType')}</TableHead>
                    <TableHead className="text-right">{t('fields.amount')}</TableHead>
                    <TableHead>{t('fields.project')}</TableHead>
                    <TableHead>{t('fields.vendor')}</TableHead>
                    <TableHead>{t('pending.currentStep')}</TableHead>
                    <TableHead>{t('fields.documentLink')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((p) => {
                    const current = p.approvalProgress.find(
                      (pr) => pr.sequence === p.currentStepSequence
                    );
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/proposals/${p.id}`}
                            className="text-primary hover:underline"
                          >
                            {p.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.proposalType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${p.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {/* CHANGE-052: 目標為 Project 或 OM 費用 */}
                          {p.project ? (
                            <Link
                              href={`/projects/${p.project.id}`}
                              className="text-primary hover:underline"
                            >
                              {p.project.name}
                            </Link>
                          ) : p.omExpense ? (
                            <Link
                              href={`/om-expenses/${p.omExpense.id}`}
                              className="text-primary hover:underline"
                            >
                              {p.omExpense.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{p.vendor?.name ?? '-'}</TableCell>
                        <TableCell>
                          {current ? (
                            <span className="inline-flex items-center gap-1">
                              <Badge variant="secondary">
                                {t('approval.stepLabel', { step: current.sequence })}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {/* CHANGE-047: 指定用戶步驟顯示用戶名，否則顯示角色名 */}
                                {current.approverUserId
                                  ? current.designatedApprover?.name ??
                                    current.step?.approverUser?.name ??
                                    current.designatedApprover?.email ??
                                    current.step?.approverUser?.email ??
                                    ''
                                  : current.step?.role?.name ?? ''}
                              </span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {p.documentLink ? (
                            <a
                              href={p.documentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t('pending.openLink')}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
