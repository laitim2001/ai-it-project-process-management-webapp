/**
 * @fileoverview Project Form Component - 專案建立/編輯表單
 *
 * @description
 * 統一的專案表單組件，支援建立新專案和編輯現有專案兩種模式。
 * 整合預算池選擇、預算類別選擇（Module 2 新增）、專案經理和主管選擇功能。
 * 提供即時表單驗證、日期範圍檢查和國際化支援。
 * FEAT-001 新增：專案編號、全域標誌、優先權、貨幣欄位支援。
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
 * - 專案經理和主管選擇
 * - 專案日期範圍選擇和驗證
 * - 即時表單驗證（必填欄位、日期範圍、專案編號格式和唯一性）
 * - 國際化支援（繁中/英文）
 * - 錯誤處理和成功提示（Toast）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {'create' | 'edit'} props.mode - 表單模式
 * @param {Object} [props.initialData] - 編輯模式的預設值
 * @param {string} props.initialData.id - 專案 ID
 * @param {string} props.initialData.name - 專案名稱
 * @param {string | null} props.initialData.description - 專案說明
 * @param {string} props.initialData.budgetPoolId - 預算池 ID
 * @param {string | null} props.initialData.budgetCategoryId - 預算類別 ID
 * @param {number | null} props.initialData.requestedBudget - 請求預算金額
 * @param {string} props.initialData.managerId - 專案經理 ID
 * @param {string} props.initialData.supervisorId - 主管 ID
 * @param {Date} props.initialData.startDate - 開始日期
 * @param {Date | null} props.initialData.endDate - 結束日期
 * @param {string} props.initialData.projectCode - 專案編號 (FEAT-001)
 * @param {string} props.initialData.globalFlag - 全域標誌 'RCL' | 'Region' (FEAT-001)
 * @param {string} props.initialData.priority - 優先權 'High' | 'Medium' | 'Low' (FEAT-001)
 * @param {string | null} props.initialData.currencyId - 貨幣 ID (FEAT-001)
 *
 * @example
 * ```tsx
 * // 建立模式
 * <ProjectForm mode="create" />
 *
 * // 編輯模式
 * <ProjectForm
 *   mode="edit"
 *   initialData={{
 *     id: 'uuid',
 *     name: 'ERP 系統升級',
 *     budgetPoolId: 'pool-uuid',
 *     budgetCategoryId: 'category-uuid',
 *     requestedBudget: 500000,
 *     managerId: 'manager-uuid',
 *     supervisorId: 'supervisor-uuid',
 *     startDate: new Date('2025-01-01'),
 *     endDate: new Date('2025-12-31')
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Input, Combobox, Select, Button
 * - next-intl: 國際化
 * - React: useState, useEffect
 *
 * @related
 * - packages/api/src/routers/project.ts - 專案 API Router
 * - packages/api/src/routers/budgetPool.ts - 預算池 API (getCategories)
 * - apps/web/src/components/ui/combobox.tsx - Combobox 組件
 * - apps/web/src/app/[locale]/projects/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/projects/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-11-16 (FEAT-001: 新增專案編號、全域標誌、優先權、貨幣欄位)
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce'; // FEAT-001: 專案編號即時驗證
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface ProjectFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    budgetPoolId: string;
    budgetCategoryId: string | null; // Module 2 新增
    requestedBudget: number | null;  // Module 2 新增
    managerId: string;
    supervisorId: string;
    startDate: Date;
    endDate: Date | null;
    // FEAT-001: 專案欄位擴展
    projectCode: string;
    globalFlag: string; // 'RCL' | 'Region'
    priority: string;   // 'High' | 'Medium' | 'Low'
    currencyId: string | null;
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
    budgetCategoryId: initialData?.budgetCategoryId ?? '', // Module 2 新增
    requestedBudget: initialData?.requestedBudget ?? 0,     // Module 2 新增
    managerId: initialData?.managerId ?? '',
    supervisorId: initialData?.supervisorId ?? '',
    startDate: initialData?.startDate ? initialData.startDate.toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.toISOString().split('T')[0] : '',
    // FEAT-001: 專案欄位擴展
    projectCode: initialData?.projectCode ?? '',
    globalFlag: initialData?.globalFlag ?? 'Region', // 預設 Region
    priority: initialData?.priority ?? 'Medium',     // 預設 Medium
    currencyId: initialData?.currencyId ?? '',
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
    { enabled: !!formData.budgetPoolId } // 只在有選擇預算池時查詢
  );

  // Module 2: 當預算池改變時，清空預算類別選擇
  useEffect(() => {
    if (initialData?.budgetPoolId !== formData.budgetPoolId) {
      setFormData((prev) => ({ ...prev, budgetCategoryId: '' }));
    }
  }, [formData.budgetPoolId, initialData?.budgetPoolId]);

  // FEAT-001: 查詢啟用的貨幣列表
  const { data: currencies } = api.currency.getActive.useQuery();

  // FEAT-001: 專案編號即時驗證（debounce 500ms）
  const debouncedProjectCode = useDebounce(formData.projectCode, 500);
  const { data: codeAvailability } = api.project.checkCodeAvailability.useQuery(
    {
      projectCode: debouncedProjectCode,
      excludeProjectId: mode === 'edit' ? initialData?.id : undefined,
    },
    {
      enabled: !!debouncedProjectCode && debouncedProjectCode.length > 0, // 只在有輸入時檢查
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

    // FEAT-001: 專案編號驗證
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
      budgetCategoryId: formData.budgetCategoryId.trim() === '' ? undefined : formData.budgetCategoryId, // Module 2 新增
      requestedBudget: formData.requestedBudget > 0 ? formData.requestedBudget : undefined,              // Module 2 新增
      managerId: formData.managerId,
      supervisorId: formData.supervisorId,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      // FEAT-001: 專案欄位擴展
      projectCode: formData.projectCode,
      globalFlag: formData.globalFlag,
      priority: formData.priority,
      currencyId: formData.currencyId.trim() === '' ? undefined : formData.currencyId,
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
      <div>
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
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* FEAT-001: 專案編號 */}
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
        {/* 即時驗證提示 */}
        {debouncedProjectCode && codeAvailability && (
          <p className={`mt-1 text-sm ${codeAvailability.available ? 'text-green-600' : 'text-red-600'}`}>
            {codeAvailability.available ? tFields('projectCode.available') : tFields('projectCode.alreadyInUse')}
          </p>
        )}
        {errors.projectCode && (
          <p className="mt-1 text-sm text-red-600">{errors.projectCode}</p>
        )}
      </div>

      {/* FEAT-001: 全域標誌和優先權 (兩欄並排) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          {errors.globalFlag && (
            <p className="mt-1 text-sm text-red-600">{errors.globalFlag}</p>
          )}
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
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
          )}
        </div>
      </div>

      {/* FEAT-001: 貨幣 (Combobox 可搜尋) */}
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
        {errors.currencyId && (
          <p className="mt-1 text-sm text-red-600">{errors.currencyId}</p>
        )}
      </div>

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
        {errors.budgetPoolId && (
          <p className="mt-1 text-sm text-red-600">{errors.budgetPoolId}</p>
        )}
      </div>

      {/* Module 2: {tFields('budgetCategory.label')}和請求預算金額 */}
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
          {errors.budgetCategoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.budgetCategoryId}</p>
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
          {errors.requestedBudget && (
            <p className="mt-1 text-sm text-red-600">{errors.requestedBudget}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          {errors.managerId && (
            <p className="mt-1 text-sm text-red-600">{errors.managerId}</p>
          )}
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
          {errors.supervisorId && (
            <p className="mt-1 text-sm text-red-600">{errors.supervisorId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
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
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

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
