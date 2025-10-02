/**
 * User 列表頁面
 *
 * 顯示所有使用者的列表，包含以下功能：
 * - 顯示使用者資訊（名稱、Email、角色）
 * - 根據角色篩選
 * - 新增使用者
 * - 編輯使用者
 * - 刪除使用者
 */

import Link from 'next/link';
import { api } from '@/lib/trpc';

export default async function UsersPage() {
  const users = await api.user.getAll.query();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">使用者管理</h1>
          <p className="mt-2 text-gray-600">管理系統中的所有使用者</p>
        </div>
        <Link
          href="/users/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          新增使用者
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                名稱
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                電子郵件
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                角色
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                建立時間
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  尚無使用者資料
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${user.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {user.name || '(未設定名稱)'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/users/${user.id}`}
                      className="mr-4 text-blue-600 hover:text-blue-800"
                    >
                      查看
                    </Link>
                    <Link
                      href={`/users/${user.id}/edit`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        總共 {users.length} 位使用者
      </div>
    </div>
  );
}
