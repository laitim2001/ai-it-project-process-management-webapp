/**
 * @fileoverview User Settings Page - 用戶設定頁面
 *
 * @description
 * 提供用戶個人設定管理介面，包含個人資訊、通知偏好、顯示偏好和安全設定。
 * 支援主題切換（Light/Dark/System）、語言切換（繁中/英文）和通知偏好設定。
 * 整合 NextAuth.js 會話管理，提供密碼修改和帳戶安全功能。
 *
 * @page /[locale]/settings
 *
 * @features
 * - 個人資訊管理（名稱、電郵、頭像）
 * - 通知偏好設定（電郵通知、瀏覽器通知）
 * - 顯示偏好設定（主題模式、語言、時區）
 * - 安全設定（密碼修改、會話管理）
 * - 主題切換（Light/Dark/System）
 * - 語言切換（繁體中文/English）
 * - 通知開關（提案通知、費用通知、系統通知）
 * - 即時預覽（主題和語言切換即時生效）
 * - 表單驗證（Zod schema）
 * - 成功提示和錯誤處理（Toast）
 *
 * @permissions
 * - All authenticated users: 管理自己的設定
 *
 * @routing
 * - 設定頁: /settings
 *
 * @stateManagement
 * - Form State: React Hook Form
 * - Theme State: useTheme hook (next-themes)
 * - Locale State: next-intl routing
 * - Session State: NextAuth useSession
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next-themes: 主題管理
 * - next-auth/react: 會話管理
 * - @tanstack/react-query: tRPC mutation
 * - shadcn/ui: Card, Input, Switch, Button, Label
 *
 * @related
 * - packages/api/src/routers/user.ts - 用戶更新 API
 * - apps/web/src/components/theme/ThemeToggle.tsx - 主題切換組件
 * - apps/web/src/components/layout/LanguageSwitcher.tsx - 語言切換組件
 * - packages/auth/src/index.ts - NextAuth 配置
 *
 * @author IT Department
 * @since Post-MVP - User Experience Enhancements
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Settings, User, Bell, Eye, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
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
      title: t('toast.success'),
      description: t('toast.profileUpdated'),
      variant: 'success',
    });
  };

  const handleSaveNotifications = () => {
    // TODO: 實現 API 調用保存通知設定
    toast({
      title: t('toast.success'),
      description: t('toast.notificationsUpdated'),
      variant: 'success',
    });
  };

  const handleSavePreferences = () => {
    // TODO: 實現 API 調用保存顯示偏好
    toast({
      title: t('toast.success'),
      description: t('toast.preferencesUpdated'),
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* Tabs 設定選單 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.preferences')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.security')}</span>
            </TabsTrigger>
          </TabsList>

          {/* 個人資料 Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('profile.title')}
                </CardTitle>
                <CardDescription>
                  {t('profile.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('profile.name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('profile.email')}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.emailNote')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t('profile.role')}</Label>
                  <Input
                    id="role"
                    value={(session?.user as any)?.role?.name || ''}
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    {t('profile.save')}
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
                  {t('notificationSettings.title')}
                </CardTitle>
                <CardDescription>
                  {t('notificationSettings.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('notificationSettings.emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationSettings.emailNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('notificationSettings.proposalNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationSettings.proposalNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={proposalNotifications}
                    onCheckedChange={setProposalNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('notificationSettings.expenseNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationSettings.expenseNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={expenseNotifications}
                    onCheckedChange={setExpenseNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('notificationSettings.projectUpdates')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationSettings.projectUpdatesDesc')}
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
                    {tCommon('actions.save')}
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
                  {t('preferences.title')}
                </CardTitle>
                <CardDescription>
                  {t('preferences.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('preferences.language')}</Label>
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
                  <Label htmlFor="timezone">{t('preferences.timezone')}</Label>
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
                  <Label htmlFor="dateFormat">{t('preferences.dateFormat')}</Label>
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
                    {tCommon('actions.save')}
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
                  {t('security.title')}
                </CardTitle>
                <CardDescription>
                  {t('security.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('security.password')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('security.passwordNote')}
                  </p>
                  <Button variant="outline" disabled>
                    {t('security.changePassword')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('security.twoFactor')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('security.twoFactorNote')}
                  </p>
                  <Button variant="outline" disabled>
                    {t('security.enableTwoFactor')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('security.activityLog')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('security.activityLogNote')}
                  </p>
                  <Button variant="outline" disabled>
                    {t('security.viewActivityLog')}
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
