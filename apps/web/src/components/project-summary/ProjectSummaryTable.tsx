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
 * @lastModified 2025-12-05
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

export function ProjectSummaryTable({
  projects,
  categorySummary,
  financialYear,
  isLoading = false,
}: ProjectSummaryTableProps) {
  const t = useTranslations('projectSummary');

  // 按類別分組專案
  const projectsByCategory = React.useMemo(() => {
    const grouped: Record<string, ProjectSummaryItem[]> = {};

    projects.forEach((project) => {
      const categoryKey = project.budgetCategory?.categoryName || 'Uncategorized';
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(project);
    });

    return grouped;
  }, [projects]);

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

  // 預設展開所有類別
  const defaultExpandedCategories = Object.keys(projectsByCategory);

  return (
    <div className="space-y-6">
      {/* 類別統計表格 */}
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="min-w-[200px]">{t('table.projectName')}</TableHead>
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
                            <TableCell>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                {project.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{project.projectCode}</Badge>
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
                            <TableCell>
                              {project.chargeBackToOpCo ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              {project.chargeOutOpCos.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {project.chargeOutOpCos.map((co) => (
                                    <Badge key={co.opCo.id} variant="outline" className="text-xs">
                                      {co.opCo.code}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{project.team || '-'}</TableCell>
                            <TableCell>{project.personInCharge || '-'}</TableCell>
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
