'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/Toast';

interface ProjectFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    budgetPoolId: string;
    managerId: string;
    supervisorId: string;
    startDate: Date;
    endDate: Date | null;
  };
  mode: 'create' | 'edit';
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    budgetPoolId: initialData?.budgetPoolId ?? '',
    managerId: initialData?.managerId ?? '',
    supervisorId: initialData?.supervisorId ?? '',
    startDate: initialData?.startDate ? initialData.startDate.toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch budget pools for dropdown
  const { data: budgetPools } = api.budgetPool.getAll.useQuery();

  // Fetch users for manager and supervisor dropdowns
  const { data: managers } = api.user.getManagers.useQuery();
  const { data: supervisors } = api.user.getSupervisors.useQuery();

  const createMutation = api.project.create.useMutation({
    onSuccess: () => {
      showToast('Project created successfully!', 'success');
      router.push('/projects');
      router.refresh();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const updateMutation = api.project.update.useMutation({
    onSuccess: () => {
      showToast('Project updated successfully!', 'success');
      router.push(`/projects/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.budgetPoolId) {
      newErrors.budgetPoolId = 'Budget pool is required';
    }

    if (!formData.managerId) {
      newErrors.managerId = 'Project manager is required';
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = 'Supervisor is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
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
      description: formData.description || null,
      budgetPoolId: formData.budgetPoolId,
      managerId: formData.managerId,
      supervisorId: formData.supervisorId,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null,
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
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="e.g., Cloud Migration Phase 1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Describe the project objectives and scope..."
        />
      </div>

      <div>
        <label htmlFor="budgetPoolId" className="block text-sm font-medium text-gray-700">
          Budget Pool *
        </label>
        <select
          id="budgetPoolId"
          value={formData.budgetPoolId}
          onChange={(e) => setFormData({ ...formData, budgetPoolId: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Select a budget pool</option>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
            Project Manager *
          </label>
          <select
            id="managerId"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select a manager</option>
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
            Supervisor *
          </label>
          <select
            id="supervisorId"
            value={formData.supervisorId}
            onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select a supervisor</option>
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
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
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
            End Date
          </label>
          <input
            type="date"
            id="endDate"
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
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Update Project'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
