/**
 * @fileoverview Export Utilities - 資料匯出工具函數庫
 *
 * @description
 * 提供資料匯出為 CSV 格式的工具函數，支援預算池、專案等實體的資料匯出。
 * 處理 CSV 特殊字元轉義、檔案下載和檔名生成等功能。
 *
 * @module lib/exportUtils
 *
 * @functions
 * - convertToCSV(): 將資料陣列轉換為 CSV 格式字串
 * - escapeCSV(): 轉義 CSV 特殊字元（逗號、雙引號、換行）
 * - downloadCSV(): 觸發瀏覽器下載 CSV 檔案
 * - generateExportFilename(): 產生帶時間戳的檔名
 *
 * @features
 * - CSV 標準格式支援（RFC 4180）
 * - 特殊字元自動轉義（逗號、雙引號、換行符）
 * - UTF-8 編碼支援（中文相容）
 * - 瀏覽器相容性（使用 Blob API）
 * - 時間戳檔名（避免檔名衝突）
 *
 * @example
 * ```typescript
 * import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';
 *
 * // 匯出預算池資料
 * function BudgetPoolList() {
 *   const { data } = api.budgetPool.getAll.useQuery();
 *
 *   const handleExport = () => {
 *     const csv = convertToCSV(data);
 *     const filename = generateExportFilename('budget-pools');
 *     downloadCSV(csv, filename);
 *     // 下載檔案: budget-pools_2025-11-14_10-30-45.csv
 *   };
 * }
 *
 * // 自訂資料匯出
 * const customData = [
 *   { id: '1', name: '預算池A', totalAmount: 100000, createdAt: new Date(), _count: { projects: 5 } },
 *   { id: '2', name: '預算池B', totalAmount: 200000, createdAt: new Date(), _count: { projects: 3 } }
 * ];
 * const csv = convertToCSV(customData);
 * downloadCSV(csv, 'export.csv');
 * ```
 *
 * @dependencies
 * - 無（純 JavaScript 實現）
 *
 * @related
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池匯出功能
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案匯出功能
 * - packages/api/src/routers/budgetPool.ts - 預算池資料來源
 *
 * @author IT Department
 * @since Epic 7 - Dashboard & Basic Reporting
 * @lastModified 2025-11-14
 *
 * @notes
 * - CSV 格式符合 RFC 4180 標準
 * - 支援跨瀏覽器下載（Chrome, Firefox, Safari, Edge）
 * - 大型資料集（>10000 筆）可能需要分批處理以避免記憶體問題
 * - 未來可擴展支援 Excel (XLSX) 格式（使用 xlsx 庫）
 */

/**
 * 預算池匯出資料介面
 *
 * @interface BudgetPoolExportData
 * @property {string} id - 預算池 ID
 * @property {string} name - 預算池名稱
 * @property {number} financialYear - 財年
 * @property {number} totalAmount - 總預算金額
 * @property {Date} createdAt - 建立日期
 * @property {{projects: number}} _count - 關聯專案數量
 */
export interface BudgetPoolExportData {
  id: string;
  name: string;
  financialYear: number;
  totalAmount: number;
  createdAt: Date;
  _count: {
    projects: number;
  };
}

/**
 * Convert budget pool data to CSV format
 */
export function convertToCSV(data: BudgetPoolExportData[]): string {
  if (data.length === 0) {
    return '';
  }

  // CSV Headers
  const headers = [
    'Name',
    'Financial Year',
    'Total Budget',
    'Number of Projects',
    'Created Date',
  ];

  // CSV Rows
  const rows = data.map((pool) => [
    escapeCSV(pool.name),
    pool.financialYear.toString(),
    pool.totalAmount.toString(),
    pool._count.projects.toString(),
    new Date(pool.createdAt).toLocaleDateString(),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escape special characters in CSV fields
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(prefix: string = 'budget-pools'): string {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${prefix}_${dateString}_${timeString}.csv`;
}
