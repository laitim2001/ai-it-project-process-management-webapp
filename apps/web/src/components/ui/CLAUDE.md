# UI Design System - shadcn/ui 組件層

## 📋 目錄用途
此目錄包含 **35 個** shadcn/ui 設計系統組件，提供統一的 UI/UX 標準。

## 🎯 核心組件

### 表單組件 (12 個)
- `button.tsx` - 按鈕（5 種變體）
- `input.tsx` - 文字輸入框
- `textarea.tsx` - 多行文字框
- `select.tsx` - 下拉選單
- `combobox.tsx` - 可搜尋下拉選單
- `command.tsx` - 命令選單（搜尋框基礎）
- `checkbox.tsx` - 複選框
- `radio-group.tsx` - 單選按鈕組
- `switch.tsx` - 開關按鈕
- `slider.tsx` - 滑桿
- `form.tsx` - 表單包裝器
- `label.tsx` - 表單標籤

### 資料顯示 (10 個)
- `table.tsx` - 資料表格
- `card.tsx` - 卡片容器
- `badge.tsx` - 徽章標籤
- `avatar.tsx` - 用戶頭像
- `separator.tsx` - 分隔線
- `skeleton.tsx` - 載入骨架
- `loading-skeleton.tsx` - 載入骨架（擴展）
- `progress.tsx` - 進度條
- `tabs.tsx` - 標籤頁
- `accordion.tsx` - 手風琴面板

### 導航與回饋 (10 個)
- `breadcrumb.tsx` - 麵包屑導航
- `pagination.tsx` - 分頁控制
- `dropdown-menu.tsx` - 下拉選單
- `context-menu.tsx` - 右鍵選單
- `sheet.tsx` - 側邊抽屜
- `dialog.tsx` - 對話框
- `alert-dialog.tsx` - 警告對話框
- `popover.tsx` - 彈出框
- `tooltip.tsx` - 工具提示
- `alert.tsx` - 警告框

### Toast 通知系統 (3 個)
- `toast.tsx` - 通知提示
- `toaster.tsx` - Toast 容器
- `use-toast.tsx` - Toast Hook

## 🎨 使用模式

### Button 變體
```typescript
<Button variant="default">預設</Button>
<Button variant="destructive">刪除</Button>
<Button variant="outline">輪廓</Button>
<Button variant="ghost">幽靈</Button>
<Button variant="link">連結</Button>

<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>
```

### Card 組合
```typescript
<Card>
  <CardHeader>
    <CardTitle>標題</CardTitle>
    <CardDescription>說明</CardDescription>
  </CardHeader>
  <CardContent>內容</CardContent>
  <CardFooter>頁腳</CardFooter>
</Card>
```

### Form 整合
```typescript
<Form>
  <FormField
    label="名稱"
    error={errors.name}
  >
    <Input name="name" value={formData.name} onChange={handleChange} />
  </FormField>
</Form>
```

## ⚠️ 重要約定

1. **不可修改 ui/ 組件的核心邏輯**（shadcn/ui 標準）
2. **樣式調整使用 className prop**
3. **使用 cn() 合併類名**
4. **所有組件支援 Light/Dark 主題**
5. **ARIA 屬性不可刪除**（無障礙設計）

## 相關文件
- `apps/web/src/lib/utils.ts` - cn() 函數
- [shadcn/ui 文檔](https://ui.shadcn.com/)
