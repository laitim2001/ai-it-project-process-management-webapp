import dynamic from 'next/dynamic';
import { api } from '@/lib/trpc';
import { notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const UserForm = dynamic(
  () => import('@/components/user/UserForm').then((mod) => ({ default: mod.UserForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

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
              <BreadcrumbLink href="/users">使用者</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/users/${params.id}`}>{user.name || user.email}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯使用者</h1>
          <p className="mt-2 text-muted-foreground">
            更新使用者資訊
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <UserForm
              mode="edit"
              initialData={{
                id: user.id,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
