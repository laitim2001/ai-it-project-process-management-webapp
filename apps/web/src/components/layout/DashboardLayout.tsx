/**
 * Dashboard 布局組件
 *
 * 包含側邊欄和主內容區域的整體布局
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
