# UI/UX 重新設計文件
> 基於 BMad 方法的完整設計系統重構
> 參考項目：AI Sales Enablement Platform

**創建日期：** 2025-10-03
**狀態：** 設計階段
**負責人：** Development Team

---

## 目錄
1. [發現階段 (Discovery)](#1-發現階段-discovery)
2. [定義階段 (Define)](#2-定義階段-define)
3. [設計階段 (Design)](#3-設計階段-design)
4. [開發階段 (Develop)](#4-開發階段-develop)

---

## 1. 發現階段 (Discovery)

### 1.1 當前問題分析

**現有 UI/UX 的問題：**
- ❌ **視覺風格不統一** - 缺乏一致的設計系統
- ❌ **佈局結構混亂** - 導航和頁面組織不清晰
- ❌ **互動體驗不佳** - 表單、按鈕、回饋機制不完善
- ❌ **響應式設計缺失** - 移動端體驗不佳

### 1.2 目標使用者角色

**主要使用者：**
1. **Project Manager (專案經理)**
   - 需求：快速創建專案、提交提案、追蹤預算
   - 痛點：複雜的表單、不直觀的導航

2. **Supervisor (主管)**
   - 需求：審批提案、監控專案進度、預算控制
   - 痛點：缺乏清晰的數據視覺化、審批流程不清晰

3. **Admin (管理員)**
   - 需求：系統管理、用戶管理、全局監控
   - 痛點：缺乏高效的管理介面

### 1.3 參考設計系統分析

基於 **AI Sales Enablement Platform** 的設計系統，我們識別出以下優秀設計模式：

✅ **統一的顏色系統** - HSL-based CSS 變數
✅ **模組化元件庫** - 使用 Radix UI + CVA
✅ **響應式佈局** - 移動優先設計
✅ **清晰的視覺層級** - 卡片、陰影、間距
✅ **豐富的互動狀態** - Hover、Focus、Active
✅ **完善的載入/錯誤狀態** - Skeleton、錯誤頁面

---

## 2. 定義階段 (Define)

### 2.1 設計目標

**核心目標：**
1. ✨ **建立統一的設計系統** - 可複用的元件庫
2. 📱 **優化響應式體驗** - 完美支援桌面、平板、手機
3. 🎨 **提升視覺專業度** - 現代、簡潔、專業的外觀
4. 🚀 **改善互動流暢度** - 快速回饋、流暢動畫
5. ♿ **確保無障礙性** - WCAG 2.1 AA 標準

### 2.2 成功指標

**量化指標：**
- 頁面載入時間 < 2 秒
- 首次內容繪製 (FCP) < 1.5 秒
- 互動時間 (TTI) < 3 秒
- 移動端可用性分數 > 90

**質化指標：**
- 使用者滿意度提升
- 任務完成時間縮短
- 錯誤率降低

### 2.3 設計原則

1. **一致性 (Consistency)** - 統一的視覺語言和互動模式
2. **清晰度 (Clarity)** - 明確的資訊層級和視覺引導
3. **效率 (Efficiency)** - 最小化操作步驟
4. **回饋性 (Feedback)** - 即時的狀態反饋
5. **容錯性 (Error Prevention)** - 防止用戶錯誤

---

## 3. 設計階段 (Design)

### 3.1 視覺設計系統

#### 3.1.1 顏色系統

**主色調 (Primary Colors):**
```css
/* Light Theme */
--background: 0 0% 100%            /* #FFFFFF - 背景白 */
--foreground: 222.2 84% 4.9%       /* #020817 - 文字深藍灰 */
--primary: 221.2 83.2% 53.3%       /* #3B82F6 - 品牌藍 */
--primary-foreground: 210 40% 98%  /* #F8FAFC - 主色文字 */

/* Dark Theme */
--background: 222.2 84% 4.9%       /* #020817 - 背景深藍灰 */
--foreground: 210 40% 98%          /* #F8FAFC - 文字近白 */
--primary: 217.2 91.2% 59.8%       /* #60A5FA - 亮藍 */
```

**語義化顏色 (Semantic Colors):**
```css
--success: 142 76% 36%             /* #16A34A - 成功綠 */
--warning: 38 92% 50%              /* #F59E0B - 警告黃 */
--error: 0 84.2% 60.2%             /* #EF4444 - 錯誤紅 */
--info: 199 89% 48%                /* #0EA5E9 - 資訊藍 */
```

**中性色 (Neutral Colors):**
```css
--muted: 210 40% 96%               /* #F1F5F9 - 淺灰 */
--accent: 210 40% 96%              /* #F1F5F9 - 強調灰 */
--border: 214.3 31.8% 91.4%        /* #E2E8F0 - 邊框灰 */
--ring: 221.2 83.2% 53.3%          /* #3B82F6 - 聚焦環藍 */
```

**提案狀態顏色對應：**
- 🟡 Draft (草稿) → `bg-gray-100 text-gray-800`
- 🔵 PendingApproval (待審批) → `bg-blue-100 text-blue-800`
- 🟢 Approved (已批准) → `bg-green-100 text-green-800`
- 🔴 Rejected (已拒絕) → `bg-red-100 text-red-800`
- 🟠 MoreInfoRequired (需更多資訊) → `bg-yellow-100 text-yellow-800`

#### 3.1.2 字體系統

**字型選擇：**
```typescript
// Primary: Inter (現代無襯線字體)
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})
```

**字級規模 (Type Scale):**
| 用途 | Class | 大小 | 行高 |
|------|-------|------|------|
| 小標籤 | `text-xs` | 12px | 16px |
| 正文小 | `text-sm` | 14px | 20px |
| 正文 | `text-base` | 16px | 24px |
| 副標題 | `text-lg` | 18px | 28px |
| 標題小 | `text-xl` | 20px | 28px |
| 標題中 | `text-2xl` | 24px | 32px |
| 標題大 | `text-3xl` | 30px | 36px |
| Hero 數字 | `text-6xl` | 60px | 1 |

**字重 (Font Weights):**
- Regular: `font-normal` (400) - 正文
- Medium: `font-medium` (500) - 次要標題
- Semibold: `font-semibold` (600) - 主要標題
- Bold: `font-bold` (700) - 重點強調

#### 3.1.3 間距系統

**基於 4px 網格系統：**
```
px-1  (4px)    px-2  (8px)    px-3  (12px)   px-4  (16px)
px-5  (20px)   px-6  (24px)   px-8  (32px)   px-10 (40px)
px-12 (48px)   px-16 (64px)   px-20 (80px)   px-24 (96px)
```

**元件間距規範：**
- 卡片內邊距: `p-6` (24px)
- 區塊間距: `gap-6` (24px)
- 輸入框高度: `h-10` (40px)
- 按鈕高度: `h-10` (40px)
- 頁面邊距: `px-4 sm:px-6 lg:px-8`

#### 3.1.4 圓角系統

```css
--radius: 0.5rem                   /* 基礎圓角 8px */

rounded-sm    /* 2px  - 小元素 */
rounded-md    /* 6px  - 輸入框、按鈕 */
rounded-lg    /* 8px  - 卡片 */
rounded-xl    /* 12px - 大卡片 */
rounded-full  /* 圓形 - 徽章、頭像 */
```

#### 3.1.5 陰影系統

```css
/* 卡片陰影 */
shadow-sm     /* 小陰影 - hover 狀態 */
shadow-md     /* 中陰影 - 一般卡片 */
shadow-lg     /* 大陰影 - modal、dropdown */

/* 自定義陰影 */
.card-shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
```

### 3.2 佈局設計

#### 3.2.1 整體佈局結構

```
┌─────────────────────────────────────────────────────┐
│  TopBar (固定頂部)                                   │
│  - Logo | Search | Actions | User                   │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Main Content Area                       │
│ (固定)   │  - Breadcrumb                             │
│          │  - Page Header                            │
│  - Nav   │  - Content Grid                           │
│  - Menu  │    └─ Cards / Tables / Forms             │
│          │                                           │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

**佈局規範：**
- Sidebar 寬度: `288px` (lg:w-72)
- TopBar 高度: `64px` (h-16)
- 主內容區: `lg:pl-72` (左側留 Sidebar 空間)
- 最大內容寬度: `1400px`

#### 3.2.2 Dashboard 網格系統

**統計卡片網格：**
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <StatsCard title="總預算" value="$1.2M" trend="+12%" />
  <StatsCard title="進行中專案" value="24" trend="+3" />
  <StatsCard title="待審批提案" value="8" trend="-2" />
  <StatsCard title="本月支出" value="$180K" trend="+8%" />
</div>
```

**主內容區網格（2:1 比例）：**
```tsx
<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
  {/* 左側 2/3 */}
  <div className="lg:col-span-2 space-y-8">
    <BudgetChart />
    <RecentProjects />
  </div>

  {/* 右側 1/3 */}
  <div className="space-y-8">
    <QuickActions />
    <PendingApprovals />
  </div>
</div>
```

#### 3.2.3 Sidebar 導航設計

**結構：**
```tsx
<div className="fixed inset-y-0 w-72 bg-white border-r">
  {/* Logo & Brand */}
  <div className="h-16 flex items-center px-6 border-b">
    <Building2 className="h-8 w-8 text-blue-600" />
    <span className="ml-3 text-xl font-semibold">IT 專案管理</span>
  </div>

  {/* User Card */}
  <div className="p-4">
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} />
        <div>
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
      </div>
    </div>
  </div>

  {/* Navigation Sections */}
  <nav className="px-4 space-y-6">
    {/* 主要功能 */}
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
        主要功能
      </h3>
      <NavItem icon={LayoutDashboard} href="/dashboard">Dashboard</NavItem>
      <NavItem icon={FolderKanban} href="/projects">專案管理</NavItem>
      <NavItem icon={FileText} href="/proposals">預算提案</NavItem>
      <NavItem icon={Wallet} href="/budget-pools">預算池</NavItem>
    </div>

    {/* 採購管理 */}
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
        採購管理
      </h3>
      <NavItem icon={Building} href="/vendors">供應商</NavItem>
      <NavItem icon={FileCheck} href="/quotes">報價單</NavItem>
      <NavItem icon={ShoppingCart} href="/purchase-orders">採購單</NavItem>
      <NavItem icon={Receipt} href="/expenses">費用記錄</NavItem>
    </div>

    {/* 系統管理 */}
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
        系統管理
      </h3>
      <NavItem icon={Users} href="/users">用戶管理</NavItem>
      <NavItem icon={Settings} href="/settings">系統設定</NavItem>
    </div>
  </nav>
</div>
```

**導航項目樣式：**
```tsx
// Active 狀態
className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 shadow-sm font-medium"

// Inactive 狀態
className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"

// Icon 顏色
isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
```

#### 3.2.4 TopBar 設計

```tsx
<header className="h-16 bg-white border-b px-4 lg:px-8 flex items-center justify-between">
  {/* 左側：Mobile Menu + Search */}
  <div className="flex items-center gap-4 flex-1">
    {/* Mobile Menu Toggle */}
    <Button variant="ghost" size="icon" className="lg:hidden">
      <Menu className="h-5 w-5" />
    </Button>

    {/* Search Bar */}
    <div className="hidden md:block flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="搜尋專案、提案..."
          className="pl-10 bg-gray-50 border-none"
        />
      </div>
    </div>
  </div>

  {/* 右側：Actions */}
  <div className="flex items-center gap-2">
    {/* Quick Actions */}
    <Button variant="ghost" size="icon">
      <Plus className="h-5 w-5" />
    </Button>

    {/* Notifications */}
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
        3
      </Badge>
    </Button>

    {/* Theme Toggle */}
    <Button variant="ghost" size="icon">
      <Sun className="h-5 w-5" />
    </Button>

    {/* User Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Avatar size="sm" />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" /> 個人資料
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" /> 設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" /> 登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
```

### 3.3 元件設計規範

#### 3.3.1 按鈕 (Button)

**變體定義：**
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**使用範例：**
```tsx
<Button>預設按鈕</Button>
<Button variant="outline">外框按鈕</Button>
<Button variant="destructive">刪除</Button>
<Button size="sm">小按鈕</Button>
<Button size="icon"><Plus /></Button>
```

#### 3.3.2 卡片 (Card)

**基礎結構：**
```tsx
<Card className="relative overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-gray-600">
      標題
    </CardTitle>
    <Icon className="h-4 w-4 text-gray-400" />
  </CardHeader>

  <CardContent>
    <div className="text-2xl font-bold text-gray-900">
      主要內容
    </div>
    <p className="text-xs text-gray-500 mt-1">
      輔助說明
    </p>
  </CardContent>

  {/* 可選：裝飾性背景 */}
  <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-blue-500 opacity-10" />
</Card>
```

**統計卡片範例：**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-gray-600">
      總預算
    </CardTitle>
    <Wallet className="h-4 w-4 text-gray-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$1,234,567</div>
    <div className="flex items-center text-xs text-green-600 mt-1">
      <TrendingUp className="h-3 w-3 mr-1" />
      +12% 較上月
    </div>
  </CardContent>
</Card>
```

#### 3.3.3 表單元件

**輸入框 (Input):**
```tsx
<div className="space-y-2">
  <Label htmlFor="projectName">專案名稱</Label>
  <Input
    id="projectName"
    placeholder="輸入專案名稱"
    className="h-10"
  />
  <p className="text-xs text-gray-500">最多 100 字元</p>
</div>
```

**選擇器 (Select):**
```tsx
<div className="space-y-2">
  <Label>預算池</Label>
  <Select>
    <SelectTrigger className="h-10">
      <SelectValue placeholder="選擇預算池" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="pool1">2024 年度預算</SelectItem>
      <SelectItem value="pool2">2025 年度預算</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**文字區域 (Textarea):**
```tsx
<div className="space-y-2">
  <Label htmlFor="description">專案描述</Label>
  <Textarea
    id="description"
    placeholder="描述專案目標和範圍..."
    className="min-h-[120px] resize-none"
  />
</div>
```

**日期選擇器 (DatePicker):**
```tsx
<div className="space-y-2">
  <Label>開始日期</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-start text-left">
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : <span>選擇日期</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar mode="single" selected={date} onSelect={setDate} />
    </PopoverContent>
  </Popover>
</div>
```

#### 3.3.4 徽章 (Badge)

**變體定義：**
```tsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        outline: "text-foreground border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

**提案狀態徽章：**
```tsx
function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const variants = {
    Draft: { variant: "secondary", label: "草稿" },
    PendingApproval: { variant: "info", label: "待審批" },
    Approved: { variant: "success", label: "已批准" },
    Rejected: { variant: "error", label: "已拒絕" },
    MoreInfoRequired: { variant: "warning", label: "需更多資訊" },
  }

  const config = variants[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
```

#### 3.3.5 表格 (Table)

**專案列表表格：**
```tsx
<div className="bg-white rounded-lg border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[300px]">專案名稱</TableHead>
        <TableHead>專案經理</TableHead>
        <TableHead>預算</TableHead>
        <TableHead>狀態</TableHead>
        <TableHead>進度</TableHead>
        <TableHead className="text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {projects.map((project) => (
        <TableRow key={project.id} className="hover:bg-gray-50">
          <TableCell className="font-medium">
            <div>
              <p className="font-semibold">{project.name}</p>
              <p className="text-xs text-gray-500">{project.code}</p>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Avatar size="sm" src={project.manager.avatar} />
              <span className="text-sm">{project.manager.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <span className="font-semibold">${project.budget.toLocaleString()}</span>
          </TableCell>
          <TableCell>
            <Badge variant={getStatusVariant(project.status)}>
              {project.status}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Progress value={project.progress} className="w-20" />
              <span className="text-xs text-gray-500">{project.progress}%</span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> 查看
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> 編輯
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> 刪除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

#### 3.3.6 對話框 (Dialog)

**確認刪除對話框：**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">刪除專案</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        確認刪除
      </DialogTitle>
      <DialogDescription>
        您確定要刪除專案「{projectName}」嗎？此操作無法復原。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={onCancel}>
        取消
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        確定刪除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**表單對話框：**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>
      <Plus className="mr-2 h-4 w-4" /> 新增專案
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>建立新專案</DialogTitle>
      <DialogDescription>
        填寫以下資訊以建立新專案
      </DialogDescription>
    </DialogHeader>
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">專案名稱 *</Label>
        <Input id="name" placeholder="輸入專案名稱" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">專案代碼 *</Label>
        <Input id="code" placeholder="例如：PROJ-2024-001" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>開始日期</Label>
          <DatePicker />
        </div>
        <div className="space-y-2">
          <Label>結束日期</Label>
          <DatePicker />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea id="description" placeholder="專案描述..." />
      </div>
    </form>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        取消
      </Button>
      <Button onClick={onSubmit}>
        建立專案
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.4 頁面設計模板

#### 3.4.1 Dashboard 頁面

**佈局結構：**
```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">歡迎回來，{user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="總預算"
          value="$1,234,567"
          icon={Wallet}
          trend={{ value: "+12%", isPositive: true }}
        />
        <StatsCard
          title="進行中專案"
          value="24"
          icon={FolderKanban}
          trend={{ value: "+3", isPositive: true }}
        />
        <StatsCard
          title="待審批提案"
          value="8"
          icon={FileText}
          trend={{ value: "-2", isPositive: false }}
        />
        <StatsCard
          title="本月支出"
          value="$180,000"
          icon={TrendingUp}
          trend={{ value: "+8%", isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Budget Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>預算使用概況</CardTitle>
              <CardDescription>過去 12 個月的預算分配與使用情況</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetChart data={budgetData} />
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>最近專案</CardTitle>
              <CardDescription>最近更新的專案列表</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectList projects={recentProjects} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> 建立新專案
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" /> 提交預算提案
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="mr-2 h-4 w-4" /> 記錄費用
              </Button>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle>待審批項目</CardTitle>
              <CardDescription>需要您審批的提案</CardDescription>
            </CardHeader>
            <CardContent>
              <PendingApprovalsList approvals={pendingApprovals} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>最近活動</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={recentActivities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

#### 3.4.2 專案列表頁面

```tsx
export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">專案管理</h1>
          <p className="text-gray-500 mt-1">管理所有 IT 專案</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新增專案
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="搜尋專案名稱或代碼..." className="pl-10" />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="active">進行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="預算池" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有預算池</SelectItem>
                  <SelectItem value="2024">2024 年度</SelectItem>
                  <SelectItem value="2025">2025 年度</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <Table>
          {/* ... table content ... */}
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          顯示 1-10 筆，共 48 筆
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### 3.4.3 專案詳情頁面

```tsx
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">專案管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={getStatusVariant(project.status)}>
              {project.status}
            </Badge>
          </div>
          <p className="text-gray-500">{project.code}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              操作 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" /> 編輯專案
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" /> 新增提案
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> 刪除專案
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概覽</TabsTrigger>
          <TabsTrigger value="budget">預算</TabsTrigger>
          <TabsTrigger value="proposals">提案</TabsTrigger>
          <TabsTrigger value="expenses">費用</TabsTrigger>
          <TabsTrigger value="activity">活動記錄</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Info Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="專案代碼" value={project.code} />
                <InfoRow label="專案經理" value={project.manager.name} />
                <InfoRow label="主管" value={project.supervisor.name} />
                <InfoRow label="開始日期" value={formatDate(project.startDate)} />
                <InfoRow label="結束日期" value={formatDate(project.endDate)} />
              </CardContent>
            </Card>

            {/* Budget Info */}
            <Card>
              <CardHeader>
                <CardTitle>預算資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="總預算" value={`$${project.budget.toLocaleString()}`} />
                <InfoRow label="已使用" value={`$${project.spent.toLocaleString()}`} />
                <InfoRow label="剩餘" value={`$${project.remaining.toLocaleString()}`} />
                <div className="pt-2">
                  <Label className="text-xs text-gray-500 mb-2 block">使用率</Label>
                  <Progress value={(project.spent / project.budget) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>專案描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>專案時間軸</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTimeline project={project} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content ... */}
      </Tabs>
    </div>
  )
}
```

#### 3.4.4 表單頁面（新增/編輯專案）

```tsx
export default function ProjectFormPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">建立新專案</h1>
        <p className="text-gray-500 mt-1">填寫以下資訊以建立新的 IT 專案</p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                基本資訊
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">專案名稱 *</Label>
                  <Input
                    id="name"
                    placeholder="輸入專案名稱"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">專案代碼 *</Label>
                  <Input
                    id="code"
                    placeholder="例如：PROJ-2024-001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">專案描述</Label>
                <Textarea
                  id="description"
                  placeholder="描述專案的目標、範圍和預期成果..."
                  className="min-h-[120px]"
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                預算資訊
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetPool">預算池 *</Label>
                  <Select>
                    <SelectTrigger id="budgetPool">
                      <SelectValue placeholder="選擇預算池" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool1">2024 年度預算 - IT 部門</SelectItem>
                      <SelectItem value="pool2">2025 年度預算 - IT 部門</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">預算金額 *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                團隊成員
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manager">專案經理 *</Label>
                  <Select>
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="選擇專案經理" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">張三 (IT Manager)</SelectItem>
                      <SelectItem value="user2">李四 (Senior PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor">主管 *</Label>
                  <Select>
                    <SelectTrigger id="supervisor">
                      <SelectValue placeholder="選擇主管" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user3">王五 (IT Director)</SelectItem>
                      <SelectItem value="user4">趙六 (CTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                時間規劃
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">開始日期 *</Label>
                  <DatePicker id="startDate" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">預計結束日期 *</Label>
                  <DatePicker id="endDate" />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button variant="outline" type="button">
                取消
              </Button>
              <Button type="submit">
                建立專案
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3.5 載入與錯誤狀態

#### 3.5.1 頁面載入狀態

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">載入中...</h2>
        <p className="text-sm text-gray-500">正在準備您的內容</p>

        {/* Progress Bar */}
        <div className="mt-6 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 3.5.2 Skeleton 載入

```tsx
function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

#### 3.5.3 錯誤頁面

```tsx
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          糟糕！發生錯誤
        </h1>

        <p className="text-gray-600 mb-4">
          系統遇到了一些問題，請稍後再試。
        </p>

        {/* Error Details (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-md p-3 mb-4 text-left">
            <p className="font-mono text-xs text-gray-700 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> 重試
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回上一頁
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### 3.5.4 404 頁面

```tsx
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <FileQuestion className="h-20 w-20 text-gray-400 mx-auto mb-4" />

        <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">頁面不存在</h2>
        <p className="text-gray-600 mb-6">
          抱歉，您訪問的頁面不存在或已被移除。
        </p>

        {/* Quick Links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> 返回 Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">
              <FolderKanban className="mr-2 h-4 w-4" /> 瀏覽專案
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="text-sm text-gray-500">
          <p className="mb-2">或者搜尋您需要的內容：</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋專案、提案..."
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.6 響應式設計策略

#### 3.6.1 斷點系統

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small devices (large phones)
      'md': '768px',   // Medium devices (tablets)
      'lg': '1024px',  // Large devices (desktops) - Sidebar appears
      'xl': '1280px',  // Extra large devices
      '2xl': '1536px', // 2X large devices
    },
  },
}
```

#### 3.6.2 移動端導航

**Mobile Menu Component:**
```tsx
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Slide-out Menu */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[300px] h-full p-0 m-0 max-w-none sm:max-w-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">選單</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <Sidebar onNavigate={() => setIsOpen(false)} />
            </nav>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

#### 3.6.3 響應式網格

```tsx
{/* Stats Cards: 1 col mobile, 2 col tablet, 4 col desktop */}
<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {statsCards.map(...)}
</div>

{/* Content Grid: 1 col mobile, 3 col desktop with 2:1 ratio */}
<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
  <div className="lg:col-span-2">...</div>
  <div>...</div>
</div>

{/* Form Grid: 1 col mobile, 2 col desktop */}
<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
  {formFields.map(...)}
</div>
```

#### 3.6.4 響應式間距

```tsx
{/* Responsive Padding */}
<div className="px-4 sm:px-6 lg:px-8">

{/* Responsive Gap */}
<div className="gap-4 md:gap-6 lg:gap-8">

{/* Responsive Text Size */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

{/* Responsive Hide/Show */}
<div className="hidden lg:block">Desktop Only</div>
<div className="lg:hidden">Mobile Only</div>
```

### 3.7 互動設計

#### 3.7.1 Hover 狀態

```tsx
{/* Button Hover */}
className="hover:bg-primary/90 transition-colors"

{/* Card Hover */}
className="hover:shadow-md hover:border-gray-300 transition-all"

{/* Link Hover */}
className="hover:text-blue-600 hover:underline transition-colors"

{/* Icon Hover */}
className="text-gray-400 group-hover:text-gray-600 transition-colors"
```

#### 3.7.2 Focus 狀態

```tsx
{/* Input Focus */}
className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

{/* Button Focus */}
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

{/* Link Focus */}
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded"
```

#### 3.7.3 Active 狀態

```tsx
{/* Navigation Active */}
const navItemClass = cn(
  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
  isActive
    ? "bg-blue-50 text-blue-700 shadow-sm font-medium"
    : "text-gray-700 hover:bg-gray-50"
)

{/* Tab Active */}
const tabClass = cn(
  "px-4 py-2 rounded-md transition-colors",
  isActive
    ? "bg-white text-gray-900 shadow-sm"
    : "text-gray-600 hover:text-gray-900"
)
```

#### 3.7.4 動畫效果

```tsx
{/* Fade In */}
className="animate-in fade-in duration-200"

{/* Slide In */}
className="animate-in slide-in-from-left duration-300"

{/* Spin (Loading) */}
<Loader2 className="animate-spin" />

{/* Pulse (Skeleton) */}
<Skeleton className="animate-pulse" />

{/* Custom Transition */}
className="transition-all duration-200 ease-in-out"
```

#### 3.7.5 Toast 通知

```tsx
import { useToast } from "@/hooks/use-toast"

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "成功",
      description: "專案已成功建立",
      variant: "success",
    })
  }

  const handleError = () => {
    toast({
      title: "錯誤",
      description: "建立專案失敗，請重試",
      variant: "destructive",
    })
  }

  return (
    <Button onClick={handleSuccess}>
      建立專案
    </Button>
  )
}
```

---

## 4. 開發階段 (Develop)

### 4.1 實作計劃

#### 階段 1：設計系統基礎（1-2 天）
- [ ] 設定 Tailwind CSS 配置
- [ ] 建立 CSS 變數系統（顏色、間距、圓角）
- [ ] 設定字體系統
- [ ] 建立 `cn()` 工具函數

#### 階段 2：基礎元件庫（3-4 天）
- [ ] Button 元件
- [ ] Card 元件
- [ ] Input / Textarea / Select 元件
- [ ] Label 元件
- [ ] Badge 元件
- [ ] Dialog 元件
- [ ] DropdownMenu 元件
- [ ] Table 元件
- [ ] Tabs 元件
- [ ] Avatar 元件
- [ ] Progress 元件
- [ ] Skeleton 元件

#### 階段 3：佈局元件（2-3 天）
- [ ] Sidebar 元件
- [ ] TopBar 元件
- [ ] MobileNav 元件
- [ ] DashboardLayout 元件
- [ ] Breadcrumb 元件

#### 階段 4：頁面模板（4-5 天）
- [ ] Dashboard 頁面
- [ ] 專案列表頁面
- [ ] 專案詳情頁面
- [ ] 專案表單頁面（新增/編輯）
- [ ] 提案列表頁面
- [ ] 提案詳情頁面
- [ ] 用戶管理頁面
- [ ] 登入頁面

#### 階段 5：載入與錯誤處理（1-2 天）
- [ ] Loading 頁面
- [ ] Skeleton 載入狀態
- [ ] Error 頁面
- [ ] 404 頁面
- [ ] Toast 通知系統

#### 階段 6：響應式優化（2-3 天）
- [ ] 移動端導航測試
- [ ] 平板佈局測試
- [ ] 桌面佈局測試
- [ ] 觸控優化

#### 階段 7：無障礙性與最終調整（1-2 天）
- [ ] 鍵盤導航測試
- [ ] Screen reader 測試
- [ ] 顏色對比度檢查
- [ ] Focus indicator 優化
- [ ] 性能優化
- [ ] 瀏覽器兼容性測試

**總預估時間：16-23 天**

### 4.2 技術棧

```typescript
// 核心框架
- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+

// 樣式
- Tailwind CSS 3.4+
- class-variance-authority (CVA)
- tailwind-merge
- clsx

// UI 元件庫
- Radix UI (headless components)
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-select
  - @radix-ui/react-tabs
  - @radix-ui/react-avatar
  - @radix-ui/react-progress
  - 等等...

// Icon
- lucide-react

// 表單處理
- react-hook-form
- zod (validation)

// 日期處理
- date-fns
- react-day-picker

// 狀態管理
- Zustand (global state)
- TanStack Query (server state)

// 動畫
- framer-motion (optional)
```

### 4.3 檔案結構

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── proposals/
│   │   │   ├── budget-pools/
│   │   │   ├── users/
│   │   │   └── layout.tsx            # DashboardLayout
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # 基礎 UI 元件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # 佈局元件
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   ├── dashboard-layout.tsx
│   │   │   └── breadcrumb.tsx
│   │   │
│   │   ├── dashboard/                # Dashboard 特定元件
│   │   │   ├── stats-card.tsx
│   │   │   ├── budget-chart.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── ...
│   │   │
│   │   ├── project/                  # 專案相關元件
│   │   │   ├── project-form.tsx
│   │   │   ├── project-list.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── proposal/                 # 提案相關元件
│   │   │   ├── proposal-form.tsx
│   │   │   ├── proposal-actions.tsx
│   │   │   ├── comment-section.tsx
│   │   │   └── ...
│   │   │
│   │   └── user/                     # 用戶相關元件
│   │       ├── user-form.tsx
│   │       ├── user-avatar.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── utils.ts                  # cn() 函數等
│   │   ├── trpc.ts                   # tRPC client
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   ├── use-media-query.ts
│   │   └── ...
│   │
│   └── styles/
│       └── globals.css               # Tailwind + CSS 變數
│
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### 4.4 Tailwind 配置

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### 4.5 全局樣式

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light Theme Colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;
  }

  .dark {
    /* Dark Theme Colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .animate-in {
    animation: enter 200ms ease-out;
  }

  .animate-out {
    animation: exit 150ms ease-in forwards;
  }

  @keyframes enter {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes exit {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
}
```

### 4.6 開發流程

**Step 1: 安裝依賴**
```bash
cd apps/web
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-label @radix-ui/react-popover
pnpm add lucide-react
pnpm add date-fns react-day-picker
pnpm add -D tailwindcss-animate
```

**Step 2: 建立工具函數**
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 3: 建立基礎元件**
從 Button、Card、Input 開始，逐步建立元件庫。

**Step 4: 建立佈局元件**
Sidebar → TopBar → DashboardLayout

**Step 5: 建立頁面**
從 Dashboard 開始，逐步實作所有頁面。

**Step 6: 測試與優化**
響應式測試、無障礙性測試、性能優化。

### 4.7 質量檢查清單

**視覺設計：**
- [ ] 顏色系統一致性
- [ ] 字體大小和權重正確
- [ ] 間距符合 4px 網格
- [ ] 圓角統一
- [ ] 陰影適當

**互動設計：**
- [ ] Hover 狀態清晰
- [ ] Focus 狀態可見
- [ ] Active 狀態明確
- [ ] 動畫流暢
- [ ] 載入狀態完善

**響應式設計：**
- [ ] 手機佈局正確
- [ ] 平板佈局正確
- [ ] 桌面佈局正確
- [ ] 觸控目標足夠大（44px+）
- [ ] 文字可讀（最小 14px）

**無障礙性：**
- [ ] 鍵盤可導航
- [ ] Screen reader 友好
- [ ] ARIA 標籤正確
- [ ] 顏色對比度達標（4.5:1）
- [ ] Focus indicator 清晰

**性能：**
- [ ] 圖片優化
- [ ] 程式碼分割
- [ ] 懶加載
- [ ] 首屏載入快
- [ ] 互動流暢

---

## 5. 附錄

### 5.1 設計資源

**參考項目：**
- AI Sales Enablement Platform: https://github.com/laitim2001/ai-sales-enablement-webapp

**設計工具：**
- Figma (設計稿)
- Chrome DevTools (響應式測試)
- Lighthouse (性能測試)
- axe DevTools (無障礙性測試)

**UI 元件庫：**
- Radix UI: https://www.radix-ui.com/
- shadcn/ui: https://ui.shadcn.com/

**顏色工具：**
- HSL Color Picker: https://hslpicker.com/
- Contrast Checker: https://webaim.org/resources/contrastchecker/

### 5.2 命名規範

**檔案命名：**
- 元件：PascalCase (e.g., `Button.tsx`, `ProjectForm.tsx`)
- 工具函數：camelCase (e.g., `utils.ts`, `formatDate.ts`)
- 頁面：kebab-case (e.g., `login/page.tsx`, `projects/page.tsx`)

**CSS Class 命名：**
- 遵循 Tailwind 原生 class
- 自定義 class 使用 kebab-case
- 避免過度自定義，優先使用 Tailwind

**變數命名：**
- 元件 props：camelCase
- State：camelCase
- 常數：UPPER_SNAKE_CASE
- 類型：PascalCase

### 5.3 Git Commit 規範

```
feat: 新增 Dashboard 頁面
fix: 修正 Sidebar 響應式問題
style: 調整卡片陰影和圓角
refactor: 重構 Button 元件
docs: 更新 UI/UX 設計文件
test: 新增 Button 元件測試
```

### 5.4 下一步行動

1. **審查此設計文件** - 團隊討論並確認設計方向
2. **建立設計原型** - 在 Figma 建立關鍵頁面的原型（可選）
3. **開始開發** - 按照實作計劃逐步進行
4. **持續迭代** - 根據使用者回饋不斷優化

---

**文件版本：** 1.0
**最後更新：** 2025-10-03
**維護者：** Development Team
