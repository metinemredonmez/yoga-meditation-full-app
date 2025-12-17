import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { CategoriesTable } from '@/features/community/components/categories-table';

export const metadata: Metadata = {
  title: 'Forum Kategorileri | Yoga Admin',
  description: 'Forum kategorilerini yönet',
};

export default function CategoriesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Kategoriler</h2>
            <p className='text-muted-foreground'>Forum kategorilerini yönet</p>
          </div>
        </div>
        <CategoriesTable />
      </div>
    </PageContainer>
  );
}
