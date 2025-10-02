import { ProjectForm } from '@/components/project/ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to create a new project.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
