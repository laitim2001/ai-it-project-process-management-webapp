# TypeScript Rules - TypeScript 約定

---
applies_to:
  - "**/*.ts"
  - "**/*.tsx"
---

## 概述
此規則適用於所有 TypeScript 代碼，確保類型安全和代碼一致性。

## 類型定義約定

### Interface vs Type
```typescript
// ✅ 使用 interface 定義物件結構（推薦）
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// ✅ 使用 type 定義聯合類型或複雜類型
type Status = 'pending' | 'active' | 'completed';
type FormMode = 'create' | 'edit';

// ✅ 使用 type 定義條件類型
type FormProps = {
  mode: FormMode;
} & (
  | { mode: 'create' }
  | { mode: 'edit'; initialData: User }
);
```

### Props 類型
```typescript
// ✅ 組件 Props 使用 interface
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ✅ 使用 React 內建類型
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

### 泛型使用
```typescript
// ✅ API 回應類型
interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
}

// ✅ 列表組件 Props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}
```

## 命名約定

| 類型 | 約定 | 範例 |
|------|------|------|
| Interface | PascalCase | `UserProfile`, `ButtonProps` |
| Type | PascalCase | `Status`, `FormMode` |
| Enum | PascalCase | `UserRole`, `ProjectStatus` |
| 常數 | UPPER_SNAKE_CASE | `API_URL`, `MAX_RETRY` |
| 變數 | camelCase | `userName`, `isLoading` |
| 函數 | camelCase | `getUserById`, `handleSubmit` |
| 組件 | PascalCase | `UserCard`, `ProjectForm` |

## 類型導入

```typescript
// ✅ 使用 type-only import
import type { User, Project } from '@/types';
import type { Prisma } from '@prisma/client';

// ✅ 混合導入
import { api, type AppRouter } from '@/lib/trpc';
```

## 嚴格類型模式

### 避免 any
```typescript
// ❌ 避免使用 any
function processData(data: any) { ... }

// ✅ 使用具體類型
function processData(data: User) { ... }

// ✅ 使用 unknown 並進行類型守衛
function processData(data: unknown) {
  if (isUser(data)) {
    // data 現在是 User 類型
  }
}
```

### 類型守衛
```typescript
// ✅ 自定義類型守衛
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

// ✅ 使用 in 操作符
function handleResponse(response: SuccessResponse | ErrorResponse) {
  if ('error' in response) {
    // ErrorResponse
    console.error(response.error);
  } else {
    // SuccessResponse
    console.log(response.data);
  }
}
```

### 非空斷言
```typescript
// ❌ 避免過度使用非空斷言
const user = getUser()!;

// ✅ 使用條件檢查
const user = getUser();
if (!user) {
  throw new Error('User not found');
}
// user 現在是非 null

// ✅ 或使用可選鏈
const userName = user?.name ?? 'Unknown';
```

## Zod Schema 整合

```typescript
import { z } from 'zod';

// ✅ 定義 Zod Schema
export const createUserSchema = z.object({
  name: z.string().min(1, '名稱不可為空'),
  email: z.string().email('無效的電子郵件'),
  role: z.enum(['admin', 'user']).default('user'),
});

// ✅ 從 Zod 推導 TypeScript 類型
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ✅ 在 tRPC 中使用
export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // input 已自動推導為 CreateUserInput
      return ctx.prisma.user.create({ data: input });
    }),
});
```

## Prisma 類型使用

```typescript
import type { Prisma, User, Project } from '@prisma/client';

// ✅ 使用 Prisma 生成的類型
type UserWithProjects = Prisma.UserGetPayload<{
  include: { projects: true };
}>;

// ✅ 使用 Prisma 輸入類型
type CreateUserData = Prisma.UserCreateInput;
type UpdateUserData = Prisma.UserUpdateInput;

// ✅ 使用 Prisma Where 類型
type UserWhereInput = Prisma.UserWhereInput;
```

## 事件處理類型

```typescript
// ✅ 表單事件
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// ✅ 輸入事件
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// ✅ 點擊事件
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};

// ✅ 鍵盤事件
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    submit();
  }
};
```

## 非同步類型

```typescript
// ✅ Promise 返回類型
async function fetchUser(id: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id } });
}

// ✅ tRPC 查詢類型推導（自動）
const { data, isLoading } = api.user.getById.useQuery({ id });
// data 類型自動推導為 User | undefined
```

## 實用工具類型

```typescript
// ✅ Partial - 所有屬性可選
type UpdateUser = Partial<User>;

// ✅ Required - 所有屬性必填
type RequiredUser = Required<User>;

// ✅ Pick - 選取特定屬性
type UserBasic = Pick<User, 'id' | 'name' | 'email'>;

// ✅ Omit - 排除特定屬性
type UserWithoutPassword = Omit<User, 'password'>;

// ✅ Record - 鍵值對類型
type UserRoles = Record<string, 'admin' | 'user'>;
```

## 禁止事項

1. ❌ **禁止使用 `any` 類型**（除非絕對必要並有註釋）
2. ❌ **禁止忽略 TypeScript 錯誤**（`@ts-ignore`）
3. ❌ **禁止過度使用非空斷言**（`!`）
4. ❌ **禁止使用 `as unknown as T` 強制轉換**
5. ❌ **禁止使用 `Function` 類型**（使用具體函數簽名）

## 相關規則
- `backend-api.md` - tRPC API 規範（Zod 整合）
- `database.md` - Prisma 類型使用
- `components.md` - React 組件 Props 類型
