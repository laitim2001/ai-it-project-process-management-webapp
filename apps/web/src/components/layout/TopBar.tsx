/**
 * 頂部導航欄組件
 *
 * 包含搜索、通知和用戶菜單
 */

'use client';

import { MagnifyingGlassIcon, BellIcon, GlobeAltIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 transition-colors mr-2"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden sm:block sm:w-64 lg:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="搜索專案、文檔、知識..."
            className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-10 pr-4 text-[14px] text-neutral-950 placeholder:text-neutral-500 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant */}
        <button className="hidden md:flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:border-primary-300 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="hidden lg:inline">AI 助手</span>
        </button>

        {/* Language */}
        <button className="hidden sm:block rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 transition-colors">
          <GlobeAltIcon className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <button className="hidden sm:block rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 transition-colors">
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-semantic-error"></span>
        </button>

        {/* User Info */}
        {session && (
          <div className="flex items-center gap-2 ml-2">
            <div className="hidden lg:block text-right">
              <p className="text-[13px] font-medium text-neutral-950">{session.user.name}</p>
              <p className="text-[11px] text-neutral-600">{session.user.email}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-[14px]">
              {session.user.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
