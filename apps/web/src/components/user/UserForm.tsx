'use client';

/**
 * UserForm 組件
 *
 * 用於新增和編輯使用者的表單組件
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

interface UserFormProps {
  initialData?: {
    id: string;
    email: string;
    name: string | null;
    roleId: number;
  };
  mode: 'create' | 'edit';
}

export function UserForm({ initialData, mode }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: initialData?.email ?? '',
    name: initialData?.name ?? '',
    roleId: initialData?.roleId ?? 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 取得所有角色
  const { data: roles } = api.user.getRoles.useQuery();

  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '使用者建立成功！',
        variant: 'success',
      });
      router.push('/users');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: `錯誤: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '使用者更新成功！',
        variant: 'success',
      });
      router.push(`/users/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: `錯誤: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = '電子郵件為必填欄位';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件格式';
    }

    if (!formData.roleId) {
      newErrors.roleId = '角色為必填欄位';
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
      email: formData.email,
      name: formData.name || undefined,
      roleId: formData.roleId,
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

  const getRoleName = (roleName: string) => {
    switch (roleName) {
      case 'ProjectManager':
        return '專案管理者';
      case 'Supervisor':
        return '監督者';
      case 'Admin':
        return '管理員';
      default:
        return roleName;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          電子郵件 *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="user@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          名稱
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="使用者名稱"
        />
      </div>

      <div>
        <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
          角色 *
        </label>
        <select
          id="roleId"
          value={formData.roleId}
          onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">選擇角色</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {getRoleName(role.name)}
            </option>
          ))}
        </select>
        {errors.roleId && (
          <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '儲存中...' : mode === 'create' ? '建立使用者' : '更新使用者'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
