import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionsTable } from '@/features/financial/components/subscriptions-table';
import { PlansTable } from '@/features/financial/components/plans-table';

export const metadata: Metadata = {
  title: 'Subscriptions | Yoga Admin',
  description: 'Manage subscriptions and plans',
};

export default function SubscriptionsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Subscriptions</h2>
            <p className='text-muted-foreground'>Manage subscriptions and subscription plans</p>
          </div>
        </div>

        <Tabs defaultValue='subscriptions' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='subscriptions'>Active Subscriptions</TabsTrigger>
            <TabsTrigger value='plans'>Subscription Plans</TabsTrigger>
          </TabsList>

          <TabsContent value='subscriptions'>
            <SubscriptionsTable />
          </TabsContent>

          <TabsContent value='plans'>
            <PlansTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
