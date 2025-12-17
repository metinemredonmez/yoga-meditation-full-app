import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { TopicsTable } from '@/features/community/components/topics-table';

export const metadata: Metadata = {
  title: 'Forum Konuları | Yoga Admin',
  description: 'Forum konularını yönet',
};

export default function TopicsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Konular</h2>
            <p className='text-muted-foreground'>Forum konularını yönet</p>
          </div>
        </div>
        <TopicsTable />
      </div>
    </PageContainer>
  );
}
