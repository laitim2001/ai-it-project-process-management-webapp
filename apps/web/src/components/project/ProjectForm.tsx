'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';

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
          {tFields('name.label')} {tCommon('required')}
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
        <label htmlFor="budgetPoolId" className="block text-sm font-medium text-gray-700">
          {tFields('budgetPool.label')} {tCommon('required')}
        </label>
        <select
          id="budgetPoolId"
          name="budgetPoolId"
          value={formData.budgetPoolId}
          onChange={(e) => setFormData({ ...formData, budgetPoolId: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">{tFields('budgetPool.placeholder')}</option>
          {budgetPools?.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.name} - FY{pool.financialYear} (${pool.totalAmount.toLocaleString()})
            </option>
          ))}
        </select>
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
            {tFields('manager.label')} {tCommon('required')}
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
            {tFields('supervisor.label')} {tCommon('required')}
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
            {tFields('startDate.label')} {tCommon('required')}
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
