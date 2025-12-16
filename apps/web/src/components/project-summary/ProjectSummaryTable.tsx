/**
 * @fileoverview ProjectSummaryTable - Project Summary 表格組件
 *
 * @description
 * 顯示專案的摘要列表，使用階層結構：OpCo → Category → Projects。
 * 使用 Accordion 組件實現可展開/收合的分組結構。
 * 支援 FEAT-006 的 16 個欄位顯示。
 *
 * @component ProjectSummaryTable
 *
 * @features
 * - 階層結構顯示（OpCo → Category → Projects）
 * - 使用 Accordion 實現可展開/收合
 * - 顯示專案的所有 FEAT-006 欄位
 * - 每個 Category 的小計
 * - 金額格式化（千分位）
 * - 響應式設計
 *
 * @dependencies
 * - @/components/ui/accordion - Accordion 組件
 * - @/components/ui/table - Table 組件
 * - next-intl - 國際化
 *
 * @related
 * - apps/web/src/app/[locale]/om-summary/page.tsx - 主頁面
 * - packages/api/src/routers/project.ts - API
 *
 * @author IT Department
 * @since FEAT-006 - Project Summary Tab
 * @lastModified 2025-12-15
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen, Building2, CheckCircle2, XCircle } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 專案資料類型
export interface ProjectSummaryItem {
  id: string;
  name: string;
  projectCode: string;
  projectCategory: string | null;
  projectType: string;
  expenseType: string;
  description: string | null;
  globalFlag: string;
  probability: string;
  team: string | null;
  personInCharge: string | null;
  chargeBackToOpCo: boolean;
  chargeOutMethod: string | null;
  requestedBudget: number | null;
  budgetCategory: {
    id: string;
    categoryName: string;
    categoryCode: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  chargeOutOpCos: {
    opCo: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

// 類別統計資料
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryCode: string | null;
  projectCount: number;
  totalRequestedBudget: number;
  totalApprovedBudget: number;
}

interface ProjectSummaryTableProps {
  projects: ProjectSummaryItem[];
  categorySummary: CategorySummary[];
  financialYear: number;
  isLoading?: boolean;
  /** 用戶有權限訪問的 OpCo 代碼列表（CHANGE-014: OpCo 權限過濾） */
  userOpCoCodes?: string[];
  /** 用戶是否為 Admin（Admin 可查看全部數據） */
  isAdmin?: boolean;
  /** CHANGE-030: 搜索詞（用於過濾 Project Name 和 Project Code） */
  searchTerm?: string;
}

/**
 * 格式化金額（千分位）
 */
function formatCurrency(amount: number | null, symbol?: string): string {
  if (amount === null || amount === undefined) return '-';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return symbol ? `${symbol}${formatted}` : `$${formatted}`;
}

/**
 * 獲取優先權顏色
 */
