# 國際化 (i18n) 翻譯系統分析

> **分析日期**: 2026-04-09
> **框架**: next-intl (整合 Next.js App Router)
> **支援語言**: English (`en`) / 繁體中文 (`zh-TW`)
> **預設語言**: `zh-TW`

---

## 目錄

- [1. 系統架構概覽](#1-系統架構概覽)
- [2. 翻譯文件結構分析](#2-翻譯文件結構分析)
- [3. 命名空間詳細分析](#3-命名空間詳細分析)
- [4. i18n 配置文件](#4-i18n-配置文件)
- [5. 驗證工具分析](#5-驗證工具分析)
- [6. 相關腳本清單](#6-相關腳本清單)
- [7. 結構健康度評估](#7-結構健康度評估)

---

## 1. 系統架構概覽

### 核心組件

```
apps/web/
├── next.config.mjs              # next-intl plugin 整合入口
├── src/
│   ├── middleware.ts             # NextAuth + next-intl 中介層整合
│   ├── i18n/
│   │   ├── routing.ts           # 路由配置：locales, defaultLocale, localePrefix
│   │   └── request.ts           # 請求處理：動態載入翻譯 JSON
│   └── messages/
│       ├── en.json              # 英文翻譯 (133,430 bytes, 3,884 行)
│       ├── zh-TW.json           # 繁體中文翻譯 (127,908 bytes, 3,884 行)
│       ├── en.json.backup       # 英文翻譯備份 (舊版, 28,255 bytes)
│       ├── en-template.json     # 翻譯模板 (39 行, auth 基礎結構)
│       └── index.ts             # TypeScript 類型定義導出
scripts/
├── validate-i18n.js             # 翻譯驗證工具 (293 行)
├── analyze-i18n-scope.js        # 硬編碼中文掃描 (349 行)
├── check-i18n-messages.js       # 組件 key 完整性檢查 (126 行)
├── generate-en-translations.js  # 自動生成英文翻譯 (221 行)
├── i18n-migration-helper.js     # 遷移輔助工具 (242 行)
├── i18n-migrate-all.sh          # 批量遷移腳本 (207 行)
└── add-login-errors.js          # 添加登入錯誤翻譯 (131 行)
```

### 請求流程

```
Request
  → NextAuth auth() 認證檢查
  → next-intl createMiddleware(routing) 語言路由處理
  → getRequestConfig() 動態載入翻譯 JSON
  → Page/Component 使用 useTranslations() / getTranslations()
```

### URL 策略

- **模式**: `localePrefix: 'always'`
- **繁體中文**: `/zh-TW/projects`、`/zh-TW/dashboard`
- **英文**: `/en/projects`、`/en/dashboard`
- **根路徑** `/` 自動重定向到 `/zh-TW`

---

## 2. 翻譯文件結構分析

### 基本統計

| 指標 | en.json | zh-TW.json |
|------|---------|------------|
| 檔案大小 | 133,430 bytes | 127,908 bytes |
| 總行數 | 3,884 | 3,884 |
| 頂層命名空間 | 29 | 29 |
| 葉節點 key 數量 | 2,640 | 2,640 |
| 結構一致性 | -- | 完全一致 |

### 頂層命名空間一覽（29 個）

兩個翻譯文件具有完全相同的頂層結構，以下按葉節點 key 數量降序排列：

| # | 命名空間 | 葉節點 key 數 | 用途說明 |
|---|----------|--------------|----------|
| 1 | `projects` | 268 | 專案管理：列表、表單、詳情、狀態、刪除對話框 |
| 2 | `omExpenses` | 229 | OM 維運費用：CRUD、明細項目、月度記錄、審批 |
| 3 | `dataImport` | 194 | 數據導入（FEAT-008）：Excel 解析、預覽、批量導入 |
| 4 | `proposals` | 178 | 預算提案：表單、審批流程、評論、歷史記錄 |
| 5 | `expenses` | 177 | 費用管理：CRUD、發票、審批、預算關聯 |
| 6 | `purchaseOrders` | 169 | 採購單：CRUD、供應商關聯、報價、明細 |
| 7 | `chargeOuts` | 153 | 費用轉嫁：CRUD、OpCo 分攤、審批 |
| 8 | `budgetPools` | 150 | 預算池：CRUD、類別管理、使用率追蹤 |
| 9 | `users` | 121 | 用戶管理：列表、表單、角色、密碼設定 |
| 10 | `quotes` | 110 | 報價管理：列表、上傳、比較 |
| 11 | `common` | 105 | 通用：操作按鈕、狀態、排序、表格、錯誤訊息 |
| 12 | `vendors` | 78 | 供應商管理：CRUD、聯絡資訊 |
| 13 | `settings` | 77 | 用戶設定頁：個人資料、密碼、偏好 |
| 14 | `navigation` | 64 | 側邊欄導航：所有模組連結、分組標籤 |
| 15 | `auth` | 64 | 認證：登入、註冊、忘記密碼、錯誤訊息 |
| 16 | `omSummary` | 64 | OM 費用摘要報表：表格、篩選、統計 |
| 17 | `projectDataImport` | 56 | 專案數據導入（FEAT-010） |
| 18 | `dashboard` | 50 | Dashboard 通用：卡片、圖表、統計 |
| 19 | `omExpenseCategories` | 48 | OM 費用類別管理 |
| 20 | `dashboardPM` | 44 | PM Dashboard：專案經理專屬視圖 |
| 21 | `operatingCompanies` | 43 | 營運公司管理：CRUD、代碼 |
| 22 | `currencies` | 42 | 貨幣管理：CRUD、匯率 |
| 23 | `dashboardSupervisor` | 39 | Supervisor Dashboard：主管專屬視圖 |
| 24 | `projectSummary` | 30 | 專案摘要：狀態統計、預算概覽 |
| 25 | `notifications` | 29 | 通知中心：列表、未讀、操作 |
| 26 | `toast` | 24 | Toast 通知訊息：成功、錯誤、警告模板 |
| 27 | `validation` | 15 | 表單驗證訊息：必填、格式、範圍 |
| 28 | `loading` | 10 | 載入狀態文字（FEAT-012） |
| 29 | `errors` | 9 | 全域錯誤頁面：404、500、通用錯誤 |

---

## 3. 命名空間詳細分析

### 3.1 `common` 命名空間（105 keys）

通用翻譯，被所有頁面共享：

```
common
├── actions (21 keys)        # 操作按鈕：view, edit, save, delete, create, search...
├── sort (4 keys)            # 排序：createdAtDesc, createdAtAsc...
├── fields (7 keys)          # 通用欄位：createdAt, updatedAt, amount, status...
├── table (1 key)            # 表格操作
├── form (2 keys)            # 通用表單欄位：description, currency
├── status (14 keys)         # 狀態標籤：draft, pending, approved, rejected...
├── nav (1 key)              # 導航：dashboard
├── loading, saving, submitting, processing (單一值)
├── error, success, noData, noResults (單一值)
├── selectPlaceholder, searchPlaceholder (單一值)
├── required, optional (單一值)
├── pagination (4 keys)      # 分頁
├── dialogs.delete (3 keys)  # 刪除確認對話框
├── currency (1 key)         # 貨幣符號前綴
└── ...其他
```

### 3.2 業務命名空間結構模式

所有業務模組（projects, proposals, expenses 等）遵循一致的結構：

```
[module]
├── pageTitle                 # 列表頁標題
├── createTitle               # 新增頁標題
├── editTitle                 # 編輯頁標題
├── detailTitle               # 詳情頁標題
├── list                      # 列表相關
│   ├── title
│   ├── empty / loading / searchPlaceholder
│   └── statusFilter
├── form                      # 表單欄位
│   ├── [field].label
│   ├── [field].placeholder
│   └── [field].error
├── detail                    # 詳情頁欄位標籤
├── dialogs                   # 對話框
│   ├── delete.title / description / confirmButton
│   └── submit.title / description
├── messages                  # 操作結果訊息
│   ├── createSuccess / createError
│   ├── updateSuccess / updateError
│   └── deleteSuccess / deleteError
├── status                    # 狀態標籤（特定於該模組）
└── table                     # 表格欄位標題
```

### 3.3 `auth` 命名空間（64 keys）

```
auth
├── login                     # 登入頁面
│   ├── title, subtitle, email, password...
│   └── errors                # 13 組錯誤訊息（由 add-login-errors.js 添加）
├── register                  # 註冊頁面
│   └── title, subtitle, name, email, password, confirmPassword...
└── forgotPassword            # 忘記密碼頁面
    └── title, subtitle, email, sendResetLink...
```

---

## 4. i18n 配置文件

### 4.1 `routing.ts`（路由配置）

**路徑**: `apps/web/src/i18n/routing.ts` (94 行)

```typescript
export const routing = defineRouting({
  locales: ['en', 'zh-TW'],
  defaultLocale: 'zh-TW',
  localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- 定義支援的語言列表和預設語言
- 創建類型安全的導航輔助函數（Link、redirect、useRouter 等）
- `localePrefix: 'always'` 確保所有 URL 都帶有語言前綴

### 4.2 `request.ts`（請求配置）

**路徑**: `apps/web/src/i18n/request.ts` (71 行)

```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

- 從請求中獲取語言設定
- 無效語言時降級為 `zh-TW`
- 動態 import 對應的翻譯 JSON 文件

### 4.3 `index.ts`（類型定義）

**路徑**: `apps/web/src/messages/index.ts` (56 行)

```typescript
export type Messages = typeof import('./zh-TW.json');
```

- 基於 `zh-TW.json` 生成 TypeScript 類型
- 為 `useTranslations()` 提供自動補全和類型檢查

### 4.4 `next.config.mjs`（Next.js 配置）

```javascript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl(nextConfig);
```

- 使用 `next-intl/plugin` 包裝 Next.js 配置
- 指向 `request.ts` 作為 i18n 請求配置入口

### 4.5 `middleware.ts`（中介層）

**路徑**: `apps/web/src/middleware.ts`

整合 NextAuth 認證 + next-intl 國際化：

```typescript
const handleI18nRouting = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // 1. 認證檢查（FIX-095: 手動處理重定向）
  // 2. next-intl 路由處理
  return handleI18nRouting(req);
});
```

### 4.6 `en-template.json`（模板文件）

**路徑**: `apps/web/src/messages/en-template.json` (39 行)

僅包含 `auth` 命名空間的基礎結構（login、register、forgotPassword），作為翻譯模板參考。

---

## 5. 驗證工具分析

### `validate-i18n.js`（293 行）

**執行方式**: `pnpm validate:i18n`

驗證四大項目：

| 驗證項 | 方法 | 說明 |
|--------|------|------|
| JSON 語法 | `JSON.parse()` | 確保文件可正確解析 |
| 重複鍵偵測 | 逐行正則解析 + 層級追蹤 | 偵測同路徑下的重複 key（JSON.parse 會靜默覆蓋） |
| 空值檢查 | 遞迴遍歷 | 偵測空字串、null、undefined 值 |
| 跨語言一致性 | Set 比較 | 比較 en.json 和 zh-TW.json 的所有葉節點 key 路徑 |

**重複鍵偵測算法**：
- 逐行讀取 JSON 文件
- 使用正則 `/^\s*"([^"]+)"\s*:/` 提取 key
- 根據縮排計算層級，構建完整路徑
- 使用 Map 追蹤每個 key 首次出現的行號
- 發現同路徑重複 key 時報告兩個行號

**退出碼**：
- `0`: 全部通過或僅有警告
- `1`: 存在嚴重錯誤（JSON 語法錯誤或重複鍵）

---

## 6. 相關腳本清單

| 腳本 | 行數 | 用途 |
|------|------|------|
| `validate-i18n.js` | 293 | 核心驗證工具（JSON 語法、重複鍵、空值、跨語言一致性） |
| `analyze-i18n-scope.js` | 349 | 掃描 TSX 文件中的硬編碼中文字串，評估遷移工作量 |
| `check-i18n-messages.js` | 126 | 檢查組件使用的 i18n key 是否在翻譯文件中存在 |
| `generate-en-translations.js` | 221 | 讀取 zh-TW.json 透過對照表自動生成 en.json |
| `i18n-migration-helper.js` | 242 | 針對單一文件掃描硬編碼中文，生成遷移建議 |
| `i18n-migrate-all.sh` | 207 | 批量自動遷移所有剩餘檔案到 next-intl |
| `add-login-errors.js` | 131 | 為兩個語言文件添加 auth.login.errors 翻譯鍵 |

---

## 7. 結構健康度評估

### 正面發現

1. **完美的結構一致性**: en.json 和 zh-TW.json 具有完全相同的 29 個頂層命名空間和 2,640 個葉節點 key，無遺漏或多餘
2. **行數完全一致**: 兩個文件均為 3,884 行，表明格式化一致
3. **一致的命名模式**: 所有業務模組遵循統一的 `pageTitle/list/form/detail/dialogs/messages` 結構
4. **完善的驗證工具鏈**: 有 `validate-i18n.js` 提供自動化驗證，包含重複鍵偵測（這是 JSON 的常見陷阱）
5. **TypeScript 類型安全**: 透過 `index.ts` 導出 Messages 類型，為 `useTranslations()` 提供編譯時檢查
6. **豐富的遷移工具**: 7 個 i18n 相關腳本，反映了從硬編碼到 i18n 的完整遷移歷程

### 潛在關注點

1. **文件體積偏大**: en.json 為 133KB、3,884 行，對於需要在客戶端載入的場景可能影響初始加載性能（但 next-intl 的動態 import 和按語言載入已有效緩解）
2. **巢狀深度**: 部分 key 路徑較深（如 `projects.form.budgetCategories.requestedAmount.label`），在使用 `useTranslations()` 時需要注意 namespace 層級的選擇
3. **`en-template.json` 和 `en.json.backup` 為歷史遺留文件**: 不再被程式碼引用，可考慮清理
4. **`common` 命名空間結構略顯扁平**: 部分單一值 key（loading、saving、error 等）與巢狀物件（actions、status）混用，但不影響功能
5. **大量一次性遷移腳本**: `fix-duplicate-imports.py`、`add-missing-link-import.js`、`remove-locale-prefix.js` 等屬於遷移期間的工具，遷移完成後可考慮歸檔

### 命名空間分佈視覺化

```
projects         ████████████████████████████████████ 268
omExpenses       █████████████████████████████████  229
dataImport       ████████████████████████████  194
proposals        █████████████████████████  178
expenses         █████████████████████████  177
purchaseOrders   ████████████████████████  169
chargeOuts       █████████████████████  153
budgetPools      █████████████████████  150
users            █████████████████  121
quotes           ███████████████  110
common           ██████████████  105
vendors          ███████████  78
settings         ██████████  77
navigation       █████████  64
auth             █████████  64
omSummary        █████████  64
projectDataImport ████████  56
dashboard        ███████  50
omExpenseCateg.  ██████  48
dashboardPM      ██████  44
operatingComp.   ██████  43
currencies       █████  42
dashboardSuper.  █████  39
projectSummary   ████  30
notifications    ████  29
toast            ███  24
validation       ██  15
loading          █  10
errors           █  9
                 ─────────────────────────────────────
                 總計: 2,640 個翻譯 key
```
