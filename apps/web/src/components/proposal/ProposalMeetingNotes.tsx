'use client';

/**
 * Module 3: 提案會議記錄組件
 *
 * 功能：
 * - 顯示會議記錄
 * - 編輯會議記錄
 * - 記錄會議日期、記錄和介紹人員
 */

import { useState, useEffect } from 'react';
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
        title: '保存成功',
        description: '會議記錄已成功保存',
      });
      setIsEditing(false);
      utils.budgetProposal.getById.invalidate({ id: proposalId });
    },
    onError: (error) => {
      toast({
        title: '保存失敗',
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
        title: '驗證失敗',
        description: '請選擇會議日期',
        variant: 'destructive',
      });
      return;
    }

    if (!meetingNotes.trim()) {
      toast({
        title: '驗證失敗',
        description: '請輸入會議記錄',
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
            會議記錄
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {hasData ? '編輯' : '新增'}
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
                  會議日期
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
                  介紹人員
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
                  會議記錄
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
              尚未記錄會議資訊。點擊「新增」按鈕開始記錄。
            </AlertDescription>
          </Alert>
        ) : (
          /* 編輯模式 */
          <div className="space-y-4">
            {/* 會議日期 */}
            <div>
              <label htmlFor="meetingDate" className="text-sm font-medium text-foreground block mb-2">
                會議日期 <span className="text-destructive">*</span>
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
                介紹人員
              </label>
              <Input
                id="presentedBy"
                type="text"
                value={presentedBy}
                onChange={(e) => setPresentedBy(e.target.value)}
                placeholder="例如：張經理、李主管"
                disabled={updateMutation.isLoading}
              />
            </div>

            {/* 會議記錄 */}
            <div>
              <label htmlFor="meetingNotes" className="text-sm font-medium text-foreground block mb-2">
                會議記錄 <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="meetingNotes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="請輸入會議記錄內容..."
                rows={8}
                disabled={updateMutation.isLoading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                記錄提案介紹會議的討論內容、決議事項等
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
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
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
              記錄提案介紹會議的日期、參與人員和討論內容，便於後續追蹤和審核。
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
