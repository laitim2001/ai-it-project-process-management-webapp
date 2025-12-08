# Scripts - 開發工具腳本目錄

## 目錄用途
此目錄包含所有開發、維護和自動化腳本，用於提升開發效率和代碼質量。

## 腳本分類

### 環境與設置 (Environment & Setup)
```
check-environment.js     # 環境配置檢查 (pnpm check:env)
create-test-users.ts     # 創建測試用戶
check-test-users.ts      # 檢查測試用戶
api-health-check.ts      # API 健康檢查
```

### 索引維護 (Index Maintenance)
```
check-index-sync.js      # 索引同步檢查 (pnpm index:check)
```

### 國際化 (i18n)
```
analyze-i18n-scope.js    # 分析 i18n 範圍
check-i18n-messages.js   # 檢查 i18n 訊息完整性
generate-en-translations.js    # 生成英文翻譯
i18n-migration-helper.js       # i18n 遷移輔助
validate-i18n.js               # i18n 驗證 (pnpm validate:i18n)
```

### 代碼修復 (Code Fixes)
```
add-login-errors.js           # 添加登入錯誤處理
add-missing-link-import.js    # 添加缺失的 Link import
add-page-jsdoc.js             # 添加頁面 JSDoc
check-duplicate-imports.js    # 檢查重複 imports
fix-breadcrumb-routing.js     # 修復麵包屑路由
fix-import-semicolons.js      # 修復 import 分號
```

## 常用命令

```bash
# 環境檢查
pnpm check:env

# 索引維護
pnpm index:check              # 基本同步檢查
pnpm index:check:incremental  # 增量檢查
pnpm index:health             # 完整健康檢查

# i18n 驗證
pnpm validate:i18n

# API 健康檢查
pnpm ts-node scripts/api-health-check.ts
```

## 腳本開發約定

### 命名規則
- 使用 kebab-case：`check-environment.js`
- 動詞開頭：`check-*`, `fix-*`, `add-*`, `generate-*`, `validate-*`

### 輸出格式
```javascript
// 使用 emoji 標記狀態
console.log('✅ Check passed');
console.log('❌ Error found');
console.log('⚠️ Warning');
console.log('📋 Info');
```

### 錯誤處理
```javascript
try {
  // 執行邏輯
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
```

## 相關文件
- `package.json` - 腳本命令定義
- `DEVELOPMENT-SETUP.md` - 環境設置指南
- `INDEX-MAINTENANCE-GUIDE.md` - 索引維護指南
