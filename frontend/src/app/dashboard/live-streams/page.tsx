import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { LiveStreamsTable } from '@/features/live-streams/components/live-streams-table';

export const metadata: Metadata = {
  title: 'Live Streams | Yoga Admin',
  description: 'Manage live streaming sessions',
};

export default function LiveStreamsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Live Streams</h2>
            <p className='text-muted-foreground'>Monitor and manage live streaming sessions</p>
          </div>
        </div>
        <LiveStreamsTable />
      </div>
    </PageContainer>
  );
}
