import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PosesTable } from '@/features/content/components/poses-table';

export const metadata: Metadata = {
  title: 'Pozlar | Yoga Admin',
  description: 'Yoga pozlarını yönet',
};

export default function PosesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Pozlar</h2>
          <p className='text-muted-foreground'>Yoga pozlarını yönetin</p>
        </div>
        <PosesTable />
      </div>
    </PageContainer>
  );
}
