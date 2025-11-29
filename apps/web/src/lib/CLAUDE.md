# Frontend Libraries - 前端工具與配置層

## 📋 目錄用途
此目錄包含前端應用的核心工具函數、tRPC 客戶端配置和共用邏輯。

## 🏗️ 核心檔案

```
lib/
├── trpc.ts           # tRPC 客戶端配置（最重要）
├── utils.ts          # 通用工具函數
├── exportUtils.ts    # CSV/Excel 導出功能
├── azure-storage.ts  # Azure Blob Storage 工具
└── db-init.ts        # 資料庫初始化工具
```

## 🎯 核心模式與約定

### 1. tRPC Client (`trpc.ts`)

**用途**: 端對端類型安全的 API 客戶端

**配置結構**:
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@itpm/api';

// 創建 tRPC React Client
export const api = createTRPCReact<AppRouter>();

// Provider 配置
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 分鐘
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              // Session 自動包含在 Cookie 中
            };
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}
```

**使用模式**:
```typescript
// Query（查詢資料）
const { data, isLoading, error } = api.project.getAll.useQuery({
  page: 1,
  limit: 10,
});

// Mutation（變更資料）
const createProject = api.project.create.useMutation({
  onSuccess: () => {
    // 重新查詢列表
    utils.project.getAll.invalidate();
  },
});

// Utils（手動操作）
const utils = api.useContext();
utils.project.getAll.invalidate(); // 重新查詢
utils.project.getById.setData({ id: '123' }, newData); // 手動設置快取
```

**React Query 配置**:
```typescript
// 全域設置
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,      // 資料新鮮度 5 分鐘
    cacheTime: 10 * 60 * 1000,     // 快取保留 10 分鐘
    refetchOnWindowFocus: false,    // 不自動重新查詢
    retry: 1,                       // 重試 1 次
  },
}

// Per-query 覆寫
api.project.getAll.useQuery(
  { page: 1 },
  {
    staleTime: 0,           // 立即過期
    enabled: !!userId,      // 條件查詢
    refetchInterval: 30000, // 每 30 秒重新查詢
  }
);
```

### 2. Utils (`utils.ts`)

**cn 函數** - Tailwind 類名合併
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用範例
<div className={cn(
  'px-4 py-2',
  variant === 'primary' && 'bg-blue-600',
  disabled && 'opacity-50'
)} />
```

**日期格式化**
```typescript
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 使用範例
formatDate(project.createdAt) // "2025/01/15"
```

**金額格式化**
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
  }).format(amount);
}

// 使用範例
formatCurrency(100000) // "NT$100,000"
```

**防抖（Debounce）**
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### 3. Export Utils (`exportUtils.ts`)

**CSV 導出**
```typescript
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // 標題行
  csvRows.push(headers.join(','));

  // 資料行
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`.replace(/"/g, '""'); // 處理引號
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateExportFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.csv`;
}
```

**使用範例**:
```typescript
const handleExport = () => {
  const csv = convertToCSV(
    projects,
    ['name', 'status', 'budgetPool', 'manager']
  );
  downloadCSV(csv, generateExportFilename('projects'));
};
```

## 🎯 工具函數開發模式

### 純函數原則
```typescript
// ✅ 純函數（推薦）
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ 有副作用（避免）
let total = 0;
export function addToTotal(amount: number): void {
  total += amount; // 修改外部狀態
}
```

### 類型安全
```typescript
// ✅ 明確的類型定義
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// ❌ any 類型（避免）
export function format(value: any): any {
  return value.toString();
}
```

### 錯誤處理
```typescript
export function parseJSON<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}
```

## 📝 新增工具函數檢查清單

- [ ] 函數用途清晰明確
- [ ] 函數名稱描述性強
- [ ] 完整的 TypeScript 類型定義
- [ ] 純函數（無副作用）
- [ ] 適當的錯誤處理
- [ ] 添加 JSDoc 註釋
- [ ] 單元測試（如果複雜）
- [ ] 導出到 `utils.ts` 或專用檔案

## ⚠️ 重要約定

1. **tRPC Client 配置不可修改**（除非有充分理由）
2. **工具函數必須是純函數**
3. **所有函數必須有類型定義**
4. **複雜邏輯必須有 JSDoc 註釋**
5. **避免創建過多工具檔案**（優先添加到 `utils.ts`）
6. **日期和金額格式化統一使用工具函數**
7. **防抖和節流使用 React Hooks**（`useDebounce`）

## 🔍 常見操作

### 快取失效
```typescript
// 單一查詢失效
utils.project.getById.invalidate({ id: '123' });

// 所有 project 查詢失效
utils.project.invalidate();

// 全部失效
utils.invalidate();
```

### 樂觀更新
```typescript
const updateProject = api.project.update.useMutation({
  onMutate: async (newData) => {
    // 取消進行中的查詢
    await utils.project.getById.cancel({ id: newData.id });

    // 快照當前資料
    const previousData = utils.project.getById.getData({ id: newData.id });

    // 樂觀更新
    utils.project.getById.setData({ id: newData.id }, (old) => ({
      ...old,
      ...newData,
    }));

    return { previousData };
  },
  onError: (err, newData, context) => {
    // 回滾到快照
    utils.project.getById.setData(
      { id: newData.id },
      context?.previousData
    );
  },
  onSettled: (data, error, variables) => {
    // 重新查詢以確保同步
    utils.project.getById.invalidate({ id: variables.id });
  },
});
```

### 預取資料
```typescript
// 預取列表
await utils.project.getAll.prefetch({ page: 2 });

// 預取詳情
await utils.project.getById.prefetch({ id: '123' });
```

## 相關文件
- `packages/api/src/root.ts` - AppRouter 類型定義
- `apps/web/src/hooks/` - 自定義 Hooks
- `apps/web/src/app/[locale]/` - 使用 tRPC 的頁面
