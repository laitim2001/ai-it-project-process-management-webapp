/**
 * @fileoverview Data Import Page - OM 費用資料導入頁面 v1.1
 *
 * @description
 * 提供批量導入 OM 費用資料的介面。支援 Excel (.xlsx) 和 JSON 格式的資料導入，
 * 自動建立不存在的 OpCo 和 Header，並驗證資料唯一性。
 *
 * @page /[locale]/data-import
 *
 * @features
 * - 三步驟流程：上傳 → 預覽確認 → 導入結果
 * - Excel 檔案上傳（客戶端解析）
 * - JSON 資料輸入（貼上或檔案上傳）
 * - 詳細解析統計（總資料、Headers、Items、OpCos）
 * - 問題數據行顯示（行號、問題欄位、原因）
 * - 重複數據行顯示（重複組合識別）
 * - 預覽確認後才執行導入
 *
 * @permissions
 * - Admin/Supervisor: 執行資料導入
 *
 * @version 1.1.0
 * @author IT Department
 * @since FEAT-008 - OM Expense Data Import
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import * as XLSX from 'xlsx';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/trpc';
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Database,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Copy
} from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

// 導入項目介面
interface ImportItem {
  headerName: string;
  headerDescription?: string | null;
  category: string;
  itemName: string;
  itemDescription?: string | null;
  budgetAmount: number;
  opCoName: string;
  endDate?: string | null;
  lastFYActualExpense?: number | null;
}

// 錯誤行資訊
interface ErrorRow {
  rowNumber: number;
  field: string;
  reason: string;
  rawValue: string | null;
}

// 重複行資訊
interface DuplicateRow {
  rowNumber: number;
  headerName: string;
  itemName: string;
  itemDescription: string | null;
  category: string;
  opCoName: string;
  budgetAmount: number;
  duplicateOf: number[];
}

// Header 預覽
interface HeaderPreview {
  name: string;
  category: string;
  description: string | null;
  itemCount: number;
}

// Item 預覽
interface ItemPreview {
  rowNumber: number;
  headerName: string;
  headerDescription: string | null;
  itemName: string;
  itemDescription: string | null;
  opCoName: string;
  budgetAmount: number;
  endDate: string | null;
  lastFYActualExpense: number | null;
  category: string;
}

// 解析結果
interface ParseResult {
  statistics: {
    totalRows: number;
    validItems: number;
    skippedRows: number;
    errorRows: number;
    duplicateRows: number;
    uniqueHeaders: number;
    uniqueOpCos: number;
    uniqueCategories: number;
  };
  headers: HeaderPreview[];
  items: ItemPreview[];
  errorRows: ErrorRow[];
  duplicateRows: DuplicateRow[];
  validData: ImportItem[];
}

// 頁面狀態
type ImportStep = 'upload' | 'preview' | 'result';

// Excel 欄位映射配置
const EXCEL_COLUMN_MAP = {
  headerName: 1,      // Column B
  headerDescription: 2, // Column C
  itemName: 3,        // Column D
  itemDescription: 4, // Column E
  category: 5,        // Column F
  budgetAmount: 6,    // Column G (USD)
  opCoName: 9,        // Column J
  endDate: 12,        // Column M
  lastFYActualExpense: 13, // Column N (if exists)
};

// ============================================================================
// Main Component
// ============================================================================

export default function DataImportPage() {
  const t = useTranslations('dataImport');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  // 狀態
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [financialYear, setFinancialYear] = useState<number>(new Date().getFullYear());
  const [jsonText, setJsonText] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('excel');

  // 展開/收合狀態
  const [showAllHeaders, setShowAllHeaders] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showErrorRows, setShowErrorRows] = useState(true);
  const [showDuplicateRows, setShowDuplicateRows] = useState(true);

  // tRPC mutation
  const importMutation = api.omExpense.importData.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setCurrentStep('result');
        toast({
          title: t('result.success.title'),
          description: `${result.statistics.createdItems} ${t('result.statistics.createdItems')}`,
          variant: 'success',
        });
      } else {
        setCurrentStep('result');
        toast({
          title: t('result.error.title'),
          description: result.error?.message || t('result.error.message'),
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      setCurrentStep('result');
      toast({
        title: t('result.error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 生成財務年度選項（過去 3 年 + 當前年 + 未來 3 年，從新到舊排序）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear + 3 - i);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  // 格式化日期
  const formatDate = (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null;

    // Excel 日期是數字格式
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    // 字串格式
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0];
        return dateStr ?? null;
      }
    }

    return null;
  };

  // 安全轉換為浮點數
  const safeFloat = (value: unknown, defaultValue = 0): number => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseFloat(String(value));
    return isNaN(num) ? defaultValue : num;
  };

  // 安全轉換為字串
  const safeString = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str === '' ? null : str;
  };

  // 格式化金額
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  // 清空所有資料
  const handleClear = useCallback(() => {
    setJsonText('');
    setParseResult(null);
    setParseError(null);
    setUploadedFileName(null);
    setCurrentStep('upload');
    setShowAllHeaders(false);
    setShowAllItems(false);
    importMutation.reset();
  }, [importMutation]);

  // 解析 Excel 檔案
  const parseExcelFile = useCallback((file: File) => {
    setParseError(null);
    setParseResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // 取得第一個工作表
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setParseError(t('errors.noWorksheet'));
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setParseError(t('errors.cantReadWorksheet'));
          return;
        }

        // 轉換為 JSON (陣列格式)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (rows.length < 2) {
          setParseError(t('errors.noDataRows'));
          return;
        }

        const validItems: ImportItem[] = [];
        const itemPreviews: ItemPreview[] = [];
        const errorRows: ErrorRow[] = [];
        const duplicateRows: DuplicateRow[] = [];
        const seenItems = new Map<string, number[]>(); // key -> row numbers
        let skippedRows = 0;

        // 從第二列開始 (跳過標題列)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 1; // Excel 行號從 1 開始，加上標題列

          if (!row || row.length === 0) {
            skippedRows++;
            continue;
          }

          // 檢查是否為空列
          if (row.every(cell => cell === null || cell === undefined || cell === '')) {
            skippedRows++;
            continue;
          }

          const headerName = safeString(row[EXCEL_COLUMN_MAP.headerName]);
          const category = safeString(row[EXCEL_COLUMN_MAP.category]);
          const itemName = safeString(row[EXCEL_COLUMN_MAP.itemName]);
          const opCoName = safeString(row[EXCEL_COLUMN_MAP.opCoName]);
          const headerDescription = safeString(row[EXCEL_COLUMN_MAP.headerDescription]);
          const itemDescription = safeString(row[EXCEL_COLUMN_MAP.itemDescription]);
          const budgetAmount = safeFloat(row[EXCEL_COLUMN_MAP.budgetAmount], 0);

          // CHANGE-010: 增強 Maintenance end date 驗證
          // 1. 檢查是否有數據
          // 2. 如果為空就跳至錯誤狀況
          // 3. 如果有數據但類型錯誤也是錯誤狀況
          const rawEndDate = row[EXCEL_COLUMN_MAP.endDate];
          const endDateIsEmpty = rawEndDate === null || rawEndDate === undefined || rawEndDate === '' ||
            (typeof rawEndDate === 'string' && rawEndDate.trim() === '');

          if (endDateIsEmpty) {
            errorRows.push({
              rowNumber,
              field: 'End Date',
              reason: t('errors.missingEndDate', { row: rowNumber }),
              rawValue: String(rawEndDate ?? ''),
            });
            continue;
          }

          const endDate = formatDate(rawEndDate);
          if (!endDate) {
            errorRows.push({
              rowNumber,
              field: 'End Date',
              reason: t('errors.invalidEndDateFormat', { row: rowNumber, value: String(rawEndDate) }),
              rawValue: String(rawEndDate),
            });
            continue;
          }

          // CHANGE-010: lastFYActualExpense 默認值改為 0 而非 null
          const lastFYActualExpense = row.length > EXCEL_COLUMN_MAP.lastFYActualExpense
            ? safeFloat(row[EXCEL_COLUMN_MAP.lastFYActualExpense], 0)
            : 0;

          // 驗證必填欄位
          if (!headerName) {
            errorRows.push({
              rowNumber,
              field: 'Header Name',
              reason: t('errors.missingHeader', { row: rowNumber }),
              rawValue: safeString(row[EXCEL_COLUMN_MAP.headerName]),
            });
            continue;
          }
          if (!category) {
            errorRows.push({
              rowNumber,
              field: 'Category',
              reason: t('errors.missingCategory', { row: rowNumber }),
              rawValue: safeString(row[EXCEL_COLUMN_MAP.category]),
            });
            continue;
          }
          if (!itemName) {
            errorRows.push({
              rowNumber,
              field: 'Item Name',
              reason: t('errors.missingItemName', { row: rowNumber }),
              rawValue: safeString(row[EXCEL_COLUMN_MAP.itemName]),
            });
            continue;
          }
          if (!opCoName) {
            errorRows.push({
              rowNumber,
              field: 'OpCo Name',
              reason: t('errors.missingOpCo', { row: rowNumber }),
              rawValue: safeString(row[EXCEL_COLUMN_MAP.opCoName]),
            });
            continue;
          }

          // ========== 重複檢測 - 6 欄位完整唯一鍵 ==========
          // 與後端 importData API 使用相同的唯一鍵邏輯：
          // 1. headerName    - OM Expense Header
          // 2. itemName      - OM Expense Item Details
          // 3. itemDescription - OM Expense Item Details Description
          // 4. category      - Expense Category
          // 5. opCoName      - Charge to OpCos
          // 6. budgetAmount  - Budget Amount
          const key = `${headerName}|${itemName}|${itemDescription || ''}|${category}|${opCoName}|${budgetAmount}`;
          const existingRows = seenItems.get(key);
          if (existingRows) {
            duplicateRows.push({
              rowNumber,
              headerName,
              itemName,
              itemDescription,
              category,
              opCoName,
              budgetAmount,
              duplicateOf: [...existingRows],
            });
            existingRows.push(rowNumber);
            continue;
          }
          seenItems.set(key, [rowNumber]);

          // 加入有效資料
          const item: ImportItem = {
            headerName,
            headerDescription,
            category,
            itemName,
            itemDescription,
            budgetAmount,
            opCoName,
            endDate,
            lastFYActualExpense,
          };
          validItems.push(item);

          // 加入預覽
          itemPreviews.push({
            rowNumber,
            headerName,
            headerDescription,
            itemName,
            itemDescription,
            opCoName,
            budgetAmount,
            endDate,
            lastFYActualExpense,
            category,
          });
        }

        if (validItems.length === 0) {
          setParseError(errorRows.length > 0
            ? errorRows.slice(0, 5).map(e => e.reason).join('\n')
            : t('errors.noValidRows')
          );
          return;
        }

        // 計算 Headers 預覽
        const headerMap = new Map<string, HeaderPreview>();
        for (const item of validItems) {
          const existing = headerMap.get(item.headerName);
          if (existing) {
            existing.itemCount++;
          } else {
            headerMap.set(item.headerName, {
              name: item.headerName,
              category: item.category,
              description: item.headerDescription || null,
              itemCount: 1,
            });
          }
        }

        // 計算統計
        const uniqueHeaders = [...new Set(validItems.map(i => i.headerName))];
        const uniqueOpCos = [...new Set(validItems.map(i => i.opCoName))];
        const uniqueCategories = [...new Set(validItems.map(i => i.category))];

        const result: ParseResult = {
          statistics: {
            totalRows: rows.length - 1, // 排除標題列
            validItems: validItems.length,
            skippedRows,
            errorRows: errorRows.length,
            duplicateRows: duplicateRows.length,
            uniqueHeaders: uniqueHeaders.length,
            uniqueOpCos: uniqueOpCos.length,
            uniqueCategories: uniqueCategories.length,
          },
          headers: Array.from(headerMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
          items: itemPreviews,
          errorRows,
          duplicateRows,
          validData: validItems,
        };

        setParseResult(result);
        setUploadedFileName(file.name);
        setCurrentStep('preview');

        toast({
          title: tCommon('messages.success'),
          description: t('messages.parseSuccess', { count: validItems.length }),
          variant: 'success',
        });

      } catch (err) {
        console.error('Excel parsing error:', err);
        setParseError(t('errors.parseError', { error: err instanceof Error ? err.message : 'Unknown' }));
      }
    };

    reader.onerror = () => {
      setParseError(t('errors.readError'));
    };

    reader.readAsArrayBuffer(file);
  }, [t, toast, tCommon]);

  // 解析並驗證 JSON
  const handleValidateJson = useCallback(() => {
    setParseError(null);
    setParseResult(null);

    if (!jsonText.trim()) {
      setParseError(t('validation.emptyData'));
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const items: ImportItem[] = Array.isArray(parsed) ? parsed : [parsed];

      if (items.length === 0) {
        setParseError(t('validation.emptyData'));
        return;
      }

      const validItems: ImportItem[] = [];
      const itemPreviews: ItemPreview[] = [];
      const errorRows: ErrorRow[] = [];
      const duplicateRows: DuplicateRow[] = [];
      const seenItems = new Map<string, number[]>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNumber = i + 1;

        if (!item || !item.headerName) {
          errorRows.push({ rowNumber, field: 'headerName', reason: t('errors.missingHeader', { row: rowNumber }), rawValue: null });
          continue;
        }
        if (!item.category) {
          errorRows.push({ rowNumber, field: 'category', reason: t('errors.missingCategory', { row: rowNumber }), rawValue: null });
          continue;
        }
        if (!item.itemName) {
          errorRows.push({ rowNumber, field: 'itemName', reason: t('errors.missingItemName', { row: rowNumber }), rawValue: null });
          continue;
        }
        if (!item.opCoName) {
          errorRows.push({ rowNumber, field: 'opCoName', reason: t('errors.missingOpCo', { row: rowNumber }), rawValue: null });
          continue;
        }

        // 檢查重複 - 使用完整的唯一鍵：Header Name + Item Name + Item Description + Category + OpCo + Budget Amount
        const key = `${item.headerName}|${item.itemName}|${item.itemDescription || ''}|${item.category}|${item.opCoName}|${item.budgetAmount}`;
        const existingRows = seenItems.get(key);
        if (existingRows) {
          duplicateRows.push({
            rowNumber,
            headerName: item.headerName,
            itemName: item.itemName,
            itemDescription: item.itemDescription || null,
            category: item.category,
            opCoName: item.opCoName,
            budgetAmount: item.budgetAmount,
            duplicateOf: [...existingRows],
          });
          existingRows.push(rowNumber);
          continue;
        }
        seenItems.set(key, [rowNumber]);

        validItems.push(item);
        itemPreviews.push({
          rowNumber,
          headerName: item.headerName,
          headerDescription: item.headerDescription || null,
          itemName: item.itemName,
          itemDescription: item.itemDescription || null,
          opCoName: item.opCoName,
          budgetAmount: item.budgetAmount || 0,
          endDate: item.endDate || null,
          lastFYActualExpense: item.lastFYActualExpense || null,
          category: item.category,
        });
      }

      if (validItems.length === 0) {
        setParseError(t('errors.noValidRows'));
        return;
      }

      // 計算 Headers 預覽
      const headerMap = new Map<string, HeaderPreview>();
      for (const item of validItems) {
        const existing = headerMap.get(item.headerName);
        if (existing) {
          existing.itemCount++;
        } else {
          headerMap.set(item.headerName, {
            name: item.headerName,
            category: item.category,
            description: item.headerDescription || null,
            itemCount: 1,
          });
        }
      }

      const uniqueHeaders = [...new Set(validItems.map(i => i.headerName))];
      const uniqueOpCos = [...new Set(validItems.map(i => i.opCoName))];
      const uniqueCategories = [...new Set(validItems.map(i => i.category))];

      const result: ParseResult = {
        statistics: {
          totalRows: items.length,
          validItems: validItems.length,
          skippedRows: 0,
          errorRows: errorRows.length,
          duplicateRows: duplicateRows.length,
          uniqueHeaders: uniqueHeaders.length,
          uniqueOpCos: uniqueOpCos.length,
          uniqueCategories: uniqueCategories.length,
        },
        headers: Array.from(headerMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        items: itemPreviews,
        errorRows,
        duplicateRows,
        validData: validItems,
      };

      setParseResult(result);
      setCurrentStep('preview');

      toast({
        title: tCommon('messages.success'),
        description: t('messages.parseSuccess', { count: validItems.length }),
        variant: 'success',
      });
    } catch {
      setParseError(t('validation.invalidJson'));
    }
  }, [jsonText, t, toast, tCommon]);

  // 執行導入
  const handleImport = useCallback(() => {
    if (!parseResult || parseResult.validData.length === 0) {
      toast({
        title: t('result.error.title'),
        description: t('validation.emptyData'),
        variant: 'destructive',
      });
      return;
    }

    importMutation.mutate({
      financialYear,
      items: parseResult.validData.map(item => ({
        headerName: item.headerName,
        headerDescription: item.headerDescription,
        category: item.category,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        budgetAmount: item.budgetAmount || 0,
        opCoName: item.opCoName,
        endDate: item.endDate,
        lastFYActualExpense: item.lastFYActualExpense,
      })),
    });
  }, [parseResult, financialYear, importMutation, toast, t]);

  // 處理 Excel 檔案上傳
  const handleExcelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseError(t('errors.invalidExcelFormat'));
      return;
    }

    parseExcelFile(file);
    event.target.value = '';
  }, [parseExcelFile, t]);

  // 處理 JSON 檔案上傳
  const handleJsonFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      setParseResult(null);
      setParseError(null);
      setUploadedFileName(file.name);
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  // 拖放處理
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      parseExcelFile(file);
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonText(e.target?.result as string);
        setUploadedFileName(file.name);
      };
      reader.readAsText(file);
    } else {
      setParseError(t('errors.invalidFileFormat'));
    }
  }, [parseExcelFile, t]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // 顯示的 Items 數量
  const displayedItems = useMemo(() => {
    if (!parseResult) return [];
    return showAllItems ? parseResult.items : parseResult.items.slice(0, 10);
  }, [parseResult, showAllItems]);

  // 顯示的 Headers 數量
  const displayedHeaders = useMemo(() => {
    if (!parseResult) return [];
    return showAllHeaders ? parseResult.headers : parseResult.headers.slice(0, 10);
  }, [parseResult, showAllHeaders]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Upload className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* 步驟指示器 */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span>{t('steps.upload')}</span>
          </div>
          <div className="w-12 h-0.5 bg-muted" />
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span>{t('steps.preview')}</span>
          </div>
          <div className="w-12 h-0.5 bg-muted" />
          <div className={`flex items-center gap-2 ${currentStep === 'result' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'result' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span>{t('steps.result')}</span>
          </div>
        </div>

        {/* Step 1: 上傳 */}
        {currentStep === 'upload' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 導入設定卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  {t('form.title')}
                </CardTitle>
                <CardDescription>
                  {t('form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 財務年度選擇 */}
                <div className="space-y-2">
                  <Label htmlFor="financialYear">{t('form.financialYear.label')}</Label>
                  <NativeSelect
                    id="financialYear"
                    value={financialYear.toString()}
                    onChange={(e) => setFinancialYear(parseInt(e.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        FY{year}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {/* 上傳方式切換 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="excel" className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {t('tabs.excel')}
                    </TabsTrigger>
                    <TabsTrigger value="json" className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      {t('tabs.json')}
                    </TabsTrigger>
                  </TabsList>

                  {/* Excel 上傳 */}
                  <TabsContent value="excel" className="space-y-4">
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => document.getElementById('excelFile')?.click()}
                    >
                      <input
                        type="file"
                        id="excelFile"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{t('form.excel.dropzone')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('form.excel.supportedFormats')}</p>
                      {uploadedFileName && activeTab === 'excel' && (
                        <p className="text-sm text-primary mt-2">{t('form.excel.selected', { filename: uploadedFileName })}</p>
                      )}
                    </div>
                  </TabsContent>

                  {/* JSON 輸入 */}
                  <TabsContent value="json" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="jsonText">{t('form.jsonText.label')}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById('jsonFile')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {t('actions.uploadJson')}
                        </Button>
                      </div>
                      <input
                        type="file"
                        id="jsonFile"
                        accept=".json"
                        onChange={handleJsonFileUpload}
                        className="hidden"
                      />
                      <Textarea
                        id="jsonText"
                        value={jsonText}
                        onChange={(e) => {
                          setJsonText(e.target.value);
                          setParseResult(null);
                          setParseError(null);
                        }}
                        placeholder={t('form.jsonText.placeholder')}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateJson}
                      disabled={!jsonText.trim()}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('actions.validate')}
                    </Button>
                  </TabsContent>
                </Tabs>

                {/* 錯誤提示 */}
                {parseError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>{t('result.error.title')}</AlertTitle>
                    <AlertDescription className="whitespace-pre-line">{parseError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Excel 格式說明 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('excelFormat.title')}</CardTitle>
                <CardDescription>{t('excelFormat.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left font-medium">{t('excelFormat.columns.field')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('excelFormat.columns.excelColumn')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('excelFormat.columns.description')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('excelFormat.columns.required')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.headerName')}</td><td className="py-2 px-4 font-mono">B</td><td className="py-2 px-4">{t('excelFormat.desc.headerName')}</td><td className="py-2 px-4 text-red-500">{t('excelFormat.required.yes')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.headerDesc')}</td><td className="py-2 px-4 font-mono">C</td><td className="py-2 px-4">{t('excelFormat.desc.headerDesc')}</td><td className="py-2 px-4">{t('excelFormat.required.no')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.itemName')}</td><td className="py-2 px-4 font-mono">D</td><td className="py-2 px-4">{t('excelFormat.desc.itemName')}</td><td className="py-2 px-4 text-red-500">{t('excelFormat.required.yes')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.itemDesc')}</td><td className="py-2 px-4 font-mono">E</td><td className="py-2 px-4">{t('excelFormat.desc.itemDesc')}</td><td className="py-2 px-4">{t('excelFormat.required.no')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.category')}</td><td className="py-2 px-4 font-mono">F</td><td className="py-2 px-4">{t('excelFormat.desc.category')}</td><td className="py-2 px-4 text-red-500">{t('excelFormat.required.yes')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.budgetAmount')}</td><td className="py-2 px-4 font-mono">G</td><td className="py-2 px-4">{t('excelFormat.desc.budgetAmount')}</td><td className="py-2 px-4">{t('excelFormat.required.default0')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.opCoName')}</td><td className="py-2 px-4 font-mono">J</td><td className="py-2 px-4">{t('excelFormat.desc.opCoName')}</td><td className="py-2 px-4 text-red-500">{t('excelFormat.required.yes')}</td></tr>
                      <tr className="border-b"><td className="py-2 px-4">{t('excelFormat.fields.endDate')}</td><td className="py-2 px-4 font-mono">M</td><td className="py-2 px-4">{t('excelFormat.desc.endDate')}</td><td className="py-2 px-4">{t('excelFormat.required.no')}</td></tr>
                      <tr><td className="py-2 px-4">{t('excelFormat.fields.lastFYActual')}</td><td className="py-2 px-4 font-mono">N</td><td className="py-2 px-4">{t('excelFormat.desc.lastFYActual')}</td><td className="py-2 px-4">{t('excelFormat.required.no')}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">{t('excelFormat.notes.title')}</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>{t('excelFormat.notes.skipHeader')}</li>
                    <li>{t('excelFormat.notes.removeDuplicates')}</li>
                    <li>{t('excelFormat.notes.skipEmpty')}</li>
                    <li>{t('excelFormat.notes.autoCreateOpCo')}</li>
                    <li>{t('excelFormat.notes.autoCreateHeader')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: 預覽確認 */}
        {currentStep === 'preview' && parseResult && (
          <div className="space-y-6">
            {/* 統計摘要 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  {t('statistics.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">{parseResult.statistics.totalRows}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.totalRows')}</div>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{parseResult.statistics.validItems}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.validItems')}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">{parseResult.statistics.skippedRows}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.skippedRows')}</div>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{parseResult.statistics.errorRows}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.errorRows')}</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{parseResult.statistics.duplicateRows}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.duplicateRows')}</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{parseResult.statistics.uniqueHeaders}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.uniqueHeaders')}</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{parseResult.statistics.uniqueOpCos}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.uniqueOpCos')}</div>
                  </div>
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{parseResult.statistics.uniqueCategories}</div>
                    <div className="text-sm text-muted-foreground">{t('statistics.uniqueCategories')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 問題數據行 */}
            {parseResult.errorRows.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowErrorRows(!showErrorRows)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      {t('errorRows.title')} ({parseResult.errorRows.length})
                    </span>
                    {showErrorRows ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showErrorRows && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-2 px-4 text-left font-medium">{t('errorRows.rowNumber')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('errorRows.field')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('errorRows.reason')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('errorRows.rawValue')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.errorRows.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-4 font-mono">{row.rowNumber}</td>
                              <td className="py-2 px-4">{row.field}</td>
                              <td className="py-2 px-4 text-red-600">{row.reason}</td>
                              <td className="py-2 px-4 text-muted-foreground">{row.rawValue || t('errorRows.empty')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* 重複數據行 */}
            {parseResult.duplicateRows.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowDuplicateRows(!showDuplicateRows)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-yellow-600">
                      <Copy className="h-5 w-5" />
                      {t('duplicateRows.title')} ({parseResult.duplicateRows.length})
                    </span>
                    {showDuplicateRows ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showDuplicateRows && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.rowNumber')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.headerName')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.itemName')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.itemDescription')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.category')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.opCoName')}</th>
                            <th className="py-2 px-4 text-right font-medium">{t('duplicateRows.budgetAmount')}</th>
                            <th className="py-2 px-4 text-left font-medium">{t('duplicateRows.duplicateOf')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.duplicateRows.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-4 font-mono">{row.rowNumber}</td>
                              <td className="py-2 px-4">{row.headerName}</td>
                              <td className="py-2 px-4">{row.itemName}</td>
                              <td className="py-2 px-4 text-muted-foreground truncate max-w-xs">{row.itemDescription || '-'}</td>
                              <td className="py-2 px-4">{row.category}</td>
                              <td className="py-2 px-4">{row.opCoName}</td>
                              <td className="py-2 px-4 text-right font-mono">{row.budgetAmount.toLocaleString()}</td>
                              <td className="py-2 px-4 font-mono text-yellow-600">{row.duplicateOf.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Headers 預覽 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t('headersPreview.title')} ({parseResult.headers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-2 px-4 text-left font-medium">{t('headersPreview.name')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('headersPreview.category')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('headersPreview.description')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('headersPreview.itemCount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedHeaders.map((header, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{header.name}</td>
                          <td className="py-2 px-4">{header.category}</td>
                          <td className="py-2 px-4 text-muted-foreground truncate max-w-xs">{header.description || '-'}</td>
                          <td className="py-2 px-4 font-mono">{header.itemCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parseResult.headers.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAllHeaders(!showAllHeaders)}
                  >
                    {showAllHeaders
                      ? t('headersPreview.collapse')
                      : t('headersPreview.showAll', { count: parseResult.headers.length })
                    }
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Items 預覽 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('itemsPreview.title')} ({parseResult.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-2 px-4 text-left font-medium">#</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.headerName')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.headerDescription')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.itemName')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.itemDescription')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.opCoName')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.category')}</th>
                        <th className="py-2 px-4 text-right font-medium">{t('itemsPreview.budgetAmount')}</th>
                        <th className="py-2 px-4 text-left font-medium">{t('itemsPreview.endDate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedItems.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-mono text-muted-foreground">{item.rowNumber}</td>
                          <td className="py-2 px-4">{item.headerName}</td>
                          <td className="py-2 px-4 text-muted-foreground truncate max-w-xs">{item.headerDescription || '-'}</td>
                          <td className="py-2 px-4">{item.itemName}</td>
                          <td className="py-2 px-4 text-muted-foreground truncate max-w-xs">{item.itemDescription || '-'}</td>
                          <td className="py-2 px-4">{item.opCoName}</td>
                          <td className="py-2 px-4">{item.category}</td>
                          <td className="py-2 px-4 text-right font-mono">{formatAmount(item.budgetAmount)}</td>
                          <td className="py-2 px-4 text-muted-foreground">{item.endDate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parseResult.items.length > 10 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      {t('itemsPreview.showing', { current: displayedItems.length, total: parseResult.items.length })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllItems(!showAllItems)}
                    >
                      {showAllItems ? t('itemsPreview.showLess') : t('itemsPreview.loadMore')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleClear}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('actions.reupload')}
              </Button>
              <Button
                size="lg"
                onClick={handleImport}
                disabled={importMutation.isPending || parseResult.validData.length === 0}
              >
                {importMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                {importMutation.isPending
                  ? t('actions.importing')
                  : t('actions.confirmImport', { count: parseResult.validData.length })
                }
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 結果 */}
        {currentStep === 'result' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {importMutation.isSuccess && importMutation.data?.success && (
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                    {t('result.success.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{t('result.success.message')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">{importMutation.data.statistics.createdOpCos}</div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.createdOpCos')}</div>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${
                      (importMutation.data.statistics.createdCategories ?? 0) > 0
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-muted'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        (importMutation.data.statistics.createdCategories ?? 0) > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }`}>
                        {importMutation.data.statistics.createdCategories ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.createdCategories')}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">{importMutation.data.statistics.createdHeaders}</div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.createdHeaders')}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{importMutation.data.statistics.createdItems}</div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.createdItems')}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">{importMutation.data.statistics.createdMonthlyRecords}</div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.createdMonthlyRecords')}</div>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${
                      (importMutation.data.statistics.skippedDuplicates ?? 0) > 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-muted'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        (importMutation.data.statistics.skippedDuplicates ?? 0) > 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : ''
                      }`}>
                        {importMutation.data.statistics.skippedDuplicates ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('result.statistics.skippedDuplicates')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {importMutation.isSuccess && !importMutation.data?.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('result.error.title')}</AlertTitle>
                <AlertDescription>
                  {importMutation.data?.error?.message}
                  {importMutation.data?.error?.duplicateItem && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded">
                      <div className="font-medium">{t('result.duplicate.title')}</div>
                      <div className="text-sm mt-1">
                        <div>{t('result.duplicate.headerName')}: {importMutation.data.error.duplicateItem.headerName}</div>
                        <div>{t('result.duplicate.itemName')}: {importMutation.data.error.duplicateItem.itemName}</div>
                        <div>{t('result.duplicate.opCoName')}: {importMutation.data.error.duplicateItem.opCoName}</div>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {importMutation.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('result.error.title')}</AlertTitle>
                <AlertDescription>{importMutation.error.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleClear}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('actions.importAnother')}
              </Button>
              <Button asChild>
                <Link href="/om-expenses">
                  <Eye className="mr-2 h-4 w-4" />
                  {t('actions.viewOMExpenses')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
