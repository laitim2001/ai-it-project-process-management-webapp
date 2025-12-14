# CHANGE-014: OM Summary 頁面 OpCo 權限過濾

> **建立日期**: 2025-12-14
> **完成日期**: 2025-12-14
> **狀態**: ✅ 已完成
> **相關功能**: FEAT-003 (OM Summary Page), FEAT-009 (OpCo Data Permission)
> **優先級**: High

## 1. 變更概述

### 1.1 背景
OM Summary 頁面目前會顯示 Project Summary 部分，其中包含 Charge Out Method 欄位。此欄位可能包含多個 Operating Company 的分攤金額信息。根據 FEAT-009 建立的 OpCo 數據權限管理功能，需要根據當前用戶的 Operating Company Access 權限過濾顯示內容。

### 1.2 目標
- 解析 Charge Out Method 欄位中的分號分隔格式
- 根據用戶的 OpCo 權限過濾顯示內容
- 只顯示用戶有權限查看的 OpCo 數據（不是刪除，是隱藏）

## 2. 需求規格

### 2.1 輸入格式範例
```
RA     $     2,269 ;
RAPO     $     2,370 ;
RBS     $     4,110 ;
RHK     $  17,398 ;
RMS     $     9,128 ;
RPH     $     4,413 ;
RSP     $     3,429 ;
RTH     $  48,462 ;
RTW     $     5,270 ;
RVN     $     3,152
```

### 2.2 用戶權限範例
假設用戶有權限查看: `RA`, `RAPO`, `RMS`

### 2.3 預期輸出
```
RA     $     2,269 ;
RAPO     $     2,370 ;
RMS     $     9,128 ;
```

### 2.4 處理規則
| 情況 | 處理方式 |
|------|----------|
| 欄位包含分號分隔的 OpCo 數據 | 解析並過濾 |
| 欄位不包含分號 | 原樣顯示（不過濾） |
| 用戶有 Admin 權限 | 顯示全部（不過濾） |
| 用戶沒有任何 OpCo 權限 | 顯示 "No access" 或隱藏整個欄位 |
| OpCo 代碼無法識別 | 保留原樣顯示 |

### 2.5 重要說明
- **不是刪除數據**，只是在前端顯示時隱藏
- 後端數據保持完整不變
- 過濾邏輯在前端執行

## 3. 實施結果

### 3.1 前端修改 (`apps/web/src/components/project-summary/ProjectSummaryTable.tsx`)

**新增 Props**:
```typescript
interface ProjectSummaryTableProps {
  // ... 原有 props
  /** 用戶有權限訪問的 OpCo 代碼列表（CHANGE-014: OpCo 權限過濾） */
  userOpCoCodes?: string[];
  /** 用戶是否為 Admin（Admin 可查看全部數據） */
  isAdmin?: boolean;
}
```

**新增 `filterChargeOutMethodByPermission` 函數**:
```typescript
function filterChargeOutMethodByPermission(
  chargeOutMethod: string | null,
  userOpCoCodes: string[],
  isAdmin: boolean
): string | null {
  // Admin 用戶顯示全部
  if (isAdmin) {
    return chargeOutMethod;
  }

  // 空值直接返回
  if (!chargeOutMethod || chargeOutMethod.trim() === '') {
    return chargeOutMethod;
  }

  // 檢查是否包含分號（OpCo 分攤格式）
  if (!chargeOutMethod.includes(';')) {
    return chargeOutMethod; // 不是 OpCo 格式，原樣返回
  }

  // 解析分號分隔的條目
  const entries = chargeOutMethod.split(';').map(e => e.trim()).filter(e => e.length > 0);

  // 過濾有權限的條目
  const filteredEntries = entries.filter(entry => {
    const match = entry.match(/^([A-Z]+)/);
    if (!match) return true; // 無法識別，保留
    return userOpCoCodes.includes(match[1]);
  });

  // 如果沒有任何有權限的條目
  if (filteredEntries.length === 0) {
    return null; // 返回 null 表示無權限
  }

  return filteredEntries.join(' ; ');
}
```

**顯示邏輯更新**:
- 優先顯示 `chargeOutMethod`（經過權限過濾）
- 無權限時顯示 "無權限" 提示
- 回退：顯示 `chargeOutOpCos` Badge

### 3.2 頁面修改 (`apps/web/src/app/[locale]/om-summary/page.tsx`)

**新增功能**:
- 導入 `useSession` from `next-auth/react`
- 計算 `isAdmin` 基於 `session?.user?.roleId === 3`
- 傳遞 `userOpCoCodes` 和 `isAdmin` 到 ProjectSummaryTable

```typescript
// CHANGE-014: 獲取用戶 session 以判斷權限
const { data: session } = useSession();
const isAdmin = session?.user?.roleId === 3; // Admin roleId = 3

// 傳遞給 ProjectSummaryTable
<ProjectSummaryTable
  projects={projectSummaryData?.projects || []}
  categorySummary={projectSummaryData?.summary || []}
  financialYear={projectFilters.financialYear}
  isLoading={isProjectLoading}
  userOpCoCodes={opCoData?.map((o) => o.code) || []}
  isAdmin={isAdmin}
/>
```

### 3.3 i18n 翻譯更新

**en.json**:
```json
"projectSummary": {
  "table": {
    "noAccess": "No access"
  }
}
```

**zh-TW.json**:
```json
"projectSummary": {
  "table": {
    "noAccess": "無權限"
  }
}
```

## 4. 影響範圍

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `apps/web/src/app/[locale]/om-summary/page.tsx` | 修改 | 添加 useSession、isAdmin 計算、傳遞權限參數 |
| `apps/web/src/components/project-summary/ProjectSummaryTable.tsx` | 修改 | 添加過濾函數、新增 props、顯示邏輯更新 |
| `apps/web/src/messages/en.json` | 修改 | 添加 projectSummary.table.noAccess |
| `apps/web/src/messages/zh-TW.json` | 修改 | 添加 projectSummary.table.noAccess |

## 5. 驗收標準

- [x] 有 OpCo 權限的用戶只能看到自己有權限的 OpCo 數據
- [x] Admin 用戶可以看到全部數據
- [x] 非 OpCo 格式的 Charge Out Method 保持原樣顯示
- [x] 無權限時顯示 "無權限" 提示
- [x] 後端數據不受影響（只是前端過濾）
- [x] i18n 翻譯完整（en + zh-TW）

## 6. 測試驗證

| 測試案例 | 輸入 | 預期結果 | 狀態 |
|----------|------|----------|------|
| Admin 用戶 | 任何 chargeOutMethod | 顯示全部 | ✅ |
| 有權限用戶 | `RA $1,000 ; RMS $2,000 ;` (用戶權限: RA) | 顯示 `RA $1,000` | ✅ |
| 無權限用戶 | `RA $1,000 ;` (用戶權限: RMS) | 顯示 "無權限" | ✅ |
| 非 OpCo 格式 | `Direct charge` | 原樣顯示 | ✅ |
| 空值 | null 或 "" | 顯示 "-" | ✅ |
| 無法識別代碼 | `123 $1,000 ;` | 保留原樣 | ✅ |

---

**維護者**: AI 助手
**最後更新**: 2025-12-14
