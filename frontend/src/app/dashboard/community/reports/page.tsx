import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ReportsTable } from '@/features/community/components/reports-table';

export const metadata: Metadata = {
  title: 'İçerik Raporları | Yoga Admin',
  description: 'Raporlanmış içerikleri yönet',
};

export default function ReportsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>İçerik Raporları</h2>
            <p className='text-muted-foreground'>Kullanıcılar tarafından raporlanan içerikleri inceleyin ve yönetin</p>
          </div>
        </div>
        <ReportsTable />
      </div>
    </PageContainer>
  );
}
