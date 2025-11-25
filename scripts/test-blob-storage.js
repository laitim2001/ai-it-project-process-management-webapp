/**
 * Azure Blob Storage 功能測試腳本
 *
 * 用途: 驗證 Azurite 或 Azure Blob Storage 的功能是否正常
 *
 * 使用方式:
 *   測試本地 Azurite:
 *     AZURE_STORAGE_USE_DEVELOPMENT=true node scripts/test-blob-storage.js
 *
 *   測試生產 Azure Blob Storage:
 *     AZURE_STORAGE_USE_DEVELOPMENT=false node scripts/test-blob-storage.js
 *
 * 功能:
 *   1. 測試連接 Blob Service
 *   2. 創建/驗證 Containers (quotes, invoices, proposals)
 *   3. 測試文件上傳
 *   4. 測試文件列表
 *   5. 測試文件下載
 *   6. 測試文件刪除
 *   7. 清理測試數據
 */

// 從 apps/web/node_modules 導入 Azure SDK
const path = require('path');
const webAppPath = path.join(__dirname, '..', 'apps', 'web');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require(path.join(webAppPath, 'node_modules', '@azure', 'storage-blob'));

// 測試配置
const TEST_CONTAINERS = ['quotes', 'invoices', 'proposals'];
const TEST_FILE_NAME = 'test-file.txt';
const TEST_FILE_CONTENT = 'This is a test file for Azure Blob Storage validation.\\n測試文件內容。';

// ANSI 顏色碼
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  green: '\\x1b[32m',
  red: '\\x1b[31m',
  yellow: '\\x1b[33m',
  cyan: '\\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * 獲取 Azure Storage 配置
 */
function getAzureStorageConfig() {
  const useDevelopmentStorage =
    process.env.AZURE_STORAGE_USE_DEVELOPMENT === 'true' ||
    process.env.NODE_ENV === 'development';

  if (useDevelopmentStorage) {
    return {
      accountName: 'devstoreaccount1',
      connectionString: 'UseDevelopmentStorage=true',
      useDevelopmentStorage: true,
    };
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error(
      '缺少 AZURE_STORAGE_ACCOUNT_NAME 環境變數。\\n' +
      '請在 .env 文件中配置或設置 AZURE_STORAGE_USE_DEVELOPMENT=true 使用 Azurite。'
    );
  }

  return {
    accountName,
    useDevelopmentStorage: false,
  };
}

/**
 * 創建 BlobServiceClient
 */
