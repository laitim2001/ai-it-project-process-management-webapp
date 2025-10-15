'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // 已登入，重定向到 Dashboard
      router.push('/dashboard');
    } else {
      // 未登入，重定向到登入頁面
      router.push('/login');
    }
  }, [session, status, router]);

  // 顯示載入畫面
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}
