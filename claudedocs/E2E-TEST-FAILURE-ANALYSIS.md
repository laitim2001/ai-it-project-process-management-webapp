# E2E 測試失敗分析報告

**生成時間**: 2025-10-30 15:55 (更新)
**測試執行環境**: Chromium
**總測試數**: 14
**通過**: 7 (50%)
**失敗**: 7 (50%)
**修復狀態**: Pagination 警告已修復, waitForEntity 已增強, 工作流測試仍需進一步修復

---

## 📊 測試結果總覽

### ✅ 通過的測試 (7/7 基本功能測試)

1. ✓ 應該能夠訪問首頁 (1.7s)
2. ✓ 應該能夠訪問登入頁面 (1.7s)
3. ✓ 應該能夠以 ProjectManager 身份登入 (5.2s)
4. ✓ 應該能夠以 Supervisor 身份登入 (5.3s)
5. ✓ 應該能夠導航到預算池頁面 (8.2s)
6. ✓ 應該能夠導航到項目頁面 (8.3s)
7. ✓ 應該能夠導航到費用轉嫁頁面 (8.1s)

### ❌ 失敗的測試 (7/7 工作流測試)

所有工作流測試都失敗並進行了自動重試(retry1),但重試後仍然失敗:

#### 預算申請工作流 (2個測試失敗)
1. ❌ **完整預算申請工作流：創建 → 提交 → 審核 → 批准**
   - 測試文件: `workflows/budget-proposal-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

2. ❌ **預算提案拒絕流程**
   - 測試文件: `workflows/budget-proposal-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

#### 費用轉嫁工作流 (3個測試失敗)
3. ❌ **完整費用轉嫁工作流：費用 → ChargeOut → 確認 → 付款**
   - 測試文件: `workflows/expense-chargeout-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

4. ❌ **ChargeOut 拒絕流程**
   - 測試文件: `workflows/expense-chargeout-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

5. ❌ **ChargeOut 多費用項目處理**
   - 測試文件: `workflows/expense-chargeout-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
   - 重試結果: 失敗

#### 採購工作流 (2個測試失敗)
6. ❌ **完整採購工作流：供應商 → 報價 → 採購訂單 → 費用記錄 → 批准**
   - 測試文件: `workflows/procurement-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

7. ❌ **費用拒絕流程**
   - 測試文件: `workflows/procurement-workflow.spec.ts`
   - 失敗截圖:
     - `test-failed-1.png`
     - `test-failed-2.png`
   - 重試結果: 失敗

---

## 🔍 問題分析

### 主要錯誤模式

#### 1. TRPC 客戶端錯誤 (資料不存在)
```
TRPCClientError: ChargeOut 不存在
TRPCClientError: 找不到該費用記錄
TRPCClientError: 找不到該預算提案
```

**分析**:
- 測試創建資料後,後續查詢時資料不存在
- 表明資料創建或持久化環節出現問題
- 可能的原因:
  1. 資料庫事務未正確提交
  2. waitForEntity helper 的等待時間不足
  3. 測試資料創建失敗但未正確處理錯誤
  4. 資料庫隔離級別問題

#### 2. 404 資源載入錯誤
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**頻率**: 多次出現
**影響**: 可能導致頁面功能不完整,間接影響測試結果

#### 3. React Props 警告 (已修復)
```
Warning: React does not recognize the `currentPage` prop on a DOM element
Warning: React does not recognize the `totalPages` prop on a DOM element
Warning: Unknown event handler property `onPageChange`
```

**狀態**: ✅ 已在 Pagination.tsx:6 修復
**修復方案**: 添加 TypeScript interface 排除這些 props
```typescript
interface PaginationProps extends Omit<React.ComponentProps<"nav">, 'currentPage' | 'totalPages' | 'onPageChange'> {}
```

---

## 🛠️ 修復建議

### 優先級1: 修復 TRPC 資料不存在錯誤

#### 方案 A: 增加 waitForEntity 等待時間
**位置**: `apps/web/e2e/helpers/waitForEntity.ts:32`

```typescript
// 當前: 500ms
await page.waitForTimeout(500);

// 建議: 1000ms
await page.waitForTimeout(1000);
```

