'use client';

/**
 * Module 3: 提案文件上傳組件
 *
 * 功能：
 * - 上傳項目計劃書文件 (PDF/PPT)
 * - 顯示已上傳的文件
 * - 下載文件
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Download, FileText, AlertCircle, X } from 'lucide-react';

interface ProposalFileUploadProps {
  proposalId: string;
  proposalFilePath?: string | null;
  proposalFileName?: string | null;
  proposalFileSize?: number | null;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function ProposalFileUpload({
  proposalId,
  proposalFilePath,
  proposalFileName,
  proposalFileSize,
}: ProposalFileUploadProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 上傳文件 mutation
  const uploadMutation = api.budgetProposal.uploadProposalFile.useMutation({
    onSuccess: () => {
      toast({
        title: '上傳成功',
        description: '提案文件已成功上傳',
      });
      setFile(null);
      utils.budgetProposal.getById.invalidate({ id: proposalId });
    },
    onError: (error) => {
      toast({
        title: '上傳失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * 文件選擇處理
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 驗證文件類型
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: '文件類型不支持',
        description: '請上傳 PDF、PPT 或 Word 文件',
        variant: 'destructive',
      });
      return;
    }

    // 驗證文件大小 (20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: '文件過大',
        description: '文件大小不能超過 20MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  /**
   * 上傳文件
   */
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('proposalId', proposalId);

      // 上傳到服務器
      const response = await fetch('/api/upload/proposal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '上傳失敗');
      }

      // 調用 tRPC mutation 更新數據庫
      await uploadMutation.mutateAsync({
        proposalId,
        filePath: result.filePath,
        fileName: file.name,
        fileSize: file.size,
      });

    } catch (error) {
      console.error('上傳錯誤:', error);
      toast({
        title: '上傳失敗',
        description: error instanceof Error ? error.message : '上傳失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * 取消選擇
   */
  const handleCancel = () => {
    setFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          項目計劃書文件
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 已上傳的文件 */}
        {proposalFilePath && !file && (
          <div className="p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {proposalFileName || '提案文件'}
                  </p>
                  {proposalFileSize && (
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(proposalFileSize)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={proposalFilePath} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  下載
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* 文件上傳區 */}
        {!proposalFilePath || file ? (
          <div className="space-y-4">
            {/* 文件選擇 */}
            {!file ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="proposal-file-input"
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="proposal-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">點擊上傳文件</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      支持 PDF、PPT、Word 文件，最大 20MB
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              /* 已選擇的文件 */
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 上傳按鈕 */}
            {file && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={uploading}
                >
                  取消
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      上傳文件
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* 替換文件選項 */
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('proposal-file-input')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              替換文件
            </Button>
            <input
              id="proposal-file-input"
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </div>
        )}

        {/* 提示訊息 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            上傳項目計劃書 (PDF/PPT) 以便審批者查閱完整的項目資訊。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
