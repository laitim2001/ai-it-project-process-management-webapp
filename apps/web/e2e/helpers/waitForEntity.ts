import { Page, expect } from '@playwright/test';

/**
 * 等待實體在數據庫中持久化並可查詢
 *
 * 解決問題：工作流測試中實體創建成功但後續查詢失敗（404 錯誤）
 * 根本原因：前端創建實體後立即重定向，數據庫寫入可能未完成
 *
 * 修復方案：使用 page.goto() 導航驗證（會自動帶認證 cookies）
 *
 * @param page - Playwright Page 對象
 * @param entityType - 實體類型，例如 'budgetPool', 'project', 'budgetProposal'
 * @param entityId - 實體 ID（從 URL 或響應中提取）
 * @returns Promise<any> - 返回驗證結果
 *
 * @example
 * ```typescript
 * // 在創建預算池後使用
 * const budgetPoolId = extractIdFromURL(page, /\/budget-pools\/([a-f0-9-]+)/);
 * await waitForEntityPersisted(page, 'budgetPool', budgetPoolId);
 * // 現在可以安全地繼續工作流的後續步驟
 * ```
 */
export async function waitForEntityPersisted(
  page: Page,
  entityType: string,
  entityId: string,
  maxRetries: number = 3
): Promise<any> {
  console.log(`⏳ 等待實體持久化: ${entityType} (ID: ${entityId})`);

  // Entity type 到路徑的映射
  const entityTypeToPath: Record<string, string> = {
    'budgetPool': 'budget-pools',
    'project': 'projects',
    'budgetProposal': 'proposals',
    'vendor': 'vendors',
    'quote': 'quotes',
    'purchaseOrder': 'purchase-orders',
    'expense': 'expenses',
    'chargeOut': 'charge-outs',
  };

  const path = entityTypeToPath[entityType];
  if (!path) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const detailUrl = `/${path}/${entityId}`;

  // 重試機制：最多嘗試 maxRetries 次
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 驗證實體存在 (第 ${attempt}/${maxRetries} 次嘗試): 導航到 ${detailUrl}`);

      // 遞增等待時間：第1次500ms, 第2次1000ms, 第3次1500ms
      const waitTime = 500 * attempt;
      await page.waitForTimeout(waitTime);

      // 使用頁面導航驗證（會自動帶認證 cookies）
      // FIX-042: 增強容錯性 - 使用 domcontentloaded 避免 HMR 資源等待問題
      const response = await page.goto(detailUrl, {
        waitUntil: 'domcontentloaded',  // 開發模式下更穩定
        timeout: 15000, // 增加超時時間到 15 秒
      });

      // 額外等待頁面穩定
      await page.waitForTimeout(500);

      // 檢查響應狀態
      if (response && response.ok() && response.status() !== 404) {
        console.log(`✅ 實體已持久化並可查詢: ${entityType} (ID: ${entityId}) [第 ${attempt} 次嘗試成功]`);
        return { success: true };
      }

      // 如果是404或其他錯誤,記錄並準備重試
      console.log(`⚠️ 第 ${attempt} 次嘗試失敗: HTTP ${response?.status()}`);

      // 如果是最後一次嘗試,拋出錯誤
      if (attempt === maxRetries) {
        throw new Error(`實體持久化驗證失敗: ${entityType} (ID: ${entityId}) - HTTP ${response?.status()}`);
      }

    } catch (error) {
      console.log(`⚠️ 第 ${attempt} 次嘗試遇到錯誤: ${error}`);

      // 如果是最後一次嘗試,拋出錯誤
      if (attempt === maxRetries) {
        throw new Error(`實體持久化驗證失敗 (${maxRetries}次重試後): ${entityType} (ID: ${entityId}) - ${error}`);
      }

      // 否則繼續下一次重試
      console.log(`🔄 準備第 ${attempt + 1} 次重試...`);
    }
  }

  // 理論上不應該到達這裡
  throw new Error(`實體持久化驗證失敗: ${entityType} (ID: ${entityId})`);
}

/**
 * 從當前 URL 中提取實體 ID
 *
 * @param page - Playwright Page 對象
 * @param pattern - URL 正則模式，捕獲組 1 應該是 ID
 * @returns string - 提取的 ID
 * @throws Error - 如果無法從 URL 提取 ID
 *
 * @example
 * ```typescript
 * // 從 /budget-pools/900a5fd3-0f09-410f-b0de-18a8c9b0bcb3 提取 ID
 * const budgetPoolId = extractIdFromURL(page, /\/budget-pools\/([a-f0-9-]+)/);
 * // budgetPoolId = "900a5fd3-0f09-410f-b0de-18a8c9b0bcb3"
 * ```
 */
export function extractIdFromURL(page: Page, pattern: RegExp): string {
  const url = page.url();
  const match = url.match(pattern);

  if (!match || !match[1]) {
    throw new Error(`無法從 URL 提取 ID: ${url} (Pattern: ${pattern})`);
  }

  const extractedId = match[1];
  console.log(`📍 從 URL 提取 ID: ${extractedId}`);
  return extractedId;
}

/**
 * 等待實體持久化並驗證特定欄位值
 *
 * 用於需要驗證實體不僅存在，而且包含特定數據的場景
 *
 * @param page - Playwright Page 對象
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @param fieldChecks - 欄位驗證對象，key 是欄位名，value 是期望值
 * @returns Promise<any> - 返回實體數據
 *
 * @example
 * ```typescript
 * // 驗證預算提案狀態為 'PendingApproval'
 * await waitForEntityWithFields(page, 'budgetProposal', proposalId, {
 *   status: 'PendingApproval',
 *   projectId: projectId
 * });
 * ```
 */
/**
 * FIX-044: 使用 API 驗證實體狀態（避免導航到有 HotReload 問題的頁面）
 *
 * 問題: ExpensesPage 詳情頁同樣有 HotReload 問題，導致頁面導航驗證失敗
 * 解決: 直接使用 tRPC API 端點驗證實體狀態，避免瀏覽器渲染
 *
 * @param page - Playwright Page 對象
 * @param entityType - 實體類型
 * @param entityId - 實體 ID
 * @param fieldChecks - 欄位驗證對象
 * @param maxRetries - 最大重試次數
 */
export async function waitForEntityViaAPI(
  page: Page,
  entityType: string,
  entityId: string,
  fieldChecks: Record<string, any>,
  maxRetries: number = 5
): Promise<any> {
  console.log(`⏳ 使用 API 驗證實體狀態: ${entityType} (ID: ${entityId})`);

  // Entity type 到 tRPC 端點的映射
  const entityTypeToEndpoint: Record<string, string> = {
    'expense': `expense.getById`,
    'budgetProposal': `budgetProposal.getById`,
    'project': `project.getById`,
    'purchaseOrder': `purchaseOrder.getById`,
    'vendor': `vendor.getById`,
  };

  const endpoint = entityTypeToEndpoint[entityType];
  if (!endpoint) {
    throw new Error(`未支援的實體類型（API 驗證）: ${entityType}`);
  }

  // 構建 tRPC API URL
  // tRPC 使用 {"json": {...}} 格式包裝 input
  const apiUrl = `http://localhost:3006/api/trpc/${endpoint}?input=${encodeURIComponent(JSON.stringify({ json: { id: entityId } }))}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 API 驗證 (第 ${attempt}/${maxRetries} 次嘗試): GET ${endpoint}`);

      // 等待時間遞增：前兩次等待較長（費用狀態更新需要時間）
      // 1000ms, 2000ms, 3000ms, 3500ms, 4000ms
      const waitTime = attempt <= 2 ? 1000 * attempt : 2500 + (attempt * 500);
      await page.waitForTimeout(waitTime);

      // 使用 page.evaluate 發送 API 請求（會自動帶認證 cookies）
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include', // 攜帶 cookies
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return await res.json();
      }, apiUrl);

      // tRPC 響應格式：{ result: { data: { json: {...} } } }
      console.log(`📦 API 原始響應:`, JSON.stringify(response).substring(0, 200));

      // FIX-044: tRPC 返回的數據在 result.data.json 中
      const entityData = response.result?.data?.json || response.result?.data;

      if (!entityData) {
        console.log(`⚠️ 第 ${attempt} 次嘗試：實體數據為空`);
        if (attempt === maxRetries) {
          throw new Error(`API 驗證失敗：實體數據為空`);
        }
        continue;
      }

      console.log(`📦 解析後的實體數據:`, JSON.stringify(entityData).substring(0, 200));

      // 驗證欄位值
      let allFieldsMatch = true;
      for (const [field, expectedValue] of Object.entries(fieldChecks)) {
        const actualValue = entityData[field];
        console.log(`🔍 驗證欄位: ${field} = ${actualValue} (期望: ${expectedValue})`);

        if (actualValue !== expectedValue) {
          allFieldsMatch = false;
          console.log(`⚠️ 欄位不匹配: ${field} (實際: ${actualValue}, 期望: ${expectedValue})`);
          break;
        }
      }

      if (!allFieldsMatch) {
        if (attempt === maxRetries) {
          throw new Error(`欄位驗證失敗：部分欄位值不符合預期`);
        }
        console.log(`🔄 準備第 ${attempt + 1} 次重試...`);
        continue;
      }

      console.log(`✅ API 驗證成功: ${entityType} (ID: ${entityId}) [第 ${attempt} 次嘗試成功]`);
      return entityData;

    } catch (error) {
      console.log(`⚠️ 第 ${attempt} 次嘗試遇到錯誤: ${error}`);

      if (attempt === maxRetries) {
        throw new Error(`API 驗證失敗 (${maxRetries}次重試後): ${entityType} (ID: ${entityId}) - ${error}`);
      }

      console.log(`🔄 準備第 ${attempt + 1} 次重試...`);
    }
  }

  throw new Error(`API 驗證失敗: ${entityType} (ID: ${entityId})`);
}

export async function waitForEntityWithFields(
  page: Page,
  entityType: string,
  entityId: string,
  fieldChecks: Record<string, any>
): Promise<any> {
  // FIX-044: 對於 expense 類型，使用 API 驗證避免 HotReload 問題
  if (entityType === 'expense') {
    console.log(`⚠️ 檢測到 expense 實體，使用 API 驗證（避免 ExpensesPage HotReload 問題）`);
    return await waitForEntityViaAPI(page, entityType, entityId, fieldChecks);
  }

  // 先確保實體存在
  const data = await waitForEntityPersisted(page, entityType, entityId);

  // 提取實際數據（tRPC 響應格式：{ result: { data: {...} } }）
  const entityData = data.result?.data || data;

  // 驗證欄位值
  for (const [field, expectedValue] of Object.entries(fieldChecks)) {
    const actualValue = entityData[field];
    console.log(`🔍 驗證欄位: ${field} = ${actualValue} (期望: ${expectedValue})`);
    expect(actualValue).toBe(expectedValue);
  }

  console.log(`✅ 所有欄位驗證通過`);
  return entityData;
}
