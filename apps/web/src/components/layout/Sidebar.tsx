/**
 * 側邊欄導航組件
 *
 * 現代化的側邊欄，包含主要導航和用戶信息
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  HomeIcon,
  FolderIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: '儀表板', href: '/dashboard', icon: HomeIcon },
  { name: '專案管理', href: '/projects', icon: FolderIcon, badge: 12 },
  { name: '預算池', href: '/budget-pools', icon: CurrencyDollarIcon },
  { name: '預算提案', href: '/budget-proposals', icon: DocumentTextIcon },
  { name: '供應商管理', href: '/vendors', icon: BuildingStorefrontIcon },
  { name: '採購單', href: '/purchase-orders', icon: ShoppingCartIcon },
  { name: '費用管理', href: '/expenses', icon: ReceiptPercentIcon },
  { name: '用戶管理', href: '/users', icon: UsersIcon },
];

const aiTools = [
  { name: 'AI 搜索', href: '/ai/search', icon: ChartBarIcon },
];

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        flex h-screen w-64 lg:w-56 flex-shrink-0 flex-col bg-white border-r border-neutral-200
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <FolderIcon className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-neutral-950 leading-tight">IT 專案平台</h1>
          <p className="text-[11px] text-neutral-600 leading-tight">智慧型管理</p>
        </div>
      </div>

      {/* User Info */}
      {session && (
        <div className="border-b border-neutral-200 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold text-sm">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-neutral-950 truncate leading-tight">
                {session.user.name}
              </p>
              <p className="text-[11px] text-neutral-600 truncate leading-tight">{session.user.role.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="space-y-0.5">
          <p className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            概覽
          </p>
          {navigation.slice(0, 1).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 space-y-0.5">
          <p className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            專案管理
          </p>
          {navigation.slice(1, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 space-y-0.5">
          <p className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            採購管理
          </p>
          {navigation.slice(4, 7).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 space-y-0.5">
          <p className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            系統管理
          </p>
          {navigation.slice(7).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 space-y-0.5">
          <p className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            AI 工具
          </p>
          {aiTools.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-neutral-200 p-2.5">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          登出
        </button>
      </div>
    </div>
    </>
  );
}
