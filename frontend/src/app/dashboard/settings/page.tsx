import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureFlagsTable } from '@/features/settings/components/feature-flags-table';
import { SystemSettings } from '@/features/settings/components/system-settings';
import { I18nManagement } from '@/features/settings/components/i18n-management';
import { BannersTable } from '@/features/settings/components/banners-table';
import { NotificationsPanel } from '@/features/settings/components/notifications-panel';
import { MaintenancePanel } from '@/features/settings/components/maintenance-panel';

export const metadata: Metadata = {
  title: 'Settings | Yoga Admin',
  description: 'System settings and configuration',
};

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
            <p className='text-muted-foreground'>System configuration and management</p>
          </div>
        </div>

        <Tabs defaultValue='feature-flags' className='space-y-4'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='feature-flags'>Feature Flags</TabsTrigger>
            <TabsTrigger value='system'>System</TabsTrigger>
            <TabsTrigger value='i18n'>Languages</TabsTrigger>
            <TabsTrigger value='cms'>CMS</TabsTrigger>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
            <TabsTrigger value='maintenance'>Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value='feature-flags'>
            <FeatureFlagsTable />
          </TabsContent>

          <TabsContent value='system'>
            <SystemSettings />
          </TabsContent>

          <TabsContent value='i18n'>
            <I18nManagement />
          </TabsContent>

          <TabsContent value='cms'>
            <BannersTable />
          </TabsContent>

          <TabsContent value='notifications'>
            <NotificationsPanel />
          </TabsContent>

          <TabsContent value='maintenance'>
            <MaintenancePanel />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
