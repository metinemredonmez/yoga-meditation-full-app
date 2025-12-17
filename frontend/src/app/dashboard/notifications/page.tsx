import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PushProvidersSettings } from '@/features/notifications/components/push-providers-settings';
import { NotificationTemplates } from '@/features/notifications/components/notification-templates';
import { BroadcastCampaign } from '@/features/notifications/components/broadcast-campaign';
import { NotificationAnalytics } from '@/features/notifications/components/notification-analytics';
import {
  IconSettings,
  IconTemplate,
  IconSend,
  IconChartBar,
} from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Bildirimler | Yoga Admin',
  description: 'Bildirim sistemi yönetimi',
};

export default function NotificationsPage() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Bildirim Yönetimi</h2>
          <p className='text-muted-foreground'>
            Push, e-posta ve uygulama içi bildirimleri yönetin
          </p>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <IconSend className="h-4 w-4" />
              <span className="hidden sm:inline">Kampanyalar</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <IconTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Şablonlar</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <IconChartBar className="h-4 w-4" />
              <span className="hidden sm:inline">Analitik</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <IconSettings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <BroadcastCampaign />
          </TabsContent>

          <TabsContent value="templates">
            <NotificationTemplates />
          </TabsContent>

          <TabsContent value="analytics">
            <NotificationAnalytics />
          </TabsContent>

          <TabsContent value="settings">
            <PushProvidersSettings />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
