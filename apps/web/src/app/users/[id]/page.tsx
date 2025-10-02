/**
 * User 詳情頁面
 *
 * 顯示單一使用者的詳細資訊
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await api.user.getById.query({ id: params.id });

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.name || '(未設定名稱)'}
          </h1>
          <p className="mt-2 text-gray-600">{user.email}</p>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/users/${user.id}/edit`}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            編輯
          </Link>
          <Link
            href="/users"
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            返回列表
          </Link>
        </div>
      </div>

      {/* 基本資訊 */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">基本資訊</h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">電子郵件</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">角色</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  user.role.name === 'Admin'
                    ? 'bg-red-100 text-red-800'
                    : user.role.name === 'Supervisor'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {user.role.name === 'ProjectManager'
                  ? '專案管理者'
                  : user.role.name === 'Supervisor'
                  ? '監督者'
                  : '管理員'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">建立時間</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleString('zh-TW')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">最後更新</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.updatedAt).toLocaleString('zh-TW')}
            </dd>
          </div>
        </dl>
      </div>

      {/* 管理的專案 */}
      {user.projects && user.projects.length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            管理的專案 ({user.projects.length})
          </h2>
          <div className="space-y-3">
            {user.projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {project.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    預算池: {project.budgetPool.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    project.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'InProgress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 監督的專案 */}
      {user.approvals && user.approvals.length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            監督的專案 ({user.approvals.length})
          </h2>
          <div className="space-y-3">
            {user.approvals.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {project.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    預算池: {project.budgetPool.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    project.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'InProgress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
