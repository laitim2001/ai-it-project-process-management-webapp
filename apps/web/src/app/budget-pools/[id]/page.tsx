'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

export default function BudgetPoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });
  const { data: stats } = api.budgetPool.getStats.useQuery({ id });

  const deleteMutation = api.budgetPool.delete.useMutation({
    onSuccess: () => {
      showToast('Budget pool deleted successfully!', 'success');
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this budget pool?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!budgetPool) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Budget pool not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{budgetPool.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/budget-pools/${id}/edit`}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Budget Pool Information</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Financial Year:</dt>
                <dd className="font-medium">{budgetPool.financialYear}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Budget:</dt>
                <dd className="font-medium text-lg">
                  ${budgetPool.totalAmount.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd className="font-medium">
                  {new Date(budgetPool.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">Budget Statistics</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Allocated:</dt>
                  <dd className="font-medium">${stats.totalAllocated.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Spent:</dt>
                  <dd className="font-medium">${stats.totalSpent.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Remaining:</dt>
                  <dd className="font-medium text-green-600">
                    ${stats.remaining.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Utilization Rate:</dt>
                  <dd className="font-medium">{stats.utilizationRate.toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Projects ({budgetPool.projects.length})
            </h2>
            {budgetPool.projects.length === 0 ? (
              <p className="text-gray-500">No projects yet</p>
            ) : (
              <ul className="space-y-3">
                {budgetPool.projects.map((project) => (
                  <li key={project.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Manager: {project.manager.name || project.manager.email}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {project.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
