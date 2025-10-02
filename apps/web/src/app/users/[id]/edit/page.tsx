import { api } from '@/lib/trpc';
import { UserForm } from '@/components/user/UserForm';
import { notFound } from 'next/navigation';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await api.user.getById.query({ id: params.id });

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">編輯使用者</h1>
        <p className="mt-2 text-gray-600">
          更新使用者資訊
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <UserForm
          mode="edit"
          initialData={{
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
          }}
        />
      </div>
    </div>
  );
}
