'use client';

/**
 * @fileoverview 提案會議記錄組件
 *
 * @description
 * 預算提案的會議記錄管理組件，記錄提案評審會議的詳細資訊。
 * 包含會議日期、會議記錄內容和介紹人員資訊，支援編輯和查看模式切換。
 *
 * @module apps/web/src/components/proposal/ProposalMeetingNotes
 * @component ProposalMeetingNotes
 * @author IT Department
 * @since Epic 3 - Story 3.5 (Proposal Meeting Notes)
 * @lastModified 2025-11-14
 *
 * @features
 * - 顯示/編輯模式切換
 * - 會議日期選擇器
 * - 介紹人員輸入框
 * - 會議記錄多行文本框
 * - 必填欄位驗證（日期和記錄）
 * - 空狀態提示
 * - 即時數據同步（tRPC invalidation）
 *
 * @dependencies
 * - @/lib/trpc - tRPC client（updateMeetingNotes mutation）
 * - next-intl - 國際化
 * - @/components/ui - Card, Button, Input, Textarea, Alert 組件
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, User, Edit, Save, X, AlertCircle } from 'lucide-react';

interface ProposalMeetingNotesProps {
  proposalId: string;
  meetingDate?: Date | null;
  meetingNotes?: string | null;
  presentedBy?: string | null;
}

export function ProposalMeetingNotes({
  proposalId,
  meetingDate: initialMeetingDate,
  meetingNotes: initialMeetingNotes,
  presentedBy: initialPresentedBy,
}: ProposalMeetingNotesProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const t = useTranslations('proposals.meeting');
  const tCommon = useTranslations('common');

  const [isEditing, setIsEditing] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [presentedBy, setPresentedBy] = useState('');

  // 初始化表單數據
  useEffect(() => {
    if (initialMeetingDate) {
      setMeetingDate(new Date(initialMeetingDate).toISOString().split('T')[0]);
    }
    setMeetingNotes(initialMeetingNotes || '');
    setPresentedBy(initialPresentedBy || '');
  }, [initialMeetingDate, initialMeetingNotes, initialPresentedBy]);

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

    // 調用 API
    updateMutation.mutate({
      proposalId,
      meetingDate,
      meetingNotes: meetingNotes.trim(),
      presentedBy: presentedBy.trim() || undefined,
    });
  };

  /**
   * 取消編輯
   */
  const handleCancel = () => {
    // 恢復初始值
    if (initialMeetingDate) {
      setMeetingDate(new Date(initialMeetingDate).toISOString().split('T')[0]);
    } else {
      setMeetingDate('');
    }
    setMeetingNotes(initialMeetingNotes || '');
    setPresentedBy(initialPresentedBy || '');
    setIsEditing(false);
  };

  const hasData = initialMeetingDate || initialMeetingNotes || initialPresentedBy;

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
