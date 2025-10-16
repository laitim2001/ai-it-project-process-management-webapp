'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const ProjectForm = dynamic(
  () => import('@/components/project/ProjectForm').then((mod) => ({ default: mod.ProjectForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading } = api.project.getById.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-[480px]" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Form Card Skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/projects">專案</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>編輯</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到專案。此專案可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/projects">
                <Button>返回專案列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">專案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{project.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯專案</h1>
          <p className="mt-2 text-muted-foreground">
            更新專案資訊
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
