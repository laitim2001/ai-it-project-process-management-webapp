# UI Design System Rules - shadcn/ui 設計系統

---
applies_to:
  - "apps/web/src/components/ui/**"
---

## 概述
此規則適用於 shadcn/ui 設計系統組件，共 41+ 個標準化 UI 組件。

## 核心組件分類

### 表單組件 (14 個)
| 組件 | 用途 |
|------|------|
| `button.tsx` | 按鈕（5 種變體） |
| `input.tsx` | 文字輸入框 |
| `textarea.tsx` | 多行文字框 |
| `select.tsx` | 下拉選單 |
| `combobox.tsx` | 可搜尋下拉選單 |
| `checkbox.tsx` | 複選框 |
| `radio-group.tsx` | 單選按鈕組 |
| `switch.tsx` | 開關按鈕 |
| `password-input.tsx` | 密碼輸入框 |

### 資料顯示 (10 個)
| 組件 | 用途 |
|------|------|
| `table.tsx` | 資料表格 |
| `card.tsx` | 卡片容器 |
| `badge.tsx` | 徽章標籤 |
| `avatar.tsx` | 用戶頭像 |
| `skeleton.tsx` | 載入骨架 |
| `tabs.tsx` | 標籤頁 |
| `accordion.tsx` | 手風琴面板 |

### 導航與回饋 (10 個)
| 組件 | 用途 |
|------|------|
| `breadcrumb.tsx` | 麵包屑導航 |
| `pagination.tsx` | 分頁控制 |
| `dropdown-menu.tsx` | 下拉選單 |
| `dialog.tsx` | 對話框 |
| `alert-dialog.tsx` | 警告對話框 |
| `popover.tsx` | 彈出框 |
| `tooltip.tsx` | 工具提示 |
| `toast.tsx` | 通知提示 |

### 載入特效系統 (4 個)
```
loading/
├── Spinner.tsx         # 旋轉載入指示器
├── LoadingButton.tsx   # 按鈕載入狀態
├── LoadingOverlay.tsx  # 區域載入遮罩
└── GlobalProgress.tsx  # 頂部導航進度條
```

## 使用模式

### Button 變體
```typescript
<Button variant="default">預設</Button>
<Button variant="destructive">刪除</Button>
<Button variant="outline">輪廓</Button>
<Button variant="ghost">幽靈</Button>
<Button variant="link">連結</Button>

<Button size="sm">小</Button>
<Button size="default">中</Button>
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

### Table 結構
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>欄位</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>資料</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Dialog 對話框
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>開啟</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>標題</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 內容 */}
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>關閉</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast 通知
```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: '操作成功',
  description: '資料已儲存',
  variant: 'default', // 'default' | 'destructive'
});
```

## 樣式調整

### cn 工具函數
```typescript
import { cn } from '@/lib/utils';

<Button className={cn('custom-class', conditionalClass && 'conditional')}>
  Click
</Button>
```

### 主題支援
所有組件自動支援 Light/Dark 主題：
```typescript
// 使用 Tailwind CSS 變數
className="bg-background text-foreground"
className="bg-card text-card-foreground"
className="border-border"
```

## 重要約定

### 不可做
1. ❌ **不可修改 ui/ 組件的核心邏輯**（shadcn/ui 標準）
2. ❌ **不可刪除 ARIA 屬性**（無障礙設計）
3. ❌ **不可移除主題支援**

### 可以做
1. ✅ 使用 `className` prop 調整樣式
2. ✅ 使用 `cn()` 合併類名
3. ✅ 擴展 variants 添加新變體
4. ✅ 創建組合組件包裝 UI 組件

## 無障礙設計 (Accessibility)

### 必要 ARIA 屬性
```typescript
// 按鈕
<Button aria-label="關閉對話框">×</Button>

// 對話框
<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">

// 表單欄位
<Input id="email" aria-describedby="email-helper" />
<p id="email-helper">請輸入有效的電子郵件</p>
```

### 鍵盤導航
所有 Radix UI 組件自動支援：
- `Tab` - 導航焦點
- `Enter/Space` - 確認操作
- `Escape` - 關閉彈出元素
- `Arrow Keys` - 選單導航

## 相關資源
- [shadcn/ui 官方文檔](https://ui.shadcn.com/)
- [Radix UI 文檔](https://www.radix-ui.com/)
- `apps/web/src/lib/utils.ts` - cn() 函數

## 相關規則
- `components.md` - React 組件規範
- `frontend.md` - 前端頁面規範
