import { UserForm } from '@/components/user/UserForm';

export default function NewUserPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">新增使用者</h1>
        <p className="mt-2 text-gray-600">
          填寫以下資訊以建立新的使用者
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
