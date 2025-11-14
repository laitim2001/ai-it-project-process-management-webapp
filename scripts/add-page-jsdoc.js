#!/usr/bin/env node
/**
 * Batch add JSDoc annotations to page components
 *
 * This script automatically adds standardized JSDoc comments to all page.tsx files
 * that don't already have @page annotation.
 */

const fs = require('fs');
const path = require('path');

// Page type definitions with their JSDoc templates
const PAGE_TEMPLATES = {
  // Vendors pages
  'vendors/page.tsx': {
    fileoverview: 'Vendors List Page - 供應商列表頁面',
    description: `顯示所有供應商的列表，支援即時搜尋、排序和分頁功能。
Project Manager 可查看和管理供應商資訊，用於後續的報價和採購流程。
整合 tRPC 查詢和 React Query 進行資料快取和即時更新。`,
    page: '/[locale]/vendors',
    features: [
      '供應商列表展示（卡片視圖）',
      '即時搜尋（供應商名稱、聯絡人、電郵）',
      '排序功能（名稱、建立日期）',
      '分頁導航（每頁 10/20/50 項）',
      '快速操作（查看詳情、編輯、刪除）',
      '供應商資訊卡片（名稱、聯絡人、電話、電郵）',
      '角色權限控制（RBAC）'
    ],
    permissions: [
      'ProjectManager: 查看和管理供應商',
      'Supervisor: 完整權限',
      'Admin: 完整權限'
    ],
    routing: [
      '列表頁: /vendors',
      '建立頁: /vendors/new',
      '詳情頁: /vendors/[id]',
      '編輯頁: /vendors/[id]/edit'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'vendors/new/page.tsx': {
    fileoverview: 'New Vendor Page - 建立供應商頁面',
    description: `提供建立新供應商的表單頁面，支援完整的供應商資訊輸入。
使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。`,
    page: '/[locale]/vendors/new',
    features: [
      '完整的供應商建立表單（名稱、聯絡人、電話、電郵、地址）',
      '即時表單驗證（Zod schema）',
      '電郵格式驗證',
      '電話號碼格式驗證',
      '錯誤處理和成功提示（Toast）'
    ],
    permissions: [
      'ProjectManager: 可建立供應商',
      'Supervisor: 完整權限',
      'Admin: 完整權限'
    ],
    routing: [
      '建立頁: /vendors/new',
      '成功後導向: /vendors/[id] (新建立的供應商詳情頁)',
      '取消後返回: /vendors (供應商列表頁)'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'vendors/[id]/page.tsx': {
    fileoverview: 'Vendor Detail Page - 供應商詳情頁面',
    description: `顯示單一供應商的完整資訊，包含基本資料和相關的報價、採購單記錄。
提供編輯和刪除操作，支援查看供應商的交易歷史。`,
    page: '/[locale]/vendors/[id]',
    features: [
      '供應商詳情展示（名稱、聯絡人、電話、電郵、地址）',
      '相關報價列表（該供應商的所有報價）',
      '相關採購單列表（該供應商的所有採購單）',
      '編輯操作按鈕',
      '刪除操作（檢查是否有相關記錄）',
      '麵包屑導航'
    ],
    permissions: [
      'ProjectManager: 查看供應商詳情',
      'Supervisor: 完整權限',
      'Admin: 完整權限'
    ],
    routing: [
      '詳情頁: /vendors/[id]',
      '編輯頁: /vendors/[id]/edit',
      '返回列表: /vendors'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'vendors/[id]/edit/page.tsx': {
    fileoverview: 'Edit Vendor Page - 編輯供應商頁面',
    description: `提供編輯現有供應商的表單頁面，支援修改供應商資訊。
使用 React Hook Form 進行表單驗證，預填充現有資料。`,
    page: '/[locale]/vendors/[id]/edit',
    features: [
      '完整的供應商編輯表單（預填充現有資料）',
      '即時表單驗證（Zod schema）',
      '電郵和電話格式驗證',
      '錯誤處理（權限錯誤、網路錯誤）'
    ],
    permissions: [
      'ProjectManager: 可編輯供應商',
      'Supervisor: 完整權限',
      'Admin: 完整權限'
    ],
    routing: [
      '編輯頁: /vendors/[id]/edit',
      '成功後導向: /vendors/[id] (供應商詳情頁)',
      '取消後返回: /vendors/[id] (供應商詳情頁)'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  // Purchase Orders pages
  'purchase-orders/page.tsx': {
    fileoverview: 'Purchase Orders List Page - 採購單列表頁面',
    description: `顯示所有採購單的列表，支援即時搜尋、多條件過濾和分頁功能。
Project Manager 可查看自己專案的採購單，Supervisor 可查看所有採購單。
整合專案、供應商和報價資訊，提供完整的採購管理功能。`,
    page: '/[locale]/purchase-orders',
    features: [
      '採購單列表展示（表格視圖）',
      '即時搜尋（採購單號、描述）',
      '專案過濾（根據所屬專案篩選）',
      '供應商過濾（根據供應商篩選）',
      '排序功能（金額、日期）',
      '分頁導航（每頁 10/20/50 項）',
      '快速操作（查看詳情、編輯）',
      '角色權限控制（RBAC）'
    ],
    permissions: [
      'ProjectManager: 查看自己專案的採購單',
      'Supervisor: 查看所有採購單',
      'Admin: 完整權限'
    ],
    routing: [
      '列表頁: /purchase-orders',
      '建立頁: /purchase-orders/new',
      '詳情頁: /purchase-orders/[id]',
      '編輯頁: /purchase-orders/[id]/edit'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'purchase-orders/new/page.tsx': {
    fileoverview: 'New Purchase Order Page - 建立採購單頁面',
    description: `提供建立新採購單的表單頁面，支援專案、供應商、報價選擇和金額輸入。
使用 React Hook Form 進行表單驗證，整合報價資訊自動填充金額。`,
    page: '/[locale]/purchase-orders/new',
    features: [
      '完整的採購單建立表單（專案、供應商、報價、金額、日期）',
      '專案選擇（Combobox 組件）',
      '供應商選擇（Combobox 組件）',
      '報價選擇（根據選定的專案和供應商載入）',
      '自動填充金額（從報價資料）',
      '即時表單驗證（Zod schema）',
      '錯誤處理和成功提示（Toast）'
    ],
    permissions: [
      'ProjectManager: 可建立自己專案的採購單',
      'Supervisor: 可建立任意專案的採購單',
      'Admin: 完整權限'
    ],
    routing: [
      '建立頁: /purchase-orders/new',
      '成功後導向: /purchase-orders/[id] (新建立的採購單詳情頁)',
      '取消後返回: /purchase-orders (採購單列表頁)'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'purchase-orders/[id]/page.tsx': {
    fileoverview: 'Purchase Order Detail Page - 採購單詳情頁面',
    description: `顯示單一採購單的完整資訊，包含專案、供應商、報價和相關費用記錄。
提供編輯操作和查看關聯的費用記錄，支援完整的採購追蹤。`,
    page: '/[locale]/purchase-orders/[id]',
    features: [
      '採購單詳情展示（採購單號、日期、金額）',
      '專案資訊展示（專案名稱、預算池）',
      '供應商資訊展示（供應商名稱、聯絡資訊）',
      '報價資訊展示（報價金額、檔案下載）',
      '相關費用記錄列表（該採購單的所有費用）',
      '編輯操作按鈕',
      '麵包屑導航'
    ],
    permissions: [
      'ProjectManager: 查看自己專案的採購單詳情',
      'Supervisor: 查看所有採購單詳情',
      'Admin: 完整權限'
    ],
    routing: [
      '詳情頁: /purchase-orders/[id]',
      '編輯頁: /purchase-orders/[id]/edit',
      '返回列表: /purchase-orders'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  'purchase-orders/[id]/edit/page.tsx': {
    fileoverview: 'Edit Purchase Order Page - 編輯採購單頁面',
    description: `提供編輯現有採購單的表單頁面，支援修改採購單資訊。
使用 React Hook Form 進行表單驗證，預填充現有資料。`,
    page: '/[locale]/purchase-orders/[id]/edit',
    features: [
      '完整的採購單編輯表單（預填充現有資料）',
      '修改金額、日期、說明',
      '即時表單驗證（Zod schema）',
      '錯誤處理（權限錯誤、網路錯誤）'
    ],
    permissions: [
      'ProjectManager: 可編輯自己專案的採購單',
      'Supervisor: 可編輯任意專案的採購單',
      'Admin: 完整權限'
    ],
    routing: [
      '編輯頁: /purchase-orders/[id]/edit',
      '成功後導向: /purchase-orders/[id] (採購單詳情頁)',
      '取消後返回: /purchase-orders/[id] (採購單詳情頁)'
    ],
    epic: 'Epic 5 - Procurement & Vendor Management'
  },

  // OM Expenses pages
  'om-expenses/page.tsx': {
    fileoverview: 'O&M Expenses List Page - 維運費用列表頁面',
    description: `顯示所有維運（O&M）費用的列表，支援即時搜尋、狀態過濾和分頁功能。
維運費用用於記錄非專案的日常營運費用，支援獨立的審批流程。
整合預算類別和審批工作流，提供完整的維運費用管理功能。`,
    page: '/[locale]/om-expenses',
    features: [
      '維運費用列表展示（卡片視圖）',
      '即時搜尋（費用描述、發票號）',
      '狀態過濾（Draft, Submitted, Approved, Paid）',
      '排序功能（金額、日期、狀態）',
      '分頁導航（每頁 10/20/50 項）',
      '快速操作（查看詳情、編輯、提交、審批）',
      '狀態徽章顯示（不同顏色標示不同狀態）',
      '角色權限控制（RBAC）'
    ],
    permissions: [
      'ProjectManager: 查看和建立維運費用',
      'Supervisor: 查看所有維運費用，審批 Submitted 費用',
      'Admin: 完整權限'
    ],
    routing: [
      '列表頁: /om-expenses',
      '建立頁: /om-expenses/new',
      '詳情頁: /om-expenses/[id]',
      '編輯頁: /om-expenses/[id]/edit'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'om-expenses/new/page.tsx': {
    fileoverview: 'New O&M Expense Page - 建立維運費用頁面',
    description: `提供建立新維運費用的表單頁面，支援預算類別選擇、金額輸入和發票上傳。
使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。`,
    page: '/[locale]/om-expenses/new',
    features: [
      '完整的維運費用建立表單（預算類別、金額、描述、發票）',
      '預算類別選擇（Combobox 組件）',
      '金額輸入（自動格式化，貨幣符號）',
      '發票資訊輸入（發票號、日期）',
      '發票檔案上傳（PDF/圖片，Azure Blob Storage）',
      '即時表單驗證（Zod schema）',
      '錯誤處理和成功提示（Toast）'
    ],
    permissions: [
      'ProjectManager: 可建立維運費用',
      'Supervisor: 完整權限',
      'Admin: 完整權限'
    ],
    routing: [
      '建立頁: /om-expenses/new',
      '成功後導向: /om-expenses/[id] (新建立的維運費用詳情頁)',
      '取消後返回: /om-expenses (維運費用列表頁)'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'om-expenses/[id]/page.tsx': {
    fileoverview: 'O&M Expense Detail Page - 維運費用詳情頁面',
    description: `顯示單一維運費用的完整資訊，包含預算類別、金額、發票和審批狀態。
提供審批工作流操作，Supervisor 可在此頁面進行審批操作。`,
    page: '/[locale]/om-expenses/[id]',
    features: [
      '維運費用詳情展示（預算類別、金額、發票號、日期）',
      '發票檔案預覽和下載（Azure Blob Storage）',
      '審批工作流（提交、審批、拒絕）',
      '狀態徽章顯示（Draft, Submitted, Approved, Paid）',
      '審批歷史記錄（狀態變更軌跡）',
      '編輯操作（僅 Draft 狀態可編輯）',
      '權限控制（根據角色和費用狀態控制操作權限）',
      '麵包屑導航'
    ],
    permissions: [
      'ProjectManager: 查看和編輯自己的維運費用',
      'Supervisor: 查看所有維運費用，審批 Submitted 費用',
      'Admin: 完整權限'
    ],
    routing: [
      '詳情頁: /om-expenses/[id]',
      '編輯頁: /om-expenses/[id]/edit',
      '返回列表: /om-expenses'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'om-expenses/[id]/edit/page.tsx': {
    fileoverview: 'Edit O&M Expense Page - 編輯維運費用頁面',
    description: `提供編輯現有維運費用的表單頁面，支援修改費用資訊。
僅允許編輯 Draft 狀態的維運費用，使用 React Hook Form 進行表單驗證。`,
    page: '/[locale]/om-expenses/[id]/edit',
    features: [
      '完整的維運費用編輯表單（預填充現有資料）',
      '修改預算類別、金額、描述、發票',
      '狀態檢查（僅允許編輯 Draft 費用）',
      '即時表單驗證（Zod schema）',
      '錯誤處理（權限錯誤、狀態錯誤、網路錯誤）'
    ],
    permissions: [
      'ProjectManager: 可編輯自己的 Draft 維運費用',
      'Supervisor: 可編輯任意 Draft 維運費用',
      'Admin: 完整權限',
      '限制: 僅 Draft 狀態的費用可編輯'
    ],
    routing: [
      '編輯頁: /om-expenses/[id]/edit',
      '成功後導向: /om-expenses/[id] (維運費用詳情頁)',
      '取消後返回: /om-expenses/[id] (維運費用詳情頁)'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  // Charge Outs pages
  'charge-outs/page.tsx': {
    fileoverview: 'Charge Outs List Page - 費用轉嫁列表頁面',
    description: `顯示所有費用轉嫁記錄的列表，支援即時搜尋、狀態過濾和分頁功能。
費用轉嫁用於將專案費用分攤到不同的成本中心或部門。
整合專案和預算類別資訊，提供完整的費用轉嫁管理功能。`,
    page: '/[locale]/charge-outs',
    features: [
      '費用轉嫁列表展示（卡片視圖）',
      '即時搜尋（轉嫁描述、成本中心）',
      '狀態過濾（Draft, Submitted, Approved, Completed）',
      '專案過濾（根據所屬專案篩選）',
      '排序功能（金額、日期、狀態）',
      '分頁導航（每頁 10/20/50 項）',
      '快速操作（查看詳情、編輯、提交、審批）',
      '狀態徽章顯示（不同顏色標示不同狀態）',
      '角色權限控制（RBAC）'
    ],
    permissions: [
      'ProjectManager: 查看和建立自己專案的費用轉嫁',
      'Supervisor: 查看所有費用轉嫁，審批 Submitted 轉嫁',
      'Admin: 完整權限'
    ],
    routing: [
      '列表頁: /charge-outs',
      '建立頁: /charge-outs/new',
      '詳情頁: /charge-outs/[id]',
      '編輯頁: /charge-outs/[id]/edit'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'charge-outs/new/page.tsx': {
    fileoverview: 'New Charge Out Page - 建立費用轉嫁頁面',
    description: `提供建立新費用轉嫁的表單頁面，支援專案選擇、預算類別選擇和成本中心輸入。
使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。`,
    page: '/[locale]/charge-outs/new',
    features: [
      '完整的費用轉嫁建立表單（專案、預算類別、成本中心、金額、描述）',
      '專案選擇（Combobox 組件）',
      '預算類別選擇（從專案預算池載入）',
      '成本中心輸入（目標部門/成本中心代碼）',
      '金額輸入（自動格式化，貨幣符號）',
      '即時表單驗證（Zod schema）',
      '錯誤處理和成功提示（Toast）'
    ],
    permissions: [
      'ProjectManager: 可建立自己專案的費用轉嫁',
      'Supervisor: 可建立任意專案的費用轉嫁',
      'Admin: 完整權限'
    ],
    routing: [
      '建立頁: /charge-outs/new',
      '成功後導向: /charge-outs/[id] (新建立的費用轉嫁詳情頁)',
      '取消後返回: /charge-outs (費用轉嫁列表頁)'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'charge-outs/[id]/page.tsx': {
    fileoverview: 'Charge Out Detail Page - 費用轉嫁詳情頁面',
    description: `顯示單一費用轉嫁的完整資訊，包含專案、預算類別、成本中心和審批狀態。
提供審批工作流操作，Supervisor 可在此頁面進行審批操作。`,
    page: '/[locale]/charge-outs/[id]',
    features: [
      '費用轉嫁詳情展示（專案、預算類別、成本中心、金額、日期）',
      '專案資訊展示（專案名稱、預算池）',
      '預算類別資訊展示（類別名稱、預算）',
      '審批工作流（提交、審批、拒絕）',
      '狀態徽章顯示（Draft, Submitted, Approved, Completed）',
      '審批歷史記錄（狀態變更軌跡）',
      '編輯操作（僅 Draft 狀態可編輯）',
      '權限控制（根據角色和轉嫁狀態控制操作權限）',
      '麵包屑導航'
    ],
    permissions: [
      'ProjectManager: 查看和編輯自己專案的費用轉嫁',
      'Supervisor: 查看所有費用轉嫁，審批 Submitted 轉嫁',
      'Admin: 完整權限'
    ],
    routing: [
      '詳情頁: /charge-outs/[id]',
      '編輯頁: /charge-outs/[id]/edit',
      '返回列表: /charge-outs'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  },

  'charge-outs/[id]/edit/page.tsx': {
    fileoverview: 'Edit Charge Out Page - 編輯費用轉嫁頁面',
    description: `提供編輯現有費用轉嫁的表單頁面，支援修改轉嫁資訊。
僅允許編輯 Draft 狀態的費用轉嫁，使用 React Hook Form 進行表單驗證。`,
    page: '/[locale]/charge-outs/[id]/edit',
    features: [
      '完整的費用轉嫁編輯表單（預填充現有資料）',
      '修改預算類別、成本中心、金額、描述',
      '狀態檢查（僅允許編輯 Draft 轉嫁）',
      '即時表單驗證（Zod schema）',
      '錯誤處理（權限錯誤、狀態錯誤、網路錯誤）'
    ],
    permissions: [
      'ProjectManager: 可編輯自己專案的 Draft 費用轉嫁',
      'Supervisor: 可編輯任意專案的 Draft 費用轉嫁',
      'Admin: 完整權限',
      '限制: 僅 Draft 狀態的轉嫁可編輯'
    ],
    routing: [
      '編輯頁: /charge-outs/[id]/edit',
      '成功後導向: /charge-outs/[id] (費用轉嫁詳情頁)',
      '取消後返回: /charge-outs/[id] (費用轉嫁詳情頁)'
    ],
    epic: 'Epic 6 - Expense Recording & Financial Integration'
  }
};

// Generate JSDoc comment from template
function generateJSDoc(template) {
  const parts = [
    '/**',
    ` * @fileoverview ${template.fileoverview}`,
    ' *',
    ' * @description',
  ];

  // Add description lines
  template.description.trim().split('\n').forEach(line => {
    parts.push(` * ${line.trim()}`);
  });

  parts.push(' *');
  parts.push(` * @page ${template.page}`);
  parts.push(' *');
  parts.push(' * @features');

  // Add features
  template.features.forEach(feature => {
    parts.push(` * - ${feature}`);
  });

  // Add permissions if exists
  if (template.permissions && template.permissions.length > 0) {
    parts.push(' *');
    parts.push(' * @permissions');
    template.permissions.forEach(perm => {
      parts.push(` * - ${perm}`);
    });
  }

  // Add routing if exists
  if (template.routing && template.routing.length > 0) {
    parts.push(' *');
    parts.push(' * @routing');
    template.routing.forEach(route => {
      parts.push(` * - ${route}`);
    });
  }

  parts.push(' *');
  parts.push(' * @dependencies');
  parts.push(' * - next-intl: 國際化支援');
  parts.push(' * - @tanstack/react-query: tRPC 查詢和快取');
  parts.push(' * - shadcn/ui: UI 組件庫');
  parts.push(' *');
  parts.push(' * @author IT Department');
  parts.push(` * @since ${template.epic}`);
  parts.push(' * @lastModified 2025-11-14');
  parts.push(' */');

  return parts.join('\n');
}

// Process a single file
function processFile(filePath, template) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if already has @page annotation
  if (content.includes('@page')) {
    console.log(`⏭️  Skipped (already has JSDoc): ${filePath}`);
    return false;
  }

  const jsdoc = generateJSDoc(template);

  // Remove existing comment if it's at the start
  let newContent = content;

  // Remove old JSDoc-style comments at the beginning
  newContent = newContent.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');

  // Add new JSDoc at the beginning
  newContent = jsdoc + '\n\n' + newContent;

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Updated: ${filePath}`);
  return true;
}

// Main execution
function main() {
  const baseDir = path.join(__dirname, '../apps/web/src/app/[locale]');
  let updatedCount = 0;
  let skippedCount = 0;

  console.log('🚀 Starting batch JSDoc addition...\n');

  for (const [relativePath, template] of Object.entries(PAGE_TEMPLATES)) {
    const filePath = path.join(baseDir, relativePath);

    if (fs.existsSync(filePath)) {
      const updated = processFile(filePath, template);
      if (updated) {
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${relativePath}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updatedCount} files`);
  console.log(`   Skipped: ${skippedCount} files`);
  console.log(`   Total: ${updatedCount + skippedCount} files processed`);
}

main();
