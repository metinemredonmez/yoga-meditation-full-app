import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsCards } from '@/features/analytics/components/analytics-cards';
import { UserAnalytics } from '@/features/analytics/components/user-analytics';
import { RevenueAnalytics } from '@/features/analytics/components/revenue-analytics';
import { ContentAnalytics } from '@/features/analytics/components/content-analytics';
import { ExportPanel } from '@/features/analytics/components/export-panel';

export const metadata: Metadata = {
  title: 'Analytics | Yoga Admin',
  description: 'Platform analytics and insights',
};

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Analytics</h2>
            <p className='text-muted-foreground'>Platform insights and performance metrics</p>
          </div>
        </div>

        <AnalyticsCards />

        <Tabs defaultValue='users' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='users'>Users</TabsTrigger>
            <TabsTrigger value='revenue'>Revenue</TabsTrigger>
            <TabsTrigger value='content'>Content</TabsTrigger>
            <TabsTrigger value='export'>Export</TabsTrigger>
          </TabsList>

          <TabsContent value='users'>
            <UserAnalytics />
          </TabsContent>

          <TabsContent value='revenue'>
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value='content'>
            <ContentAnalytics />
          </TabsContent>

          <TabsContent value='export'>
            <ExportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