function getProbabilityBadgeVariant(probability: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (probability) {
    case 'High':
      return 'default';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * 獲取費用類型顏色
 */
function getExpenseTypeBadgeVariant(expenseType: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (expenseType) {
    case 'Capital':
      return 'default';
    case 'Expense':
      return 'secondary';
    case 'Collection':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * CHANGE-030: 高亮匹配文字的組件
 */
function HighlightText({ text, searchTerm }: { text: string; searchTerm?: string }) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * 根據用戶 OpCo 權限過濾 Charge Out Method 欄位 (CHANGE-014)
 *
 * @description
 * 輸入格式範例：
 * RA     $     2,269 ;
 * RAPO     $     2,370 ;
 * RBS     $     4,110 ;
 *
 * @param chargeOutMethod - 原始 Charge Out Method 值
 * @param userOpCoCodes - 用戶有權限的 OpCo 代碼列表
 * @param isAdmin - 是否為 Admin 用戶
 * @returns 過濾後的字串，或 null 表示無權限
 */
function filterChargeOutMethodByPermission(
  chargeOutMethod: string | null,
  userOpCoCodes: string[],
  isAdmin: boolean
): string | null {
  // Admin 用戶顯示全部
  if (isAdmin) {
    return chargeOutMethod;
  }

  // 空值直接返回
  if (!chargeOutMethod || chargeOutMethod.trim() === '') {
    return chargeOutMethod;
  }

  // 檢查是否包含分號（OpCo 分攤格式）
  if (!chargeOutMethod.includes(';')) {
    return chargeOutMethod; // 不是 OpCo 格式，原樣返回
  }

  // 解析分號分隔的條目
  const entries = chargeOutMethod.split(';').map(e => e.trim()).filter(e => e.length > 0);

  // 過濾有權限的條目
  const filteredEntries = entries.filter(entry => {
    // 提取 OpCo 代碼（條目開頭的字母部分）
    const match = entry.match(/^([A-Z]+)/);
    if (!match || !match[1]) return true; // 無法識別，保留

    const opCoCode = match[1];
    return userOpCoCodes.includes(opCoCode);
  });

  // 如果沒有任何有權限的條目
  if (filteredEntries.length === 0) {
    return null; // 返回 null 表示無權限
  }

  // 重新組合（保持原格式，使用分號分隔）
  return filteredEntries.join(' ; ');
}

export function ProjectSummaryTable({
  projects,
  categorySummary,
  financialYear,
  isLoading = false,
  userOpCoCodes = [],
  isAdmin = false,
  searchTerm = '',
}: ProjectSummaryTableProps) {
  const t = useTranslations('projectSummary');

  // CHANGE-030: 過濾專案（按 Project Name 和 Project Code）
  const filteredProjects = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return projects;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerSearch) ||
        project.projectCode.toLowerCase().includes(lowerSearch)
    );
  }, [projects, searchTerm]);

  // 按類別分組專案
  const projectsByCategory = React.useMemo(() => {
    const grouped: Record<string, ProjectSummaryItem[]> = {};

    filteredProjects.forEach((project) => {
      const categoryKey = project.budgetCategory?.categoryName || 'Uncategorized';
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(project);
    });

    return grouped;
  }, [filteredProjects]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('table.title')}</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('table.title')}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {t('table.noData')}
        </div>
      </div>
    );
  }

  // CHANGE-030: 搜索無結果提示
  if (filteredProjects.length === 0 && searchTerm) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('table.title')}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {t('search.noResults')}
        </div>
      </div>
    );
  }

  // 預設展開所有類別
  const defaultExpandedCategories = Object.keys(projectsByCategory);

  return (
    <div className="space-y-6">
      {/* 類別統計表格 - CHANGE-029: 只有 Admin 可見 */}
      {isAdmin && (
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">{t('summary.title')} - FY{financialYear}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('summary.category')}</TableHead>
                <TableHead className="text-center">{t('summary.projectCount')}</TableHead>
                <TableHead className="text-right">{t('summary.requestedBudget')}</TableHead>
                <TableHead className="text-right">{t('summary.approvedBudget')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorySummary.map((category) => (
                <TableRow key={category.categoryId}>
                  <TableCell className="font-medium">
                    {category.categoryCode} - {category.categoryName}
                  </TableCell>
                  <TableCell className="text-center">{category.projectCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.totalRequestedBudget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.totalApprovedBudget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 明細表格 */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('table.title')}</h2>

        <Accordion
          type="multiple"
          defaultValue={defaultExpandedCategories}
          className="space-y-4"
        >
          {Object.entries(projectsByCategory).map(([categoryName, categoryProjects]) => {
            const categoryInfo = categorySummary.find(c => c.categoryName === categoryName);

            return (
              <AccordionItem
                key={categoryName}
                value={categoryName}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted/70 hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{categoryName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {categoryProjects.length} {t('table.projects')}
                    </Badge>
                    {categoryInfo && (
                      <span className="text-sm text-muted-foreground ml-auto mr-4">
                        {t('summary.total')}: {formatCurrency(categoryInfo.totalRequestedBudget)}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <div className="overflow-x-auto">
                    {/* FIX: 使用 table-fixed 和 colgroup 確保不同 category 的欄位對齊 */}
                    {/* FIX-009: 調整欄位寬度，讓 Project Name 更寬以顯示完整內容 */}
                    <Table className="table-fixed w-full">
{/* FIX: colgroup 內不能有空白或註釋，會導致 hydration 錯誤 */}
                      {/* 欄位寬度: # 2.5%, Project Name 25%, Project Code 7%, Project Type 7%, Expense Type 7%, Probability 7%, Budget 9%, Charge Back 5%, Charge To OpCo 10%, Team 8%, Person In Charge 12.5% */}
                      <colgroup><col style={{ width: '2.5%' }} /><col style={{ width: '25%' }} /><col style={{ width: '7%' }} /><col style={{ width: '7%' }} /><col style={{ width: '7%' }} /><col style={{ width: '7%' }} /><col style={{ width: '9%' }} /><col style={{ width: '5%' }} /><col style={{ width: '10%' }} /><col style={{ width: '8%' }} /><col style={{ width: '12.5%' }} /></colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>{t('table.projectName')}</TableHead>
                          <TableHead>{t('table.projectCode')}</TableHead>
                          <TableHead>{t('table.projectType')}</TableHead>
                          <TableHead>{t('table.expenseType')}</TableHead>
                          <TableHead>{t('table.probability')}</TableHead>
                          <TableHead className="text-right">{t('table.budget')}</TableHead>
                          <TableHead>{t('table.chargeBack')}</TableHead>
                          <TableHead>{t('table.chargeToOpCo')}</TableHead>
                          <TableHead>{t('table.team')}</TableHead>
                          <TableHead>{t('table.pic')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryProjects.map((project, index) => (
                          <TableRow key={project.id}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="overflow-hidden">
                              {/* FIX-009: 移除 truncate，改用 break-words 允許文字換行顯示完整內容 */}
                              <div className="break-words">
                                <div className="font-medium break-words">
                                  <HighlightText text={project.name} searchTerm={searchTerm} />
                                </div>
                                {project.description && (
                                  <div className="text-sm text-muted-foreground break-words line-clamp-2">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="overflow-hidden">
                              <Badge variant="outline" className="truncate max-w-full">
                                <HighlightText text={project.projectCode} searchTerm={searchTerm} />
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={project.projectType === 'Project' ? 'default' : 'secondary'}>
                                {project.projectType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getExpenseTypeBadgeVariant(project.expenseType)}>
                                {project.expenseType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getProbabilityBadgeVariant(project.probability)}>
                                {project.probability}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(project.requestedBudget, project.currency?.symbol)}
                            </TableCell>
                            <TableCell className="text-center">
                              {project.chargeBackToOpCo ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 inline-block" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground inline-block" />
                              )}
                            </TableCell>
                            <TableCell className="overflow-hidden">
                              {(() => {
                                // CHANGE-014: 優先顯示 chargeOutMethod（經過權限過濾）
                                if (project.chargeOutMethod) {
                                  const filteredMethod = filterChargeOutMethodByPermission(
                                    project.chargeOutMethod,
                                    userOpCoCodes,
                                    isAdmin
                                  );
                                  if (filteredMethod === null) {
                                    // 無權限查看
                                    return (
                                      <span className="text-muted-foreground italic text-sm">
                                        {t('table.noAccess')}
                                      </span>
                                    );
                                  }
                                  // 顯示過濾後的分攤信息（保持原格式，換行顯示）
                                  return (
                                    <div className="text-xs whitespace-pre-wrap">
                                      {filteredMethod}
                                    </div>
                                  );
                                }
                                // 回退：顯示 chargeOutOpCos Badge
                                if (project.chargeOutOpCos.length > 0) {
                                  return (
                                    <div className="flex flex-wrap gap-1">
                                      {project.chargeOutOpCos.map((co) => (
                                        <Badge key={co.opCo.id} variant="outline" className="text-xs">
                                          {co.opCo.code}
                                        </Badge>
                                      ))}
                                    </div>
                                  );
                                }
                                return <span className="text-muted-foreground">-</span>;
                              })()}
                            </TableCell>
                            <TableCell className="truncate">{project.team || '-'}</TableCell>
                            <TableCell className="truncate">{project.personInCharge || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

export default ProjectSummaryTable;
