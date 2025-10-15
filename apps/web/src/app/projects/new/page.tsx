import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 動態導入表單元件以減少初始 bundle size
const ProjectForm = dynamic(() => import('@/components/project/ProjectForm').then(mod => ({ default: mod.ProjectForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

export default function NewProjectPage() {
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
              <BreadcrumbPage>新增專案</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">新增專案</h1>
          <p className="mt-2 text-muted-foreground">
            填寫以下資訊以建立新專案
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <ProjectForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