#### 方案 B: 添加重試機制
在 waitForEntity 中添加重試邏輯,如果第一次查詢失敗則重試:

```typescript
export async function waitForEntityPersisted(
  page: Page,
  entityType: string,
  entityId: string,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForTimeout(500 * (i + 1)); // 遞增等待時間
      const response = await page.goto(detailUrl);

      if (response?.ok()) {
        console.log(`✅ 實體已持久化 (第 ${i + 1} 次嘗試)`);
        return { success: true };
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`⚠️ 重試 ${i + 2}/${maxRetries}...`);
    }
  }
}
```

#### 方案 C: 使用 API 輪詢驗證
不依賴頁面導航,直接調用 tRPC API 驗證資料存在:

```typescript
// 使用 page.request 輪詢 API
for (let i = 0; i < 5; i++) {
  const response = await page.request.get(`/api/trpc/${entityType}.getById?input={"id":"${entityId}"}`);
  if (response.ok()) {
    const data = await response.json();
    if (data.result?.data) {
      console.log(`✅ 實體已持久化`);
      return data.result.data;
    }
  }
  await page.waitForTimeout(500);
}
```

### 優先級2: 修復測試資料創建問題

檢查每個工作流測試的資料創建步驟:
1. 確認所有 `await` 正確使用
2. 添加資料創建成功的斷言
3. 在創建失敗時立即停止測試並輸出錯誤

### 優先級3: 修復 404 資源載入錯誤

調查哪些資源返回 404:
1. 檢查 Next.js 靜態資源路徑
2. 驗證 tRPC API 路由配置
3. 確認認證 middleware 不會錯誤攔截請求

---

## 📝 已執行任務與修復記錄

### ✅ 已完成的修復
1. **修復 Pagination React 警告**
   - **位置**: `apps/web/src/components/ui/Pagination.tsx:6`
   - **修復**: 添加 TypeScript interface 排除 `currentPage`, `totalPages`, `onPageChange` props
   - **影響文件**: budget-pools/page.tsx, vendors/page.tsx, quotes/page.tsx, purchase-orders/page.tsx, expenses/page.tsx
   - **修改**: 將所有頁面的 `Pagination` 改為 `PaginationControls`
   - **結果**: ✅ React 警告已消除

2. **增強 waitForEntity 重試機制**
   - **位置**: `apps/web/e2e/helpers/waitForEntity.ts`
   - **修復**:
     - 添加 maxRetries 參數 (默認 3 次)
     - 實現遞增等待時間 (500ms → 1000ms → 1500ms)
     - 添加 10 秒超時保護
     - 詳細錯誤日誌
   - **結果**: ⚠️ 修復完成但工作流測試仍然失敗

### ⚠️ 進行中的調查
3. **工作流測試失敗根本原因**
   - **發現**: 測試失敗不是 waitForEntity 的問題
   - **真正原因**: 測試步驟之間實體持久化時序問題
   - **具體表現**:
     - Step 2 創建項目時超時 (無法找到剛創建的預算池)
     - 開發服務器日誌顯示大量 tRPC getById 錯誤
     - 404 錯誤源自數據庫事務未完成
   - **下一步**: 需要在測試的更多關鍵位置添加 waitForEntity 調用

### 📋 待執行任務
4. ⏳ **在測試中添加更多 waitForEntity 調用**
   - 在創建項目前等待預算池持久化
   - 在創建預算提案前等待項目持久化
   - 在費用轉嫁前等待費用持久化
5. ⏳ **重新運行測試驗證完整修復**
6. ⏳ **更新 E2E 測試最佳實踐文檔**

---

## 🎯 預期成果

修復完成後,預期測試結果:
- **基本功能測試**: 7/7 通過 ✅ (已達成)
- **工作流測試**: 7/7 通過 (目標)
- **總通過率**: 100% (14/14)

---

## 📊 測試執行統計

- **執行時間**: ~1.1分鐘
- **重試次數**: 7個測試各重試1次
- **截圖數量**: 26張 (每個失敗測試2張,部分1張)
- **瀏覽器**: Chromium
- **並行度**: 12 workers

---

**下一步行動**: 根據建議修復方案依次執行,優先解決 TRPC 資料不存在錯誤。
