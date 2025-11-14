/**
 * @fileoverview Dashboard Layout Component - Dashboard 佈局組件
 *
 * @description
 * 提供整個應用程式的主佈局結構，包含側邊欄、頂部導航欄和主內容區域。
 * 支援桌面固定側邊欄和移動裝置的響應式彈出側邊欄，
 * 自動處理視窗大小變化和捲軸鎖定，確保最佳用戶體驗。
 *
 * @component DashboardLayout
 *
 * @features
 * - 響應式佈局（桌面固定側邊欄，移動彈出側邊欄）
 * - 移動側邊欄背景遮罩（點擊關閉）
 * - 視窗大小監聽（自動關閉移動選單）
 * - 捲軸鎖定管理（移動選單開啟時）
 * - 主內容區域最大寬度限制（1600px）
 * - 平滑動畫效果（slide-in 動畫）
 * - 無障礙支援（ARIA 屬性）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.children - 主內容區域的子組件
 *
 * @example
 * ```tsx
 * // 在 page.tsx 中使用
 * import { DashboardLayout } from '@/components/layout/dashboard-layout';
 *
 * export default function Page() {
 *   return (
 *     <DashboardLayout>
 *       <div>Your page content here</div>
 *     </DashboardLayout>
 *   );
 * }
 * ```
 *
 * @dependencies
 * - React: useState, useEffect (狀態管理和副作用)
 * - Sidebar: 側邊欄組件
 * - TopBar: 頂部導航欄組件
 * - Tailwind CSS: 響應式佈局和動畫
 *
 * @related
 * - apps/web/src/components/layout/Sidebar.tsx - 側邊欄組件
 * - apps/web/src/components/layout/TopBar.tsx - 頂部導航欄組件
 * - apps/web/src/app/[locale]/dashboard/page.tsx - Dashboard 頁面使用範例
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] animate-in slide-in-from-left duration-300">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// 同時支持 named export 和 default export
export default DashboardLayout
