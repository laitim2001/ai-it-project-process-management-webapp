/**
 * @fileoverview Azure Blob Storage 服務層
 *
 * @features
 * - 支持本地開發環境（Azurite 模擬器）和 Azure 生產環境
 * - 自動環境檢測和連接字符串配置
 * - 文件上傳、下載、刪除功能
 * - SAS Token 生成用於安全的臨時訪問
 * - 錯誤處理和日誌記錄
 *
 * @routing
 * - 被所有文件上傳 API 路由調用 (quote, invoice, proposal)
 *
 * @related
 * - apps/web/src/app/api/upload/quote/route.ts - 報價單上傳
 * - apps/web/src/app/api/upload/invoice/route.ts - 發票上傳
 * - apps/web/src/app/api/upload/proposal/route.ts - 提案文件上傳
 *
 * @since 2025-11-20 - Azure 部署準備階段 3
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  type ContainerClient,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Container 名稱定義
 */
export const BLOB_CONTAINERS = {
  QUOTES: "quotes",
  INVOICES: "invoices",
  PROPOSALS: "proposals",
} as const;

export type BlobContainerName = typeof BLOB_CONTAINERS[keyof typeof BLOB_CONTAINERS];

/**
 * Azure Storage 配置接口
 */
interface AzureStorageConfig {
  accountName: string;
  connectionString?: string;
  useDevelopmentStorage: boolean;
}

/**
 * 上傳結果接口
 */
export interface UploadResult {
  /** Blob 的完整 URL */
  url: string;
  /** Blob 名稱 */
  blobName: string;
  /** Container 名稱 */
  containerName: string;
  /** 文件大小（字節） */
  size: number;
  /** 內容類型 */
  contentType: string;
}

/**
 * 獲取 Azure Storage 配置
 *
 * @returns Azure Storage 配置對象
 * @throws 如果缺少必需的環境變數
 */
function getAzureStorageConfig(): AzureStorageConfig {
  // 檢查是否使用本地開發存儲（Azurite）
  const useDevelopmentStorage =
    process.env.AZURE_STORAGE_USE_DEVELOPMENT === "true" ||
    process.env.NODE_ENV === "development";

  if (useDevelopmentStorage) {
    // Azurite 默認連接字符串
    return {
      accountName: "devstoreaccount1",
      connectionString: "UseDevelopmentStorage=true",
      useDevelopmentStorage: true,
    };
  }

  // 生產環境配置
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  if (!accountName) {
    throw new Error(
      "缺少 AZURE_STORAGE_ACCOUNT_NAME 環境變數。" +
      "請在 .env 文件中配置或設置 AZURE_STORAGE_USE_DEVELOPMENT=true 使用 Azurite。"
    );
  }

  return {
    accountName,
    useDevelopmentStorage: false,
  };
}

/**
 * 創建 BlobServiceClient
 *
 * @returns BlobServiceClient 實例
 */
function createBlobServiceClient(): BlobServiceClient {
  const config = getAzureStorageConfig();

  if (config.useDevelopmentStorage && config.connectionString) {
    // 本地開發：使用 Azurite 連接字符串
    console.log("[Azure Storage] 使用本地 Azurite 開發存儲");
    return BlobServiceClient.fromConnectionString(config.connectionString);
  }

  // 生產環境：使用 Managed Identity (DefaultAzureCredential)
  console.log(`[Azure Storage] 使用 Managed Identity 連接到 ${config.accountName}`);
  const credential = new DefaultAzureCredential();
  return new BlobServiceClient(
    `https://${config.accountName}.blob.core.windows.net`,
    credential
  );
}

/**
 * 獲取或創建 Container Client
 *
 * @param containerName - Container 名稱
 * @returns ContainerClient 實例
 */
async function getContainerClient(
  containerName: BlobContainerName
): Promise<ContainerClient> {
  const blobServiceClient = createBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // 確保 container 存在，不存在則創建
  const exists = await containerClient.exists();
  if (!exists) {
    console.log(`[Azure Storage] 創建 Container: ${containerName}`);
    await containerClient.create({
      access: "blob", // 允許匿名讀取 blob（可根據需求調整為 "container" 或 "private"）
    });
  }

  return containerClient;
}

