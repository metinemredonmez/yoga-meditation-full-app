import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModerationStats } from '@/features/moderation/components/moderation-stats';
import { ReportsTable } from '@/features/moderation/components/reports-table';
import { CommentsTable } from '@/features/moderation/components/comments-table';

export const metadata: Metadata = {
  title: 'Moderation | Yoga Admin',
  description: 'Content moderation and reports',
};

export default function ModerationPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Moderation</h2>
            <p className='text-muted-foreground'>Review reports and moderate content</p>
          </div>
        </div>

        <ModerationStats />

        <Tabs defaultValue='reports' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
            <TabsTrigger value='comments'>Comments</TabsTrigger>
          </TabsList>

          <TabsContent value='reports'>
            <ReportsTable />
          </TabsContent>

          <TabsContent value='comments'>
            <CommentsTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
