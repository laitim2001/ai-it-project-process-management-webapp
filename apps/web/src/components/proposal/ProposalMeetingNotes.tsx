'use client';

/**
 * @fileoverview 提案會議記錄組件
 *
 * @description
 * 預算提案的會議記錄管理組件，記錄提案評審會議的詳細資訊。
 * 包含會議日期、會議記錄內容、介紹人員，以及 CHANGE-043 新增的
 * 提案類型、付款對象（Vendor）、審查行動項（Review notes）、外部連結（Docuware）。
 * 支援編輯和查看模式切換。
 *
 * @module apps/web/src/components/proposal/ProposalMeetingNotes
 * @component ProposalMeetingNotes
 * @author IT Department
 * @since Epic 3 - Story 3.5 (Proposal Meeting Notes)
 * @lastModified 2026-06-02 (CHANGE-043: 會議記錄欄位擴充)
 *
 * @features
 * - 顯示/編輯模式切換
 * - 會議日期選擇器
 * - 介紹人員輸入框
 * - 會議記錄多行文本框
 * - CHANGE-043: 提案類型（Budget Proposal / Payment）
 * - CHANGE-043: 付款對象 Vendor 下拉（Pay to）
 * - CHANGE-043: 審查行動項（Review notes / action items）
 * - CHANGE-043: 外部文件連結（Docuware，URL 驗證 + 可點開）
 * - 必填欄位驗證（日期和記錄）
 * - 空狀態提示
 * - 即時數據同步（tRPC invalidation）
 *
 * @dependencies
 * - @/lib/trpc - tRPC client（updateMeetingNotes mutation、vendor.getAll）
 * - next-intl - 國際化
 * - @/components/ui - Card, Button, Input, Textarea, Select, Alert 組件
 * - lucide-react - 圖標組件
 *
 * @related
 * - ../../app/[locale]/proposals/[id]/page.tsx - 使用此組件的提案詳情頁
 * - ../../../../packages/api/src/routers/budgetProposal.ts - updateMeetingNotes procedure
 * - ../../../../packages/db/prisma/schema.prisma - BudgetProposal meeting fields
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  User,
  Edit,
  Save,
  X,
  AlertCircle,
  Tag,
  Building2,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';

type ProposalType = 'BudgetProposal' | 'Payment';
const VENDOR_NONE = '__none__';

interface ProposalMeetingNotesProps {
  proposalId: string;
  meetingDate?: Date | null;
  meetingNotes?: string | null;
  presentedBy?: string | null;
  // CHANGE-043: 擴充欄位
  proposalType?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  reviewNotes?: string | null;
  documentLink?: string | null;
}

export function ProposalMeetingNotes({
  proposalId,
  meetingDate: initialMeetingDate,
  meetingNotes: initialMeetingNotes,
  presentedBy: initialPresentedBy,
  proposalType: initialProposalType,
  vendorId: initialVendorId,
  vendorName: initialVendorName,
  reviewNotes: initialReviewNotes,
  documentLink: initialDocumentLink,
}: ProposalMeetingNotesProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const t = useTranslations('proposals.meeting');
  const tCommon = useTranslations('common');

  const [isEditing, setIsEditing] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [presentedBy, setPresentedBy] = useState('');
  // CHANGE-043 state
  const [proposalType, setProposalType] = useState<ProposalType>('BudgetProposal');
  const [vendorId, setVendorId] = useState(''); // '' = 未指定
  const [reviewNotes, setReviewNotes] = useState('');
  const [documentLink, setDocumentLink] = useState('');

  // CHANGE-043: 取得 Vendor 清單供下拉選擇
  const { data: vendorData } = api.vendor.getAll.useQuery({ page: 1, limit: 100 });
  const vendors = vendorData?.items ?? [];

  // 初始化表單數據
  useEffect(() => {
    if (initialMeetingDate) {
      setMeetingDate(new Date(initialMeetingDate).toISOString().split('T')[0] ?? '');
    }
    setMeetingNotes(initialMeetingNotes || '');
    setPresentedBy(initialPresentedBy || '');
    setProposalType((initialProposalType as ProposalType) || 'BudgetProposal');
    setVendorId(initialVendorId || '');
    setReviewNotes(initialReviewNotes || '');
    setDocumentLink(initialDocumentLink || '');
  }, [
    initialMeetingDate,
    initialMeetingNotes,
    initialPresentedBy,
    initialProposalType,
    initialVendorId,
    initialReviewNotes,
    initialDocumentLink,
  ]);

  // 更新會議記錄 mutation
  const updateMutation = api.budgetProposal.updateMeetingNotes.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.saveSuccess'),
        description: t('messages.saveSuccessDesc'),
      });
      setIsEditing(false);
      utils.budgetProposal.getById.invalidate({ id: proposalId });
    },
    onError: (error) => {
      toast({
        title: t('messages.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * 保存會議記錄
   */
  const handleSave = () => {
    // 驗證
    if (!meetingDate) {
      toast({
        title: tCommon('status.rejected'),
        description: t('messages.validation.dateRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!meetingNotes.trim()) {
      toast({
        title: tCommon('status.rejected'),
        description: t('messages.validation.notesRequired'),
        variant: 'destructive',
      });
      return;
    }

    // 調用 API（CHANGE-043: 一併送出擴充欄位）
    updateMutation.mutate({
      proposalId,
      meetingDate,
      meetingNotes: meetingNotes.trim(),
      presentedBy: presentedBy.trim() || undefined,
      proposalType,
      vendorId: vendorId || null,
      reviewNotes: reviewNotes.trim(),
      documentLink: documentLink.trim(),
    });
  };

  /**
   * 取消編輯
   */
  const handleCancel = () => {
    // 恢復初始值
    if (initialMeetingDate) {
      setMeetingDate(new Date(initialMeetingDate).toISOString().split('T')[0] ?? '');
    } else {
      setMeetingDate('');
    }
    setMeetingNotes(initialMeetingNotes || '');
    setPresentedBy(initialPresentedBy || '');
    setProposalType((initialProposalType as ProposalType) || 'BudgetProposal');
    setVendorId(initialVendorId || '');
    setReviewNotes(initialReviewNotes || '');
    setDocumentLink(initialDocumentLink || '');
    setIsEditing(false);
  };

  const hasData =
    initialMeetingDate ||
    initialMeetingNotes ||
    initialPresentedBy ||
    initialVendorId ||
    initialReviewNotes ||
    initialDocumentLink;

  const typeLabel = (value: string) =>
    value === 'Payment' ? t('fields.type.options.payment') : t('fields.type.options.budgetProposal');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {hasData ? t('edit') : t('add')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing && hasData ? (
          /* 顯示模式 */
          <div className="space-y-4">
            {/* CHANGE-043: 提案類型 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                {t('fields.type.label')}
              </label>
              <div className="flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{typeLabel(initialProposalType || 'BudgetProposal')}</span>
              </div>
            </div>

            {initialMeetingDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.date.label')}
                </label>
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(initialMeetingDate).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>
            )}

            {/* CHANGE-043: 付款對象 */}
            {initialVendorName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.vendor.label')}
                </label>
                <div className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{initialVendorName}</span>
                </div>
              </div>
            )}

            {initialPresentedBy && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.presentedBy.label')}
                </label>
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{initialPresentedBy}</span>
                </div>
              </div>
            )}

            {initialMeetingNotes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.notes.label')}
                </label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-foreground">
                  {initialMeetingNotes}
                </div>
              </div>
            )}

            {/* CHANGE-043: 審查行動項 */}
            {initialReviewNotes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.reviewNotes.label')}
                </label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-foreground">
                  {initialReviewNotes}
                </div>
              </div>
            )}

            {/* CHANGE-043: 外部文件連結 */}
            {initialDocumentLink && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  {t('fields.documentLink.label')}
                </label>
                <a
                  href={initialDocumentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline break-all"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span>{t('fields.documentLink.open')}</span>
                </a>
              </div>
            )}
          </div>
        ) : !isEditing && !hasData ? (
          /* 空狀態 */
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('hints.empty')}
            </AlertDescription>
          </Alert>
        ) : (
          /* 編輯模式 */
          <div className="space-y-4">
            {/* CHANGE-043: 提案類型 */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {t('fields.type.label')}
              </label>
              <Select
                value={proposalType}
                onValueChange={(v) => setProposalType(v as ProposalType)}
                disabled={updateMutation.isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BudgetProposal">
                    {t('fields.type.options.budgetProposal')}
                  </SelectItem>
                  <SelectItem value="Payment">
                    {t('fields.type.options.payment')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 會議日期 */}
            <div>
              <label htmlFor="meetingDate" className="text-sm font-medium text-foreground block mb-2">
                {t('fields.date.label')} <span className="text-destructive">*</span>
              </label>
              <Input
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={updateMutation.isLoading}
              />
            </div>

            {/* CHANGE-043: 付款對象 Vendor */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {t('fields.vendor.label')}
              </label>
              <Select
                value={vendorId || VENDOR_NONE}
                onValueChange={(v) => setVendorId(v === VENDOR_NONE ? '' : v)}
                disabled={updateMutation.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.vendor.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VENDOR_NONE}>{t('fields.vendor.none')}</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 介紹人員 */}
            <div>
              <label htmlFor="presentedBy" className="text-sm font-medium text-foreground block mb-2">
                {t('fields.presentedBy.label')}
              </label>
              <Input
                id="presentedBy"
                type="text"
                value={presentedBy}
                onChange={(e) => setPresentedBy(e.target.value)}
                placeholder={t('fields.presentedBy.placeholder')}
                disabled={updateMutation.isLoading}
              />
            </div>

            {/* 會議記錄 */}
            <div>
              <label htmlFor="meetingNotes" className="text-sm font-medium text-foreground block mb-2">
                {t('fields.notes.label')} <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="meetingNotes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder={t('fields.notes.placeholder')}
                rows={8}
                disabled={updateMutation.isLoading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('hints.notesHelp')}
              </p>
            </div>

            {/* CHANGE-043: 審查行動項 */}
            <div>
              <label htmlFor="reviewNotes" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                {t('fields.reviewNotes.label')}
              </label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t('fields.reviewNotes.placeholder')}
                rows={4}
                disabled={updateMutation.isLoading}
              />
            </div>

            {/* CHANGE-043: 外部文件連結 */}
            <div>
              <label htmlFor="documentLink" className="text-sm font-medium text-foreground block mb-2">
                {t('fields.documentLink.label')}
              </label>
              <Input
                id="documentLink"
                type="url"
                value={documentLink}
                onChange={(e) => setDocumentLink(e.target.value)}
                placeholder={t('fields.documentLink.placeholder')}
                disabled={updateMutation.isLoading}
              />
            </div>

            {/* 操作按鈕 */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 提示訊息 */}
        {!isEditing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('hints.info')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