/**
 * 上傳文件到 Azure Blob Storage
 *
 * @param file - 要上傳的文件（File 或 Buffer）
 * @param containerName - Container 名稱
 * @param blobName - Blob 名稱（文件名）
 * @param contentType - 文件 MIME 類型
 * @returns 上傳結果，包含 Blob URL
 *
 * @example
 * ```typescript
 * const file = await request.formData().get("file") as File;
 * const result = await uploadToBlob(
 *   file,
 *   BLOB_CONTAINERS.QUOTES,
 *   `${quoteId}-${file.name}`,
 *   file.type
 * );
 * console.log(`文件已上傳: ${result.url}`);
 * ```
 */
export async function uploadToBlob(
  file: File | Buffer,
  containerName: BlobContainerName,
  blobName: string,
  contentType?: string
): Promise<UploadResult> {
  try {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 將 File 轉換為 ArrayBuffer 或直接使用 Buffer
    let buffer: ArrayBuffer | Buffer;
    let size: number;
    let mimeType: string;

    if (file instanceof Buffer) {
      buffer = file;
      size = file.length;
      mimeType = contentType || "application/octet-stream";
    } else {
      // File 對象 - 使用類型斷言確保 TypeScript 正確識別
      const fileObj = file as File;
      buffer = await fileObj.arrayBuffer();
      size = fileObj.size;
      mimeType = fileObj.type || contentType || "application/octet-stream";
    }

    // 上傳 blob
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    console.log(
      `[Azure Storage] 文件上傳成功: ${containerName}/${blobName} (${size} bytes)`
    );

    return {
      url: blockBlobClient.url,
      blobName,
      containerName,
      size,
      contentType: mimeType,
    };
  } catch (error) {
    console.error(`[Azure Storage] 上傳失敗: ${containerName}/${blobName}`, error);
    throw new Error(
      `文件上傳失敗: ${error instanceof Error ? error.message : "未知錯誤"}`
    );
  }
}

/**
 * 從 Azure Blob Storage 下載文件
 *
 * @param containerName - Container 名稱
 * @param blobName - Blob 名稱
 * @returns 文件 Buffer
 *
 * @example
 * ```typescript
 * const fileBuffer = await downloadFromBlob(
 *   BLOB_CONTAINERS.QUOTES,
 *   "quote-123.pdf"
 * );
 * ```
 */
export async function downloadFromBlob(
  containerName: BlobContainerName,
  blobName: string
): Promise<Buffer> {
  try {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error("下載的 blob 沒有可讀流");
    }

    // 將流轉換為 Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      // 確保 chunk 是 Uint8Array 類型
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(new TextEncoder().encode(chunk));
      } else {
        chunks.push(new Uint8Array(chunk as ArrayBuffer));
      }
    }

    console.log(`[Azure Storage] 文件下載成功: ${containerName}/${blobName}`);
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`[Azure Storage] 下載失敗: ${containerName}/${blobName}`, error);
    throw new Error(
      `文件下載失敗: ${error instanceof Error ? error.message : "未知錯誤"}`
    );
  }
}

/**
 * 從 Azure Blob Storage 刪除文件
 *
 * @param containerName - Container 名稱
 * @param blobName - Blob 名稱
 * @returns 是否刪除成功
 *
 * @example
 * ```typescript
 * await deleteFromBlob(BLOB_CONTAINERS.QUOTES, "quote-123.pdf");
 * ```
 */
export async function deleteFromBlob(
  containerName: BlobContainerName,
  blobName: string
): Promise<boolean> {
  try {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const deleteResponse = await blockBlobClient.deleteIfExists();

    if (deleteResponse.succeeded) {
      console.log(`[Azure Storage] 文件刪除成功: ${containerName}/${blobName}`);
      return true;
    }

    console.log(`[Azure Storage] 文件不存在，無需刪除: ${containerName}/${blobName}`);
    return false;
  } catch (error) {
    console.error(`[Azure Storage] 刪除失敗: ${containerName}/${blobName}`, error);
    throw new Error(
      `文件刪除失敗: ${error instanceof Error ? error.message : "未知錯誤"}`
    );
  }
}

