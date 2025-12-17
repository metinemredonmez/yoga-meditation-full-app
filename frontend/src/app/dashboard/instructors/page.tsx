import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { InstructorsTable } from '@/features/instructors/components/instructors-table';

export const metadata: Metadata = {
  title: 'Instructors | Yoga Admin',
  description: 'Manage platform instructors',
};

export default function InstructorsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Instructors</h2>
            <p className='text-muted-foreground'>Manage and approve instructor applications</p>
          </div>
        </div>
        <InstructorsTable />
      </div>
    </PageContainer>
  );
}
