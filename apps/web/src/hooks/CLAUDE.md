# Custom React Hooks - 自定義 Hooks 層

## 📋 目錄用途
此目錄包含可重用的 React Hooks，提供跨組件的邏輯共享。

## 🏗️ 核心 Hooks

```
hooks/
├── useDebounce.ts      # 防抖 Hook
├── use-theme.ts        # 主題切換 Hook
└── usePermissions.ts   # 權限管理 Hook (FEAT-011)
```

## 🎯 Hooks 模式

### 1. useDebounce
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用範例
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

// debouncedSearch 會在 300ms 後更新
```

### 2. useTheme
```typescript
'use client';
import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme } = useNextTheme();

  return {
    theme, // 'light' | 'dark' | 'system'
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}

// 使用範例
const { theme, toggleTheme } = useTheme();
<button onClick={toggleTheme}>切換主題</button>
```

### 3. usePermissions (FEAT-011)
```typescript
'use client';
import { useMemo } from 'react';
import { api } from '@/lib/trpc';

// 菜單權限代碼常量
export const MENU_PERMISSIONS = {
  DASHBOARD: 'menu:dashboard',
  BUDGET_POOLS: 'menu:budget-pools',
  PROJECTS: 'menu:projects',
  // ... 共 18 個菜單權限
} as const;

// Hook 返回類型
export interface UsePermissionsReturn {
  permissionCodes: string[];          // 用戶有效權限代碼列表
  permissions: Array<{...}>;          // 權限詳情列表
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  refetch: () => void;
}

export function usePermissions(): UsePermissionsReturn {
  const { data, isLoading, ... } = api.permission.getMyPermissions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,      // 5 分鐘內視為新鮮
    cacheTime: 30 * 60 * 1000,     // 緩存 30 分鐘
    refetchOnWindowFocus: false,
  });

  // 使用 Set 實現 O(1) 權限查詢
  const permissionSet = useMemo(() => new Set(data?.permissionCodes || []), [data]);

  const hasPermission = (code: string) => permissionSet.has(code);
  const hasAnyPermission = (codes: string[]) => codes.some(c => permissionSet.has(c));
  const hasAllPermissions = (codes: string[]) => codes.every(c => permissionSet.has(c));

  return { ... };
}

// 使用範例
import { usePermissions, MENU_PERMISSIONS } from '@/hooks/usePermissions';

function Sidebar() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return <SidebarSkeleton />;

  return (
    <nav>
      {hasPermission(MENU_PERMISSIONS.DASHBOARD) && (
        <NavItem href="/dashboard">儀表板</NavItem>
      )}
      {hasPermission(MENU_PERMISSIONS.PROJECTS) && (
        <NavItem href="/projects">專案</NavItem>
      )}
    </nav>
  );
}
```

## 📝 自定義 Hook 開發模式

### Hook 命名
```typescript
// ✅ 以 use 開頭
export function useWindowSize() { ... }
export function useLocalStorage() { ... }
export function usePrevious() { ... }

// ❌ 不以 use 開頭
export function getWindowSize() { ... } // 這是函數，不是 Hook
```

### Hook 結構模板
```typescript
import { useState, useEffect } from 'react';

export function useCustomHook<T>(param: T) {
  // 1. State
  const [state, setState] = useState<T>(param);

  // 2. Effects
  useEffect(() => {
    // 副作用邏輯
    return () => {
      // 清理邏輯
    };
  }, [dependencies]);

  // 3. Handlers
  const handleSomething = () => {
    // ...
  };

  // 4. Return
  return {
    state,
    handleSomething,
  };
}
```

### 類型安全
```typescript
// ✅ 明確的泛型和返回類型
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // ...
  return [storedValue, setValue];
}

// ❌ 缺少類型定義
export function useLocalStorage(key, initialValue) {
  // ...
}
```

## ⚠️ 重要約定

1. **所有 Hook 必須以 `use` 開頭**
2. **Hook 只能在組件或其他 Hook 中調用**
3. **Hook 必須有明確的 TypeScript 類型**
4. **複雜 Hook 必須有 JSDoc 註釋**
5. **Hook 應該是純函數邏輯**（無副作用，除了 useEffect）
6. **避免創建過多 Hooks**（優先使用現有的）

## 🔍 常見 Hook 模式

### 資料獲取 Hook
```typescript
export function useProject(id: string) {
  const { data, isLoading, error } = api.project.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  return { project: data, isLoading, error };
}
```

### Form Hook
```typescript
export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    // 驗證邏輯
    return Object.keys(errors).length === 0;
  };

  return { values, errors, handleChange, validate };
}
```

## 相關文件
- `apps/web/src/components/` - 使用 Hooks 的組件
- `apps/web/src/lib/` - 工具函數
