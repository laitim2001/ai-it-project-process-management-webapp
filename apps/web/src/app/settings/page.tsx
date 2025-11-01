'use client';

/**
 * 系統設定頁面
 *
 * 功能說明:
 * - 用戶個人設定
 * - 通知偏好設定
 * - 顯示偏好設定
 * - 安全設定
 *
 * Future Enhancement
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Settings, User, Bell, Eye, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // 個人資料設定
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');

  // 通知設定
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [proposalNotifications, setProposalNotifications] = useState(true);
  const [expenseNotifications, setExpenseNotifications] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);

  // 顯示偏好
  const [language, setLanguage] = useState('zh-TW');
  const [timezone, setTimezone] = useState('Asia/Taipei');
  const [dateFormat, setDateFormat] = useState('YYYY/MM/DD');

  // 處理儲存設定
  const handleSaveProfile = () => {
    // TODO: 實現 API 調用保存個人資料
    toast({
      title: '成功',
      description: '個人資料已更新',
      variant: 'success',
    });
  };

  const handleSaveNotifications = () => {
    // TODO: 實現 API 調用保存通知設定
    toast({
      title: '成功',
      description: '通知設定已更新',
      variant: 'success',
    });
  };

  const handleSavePreferences = () => {
    // TODO: 實現 API 調用保存顯示偏好
    toast({
      title: '成功',
      description: '顯示偏好已更新',
      variant: 'success',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>系統設定</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
            <p className="mt-2 text-muted-foreground">管理您的帳號設定和偏好</p>
          </div>
        </div>

        {/* Tabs 設定選單 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">個人資料</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">通知設定</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">顯示偏好</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">安全設定</span>
            </TabsTrigger>
          </TabsList>

          {/* 個人資料 Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  個人資料
                </CardTitle>
                <CardDescription>
                  更新您的個人資訊
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="輸入您的姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="輸入您的 Email"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email 地址由系統管理員管理，無法自行修改
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Input
                    id="role"
                    value={(session?.user as any)?.role?.name || ''}
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    儲存變更
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知設定 Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知設定
                </CardTitle>
                <CardDescription>
                  管理您接收通知的方式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email 通知</Label>
                    <p className="text-sm text-muted-foreground">
                      接收系統 Email 通知
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>預算提案通知</Label>
                    <p className="text-sm text-muted-foreground">
                      當提案狀態變更時通知
                    </p>
                  </div>
                  <Switch
                    checked={proposalNotifications}
                    onCheckedChange={setProposalNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>費用審批通知</Label>
                    <p className="text-sm text-muted-foreground">
                      當費用需要審批時通知
                    </p>
                  </div>
                  <Switch
                    checked={expenseNotifications}
                    onCheckedChange={setExpenseNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>專案更新通知</Label>
                    <p className="text-sm text-muted-foreground">
                      當專案有重要更新時通知
                    </p>
                  </div>
                  <Switch
                    checked={projectUpdates}
                    onCheckedChange={setProjectUpdates}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="mr-2 h-4 w-4" />
                    儲存變更
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 顯示偏好 Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  顯示偏好
                </CardTitle>
                <CardDescription>
                  自訂系統顯示設定
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">語言</Label>
                  <Select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="zh-TW">繁體中文</option>
                    <option value="en">English</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">時區</Label>
                  <Select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="Asia/Taipei">台北 (GMT+8)</option>
                    <option value="Asia/Hong_Kong">香港 (GMT+8)</option>
                    <option value="Asia/Shanghai">上海 (GMT+8)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">日期格式</Label>
                  <Select
                    id="dateFormat"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    <Save className="mr-2 h-4 w-4" />
                    儲存變更
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全設定 Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全設定
                </CardTitle>
                <CardDescription>
                  管理您的帳號安全性
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>密碼</Label>
                  <p className="text-sm text-muted-foreground">
                    您的密碼透過 Azure AD B2C 管理
                  </p>
                  <Button variant="outline" disabled>
                    變更密碼
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>雙因素驗證</Label>
                  <p className="text-sm text-muted-foreground">
                    增強帳號安全性（未來功能）
                  </p>
                  <Button variant="outline" disabled>
                    啟用雙因素驗證
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>活動記錄</Label>
                  <p className="text-sm text-muted-foreground">
                    查看您的帳號活動歷史
                  </p>
                  <Button variant="outline" disabled>
                    查看活動記錄
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
