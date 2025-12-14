'use client';

/**
 * @fileoverview Project Data Import Page
 * @page /[locale]/project-data-import
 * @feature FEAT-010
 * @description
 * 提供 Excel 格式的專案批量導入功能
 * 支援 100+ 筆專案記錄的批量導入
 *
 * @features
 * - Excel 檔案上傳與解析 (xlsx/xls)
 * - 即時預覽與驗證
 * - 重複檢測 (依 projectCode)
 * - 錯誤報告 (行號、欄位、原因)
 * - 批量導入執行
 *
 * @workflow
 * 1. 上傳 - Excel 檔案上傳
 * 2. 預覽確認 - 檢視解析結果、錯誤行、重複行
 * 3. 導入結果 - 顯示成功/失敗統計
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ============================================================
// 類型定義
// ============================================================

interface ParsedProject {
  rowNumber: number;
  fiscalYear: number | null;
  projectCategory: string | null;
  name: string;
  description: string | null;
  expenseType: string | null;
  budgetCategoryName: string | null;
  projectCode: string;
  globalFlag: string | null;
  probability: string | null; // "High" | "Medium" | "Low"
  priority: string | null; // "High" | "Medium" | "Low"
  team: string | null;
  personInCharge: string | null;
  currencyCode: string | null;
  isCdoReviewRequired: boolean;
  isManagerConfirmed: boolean;
  payForWhat: string | null;
  payToWhom: string | null;
  requestedBudget: number | null;
  isOngoing: boolean;
  lastFYActualExpense: number | null;
  // 新增欄位 (v2 模版)
  isChargeBackToOpco: boolean;
  chargeOutOpCos: string | null; // OpCo 代碼列表，用逗號分隔
  chargeOutMethod: string | null;
}

interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  value?: string;
}

interface DuplicateInfo {
  rowNumber: number;
  projectCode: string;
  existingProjectName: string;
  existingFiscalYear: number | null;
  isUpdate: boolean;
}

interface ParseResult {
  validProjects: ParsedProject[];
  errors: ValidationError[];
  duplicates: DuplicateInfo[];
  totalRows: number;
}

interface ImportResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    projectCode: string;
    message: string;
  }>;
  // CHANGE-013: 添加警告（無效 OpCo 代碼等）
  warnings?: Array<{
    row: number;
    projectCode: string;
    message: string;
  }>;
}

type ImportStep = 'upload' | 'preview' | 'result';

// ============================================================
// Excel 欄位映射
// ============================================================

const EXCEL_COLUMN_MAP: Record<string, string> = {
  fiscalYear: 'Fiscal Year',
  projectCategory: 'Project Category',
  name: 'Project Name',
  description: 'Project Description',
  expenseType: 'Expense Type',
  budgetCategoryName: 'Bugget Category', // Note: typo in template
  projectCode: 'Project Code',
  globalFlag: 'Global Flag',
  probability: 'Probability',
  priority: 'Priority',
  team: 'Team',
  personInCharge: 'PIC',
  currencyCode: 'Currency',
  isCdoReviewRequired: 'Is CDO review required',
  isManagerConfirmed: 'Is Manager Confirmed',
  payForWhat: 'Pay for what',
  payToWhom: 'Pay to whom',
  requestedBudget: 'Total Amount (USD)',
  isOngoing: 'Is Ongoing',
  lastFYActualExpense: 'Last FY Actual Expense',
  // 新增欄位 (v2 模版)
  isChargeBackToOpco: 'Is Charge Back to Opco',
  chargeOutOpCos: 'Charge Out OpCos',
  chargeOutMethod: 'Charge out Method',
};

// 必填欄位
const REQUIRED_FIELDS = ['name', 'projectCode'];

// ============================================================
// 輔助函數
// ============================================================

/**
 * 解析 Excel 日期 (序列號或字串)
 */
function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;

  // 如果是數字 (Excel 日期序列號)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }

  // 如果是字串
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // 如果已經是 Date 對象
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  return null;
}

/**
 * 解析布林值
 */
