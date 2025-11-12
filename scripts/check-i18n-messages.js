#!/usr/bin/env node

/**
 * I18N Messages Completeness Checker
 *
 * 檢查所有表單組件使用的 messages keys 是否在翻譯文件中存在
 */

const fs = require('fs');
const path = require('path');

// 讀取翻譯文件
const enPath = path.join(__dirname, '../apps/web/src/messages/en.json');
const zhTWPath = path.join(__dirname, '../apps/web/src/messages/zh-TW.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zhTWData = JSON.parse(fs.readFileSync(zhTWPath, 'utf8'));

// 定義需要檢查的組件和它們使用的 namespace
const componentsToCheck = [
  {
    file: 'apps/web/src/components/vendor/VendorForm.tsx',
    namespace: 'vendors',
    requiredKeys: ['messages.createSuccess', 'messages.updateSuccess', 'messages.deleteSuccess']
  },
  {
    file: 'apps/web/src/components/expense/ExpenseForm.tsx',
    namespace: 'expenses',
    requiredKeys: ['messages.createSuccess', 'messages.updateSuccess', 'messages.deleteSuccess']
  },
  {
    file: 'apps/web/src/components/budget-pool/BudgetPoolForm.tsx',
    namespace: 'budgetPools',
    requiredKeys: ['messages.createSuccess', 'messages.updateSuccess', 'messages.deleteSuccess']
  },
  {
    file: 'apps/web/src/components/proposal/BudgetProposalForm.tsx',
    namespace: 'proposals',
    requiredKeys: ['messages.createSuccess', 'messages.updateSuccess', 'messages.deleteSuccess']
  },
  {
    file: 'apps/web/src/components/charge-out/ChargeOutForm.tsx',
    namespace: 'chargeOuts',
    requiredKeys: ['form.messages.createSuccess', 'form.messages.updateSuccess']
  }
];

// 輔助函數：檢查嵌套的 key 是否存在
function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

// 執行檢查
console.log('\n═══════════════════════════════════════════════════');
console.log('   I18N Messages Completeness Checker');
console.log('═══════════════════════════════════════════════════\n');

let totalIssues = 0;
const missingKeys = { en: [], zhTW: [] };

componentsToCheck.forEach(component => {
  console.log(`\n📄 ${component.file}`);
  console.log(`   Namespace: ${component.namespace}\n`);

  let componentHasIssues = false;

  component.requiredKeys.forEach(key => {
    const fullKey = `${component.namespace}.${key}`;
    const enHasKey = hasNestedKey(enData, fullKey);
    const zhTWHasKey = hasNestedKey(zhTWData, fullKey);

    if (!enHasKey) {
      console.log(`   ❌ [EN] Missing: ${fullKey}`);
      missingKeys.en.push(fullKey);
      componentHasIssues = true;
      totalIssues++;
    }

    if (!zhTWHasKey) {
      console.log(`   ❌ [zh-TW] Missing: ${fullKey}`);
      missingKeys.zhTW.push(fullKey);
      componentHasIssues = true;
      totalIssues++;
    }

    if (enHasKey && zhTWHasKey) {
      console.log(`   ✅ ${fullKey}`);
    }
  });

  if (!componentHasIssues) {
    console.log('   ✅ All required keys present');
  }
});

// 總結
console.log('\n═══════════════════════════════════════════════════');
if (totalIssues === 0) {
  console.log('✅ All components have complete message keys!');
} else {
  console.log(`⚠️  Found ${totalIssues} missing keys`);
  console.log('\nMissing Keys Summary:');

  if (missingKeys.en.length > 0) {
    console.log('\n📝 EN (en.json):');
    missingKeys.en.forEach(key => console.log(`   - ${key}`));
  }

  if (missingKeys.zhTW.length > 0) {
    console.log('\n📝 ZH-TW (zh-TW.json):');
    missingKeys.zhTW.forEach(key => console.log(`   - ${key}`));
  }
}
console.log('═══════════════════════════════════════════════════\n');

process.exit(totalIssues > 0 ? 1 : 0);
