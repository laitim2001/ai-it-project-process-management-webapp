"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Wallet,
  Building,
  FileCheck,
  ShoppingCart,
  Receipt,
  Users,
  Settings,
} from "lucide-react"

const navigation = [
  {
    title: "主要功能",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "專案管理", href: "/projects", icon: FolderKanban },
      { name: "預算提案", href: "/proposals", icon: FileText },
      { name: "預算池", href: "/budget-pools", icon: Wallet },
    ],
  },
  {
    title: "採購管理",
    items: [
      { name: "供應商", href: "/vendors", icon: Building },
      { name: "報價單", href: "/quotes", icon: FileCheck },
      { name: "採購單", href: "/purchase-orders", icon: ShoppingCart },
      { name: "費用記錄", href: "/expenses", icon: Receipt },
    ],
  },
  {
    title: "系統管理",
    items: [
      { name: "用戶管理", href: "/users", icon: Users },
      { name: "系統設定", href: "/settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white border-r">
      {/* Logo & Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Building className="h-8 w-8 text-primary" />
        <span className="ml-3 text-xl font-semibold">IT 專案管理</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