/**
 * 生成 SAS Token 用於臨時訪問
 *
 * @param containerName - Container 名稱
 * @param blobName - Blob 名稱
 * @param expiresInMinutes - SAS Token 有效期（分鐘），默認 60 分鐘
 * @returns 帶有 SAS Token 的完整 URL
 *
 * @example
 * ```typescript
 * const sasUrl = await generateSasUrl(
 *   BLOB_CONTAINERS.QUOTES,
 *   "quote-123.pdf",
 *   30 // 30 分鐘有效期
 * );
 * ```
 *
 * @note 本地開發（Azurite）暫不支持 SAS Token 生成
 */
export async function generateSasUrl(
  containerName: BlobContainerName,
  blobName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const config = getAzureStorageConfig();

  if (config.useDevelopmentStorage) {
    // Azurite 不支持 SAS Token，返回完整 URL
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log(
      `[Azure Storage] Azurite 不支持 SAS Token，返回完整 URL: ${blockBlobClient.url}`
    );
    return blockBlobClient.url;
  }

  // 生產環境生成 SAS Token
  const accountName = config.accountName;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountKey) {
    throw new Error(
      "生成 SAS Token 需要 AZURE_STORAGE_ACCOUNT_KEY 環境變數。" +
      "或使用 Managed Identity 的其他方法。"
    );
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const containerClient = await getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse("r"), // 只讀權限
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  };

  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();

  const sasUrl = `${blockBlobClient.url}?${sasToken}`;
  console.log(
    `[Azure Storage] SAS URL 生成成功，有效期 ${expiresInMinutes} 分鐘`
  );

  return sasUrl;
}

/**
 * 檢查 blob 是否存在
 *
 * @param containerName - Container 名稱
 * @param blobName - Blob 名稱
 * @returns 是否存在
 *
 * @example
 * ```typescript
 * const exists = await blobExists(BLOB_CONTAINERS.QUOTES, "quote-123.pdf");
 * if (!exists) {
 *   console.log("文件不存在");
 * }
 * ```
 */
export async function blobExists(
  containerName: BlobContainerName,
  blobName: string
): Promise<boolean> {
  try {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const exists = await blockBlobClient.exists();
    console.log(
      `[Azure Storage] 檢查文件存在性: ${containerName}/${blobName} = ${exists}`
    );

    return exists;
  } catch (error) {
    console.error(
      `[Azure Storage] 檢查文件存在性失敗: ${containerName}/${blobName}`,
      error
    );
    return false;
  }
}

/**
 * 從完整的 Blob URL 中提取 blob 名稱
 *
 * @param blobUrl - 完整的 Blob URL
 * @returns Blob 名稱
 *
 * @example
 * ```typescript
 * const blobName = extractBlobNameFromUrl(
 *   "https://mystorageaccount.blob.core.windows.net/quotes/quote-123.pdf"
 * );
 * // 返回: "quote-123.pdf"
 * ```
 */
export function extractBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // URL 格式: /container-name/blob-name
    if (pathParts.length >= 2) {
      return pathParts.slice(1).join("/"); // 移除 container 名稱，返回 blob 名稱
    }

    throw new Error("無效的 Blob URL 格式");
  } catch (error) {
    console.error(`[Azure Storage] 無法從 URL 提取 blob 名稱: ${blobUrl}`, error);
    throw new Error("無效的 Blob URL");
  }
}

/**
 * 從完整的 Blob URL 中提取 container 名稱
 *
 * @param blobUrl - 完整的 Blob URL
 * @returns Container 名稱
 *
 * @example
 * ```typescript
 * const containerName = extractContainerNameFromUrl(
 *   "https://mystorageaccount.blob.core.windows.net/quotes/quote-123.pdf"
 * );
 * // 返回: "quotes"
 * ```
 */
export function extractContainerNameFromUrl(
  blobUrl: string
): BlobContainerName {
  try {
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // URL 格式: /container-name/blob-name
    if (pathParts.length >= 1) {
      const containerName = pathParts[0];

      // 驗證是否為有效的 container 名稱
      if (Object.values(BLOB_CONTAINERS).includes(containerName as BlobContainerName)) {
        return containerName as BlobContainerName;
      }

      throw new Error(`無效的 Container 名稱: ${containerName}`);
    }

    throw new Error("無效的 Blob URL 格式");
  } catch (error) {
    console.error(`[Azure Storage] 無法從 URL 提取 container 名稱: ${blobUrl}`, error);
    throw new Error("無效的 Blob URL");
  }
}