function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1' || lower === 'y';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * 解析數字
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$%]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * 解析整數
 */
function parseInt(value: unknown): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num);
}

/**
 * 清理字串
 */
function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

/**
 * 解析 Probability 欄位 (支援數字或字串 high/medium/low)
 * 返回標準化的字串 "High" | "Medium" | "Low" 或 null
 */
function parseProbability(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  // 如果是字串，檢查是否為 high/medium/low
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'high' || lower === 'h') return 'High';
    if (lower === 'medium' || lower === 'med' || lower === 'm') return 'Medium';
    if (lower === 'low' || lower === 'l') return 'Low';

    // 嘗試解析為數字
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num >= 80) return 'High';
      if (num <= 30) return 'Low';
      return 'Medium';
    }
    return null;
  }

  // 如果是數字
  if (typeof value === 'number') {
    if (value >= 80) return 'High';
    if (value <= 30) return 'Low';
    return 'Medium';
  }

  return null;
}

/**
 * 解析 Priority 欄位 (支援字串 high/medium/low)
 * 返回標準化的字串 "High" | "Medium" | "Low" 或 null
 */
function parsePriority(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'high' || lower === 'h') return 'High';
    if (lower === 'medium' || lower === 'med' || lower === 'm') return 'Medium';
    if (lower === 'low' || lower === 'l') return 'Low';
  }

  return null;
}

/**
 * CHANGE-013: 解析 Charge Out OpCos 欄位
 * 支援逗號分隔的 OpCo 代碼格式（如 "RAP,RAPO,RHK"）
 *
 * @returns 解析結果包含：
 *   - value: 清理後的字串（null 表示空值）
 *   - isValid: 格式是否有效
 *   - error: 錯誤訊息（格式無效時）
 */
interface ChargeOutOpCosParseResult {
  value: string | null;
  isValid: boolean;
  error?: string;
}

function parseChargeOutOpCos(value: unknown): ChargeOutOpCosParseResult {
  // 空值處理
  if (value === null || value === undefined || value === '') {
    return { value: null, isValid: true };
  }

  const strValue = String(value).trim();

  // NA / N/A 視為空值
  if (strValue.toUpperCase() === 'NA' || strValue.toUpperCase() === 'N/A') {
    return { value: null, isValid: true };
  }

  // 檢查是否使用了錯誤的分隔符（分號）
  if (strValue.includes(';')) {
    return {
      value: null,
      isValid: false,
      error: 'Invalid format: use comma (,) to separate OpCo codes, not semicolon (;)',
    };
  }

  // 解析逗號分隔的代碼並標準化（轉大寫、去空白）
  const codes = strValue.split(',')
    .map(s => s.trim().toUpperCase())
    .filter(s => s.length > 0);

  if (codes.length === 0) {
    return { value: null, isValid: true };
  }

  // 返回標準化後的字串（逗號分隔）
  return { value: codes.join(','), isValid: true };
}

// ============================================================
// 主組件
// ============================================================

