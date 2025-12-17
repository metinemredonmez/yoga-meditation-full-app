import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ChallengesTable } from '@/features/content/components/challenges-table';

export const metadata: Metadata = {
  title: 'Challenge | Yoga Admin',
  description: 'Yoga challenge\'larını yönet',
};

export default function ChallengesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Challenge</h2>
          <p className='text-muted-foreground'>Yoga challenge&apos;larını yönetin</p>
        </div>
        <ChallengesTable />
      </div>
    </PageContainer>
  );
}
