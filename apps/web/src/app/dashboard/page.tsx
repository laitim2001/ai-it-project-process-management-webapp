/**
 * Dashboard 主頁
 *
 * 顯示項目概覽、關鍵指標和最近活動
 */

'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  FolderKanban,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - 後續會從 tRPC API 獲取真實數據
  const stats = [
    {
      title: '本月預算額',
      value: 'RM 485,200',
      change: { value: '+12.5%', isPositive: true, label: '較上月' },
      icon: Wallet,
    },
    {
      title: '進行中項目',
      value: '24',
      change: { value: '+8', isPositive: true, label: '較上月' },
      icon: FolderKanban,
    },
    {
      title: '待審批提案',
      value: '32',
      change: { value: '-2.1%', isPositive: false, label: '較上月' },
      icon: FileText,
    },
    {
      title: '預算執行率',
      value: '68.5%',
      change: { value: '+18.2%', isPositive: true, label: '較上月' },
      icon: TrendingUp,
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">儀表板</h1>
          <p className="mt-1 text-muted-foreground">歡迎回來！查看您的專案進度和最新動態</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.change.isPositive ? TrendingUp : TrendingDown;

            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-1 flex items-center text-xs">
                    <TrendIcon
                      className={`mr-1 h-3 w-3 ${
                        stat.change.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    <span
                      className={
                        stat.change.isPositive ? "text-green-600" : "text-red-600"
                      }
                    >
                      {stat.change.value}
                    </span>
                    <span className="ml-1 text-muted-foreground">{stat.change.label}</span>
                  </div>
                </CardContent>
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary opacity-10" />
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Budget Trends Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>預算趨勢</CardTitle>
                  <select className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>近 6 個月</option>
                    <option>近 3 個月</option>
                    <option>本月</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex h-52 items-end justify-between gap-2">
                  {[18, 23, 25, 28, 32, 35].map((height, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full flex items-end justify-center">
                        <span className="absolute -top-6 text-xs rounded-full bg-green-600 px-2 py-0.5 font-medium text-white">
                          +{height}
                        </span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/70"
                          style={{ height: `${height * 4.5}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{i + 1}月</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">RM 485K</p>
                    <p className="text-xs text-muted-foreground">本月預算額</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-base font-semibold text-green-600">+7.8%</p>
                      <p className="text-xs text-muted-foreground">月增長率</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-primary">151</p>
                      <p className="text-xs text-muted-foreground">總提案數</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <CardTitle>快速操作</CardTitle>
              </div>
              <CardDescription>常用功能快捷入口</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="flex flex-col h-auto items-center gap-2 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xl flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-medium text-foreground leading-tight">{action.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{action.description}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>最近活動</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    查看全部 →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-md border p-3 hover:border-muted-foreground/30 transition-colors"
                    >
                      <div className="rounded-md bg-primary/10 p-2.5">
                        {activity.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-medium text-foreground">{activity.title}</h3>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80 leading-snug">{activity.subtitle}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{activity.company}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-foreground whitespace-nowrap">{activity.amount}</p>
                        {activity.status === 'completed' && (
                          <Badge variant="success" className="mt-1">
                            完成
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <CardTitle>AI 洞察</CardTitle>
              </div>
              <CardDescription>基於數據分析的智能建議</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div className="rounded-md bg-card p-3 shadow-sm">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">預算優化建議</span>
                    <span className="text-xs font-semibold text-green-600">92% 信心度</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    系統分析顯示：Q4 雲端服務項目預算使用率偏低，建議重新分配至開發項目以提高整體效益。
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[92%] bg-gradient-to-r from-green-600 to-green-400"></div>
                  </div>
                </div>

                <Button variant="outline" className="w-full justify-between">
                  <span className="text-xs font-medium text-primary">查看詳情</span>
                  <span className="text-base">→</span>
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">今日統計</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">42</span>
                  <span className="text-xs text-foreground/80">待處理提案</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">8</span>
                  <span className="text-xs text-foreground/80">今日會議</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
