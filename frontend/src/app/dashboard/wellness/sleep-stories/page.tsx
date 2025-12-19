import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SleepStoriesTable } from '@/features/wellness/components/sleep-stories-table';

export const metadata: Metadata = {
  title: 'Uyku Hikayeleri | Yoga Admin',
  description: 'Uyku hikayelerini yönetin',
};

export default function SleepStoriesPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Uyku Hikayeleri</h2>
          <p className="text-muted-foreground">
            Uyku hikayelerini oluşturun, düzenleyin ve yönetin
          </p>
        </div>
        <SleepStoriesTable />
      </div>
    </PageContainer>
  );
}
