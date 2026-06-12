/**
 * @fileoverview 文件下載 API Route - 安全文件存取代理（Azure Blob Storage SAS Token）
 * @description 為「已認證且具存取權」的用戶生成臨時 SAS URL，避免 Blob Storage 容器公開存取
 *
 * 容器設為 private 後，前端無法直接存取 blob URL。
 * 此 API 接收「資源 ID」（quoteId），由後端查 DB 取得該資源的 filePath，
 * 並做物件級授權（擁有者 / 主管 / 管理員）後，生成短期 SAS Token URL 重定向用戶至該文件。
 *
 * @api
 * @method GET
 * @route /api/download?quoteId={quoteId}
 *
 * @security
 * - 需要已認證的 session
 * - 物件級授權：複用 packages/api 的 canRead（擁有者 OR Supervisor OR Admin）
 * - filePath 由後端依資源 ID 從 DB 取得（不信任 client 傳入的 blob URL）
 * - SAS Token 有效期 15 分鐘（僅讀取權限）
 *
 * @since FIX-137 - Azure Blob Storage 容器改為 Private Access
 * @since FIX-151 (SR-08) - 改為「資源 ID + 後端物件級授權」，移除信任 client ?url= 的水平越權
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@itpm/db';
import { canRead } from '@itpm/api';
import {
  generateSasUrl,
  extractBlobNameFromUrl,
  extractContainerNameFromUrl,
  type BlobContainerName,
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
    // SR-08：改收資源 ID（不再接受 client 完全可控的 blob URL，避免水平越權）
    const quoteId = request.nextUrl.searchParams.get('quoteId');

    if (!quoteId) {
      return NextResponse.json({ error: '缺少 quoteId 參數' }, { status: 400 });
    }

    // 依資源 ID 從 DB 取得 filePath 與擁有者（報價隸屬之專案的 manager）
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        filePath: true,
        project: { select: { managerId: true } },
      },
    });

    if (!quote?.filePath) {
      return NextResponse.json({ error: '找不到報價文件' }, { status: 404 });
    }

    // 物件級授權：擁有者（專案 manager）/ Supervisor / Admin 才可下載
    if (!canRead(quote.project.managerId, session.user)) {
      return NextResponse.json({ error: '您沒有權限存取此文件' }, { status: 403 });
    }

    // 從 DB 取得的 filePath（受信任）解析 container 與 blob 名稱
    let containerName: BlobContainerName;
    let blobName: string;

    try {
      containerName = extractContainerNameFromUrl(quote.filePath);
      blobName = extractBlobNameFromUrl(quote.filePath);
    } catch {
      return NextResponse.json({ error: '無效的文件路徑' }, { status: 500 });
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
