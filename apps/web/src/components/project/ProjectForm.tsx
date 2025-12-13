/**
 * @fileoverview Project Form Component - 專案建立/編輯表單
 *
 * @description
 * 統一的專案表單組件，支援建立新專案和編輯現有專案兩種模式。
 * 整合預算池選擇、預算類別選擇（Module 2 新增）、專案經理和主管選擇功能。
 * 提供即時表單驗證、日期範圍檢查和國際化支援。
 * FEAT-001 新增：專案編號、全域標誌、優先權、貨幣欄位支援。
 * FEAT-006 新增：專案類型、費用類型、OpCo 轉嫁、機率、團隊、負責人欄位。
 * FEAT-010 新增：表單佈局重新編排
 *
 * @component ProjectForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - 預算池選擇（Combobox 可搜尋下拉選單）
 * - 預算類別動態載入（依預算池篩選，Module 2 新增）
 * - 請求預算金額輸入（Module 2 新增）
 * - 專案編號輸入（即時驗證唯一性，debounce 500ms，FEAT-001）
 * - 全域標誌選擇（RCL/Region，FEAT-001）
 * - 優先權選擇（High/Medium/Low，FEAT-001）
 * - 貨幣選擇（Combobox 可搜尋，載入啟用的貨幣，FEAT-001）
 * - 專案類型選擇（Project/Budget，FEAT-006）
 * - 費用類型選擇（Expense/Capital/Collection，FEAT-006）
 * - OpCo 轉嫁設定（支援多選 OpCo，FEAT-006）
 * - 機率、團隊、負責人欄位（FEAT-006）
 * - 專案經理和主管選擇
 * - 專案日期範圍選擇和驗證
 * - 即時表單驗證（必填欄位、日期範圍、專案編號格式和唯一性）
 * - 國際化支援（繁中/英文）
 * - 錯誤處理和成功提示（Toast）
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-12-13 (FEAT-010: 表單佈局重新編排)
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface ProjectFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    budgetPoolId: string;
    budgetCategoryId: string | null;
    requestedBudget: number | null;
    managerId: string;
    supervisorId: string;
    startDate: Date;
    endDate: Date | null;
    projectCode: string;
    globalFlag: string;
    priority: string;
    currencyId: string | null;
    projectCategory: string | null;
    projectType: string;
    expenseType: string;
    chargeBackToOpCo: boolean;
    chargeOutOpCoIds: string[];
    chargeOutMethod: string | null;
    probability: string;
    team: string | null;
    personInCharge: string | null;
    fiscalYear: number | null;
    isCdoReviewRequired: boolean;
    isManagerConfirmed: boolean;
    payForWhat: string | null;
    payToWhom: string | null;
  };
  mode: 'create' | 'edit';
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
  const tForm = useTranslations('projects.form');
  const tFields = useTranslations('projects.form.fields');
  const tActions = useTranslations('projects.form.actions');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const tToast = useTranslations('toast');

  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    budgetPoolId: initialData?.budgetPoolId ?? '',
    budgetCategoryId: initialData?.budgetCategoryId ?? '',
    requestedBudget: initialData?.requestedBudget ?? 0,
    managerId: initialData?.managerId ?? '',
    supervisorId: initialData?.supervisorId ?? '',
    startDate: initialData?.startDate ? initialData.startDate.toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.toISOString().split('T')[0] : '',
    projectCode: initialData?.projectCode ?? '',
    globalFlag: initialData?.globalFlag ?? 'Region',
    priority: initialData?.priority ?? 'Medium',
    currencyId: initialData?.currencyId ?? '',
    projectCategory: initialData?.projectCategory ?? '',
    projectType: initialData?.projectType ?? 'Project',
    expenseType: initialData?.expenseType ?? 'Expense',
    chargeBackToOpCo: initialData?.chargeBackToOpCo ?? false,
    chargeOutOpCoIds: initialData?.chargeOutOpCoIds ?? [],
    chargeOutMethod: initialData?.chargeOutMethod ?? '',
    probability: initialData?.probability ?? 'Medium',
    team: initialData?.team ?? '',
    personInCharge: initialData?.personInCharge ?? '',
    fiscalYear: initialData?.fiscalYear ?? new Date().getFullYear(),
    isCdoReviewRequired: initialData?.isCdoReviewRequired ?? false,
    isManagerConfirmed: initialData?.isManagerConfirmed ?? false,
    payForWhat: initialData?.payForWhat ?? '',
    payToWhom: initialData?.payToWhom ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch budget pools for dropdown
  const { data: budgetPoolsData } = api.budgetPool.getAll.useQuery({
    page: 1,
    limit: 100,
    sortBy: 'year',
    sortOrder: 'desc',
  });
  const budgetPools = budgetPoolsData?.items ?? [];

  // Prepare budget pool options for Combobox
  const budgetPoolOptions: ComboboxOption[] = budgetPools.map((pool) => ({
    value: pool.id,
    label: `${pool.name} - FY${pool.financialYear} ($${pool.totalAmount.toLocaleString()})`,
  }));

  // Module 2: 動態載入預算類別列表（當選擇預算池時）
  const { data: budgetCategories } = api.budgetPool.getCategories.useQuery(
    { budgetPoolId: formData.budgetPoolId },
    { enabled: !!formData.budgetPoolId }
  );

  // Module 2: 當預算池改變時，清空預算類別選擇
  useEffect(() => {
    if (initialData?.budgetPoolId !== formData.budgetPoolId) {
      setFormData((prev) => ({ ...prev, budgetCategoryId: '' }));
    }
  }, [formData.budgetPoolId, initialData?.budgetPoolId]);

  // FEAT-001: 查詢啟用的貨幣列表
  const { data: currencies } = api.currency.getActive.useQuery();

  // FEAT-006: 查詢啟用的營運公司列表
  const { data: operatingCompanies } = api.operatingCompany.getAll.useQuery({ isActive: true });

  // FEAT-001: 專案編號即時驗證
  const debouncedProjectCode = useDebounce(formData.projectCode, 500);
  const { data: codeAvailability } = api.project.checkCodeAvailability.useQuery(
    {
      projectCode: debouncedProjectCode,
      excludeProjectId: mode === 'edit' ? initialData?.id : undefined,
    },
    {
      enabled: !!debouncedProjectCode && debouncedProjectCode.length > 0,
    }
  );

  // Fetch users for manager and supervisor dropdowns
  const { data: managers } = api.user.getManagers.useQuery();
  const { data: supervisors } = api.user.getSupervisors.useQuery();

  const createMutation = api.project.create.useMutation({
    onSuccess: (project) => {
      toast({
        title: tToast('success.title'),
        description: tToast('success.created', { entity: tForm('entityName') }),
        variant: 'success',
      });
      router.push(`/projects/${project.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.project.update.useMutation({
    onSuccess: () => {
      toast({
        title: tToast('success.title'),
        description: tToast('success.updated', { entity: tForm('entityName') }),
        variant: 'success',
      });
      router.push(`/projects/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = tValidation('required');
    }

    if (!formData.projectCode.trim()) {
      newErrors.projectCode = tValidation('required');
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(formData.projectCode)) {
      newErrors.projectCode = tFields('projectCode.invalidFormat');
    } else if (codeAvailability && !codeAvailability.available) {
      newErrors.projectCode = tFields('projectCode.alreadyInUse');
    }

    if (!formData.budgetPoolId) {
      newErrors.budgetPoolId = tValidation('required');
    }

    if (!formData.managerId) {
      newErrors.managerId = tValidation('required');
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = tValidation('required');
    }

    if (!formData.startDate) {
      newErrors.startDate = tValidation('required');
    }

    if (formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = tValidation('endDateBeforeStart');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      name: formData.name,
      description: formData.description.trim() === '' ? undefined : formData.description,
      budgetPoolId: formData.budgetPoolId,
      budgetCategoryId: formData.budgetCategoryId.trim() === '' ? undefined : formData.budgetCategoryId,
      requestedBudget: formData.requestedBudget > 0 ? formData.requestedBudget : undefined,
      managerId: formData.managerId,
      supervisorId: formData.supervisorId,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      projectCode: formData.projectCode,
      globalFlag: formData.globalFlag,
      priority: formData.priority,
      currencyId: formData.currencyId.trim() === '' ? undefined : formData.currencyId,
      projectCategory: formData.projectCategory.trim() === '' ? undefined : formData.projectCategory,
      projectType: formData.projectType,
      expenseType: formData.expenseType,
      chargeBackToOpCo: formData.chargeBackToOpCo,
      chargeOutOpCoIds: formData.chargeBackToOpCo ? formData.chargeOutOpCoIds : undefined,
      chargeOutMethod: formData.chargeOutMethod.trim() === '' ? undefined : formData.chargeOutMethod,
      probability: formData.probability,
      team: formData.team.trim() === '' ? undefined : formData.team,
      personInCharge: formData.personInCharge.trim() === '' ? undefined : formData.personInCharge,
      fiscalYear: formData.fiscalYear || undefined,
      isCdoReviewRequired: formData.isCdoReviewRequired,
      isManagerConfirmed: formData.isManagerConfirmed,
      payForWhat: formData.payForWhat.trim() === '' ? undefined : formData.payForWhat,
      payToWhom: formData.payToWhom.trim() === '' ? undefined : formData.payToWhom,
    };

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Project Name*, Project Code*, Fiscal Year */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {tFields('name.label')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('name.placeholder')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700">
            {tFields('projectCode.label')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="projectCode"
            name="projectCode"
            value={formData.projectCode}
            onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('projectCode.placeholder')}
            maxLength={50}
          />
          {debouncedProjectCode && codeAvailability && (
            <p className={`mt-1 text-sm ${codeAvailability.available ? 'text-green-600' : 'text-red-600'}`}>
              {codeAvailability.available ? tFields('projectCode.available') : tFields('projectCode.alreadyInUse')}
            </p>
          )}
          {errors.projectCode && <p className="mt-1 text-sm text-red-600">{errors.projectCode}</p>}
        </div>

        <div>
          <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700">
            {tFields('fiscalYear.label')}
          </label>
          <input
            type="number"
            id="fiscalYear"
            name="fiscalYear"
            value={formData.fiscalYear || ''}
            onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value ? parseInt(e.target.value) : null })}
            min={2020}
            max={2030}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('fiscalYear.placeholder')}
          />
        </div>
      </div>

      {/* Row 2: Project Category, Project Type*, Expense Type* */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="projectCategory" className="block text-sm font-medium text-gray-700">
            {tFields('projectCategory.label')}
          </label>
          <input
            type="text"
            id="projectCategory"
            name="projectCategory"
            value={formData.projectCategory}
            onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('projectCategory.placeholder')}
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
            {tFields('projectType.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="projectType"
            name="projectType"
            value={formData.projectType}
            onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="Project">{tFields('projectType.options.project')}</option>
            <option value="Budget">{tFields('projectType.options.budget')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="expenseType" className="block text-sm font-medium text-gray-700">
            {tFields('expenseType.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="expenseType"
            name="expenseType"
            value={formData.expenseType}
            onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="Expense">{tFields('expenseType.options.expense')}</option>
            <option value="Capital">{tFields('expenseType.options.capital')}</option>
            <option value="Collection">{tFields('expenseType.options.collection')}</option>
          </select>
        </div>
      </div>

      {/* Row 3: Global Flag*, Priority*, CDO Review Required, Manager Confirmed */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <label htmlFor="globalFlag" className="block text-sm font-medium text-gray-700">
            {tFields('globalFlag.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="globalFlag"
            name="globalFlag"
            value={formData.globalFlag}
            onChange={(e) => setFormData({ ...formData, globalFlag: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="Region">{tFields('globalFlag.options.region')}</option>
            <option value="RCL">{tFields('globalFlag.options.rcl')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            {tFields('priority.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="Low">{tFields('priority.options.low')}</option>
            <option value="Medium">{tFields('priority.options.medium')}</option>
            <option value="High">{tFields('priority.options.high')}</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isCdoReviewRequired"
            name="isCdoReviewRequired"
            checked={formData.isCdoReviewRequired}
            onChange={(e) => setFormData({ ...formData, isCdoReviewRequired: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isCdoReviewRequired" className="text-sm font-medium text-gray-700">
            {tFields('isCdoReviewRequired.label')}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isManagerConfirmed"
            name="isManagerConfirmed"
            checked={formData.isManagerConfirmed}
            onChange={(e) => setFormData({ ...formData, isManagerConfirmed: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isManagerConfirmed" className="text-sm font-medium text-gray-700">
            {tFields('isManagerConfirmed.label')}
          </label>
        </div>
      </div>

      {/* Row 4: Charge Back to OpCo, Charge Out OpCos, Charge Out Method */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="chargeBackToOpCo"
            name="chargeBackToOpCo"
            checked={formData.chargeBackToOpCo}
            onChange={(e) => {
              setFormData({
                ...formData,
                chargeBackToOpCo: e.target.checked,
                chargeOutOpCoIds: e.target.checked ? formData.chargeOutOpCoIds : [],
              });
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <label htmlFor="chargeBackToOpCo" className="text-sm font-medium text-gray-700">
              {tFields('chargeBackToOpCo.label')}
            </label>
            <p className="text-xs text-gray-500">{tFields('chargeBackToOpCo.description')}</p>
          </div>
        </div>

        <div>
          <label htmlFor="chargeOutOpCos" className="block text-sm font-medium text-gray-700">
            {tFields('chargeOutOpCos.label')}
          </label>
          <select
            id="chargeOutOpCos"
            name="chargeOutOpCos"
            multiple
            value={formData.chargeOutOpCoIds}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setFormData({ ...formData, chargeOutOpCoIds: selectedOptions });
            }}
            disabled={!formData.chargeBackToOpCo}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            size={4}
          >
            {operatingCompanies?.map((opCo) => (
              <option key={opCo.id} value={opCo.id}>
                {opCo.code} - {opCo.name}
              </option>
            ))}
          </select>
          {!formData.chargeBackToOpCo && (
            <p className="mt-1 text-xs text-gray-500">{tFields('chargeOutOpCos.selectOpCosFirst')}</p>
          )}
        </div>

        <div>
          <label htmlFor="chargeOutMethod" className="block text-sm font-medium text-gray-700">
            {tFields('chargeOutMethod.label')}
          </label>
          <input
            type="text"
            id="chargeOutMethod"
            name="chargeOutMethod"
            value={formData.chargeOutMethod}
            onChange={(e) => setFormData({ ...formData, chargeOutMethod: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('chargeOutMethod.placeholder')}
            maxLength={100}
          />
        </div>
      </div>

      {/* Row 5: Pay For What, Pay To Whom */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="payForWhat" className="block text-sm font-medium text-gray-700">
            {tFields('payForWhat.label')}
          </label>
          <input
            type="text"
            id="payForWhat"
            name="payForWhat"
            value={formData.payForWhat}
            onChange={(e) => setFormData({ ...formData, payForWhat: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('payForWhat.placeholder')}
            maxLength={500}
          />
        </div>

        <div>
          <label htmlFor="payToWhom" className="block text-sm font-medium text-gray-700">
            {tFields('payToWhom.label')}
          </label>
          <input
            type="text"
            id="payToWhom"
            name="payToWhom"
            value={formData.payToWhom}
            onChange={(e) => setFormData({ ...formData, payToWhom: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('payToWhom.placeholder')}
            maxLength={500}
          />
        </div>
      </div>

      {/* Row 6: Probability*, Team, Person In Charge */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
            {tFields('probability.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="probability"
            name="probability"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="Low">{tFields('probability.options.low')}</option>
            <option value="Medium">{tFields('probability.options.medium')}</option>
            <option value="High">{tFields('probability.options.high')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700">
            {tFields('team.label')}
          </label>
          <input
            type="text"
            id="team"
            name="team"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('team.placeholder')}
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="personInCharge" className="block text-sm font-medium text-gray-700">
            {tFields('personInCharge.label')}
          </label>
          <input
            type="text"
            id="personInCharge"
            name="personInCharge"
            value={formData.personInCharge}
            onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('personInCharge.placeholder')}
            maxLength={100}
          />
        </div>
      </div>

      {/* Row 7: Project Description (full width) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {tFields('description.label')}
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={tFields('description.placeholder')}
        />
      </div>

      {/* Row 8: Budget Pools*, Currency */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="budgetPoolId" className="block text-sm font-medium text-gray-700 mb-2">
            {tFields('budgetPool.label')} <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={budgetPoolOptions}
            value={formData.budgetPoolId}
            onChange={(value) => setFormData({ ...formData, budgetPoolId: value })}
            placeholder={tFields('budgetPool.placeholder')}
            searchPlaceholder={tCommon('actions.search')}
            emptyText={tCommon('noResults')}
          />
          {errors.budgetPoolId && <p className="mt-1 text-sm text-red-600">{errors.budgetPoolId}</p>}
        </div>

        <div>
          <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700 mb-2">
            {tFields('currency.label')}
          </label>
          <Combobox
            options={
              currencies?.map((currency) => ({
                value: currency.id,
                label: `${currency.code} - ${currency.name} (${currency.symbol})`,
              })) ?? []
            }
            value={formData.currencyId}
            onChange={(value) => setFormData({ ...formData, currencyId: value })}
            placeholder={tFields('currency.placeholder')}
            searchPlaceholder={tCommon('actions.search')}
            emptyText={tCommon('noResults')}
          />
        </div>
      </div>

      {/* Row 9: Budget Category, Requested Budget Amount */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="budgetCategoryId" className="block text-sm font-medium text-gray-700">
            {tFields('budgetCategory.label')}
          </label>
          <select
            id="budgetCategoryId"
            name="budgetCategoryId"
            value={formData.budgetCategoryId}
            onChange={(e) => setFormData({ ...formData, budgetCategoryId: e.target.value })}
            disabled={!formData.budgetPoolId}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{tFields('budgetCategory.placeholder')}</option>
            {budgetCategories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryName}
              </option>
            ))}
          </select>
          {!formData.budgetPoolId && (
            <p className="mt-1 text-sm text-gray-500">{tFields('budgetCategory.selectPoolFirst')}</p>
          )}
        </div>

        <div>
          <label htmlFor="requestedBudget" className="block text-sm font-medium text-gray-700">
            {tFields('requestedBudget.label')}
          </label>
          <input
            type="number"
            id="requestedBudget"
            name="requestedBudget"
            value={formData.requestedBudget}
            onChange={(e) =>
              setFormData({ ...formData, requestedBudget: parseFloat(e.target.value) || 0 })
            }
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={tFields('requestedBudget.placeholder')}
          />
        </div>
      </div>

      {/* Row 10: Project Manager*, Supervisor*, Start Date*, End Date */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
            {tFields('manager.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">{tFields('manager.placeholder')}</option>
            {managers?.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name || manager.email}
              </option>
            ))}
          </select>
          {errors.managerId && <p className="mt-1 text-sm text-red-600">{errors.managerId}</p>}
        </div>

        <div>
          <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700">
            {tFields('supervisor.label')} <span className="text-red-500">*</span>
          </label>
          <select
            id="supervisorId"
            name="supervisorId"
            value={formData.supervisorId}
            onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">{tFields('supervisor.placeholder')}</option>
            {supervisors?.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name || supervisor.email}
              </option>
            ))}
          </select>
          {errors.supervisorId && <p className="mt-1 text-sm text-red-600">{errors.supervisorId}</p>}
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            {tFields('startDate.label')} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            {tFields('endDate.label')}
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? tCommon('saving') : mode === 'create' ? tActions('create') : tActions('update')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          {tCommon('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