export default function ProjectDataImportPage() {
  const t = useTranslations('projectDataImport');
  const tCommon = useTranslations('common');

  // 狀態
  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('valid');

  // API
  const importMutation = api.project.importProjects.useMutation();
  const { data: existingProjects, refetch: refetchExisting } = api.project.getByProjectCodes.useQuery(
    { projectCodes: parseResult?.validProjects.map(p => p.projectCode) ?? [] },
    { enabled: false }
  );

  // ============================================================
  // Excel 解析
  // ============================================================

  const parseExcelFile = useCallback(async (file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error('No sheet found in workbook');
          }
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            throw new Error('Worksheet not found');
          }
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          // 跳過表頭行 (第一行是標題)
          const headerRow = jsonData[0] as string[];
          const dataRows = jsonData.slice(1);

          // 建立欄位索引映射 (使用不區分大小寫的匹配，修復問題2)
          const columnIndexMap: Record<string, number> = {};
          headerRow.forEach((header, index) => {
            const trimmedHeader = String(header || '').trim().toLowerCase();
            Object.entries(EXCEL_COLUMN_MAP).forEach(([field, excelHeader]) => {
              // 不區分大小寫的比對
              if (trimmedHeader === excelHeader.toLowerCase()) {
                columnIndexMap[field] = index;
              }
            });
          });

          const validProjects: ParsedProject[] = [];
          const errors: ValidationError[] = [];

          // 解析每一行
          dataRows.forEach((row, index) => {
            const rowNumber = index + 2; // Excel 行號 (1-based, 跳過表頭)

            // 跳過空行
            if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
              return;
            }

            const getValue = (field: string) => {
              const colIndex = columnIndexMap[field];
              return colIndex !== undefined ? row[colIndex] : undefined;
            };

            // CHANGE-013: 先解析 chargeOutOpCos 以便驗證格式
            const chargeOutOpCosResult = parseChargeOutOpCos(getValue('chargeOutOpCos'));

            // 解析專案資料
            const project: ParsedProject = {
              rowNumber,
              fiscalYear: parseInt(getValue('fiscalYear')),
              projectCategory: cleanString(getValue('projectCategory')),
              name: cleanString(getValue('name')) ?? '',
              description: cleanString(getValue('description')),
              expenseType: cleanString(getValue('expenseType')),
              budgetCategoryName: cleanString(getValue('budgetCategoryName')),
              projectCode: cleanString(getValue('projectCode')) ?? '',
              globalFlag: cleanString(getValue('globalFlag')),
              probability: parseProbability(getValue('probability')),
              priority: parsePriority(getValue('priority')),
              team: cleanString(getValue('team')),
              personInCharge: cleanString(getValue('personInCharge')),
              currencyCode: cleanString(getValue('currencyCode')),
              isCdoReviewRequired: parseBoolean(getValue('isCdoReviewRequired')),
              isManagerConfirmed: parseBoolean(getValue('isManagerConfirmed')),
              payForWhat: cleanString(getValue('payForWhat')),
              payToWhom: cleanString(getValue('payToWhom')),
              requestedBudget: parseNumber(getValue('requestedBudget')),
              isOngoing: parseBoolean(getValue('isOngoing')),
              lastFYActualExpense: parseNumber(getValue('lastFYActualExpense')),
              // 新增欄位 (v2 模版)
              isChargeBackToOpco: parseBoolean(getValue('isChargeBackToOpco')),
              chargeOutOpCos: chargeOutOpCosResult.value, // CHANGE-013: 使用解析結果
              chargeOutMethod: cleanString(getValue('chargeOutMethod')),
            };

            // 驗證必填欄位
            let hasError = false;

            if (!project.name) {
              errors.push({
                rowNumber,
                field: 'name',
                message: t('errors.requiredField', { field: EXCEL_COLUMN_MAP.name ?? 'Project Name' }),
                value: String(getValue('name') ?? ''),
              });
              hasError = true;
            }

            if (!project.projectCode) {
              errors.push({
                rowNumber,
                field: 'projectCode',
                message: t('errors.requiredField', { field: EXCEL_COLUMN_MAP.projectCode ?? 'Project Code' }),
                value: String(getValue('projectCode') ?? ''),
              });
              hasError = true;
            }

            // 驗證 fiscalYear 範圍
            if (project.fiscalYear !== null && (project.fiscalYear < 2020 || project.fiscalYear > 2030)) {
              errors.push({
                rowNumber,
                field: 'fiscalYear',
                message: t('errors.invalidFiscalYear'),
                value: String(getValue('fiscalYear') ?? ''),
              });
              hasError = true;
            }

            // CHANGE-013: 驗證 chargeOutOpCos 格式
            if (!chargeOutOpCosResult.isValid) {
              errors.push({
                rowNumber,
                field: 'chargeOutOpCos',
                message: t('errors.invalidOpCoFormat'),
                value: String(getValue('chargeOutOpCos') ?? ''),
              });
              hasError = true;
            }

            if (!hasError) {
              validProjects.push(project);
            }
          });

          resolve({
            validProjects,
            errors,
            duplicates: [], // 稍後透過 API 檢查
            totalRows: dataRows.filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== '')).length,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, [t]);

  // ============================================================
  // 檔案處理
  // ============================================================

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    try {
      const result = await parseExcelFile(file);

      // 檢查重複 projectCode
      if (result.validProjects.length > 0) {
        const projectCodes = result.validProjects.map(p => p.projectCode);
        const existingResponse = await refetchExisting();
        const existing = existingResponse.data ?? [];

        const duplicates: DuplicateInfo[] = [];
        result.validProjects.forEach(project => {
          const existingProject = existing.find(e => e.projectCode === project.projectCode);
          if (existingProject) {
            duplicates.push({
              rowNumber: project.rowNumber,
              projectCode: project.projectCode,
              existingProjectName: existingProject.name,
              existingFiscalYear: existingProject.fiscalYear,
              isUpdate: true,
            });
          }
        });

        result.duplicates = duplicates;
      }

      setParseResult(result);
      setStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      setParseResult({
        validProjects: [],
        errors: [{
          rowNumber: 0,
          field: 'file',
          message: t('errors.parseError'),
        }],
        duplicates: [],
        totalRows: 0,
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [parseExcelFile, refetchExisting, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  // ============================================================
  // 導入執行
  // ============================================================

  const handleImport = async () => {
    if (!parseResult || parseResult.validProjects.length === 0) return;

    setIsProcessing(true);

    try {
      const result = await importMutation.mutateAsync({
        projects: parseResult.validProjects.map(p => ({
          fiscalYear: p.fiscalYear ?? undefined,
          projectCategory: p.projectCategory ?? undefined,
          name: p.name,
          description: p.description ?? undefined,
          expenseType: p.expenseType ?? undefined,
          budgetCategoryName: p.budgetCategoryName ?? undefined,
          projectCode: p.projectCode,
          globalFlag: p.globalFlag ?? undefined,
          probability: p.probability ?? undefined,
          priority: p.priority ?? undefined,
          team: p.team ?? undefined,
          personInCharge: p.personInCharge ?? undefined,
          currencyCode: p.currencyCode ?? undefined,
          isCdoReviewRequired: p.isCdoReviewRequired,
          isManagerConfirmed: p.isManagerConfirmed,
          payForWhat: p.payForWhat ?? undefined,
          payToWhom: p.payToWhom ?? undefined,
          requestedBudget: p.requestedBudget ?? undefined,
          isOngoing: p.isOngoing,
          lastFYActualExpense: p.lastFYActualExpense ?? undefined,
          // 新增欄位 (v2 模版)
          isChargeBackToOpco: p.isChargeBackToOpco,
          chargeOutOpCos: p.chargeOutOpCos ?? undefined,
          chargeOutMethod: p.chargeOutMethod ?? undefined,
        })),
      });

      setImportResult(result);
      setStep('result');
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        totalProcessed: parseResult.validProjects.length,
        created: 0,
        updated: 0,
        skipped: parseResult.validProjects.length,
        errors: [{
          row: 0,
          projectCode: 'all',
          message: error instanceof Error ? error.message : t('errors.importFailed'),
        }],
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // 重置
  // ============================================================

  const handleReset = () => {
    setStep('upload');
    setParseResult(null);
    setImportResult(null);
    setFileName('');
    setActiveTab('valid');
  };

  // ============================================================
  // 下載模板
  // ============================================================

  const handleDownloadTemplate = () => {
    // 創建模板資料
    const templateData = [
      Object.values(EXCEL_COLUMN_MAP), // 表頭
      [
        2025,                    // Fiscal Year
        'IT Infrastructure',     // Project Category
        'Example Project',       // Project Name
        'Project description',   // Project Description
        'CAPEX',                 // Expense Type
        'Hardware',              // Budget Category
        'PRJ-2025-001',          // Project Code
        'No',                    // Global Flag
        80,                      // Probability
        'IT Team',               // Team
        'John Doe',              // PIC
        'USD',                   // Currency
        'Yes',                   // Is CDO review required
        'No',                    // Is Manager Confirmed
        'Server upgrade',        // Pay for what
        'Dell Inc.',             // Pay to whom
        50000,                   // Total Amount
        'No',                    // Is Ongoing
        0,                       // Last FY Actual Expense
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, 'project-import-template.xlsx');
  };

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            {t('downloadTemplate')}
          </Button>
        </div>

        {/* 步驟指示器 */}
        <div className="flex items-center justify-center space-x-4">
          <StepIndicator
            number={1}
            label={t('steps.upload')}
            active={step === 'upload'}
            completed={step !== 'upload'}
          />
          <div className="h-px w-12 bg-border" />
          <StepIndicator
            number={2}
            label={t('steps.preview')}
            active={step === 'preview'}
            completed={step === 'result'}
          />
          <div className="h-px w-12 bg-border" />
          <StepIndicator
            number={3}
            label={t('steps.result')}
            active={step === 'result'}
            completed={false}
          />
        </div>

        {/* 步驟內容 */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('upload.title')}</CardTitle>
              <CardDescription>{t('upload.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                  isProcessing && 'pointer-events-none opacity-50'
                )}
              >
                <input {...getInputProps()} />
                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p>{t('upload.processing')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('upload.dropzone')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('upload.supportedFormats')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 欄位說明 */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">{t('upload.columnInfo')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                  {Object.entries(EXCEL_COLUMN_MAP).map(([field, header]) => (
                    <div key={field} className="flex items-center space-x-2">
                      {REQUIRED_FIELDS.includes(field) ? (
                        <Badge variant="destructive" className="text-xs">*</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">-</Badge>
                      )}
                      <span>{header}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && parseResult && (
          <>
            {/* 統計摘要 */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label={t('preview.totalRows')}
                value={parseResult.totalRows}
                icon={<FileSpreadsheet className="h-5 w-5" />}
              />
              <StatCard
                label={t('preview.validRows')}
                value={parseResult.validProjects.length}
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                variant="success"
              />
              <StatCard
                label={t('preview.errorRows')}
                value={parseResult.errors.length}
                icon={<XCircle className="h-5 w-5 text-red-500" />}
                variant={parseResult.errors.length > 0 ? 'destructive' : 'default'}
              />
              <StatCard
                label={t('preview.duplicateRows')}
                value={parseResult.duplicates.length}
                icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
                variant={parseResult.duplicates.length > 0 ? 'warning' : 'default'}
              />
            </div>

            {/* 資料預覽 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('preview.title')}</CardTitle>
                <CardDescription>{fileName}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="valid">
                      {t('preview.tabs.valid')} ({parseResult.validProjects.length})
                    </TabsTrigger>
                    <TabsTrigger value="errors">
                      {t('preview.tabs.errors')} ({parseResult.errors.length})
                    </TabsTrigger>
                    <TabsTrigger value="duplicates">
                      {t('preview.tabs.duplicates')} ({parseResult.duplicates.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="valid" className="mt-4">
                    <div className="border rounded-lg overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">{t('preview.columns.row')}</TableHead>
                            <TableHead>{t('preview.columns.fiscalYear')}</TableHead>
                            <TableHead>{t('preview.columns.projectCode')}</TableHead>
                            <TableHead>{t('preview.columns.name')}</TableHead>
                            <TableHead>{t('preview.columns.category')}</TableHead>
                            <TableHead>{t('preview.columns.budget')}</TableHead>
                            <TableHead>{t('preview.columns.currency')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parseResult.validProjects.slice(0, 50).map((project) => (
                            <TableRow key={project.rowNumber}>
                              <TableCell>{project.rowNumber}</TableCell>
                              <TableCell>{project.fiscalYear ?? '-'}</TableCell>
                              <TableCell className="font-mono">{project.projectCode}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{project.name}</TableCell>
                              <TableCell>{project.budgetCategoryName ?? '-'}</TableCell>
                              <TableCell className="text-right">
                                {project.requestedBudget?.toLocaleString() ?? '-'}
                              </TableCell>
                              <TableCell>{project.currencyCode ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parseResult.validProjects.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('preview.showingFirst', { count: 50, total: parseResult.validProjects.length })}
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="errors" className="mt-4">
                    {parseResult.errors.length === 0 ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>{t('preview.noErrors')}</AlertTitle>
                      </Alert>
                    ) : (
                      <div className="border rounded-lg overflow-auto max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">{t('preview.columns.row')}</TableHead>
                              <TableHead>{t('preview.columns.field')}</TableHead>
                              <TableHead>{t('preview.columns.error')}</TableHead>
                              <TableHead>{t('preview.columns.value')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parseResult.errors.map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.rowNumber}</TableCell>
                                <TableCell>{error.field}</TableCell>
                                <TableCell className="text-red-600">{error.message}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {error.value ?? '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="duplicates" className="mt-4">
                    {parseResult.duplicates.length === 0 ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>{t('preview.noDuplicates')}</AlertTitle>
                      </Alert>
                    ) : (
                      <>
                        <Alert variant="default" className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{t('preview.duplicateWarning')}</AlertTitle>
                          <AlertDescription>
                            {t('preview.duplicateDescription')}
                          </AlertDescription>
                        </Alert>
                        <div className="border rounded-lg overflow-auto max-h-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">{t('preview.columns.row')}</TableHead>
                                <TableHead>{t('preview.columns.projectCode')}</TableHead>
                                <TableHead>{t('preview.columns.existingName')}</TableHead>
                                <TableHead>{t('preview.columns.existingFY')}</TableHead>
                                <TableHead>{t('preview.columns.action')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {parseResult.duplicates.map((dup, index) => (
                                <TableRow key={index}>
                                  <TableCell>{dup.rowNumber}</TableCell>
                                  <TableCell className="font-mono">{dup.projectCode}</TableCell>
                                  <TableCell>{dup.existingProjectName}</TableCell>
                                  <TableCell>{dup.existingFiscalYear ?? '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{t('preview.willUpdate')}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                {/* 操作按鈕 */}
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {tCommon('actions.back')}
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={parseResult.validProjects.length === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('preview.importing')}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('preview.importButton', { count: parseResult.validProjects.length })}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'result' && importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <span>{t('result.success')}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    <span>{t('result.failed')}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 結果統計 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{importResult.created}</p>
                  <p className="text-sm text-muted-foreground">{t('result.created')}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{importResult.updated}</p>
                  <p className="text-sm text-muted-foreground">{t('result.updated')}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-600">{importResult.skipped}</p>
                  <p className="text-sm text-muted-foreground">{t('result.skipped')}</p>
                </div>
              </div>

              {/* 錯誤列表 */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>{t('result.errorDetails')}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {importResult.errors.map((err, index) => (
                        <li key={index}>
                          {err.row > 0 && <span className="text-muted-foreground">[Row {err.row}] </span>}
                          <span className="font-mono">{err.projectCode}</span>: {err.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* CHANGE-013: 警告列表 (無效 OpCo 代碼等) */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-700 dark:text-yellow-500">{t('result.warningDetails')}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {importResult.warnings.map((warn, index) => (
                        <li key={index}>
                          {warn.row > 0 && <span className="text-muted-foreground">[Row {warn.row}] </span>}
                          <span className="font-mono">{warn.projectCode}</span>: {warn.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* 操作按鈕 */}
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('result.importMore')}
                </Button>
                <Button asChild>
                  <a href="/projects">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t('result.goToProjects')}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// 子組件
// ============================================================

function StepIndicator({
  number,
  label,
  active,
  completed
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          active && 'bg-primary text-primary-foreground',
          completed && 'bg-green-500 text-white',
          !active && !completed && 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <span className={cn('text-sm', active ? 'font-medium' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = 'default'
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn(
              'text-2xl font-bold',
              variant === 'success' && 'text-green-600',
              variant === 'destructive' && 'text-red-600',
              variant === 'warning' && 'text-yellow-600',
            )}>
              {value}
            </p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
