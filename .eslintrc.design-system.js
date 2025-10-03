/**
 * ESLint 設計系統規則配置
 *
 * 此配置文件用於強制執行設計系統一致性
 * 合併到主要的 .eslintrc.js 中使用
 */

module.exports = {
  rules: {
    // 禁止使用舊的 UI 元件
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/components/ui/Button', '**/components/ui/Button.tsx'],
            message: '❌ 請使用 @/components/ui/button-new 代替舊的 Button 元件',
          },
          {
            group: ['**/components/layout/Sidebar', '**/components/layout/Sidebar.tsx'],
            message: '❌ 請使用 @/components/layout/Sidebar-new 代替舊的 Sidebar 元件',
          },
          {
            group: ['**/components/layout/TopBar', '**/components/layout/TopBar.tsx'],
            message: '❌ 請使用 @/components/layout/TopBar-new 代替舊的 TopBar 元件',
          },
          {
            group: ['**/components/layout/DashboardLayout', '**/components/layout/DashboardLayout.tsx'],
            message: '❌ 請使用 @/components/layout/DashboardLayout-new 代替舊的 DashboardLayout 元件',
          },
        ],
      },
    ],

    // 禁止使用內聯樣式
    'react/forbid-dom-props': [
      'warn',
      {
        forbid: [
          {
            propName: 'style',
            message: '❌ 避免使用內聯樣式，請使用 Tailwind CSS classes',
          },
        ],
      },
    ],

    // 禁止使用 console.log
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],

    // 要求元件使用 displayName
    'react/display-name': 'error',

    // 禁止未使用的變數
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },

  // 設計系統特定的警告
  overrides: [
    {
      // 針對元件檔案
      files: ['**/components/**/*.tsx', '**/components/**/*.ts'],
      rules: {
        // 元件檔案必須匯出
        'import/no-anonymous-default-export': 'error',
      },
    },
    {
      // 針對頁面檔案
      files: ['**/app/**/*.tsx', '**/pages/**/*.tsx'],
      rules: {
        // 頁面必須是預設匯出
        'import/no-default-export': 'off',
      },
    },
  ],
}
