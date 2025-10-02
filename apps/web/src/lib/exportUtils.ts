/**
 * Utility functions for exporting data to CSV/Excel formats
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
