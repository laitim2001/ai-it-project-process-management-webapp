/**
 * @fileoverview 文件下載 API Route - 安全文件存取代理（Azure Blob Storage SAS Token）
 * @description 為已認證用戶生成臨時 SAS URL，避免 Blob Storage 容器公開存取
 *
 * 容器設為 private 後，前端無法直接存取 blob URL。
 * 此 API 接收 blob URL（存於資料庫），驗證用戶身份後，
 * 生成短期 SAS Token URL 重定向用戶至該文件。
 *
 * @api
 * @method GET
 * @route /api/download?url={blobUrl}
 *
 * @security
 * - 需要已認證的 session
 * - SAS Token 有效期 15 分鐘（僅讀取權限）
 * - 驗證 URL 屬於已知的 container
 *
 * @since FIX-137 - Azure Blob Storage 容器改為 Private Access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  generateSasUrl,
  extractBlobNameFromUrl,
  extractContainerNameFromUrl,
} from '@/lib/azure-storage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 認證檢查：僅允許已登入用戶下載文件
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未授權：請先登入' }, { status: 401 });
  }

  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: '缺少 url 參數' },
        { status: 400 }
      );
    }

    // 從完整 blob URL 提取 container 名稱和 blob 名稱
    let containerName: string;
    let blobName: string;

    try {
      containerName = extractContainerNameFromUrl(url);
      blobName = extractBlobNameFromUrl(url);
    } catch {
      return NextResponse.json(
        { error: '無效的文件 URL' },
        { status: 400 }
      );
    }

    // 生成短期 SAS URL（15 分鐘有效期）
    const sasUrl = await generateSasUrl(containerName, blobName, 15);

    // 重定向到帶有 SAS Token 的 URL
    return NextResponse.redirect(sasUrl);
  } catch (error) {
    console.error('[Download API] 生成 SAS URL 失敗:', error);
    return NextResponse.json(
      { error: '文件存取失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
