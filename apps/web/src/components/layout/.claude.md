# Layout Components - 佈局組件層

## 📋 目錄用途
此目錄包含應用的核心佈局組件，定義整體頁面結構。

## 🏗️ 核心組件

```
layout/
├── dashboard-layout.tsx    # 主佈局（最重要）
├── Sidebar.tsx            # 側邊欄導航
├── TopBar.tsx             # 頂部欄
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

### 2. Sidebar
**功能**:
- 主導航選單
- 角色權限控制（PM vs Supervisor）
- 當前路由高亮
- 響應式收合（手機版）

**導航項目**:
- Dashboard（儀表板）
- Projects（專案）
- Proposals（提案）
- Expenses（費用）
- Purchase Orders（採購單）
- Vendors（供應商）
- Users（用戶管理，僅 Supervisor）
- Settings（設定）

### 3. TopBar
**功能**:
- 用戶資訊顯示
- 通知中心（NotificationBell）
- 語言切換器
- 主題切換器（Light/Dark）
- 用戶選單（登出）

## ⚠️ 重要約定

1. **所有業務頁面必須使用 DashboardLayout**（除了登入頁）
2. **導航項目必須根據角色權限顯示/隱藏**
3. **Sidebar 必須顯示當前路由高亮**
4. **TopBar 必須顯示用戶名稱和角色**
5. **響應式設計**（手機版 Sidebar 收合）

## 相關文件
- `apps/web/src/app/[locale]/layout.tsx` - Root Layout
- `apps/web/src/components/notification/` - 通知組件
- `apps/web/src/components/theme/` - 主題組件
