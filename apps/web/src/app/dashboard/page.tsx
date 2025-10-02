/**
 * Dashboard 主頁
 *
 * 顯示項目概覽、關鍵指標和最近活動
 */

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  CurrencyDollarIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  // Mock data - 後續會從 tRPC API 獲取真實數據
  const stats = [
    {
      title: '本月預算額',
      value: 'RM 485,200',
      change: { value: '+12.5%', type: 'increase' as const, label: '較上月' },
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      bgColor: 'bg-primary-500',
    },
    {
      title: '進行中項目',
      value: '24',
      change: { value: '+8', type: 'increase' as const, label: '較上月' },
      icon: <FolderIcon className="h-6 w-6" />,
      bgColor: 'bg-accent',
    },
    {
      title: '待審批提案',
      value: '32',
      change: { value: '-2.1%', type: 'decrease' as const, label: '較上月' },
      icon: <DocumentTextIcon className="h-6 w-6" />,
      bgColor: 'bg-semantic-warning',
    },
    {
      title: '預算執行率',
      value: '68.5%',
      change: { value: '+18.2%', type: 'increase' as const, label: '較上月' },
      icon: <ChartBarIcon className="h-6 w-6" />,
      bgColor: 'bg-semantic-success',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: '客戶電話會議',
      subtitle: '討論 Q4 合作計劃和預算分配',
      company: 'ABC Corporation',
      time: '1 小時前',
      amount: 'RM 150,000',
      status: 'completed',
    },
    {
      id: 2,
      title: '提案文件生成',
      subtitle: 'AI 自動生成人工智慧解決方案提案文件',
      company: 'XYZ Technology',
      time: '2 小時前',
      amount: 'RM 85,000',
      status: 'completed',
    },
    {
      id: 3,
      title: '新增客戶',
      subtitle: '系統自動創建新客戶資料',
      company: 'Tech Startup Inc',
      time: '3 小時前',
      amount: 'RM 45,000',
      status: 'pending',
    },
  ];

  const quickActions = [
    { name: '新增客戶', description: '建立新的客戶資料', icon: '➕' },
    { name: 'AI 助手', description: '開始智能對話', icon: '💬' },
    { name: '生成提案', description: '創建新提案文件', icon: '📋' },
    { name: '知識搜索', description: '查找產品信息', icon: '🔍' },
    { name: '安排會議', description: '預約客戶會議', icon: '📅' },
    { name: '聯絡客戶', description: '撥打或發送郵件', icon: '📞' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-neutral-950 leading-tight">儀表板</h1>
        <p className="mt-1 text-[13px] sm:text-[14px] text-neutral-600">歡迎回來！查看您的專案進度和最新動態</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-3">
        {/* Budget Trends Chart */}
        <div className="xl:col-span-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] lg:text-[18px] font-semibold text-neutral-950">預算趨勢</h2>
              <select className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-[13px] text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-100">
                <option>近 6 個月</option>
                <option>近 3 個月</option>
                <option>本月</option>
              </select>
            </div>
            <div className="flex h-48 lg:h-52 items-end justify-between gap-2">
              {[18, 23, 25, 28, 32, 35].map((height, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center">
                    <span className="absolute -top-6 text-[11px] rounded-full bg-semantic-success px-2 py-0.5 font-medium text-white">
                      +{height}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-primary-400"
                      style={{ height: `${height * 4.5}px` }}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-600">{i + 1}月</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3">
              <div>
                <p className="text-[20px] lg:text-[22px] font-bold text-neutral-950">RM 485K</p>
                <p className="text-[12px] text-neutral-600">本月預算額</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-semantic-success">+7.8%</p>
                  <p className="text-[11px] text-neutral-600">月增長率</p>
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-primary-600">151</p>
                  <p className="text-[11px] text-neutral-600">總提案數</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="text-[17px] lg:text-[18px] font-semibold text-neutral-950">快速操作</h2>
          </div>
          <p className="mb-3 text-[12px] text-neutral-600">常用功能快捷入口</p>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 rounded-md border border-neutral-200 bg-white p-3 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-xl flex-shrink-0">
                  {action.icon}
                </div>
                <div className="w-full">
                  <p className="text-[12px] font-medium text-neutral-950 leading-tight">{action.name}</p>
                  <p className="text-[11px] text-neutral-600 truncate mt-0.5">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="xl:col-span-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] lg:text-[18px] font-semibold text-neutral-950">最近活動</h2>
              <button className="text-[13px] text-primary-600 hover:text-primary-hover transition-colors">
                查看全部 →
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-md border border-neutral-200 p-3 hover:border-neutral-300 transition-colors"
                >
                  <div className="rounded-md bg-primary-50 p-2.5">
                    {activity.status === 'completed' ? (
                      <CheckCircleIcon className="h-5 w-5 text-semantic-success" />
                    ) : (
                      <ClockIcon className="h-5 w-5 text-semantic-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[13px] font-medium text-neutral-950">{activity.title}</h3>
                      <span className="text-[12px] text-neutral-500">•</span>
                      <span className="text-[12px] text-neutral-600">{activity.time}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-neutral-700 leading-snug">{activity.subtitle}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-600">{activity.company}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-semibold text-neutral-950 whitespace-nowrap">{activity.amount}</p>
                    {activity.status === 'completed' && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 mt-1">
                        完成
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-accent-light/20 p-4 lg:p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h2 className="text-[17px] lg:text-[18px] font-semibold text-neutral-950">AI 洞察</h2>
          </div>
          <p className="mb-3 text-[12px] text-neutral-700">基於數據分析的智能建議</p>

          <div className="space-y-2.5">
            <div className="rounded-md bg-white p-3 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] font-medium text-neutral-800">預算優化建議</span>
                <span className="text-[11px] font-semibold text-semantic-success">92% 信心度</span>
              </div>
              <p className="text-[12px] text-neutral-700 leading-relaxed">
                系統分析顯示：Q4 雲端服務項目預算使用率偏低，建議重新分配至開發項目以提高整體效益。
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full w-[92%] bg-gradient-to-r from-semantic-success to-green-400"></div>
              </div>
            </div>

            <button className="flex w-full items-center justify-between rounded-md bg-white p-2.5 text-left hover:bg-neutral-50 transition-colors shadow-sm">
              <span className="text-[12px] font-medium text-primary-600">查看詳情</span>
              <span className="text-base">→</span>
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold text-neutral-700">今日統計</p>
            <div className="flex items-center justify-between">
              <span className="text-[22px] font-bold text-neutral-950">42</span>
              <span className="text-[12px] text-neutral-700">待處理提案</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[22px] font-bold text-neutral-950">8</span>
              <span className="text-[12px] text-neutral-700">今日會議</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
