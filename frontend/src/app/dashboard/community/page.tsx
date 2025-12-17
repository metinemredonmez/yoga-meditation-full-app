import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ForumStats } from '@/features/community/components/forum-stats';

export const metadata: Metadata = {
  title: 'Community | Yoga Admin',
  description: 'Forum ve topluluk yönetimi',
};

export default function CommunityPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Community</h2>
            <p className='text-muted-foreground'>Forum ve topluluk yönetimi</p>
          </div>
        </div>
        <ForumStats />
      </div>
    </PageContainer>
  );
}
