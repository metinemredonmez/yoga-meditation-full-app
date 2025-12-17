import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ClassesTable } from '@/features/content/components/classes-table';

export const metadata: Metadata = {
  title: 'Dersler | Yoga Admin',
  description: 'Yoga derslerini yönet',
};

export default function ClassesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Dersler</h2>
          <p className='text-muted-foreground'>Yoga derslerini yönetin</p>
        </div>
        <ClassesTable />
      </div>
    </PageContainer>
  );
}
