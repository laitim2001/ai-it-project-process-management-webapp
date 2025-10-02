import { api } from '@/lib/trpc';
import { ProjectForm } from '@/components/project/ProjectForm';
import { notFound } from 'next/navigation';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const project = await api.project.getById.query({ id: params.id });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
        <p className="mt-2 text-gray-600">
          Update the project details below.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <ProjectForm
          mode="edit"
          initialData={{
            id: project.id,
            name: project.name,
            description: project.description,
            budgetPoolId: project.budgetPoolId,
            managerId: project.managerId,
            supervisorId: project.supervisorId,
            startDate: project.startDate,
            endDate: project.endDate,
          }}
        />
      </div>
    </div>
  );
}
