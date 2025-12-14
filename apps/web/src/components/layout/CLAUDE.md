# Layout Components - 佈局組件層

## 📋 目錄用途
此目錄包含應用的核心佈局組件，定義整體頁面結構。

## 🏗️ 核心組件

```
layout/
├── dashboard-layout.tsx    # 主佈局（最重要）
├── Sidebar.tsx            # 側邊欄導航（FEAT-011 權限過濾）
├── TopBar.tsx             # 頂部欄
├── PermissionGate.tsx     # 權限閘門組件（FEAT-011）
└── LanguageSwitcher.tsx   # 語言切換器
```

## 🎯 組件職責

### 1. DashboardLayout
**用途**: 統一的儀表板佈局，包含 Sidebar + TopBar + Content

```typescript
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**使用範例**:
```typescript
export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <h1>Projects</h1>
      {/* 頁面內容 */}
    </DashboardLayout>
  );
}
```

### 2. Sidebar (FEAT-011 權限過濾)
**功能**:
- 主導航選單
- **FEAT-011: 權限過濾**（使用 usePermissions hook）
- 當前路由高亮
- 響應式收合（手機版）
- 載入狀態（權限查詢中）

**導航項目與權限代碼**:
| 導航項目 | 權限代碼 |
|---------|---------|
| Dashboard（儀表板）| `menu:dashboard` |
| Projects（專案）| `menu:projects` |
| Proposals（提案）| `menu:proposals` |
| Budget Pools（預算池）| `menu:budgetPools` |
| Vendors（供應商）| `menu:vendors` |
| Quotes（報價單）| `menu:quotes` |
| Purchase Orders（採購單）| `menu:purchaseOrders` |
| Expenses（費用）| `menu:expenses` |
| Charge-Outs（費用轉嫁）| `menu:chargeOuts` |
| OM Expenses（OM 費用）| `menu:omExpenses` |
| OM Summary（OM Summary）| `menu:omSummary` |
| OM Categories（OM 費用類別）| `menu:omCategories` |
| Data Import（數據導入）| `menu:dataImport` |
| Operating Companies（營運公司）| `menu:opcos` |
| Users（用戶管理）| `menu:users` |
| Notifications（通知）| `menu:notifications` |
| Settings（設定）| `menu:settings` |

**權限過濾機制**:
```typescript
import { usePermissions, MENU_PERMISSIONS } from "@/hooks/usePermissions";

const { hasPermission, isLoading } = usePermissions();

// 導航項目定義
const navigation = [
  {
    name: t('menu.dashboard'),
    href: "/dashboard",
    permissionCode: MENU_PERMISSIONS.DASHBOARD, // "menu:dashboard"
  },
  // ...
];

// 過濾無權限的項目
const filteredNavigation = navigation
  .map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.permissionCode) return true;
      return hasPermission(item.permissionCode);
    }),
  }))
  .filter((section) => section.items.length > 0);
```

### 3. PermissionGate (FEAT-011 路由保護)
**用途**: 客戶端路由權限保護組件

**功能**:
- 根據權限代碼保護頁面內容
- 無權限時顯示拒絕訪問訊息或重定向
- 載入狀態處理（權限查詢中）
- 支援多種權限檢查模式

**Props**:
| Prop | 類型 | 說明 |
|------|------|------|
| `permission` | `string?` | 單一權限代碼檢查 |
| `anyPermissions` | `string[]?` | 檢查是否有任一權限 |
| `allPermissions` | `string[]?` | 檢查是否有所有權限 |
| `fallbackUrl` | `string?` | 無權限時重定向 URL (預設: /dashboard) |
| `showAccessDenied` | `boolean?` | 是否顯示拒絕訊息 (預設: true) |
| `children` | `ReactNode` | 受保護的內容 |

**使用範例**:
```typescript
// 單一權限檢查
<PermissionGate permission="menu:users">
  <UsersPage />
</PermissionGate>

// 任一權限檢查
<PermissionGate anyPermissions={['menu:projects', 'menu:proposals']}>
  <ProjectsContent />
</PermissionGate>

// 無權限時重定向（不顯示拒絕訊息）
<PermissionGate permission="menu:users" showAccessDenied={false}>
  <UsersPage />
</PermissionGate>
```

### 4. TopBar
**功能**:
- 用戶資訊顯示
- 通知中心（NotificationBell）
- 語言切換器
- 主題切換器（Light/Dark）
- 用戶選單（登出）

## ⚠️ 重要約定

1. **所有業務頁面必須使用 DashboardLayout**（除了登入頁）
2. **導航項目必須根據權限顯示/隱藏** (FEAT-011)
3. **Sidebar 必須顯示當前路由高亮**
4. **TopBar 必須顯示用戶名稱和角色**
5. **響應式設計**（手機版 Sidebar 收合）
6. **FEAT-011: 使用 PermissionGate 保護敏感頁面**

## 相關文件
- `apps/web/src/app/[locale]/layout.tsx` - Root Layout
- `apps/web/src/components/notification/` - 通知組件
- `apps/web/src/components/theme/` - 主題組件
- `apps/web/src/hooks/usePermissions.ts` - 權限管理 Hook (FEAT-011)
- `packages/api/src/routers/permission.ts` - 權限 API Router (FEAT-011)
- `packages/db/prisma/schema.prisma` - Permission 數據模型 (FEAT-011)
