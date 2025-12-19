import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MeditationCategoriesTable } from '@/features/wellness/components/meditation-categories-table';

export const metadata: Metadata = {
  title: 'Meditasyon Kategorileri | Yoga Admin',
  description: 'Meditasyon kategorilerini yönetin',
};

export default function MeditationCategoriesPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meditasyon Kategorileri</h2>
          <p className="text-muted-foreground">
            Meditasyon kategorilerini oluşturun ve düzenleyin
          </p>
        </div>
        <MeditationCategoriesTable />
      </div>
    </PageContainer>
  );
}