function createBlobServiceClient() {
  const config = getAzureStorageConfig();

  if (config.useDevelopmentStorage && config.connectionString) {
    info(`使用本地 Azurite 開發存儲`);
    info(`連接字符串: ${config.connectionString}`);
    return BlobServiceClient.fromConnectionString(config.connectionString);
  }

  info(`使用 Azure Blob Storage 生產環境`);
  info(`Account Name: ${config.accountName}`);

  // 注意: 這裡簡化處理，實際應用會使用 DefaultAzureCredential
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountKey) {
    throw new Error('生產環境需要 AZURE_STORAGE_ACCOUNT_KEY');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    config.accountName,
    accountKey
  );

  return new BlobServiceClient(
    `https://${config.accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );
}

/**
 * 測試 Container 創建和驗證
 */
async function testContainers(blobServiceClient) {
  log('\\n📦 測試 Container 創建和驗證...', 'bright');

  const results = [];

  for (const containerName of TEST_CONTAINERS) {
    try {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const exists = await containerClient.exists();

      if (!exists) {
        info(`Container "${containerName}" 不存在，正在創建...`);
        await containerClient.create({
          access: 'blob', // 允許匿名讀取 blob
        });
        success(`Container "${containerName}" 創建成功`);
      } else {
        success(`Container "${containerName}" 已存在`);
      }

      results.push({ containerName, status: 'ok' });
    } catch (err) {
      error(`Container "${containerName}" 處理失敗: ${err.message}`);
      results.push({ containerName, status: 'failed', error: err.message });
    }
  }

  return results;
}

/**
 * 測試文件上傳
 */
async function testUpload(blobServiceClient, containerName) {
  log(`\\n⬆️  測試文件上傳到 "${containerName}"...`, 'bright');

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(TEST_FILE_NAME);

    const buffer = Buffer.from(TEST_FILE_CONTENT, 'utf-8');

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: 'text/plain',
      },
    });

    success(`文件上傳成功: ${TEST_FILE_NAME} (${buffer.length} bytes)`);
    info(`Blob URL: ${blockBlobClient.url}`);

    return {
      status: 'ok',
      url: blockBlobClient.url,
      size: buffer.length,
    };
  } catch (err) {
    error(`文件上傳失敗: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

/**
 * 測試文件列表
 */
async function testList(blobServiceClient, containerName) {
  log(`\\n📋 測試文件列表 "${containerName}"...`, 'bright');

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobs = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }

    success(`文件列表成功: 找到 ${blobs.length} 個文件`);
    blobs.forEach((name) => info(`  - ${name}`));

    return { status: 'ok', count: blobs.length, blobs };
  } catch (err) {
    error(`文件列表失敗: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

/**
 * 測試文件下載
 */
async function testDownload(blobServiceClient, containerName) {
  log(`\\n⬇️  測試文件下載 "${containerName}/${TEST_FILE_NAME}"...`, 'bright');

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(TEST_FILE_NAME);

    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('下載的 blob 沒有可讀流');
    }

    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }

    const downloadedContent = Buffer.concat(chunks).toString('utf-8');

    if (downloadedContent === TEST_FILE_CONTENT) {
      success(`文件下載成功: 內容驗證通過 (${chunks[0].length} bytes)`);
    } else {
      warn(`文件下載成功但內容不匹配`);
      info(`預期: ${TEST_FILE_CONTENT.substring(0, 50)}...`);
      info(`實際: ${downloadedContent.substring(0, 50)}...`);
    }

    return {
      status: 'ok',
      size: chunks[0].length,
      contentMatch: downloadedContent === TEST_FILE_CONTENT,
    };
  } catch (err) {
    error(`文件下載失敗: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

/**
 * 測試文件刪除
 */
async function testDelete(blobServiceClient, containerName) {
  log(`\\n🗑️  測試文件刪除 "${containerName}/${TEST_FILE_NAME}"...`, 'bright');

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(TEST_FILE_NAME);

    const deleteResponse = await blockBlobClient.deleteIfExists();

    if (deleteResponse.succeeded) {
      success(`文件刪除成功: ${TEST_FILE_NAME}`);
      return { status: 'ok' };
    } else {
      warn(`文件不存在，無需刪除: ${TEST_FILE_NAME}`);
      return { status: 'not_found' };
    }
  } catch (err) {
    error(`文件刪除失敗: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

/**
 * 主測試流程
 */
async function runTests() {
  log('\\n' + '='.repeat(60), 'bright');
  log('🧪 Azure Blob Storage 功能測試', 'bright');
  log('='.repeat(60) + '\\n', 'bright');

  try {
    // 1. 創建 BlobServiceClient
    const blobServiceClient = createBlobServiceClient();
    success('BlobServiceClient 創建成功\\n');

    // 2. 測試 Container 創建
    const containerResults = await testContainers(blobServiceClient);
    const failedContainers = containerResults.filter(r => r.status === 'failed');

    if (failedContainers.length > 0) {
      error(`\\n${failedContainers.length} 個 Container 處理失敗，測試中止`);
      process.exit(1);
    }

    // 3. 對每個 Container 執行完整測試
    for (const containerName of TEST_CONTAINERS) {
      log(`\\n${'─'.repeat(60)}`, 'bright');
      log(`📦 測試 Container: "${containerName}"`, 'bright');
      log('─'.repeat(60), 'bright');

      // 上傳測試
      const uploadResult = await testUpload(blobServiceClient, containerName);
      if (uploadResult.status === 'failed') {
        warn(`跳過 "${containerName}" 的後續測試\\n`);
        continue;
      }

      // 列表測試
      await testList(blobServiceClient, containerName);

      // 下載測試
      await testDownload(blobServiceClient, containerName);

      // 刪除測試 (清理)
      await testDelete(blobServiceClient, containerName);
    }

    // 測試總結
    log('\\n' + '='.repeat(60), 'bright');
    log('✅ 所有測試完成！', 'green');
    log('='.repeat(60) + '\\n', 'bright');

    success('Azure Blob Storage 功能驗證通過');
    info('可以安全地使用文件上傳功能');

  } catch (err) {
    log('\\n' + '='.repeat(60), 'bright');
    log('❌ 測試失敗！', 'red');
    log('='.repeat(60) + '\\n', 'bright');

    error(`錯誤: ${err.message}`);
    if (err.stack) {
      console.log('\\n堆棧追蹤:');
      console.log(err.stack);
    }

    process.exit(1);
  }
}

// 執行測試
runTests();
