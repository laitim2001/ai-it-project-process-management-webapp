# Scripts Rules - 開發工具腳本規範

---
applies_to:
  - "scripts/**"
---

## 概述
此規則適用於所有開發、維護和自動化腳本。

## 腳本分類

### 環境與設置
```
check-environment.js     # 環境配置檢查 (pnpm check:env)
create-test-users.ts     # 創建測試用戶
api-health-check.ts      # API 健康檢查
test-db-connection.js    # 資料庫連接測試
```

### 索引維護
```
check-index-sync.js      # 索引同步檢查 (pnpm index:check)
```

### 國際化
```
validate-i18n.js         # i18n 驗證 (pnpm validate:i18n)
analyze-i18n-scope.js    # 分析 i18n 範圍
check-i18n-messages.js   # 檢查 i18n 訊息完整性
```

### 代碼修復
```
fix-breadcrumb-routing.js    # 修復麵包屑路由
fix-import-semicolons.js     # 修復 import 分號
add-missing-link-import.js   # 添加缺失的 Link import
```

## 命名規則

```
[動詞]-[對象]-[修飾詞].js
```

| 動詞前綴 | 用途 | 範例 |
|----------|------|------|
| `check-` | 檢查/驗證 | `check-environment.js` |
| `fix-` | 修復問題 | `fix-breadcrumb-routing.js` |
| `add-` | 添加內容 | `add-missing-link-import.js` |
| `generate-` | 生成內容 | `generate-en-translations.js` |
| `validate-` | 驗證內容 | `validate-i18n.js` |
| `test-` | 測試功能 | `test-db-connection.js` |
| `run-` | 執行操作 | `run-migration-feat-002.js` |

## 腳本結構模板

```javascript
#!/usr/bin/env node
/**
 * @fileoverview [Script Name] - [功能描述]
 * @usage pnpm [command] 或 node scripts/[script-name].js [args]
 * @example node scripts/check-environment.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  // ... 其他配置
};

// ============================================================
// 主函數
// ============================================================
async function main() {
  console.log('📋 Starting [script name]...\n');

  try {
    // 執行邏輯
    await runChecks();

    console.log('\n✅ All checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// ============================================================
// 輔助函數
// ============================================================
async function runChecks() {
  // 實現檢查邏輯
}

// ============================================================
// 執行
// ============================================================
main();
```

## 輸出格式約定

### 狀態標記
```javascript
console.log('✅ Check passed');           // 成功
console.log('❌ Error found');            // 錯誤
console.log('⚠️ Warning');                // 警告
console.log('📋 Info');                   // 資訊
console.log('🔍 Checking...');            // 進行中
console.log('📂 Processing files...');    // 處理中
```

### 結構化輸出
```javascript
// 檢查項目
console.log('\n📋 Environment Checks:');
console.log('  ├── Node.js version: ✅ v20.11.0');
console.log('  ├── pnpm version: ✅ 8.15.3');
console.log('  └── Docker: ✅ Running');

// 統計摘要
console.log('\n📊 Summary:');
console.log(`  Total: ${total}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
```

## 錯誤處理

```javascript
// ✅ 使用 try-catch
try {
  await riskyOperation();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

// ✅ 驗證必要條件
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ✅ 提供有用的錯誤訊息
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  console.error('   Please check your .env file');
  process.exit(1);
}
```

## 命令行參數處理

```javascript
// 簡單參數
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const isDryRun = args.includes('--dry-run');

// 帶值參數
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;

// 使用說明
if (args.includes('--help')) {
  console.log(`
Usage: node scripts/my-script.js [options]

Options:
  --verbose     Show detailed output
  --dry-run     Run without making changes
  --limit=N     Limit items to process (default: 10)
  --help        Show this help message
  `);
  process.exit(0);
}
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

# 直接執行腳本
node scripts/api-health-check.ts
npx ts-node scripts/create-test-users.ts
```

## 檢查清單

### 新增腳本
- [ ] 使用正確的命名格式
- [ ] 添加 JSDoc 文檔
- [ ] 實現錯誤處理
- [ ] 使用標準輸出格式
- [ ] 添加 `--help` 支援
- [ ] 更新 package.json scripts（如需要）

### 代碼規範
- [ ] 使用 async/await 處理非同步
- [ ] 使用絕對路徑
- [ ] 不硬編碼路徑
- [ ] 適當的 exit code（0=成功，1=失敗）

## 禁止事項

1. ❌ **禁止硬編碼絕對路徑**
2. ❌ **禁止忽略錯誤**
3. ❌ **禁止使用 `console.log` 輸出重要錯誤**（使用 `console.error`）
4. ❌ **禁止修改生產資料**（除非明確標示）

## 相關規則
- `typescript.md` - TypeScript 約定（.ts 腳本）
