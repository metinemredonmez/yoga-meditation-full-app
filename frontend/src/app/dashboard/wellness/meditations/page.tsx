import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MeditationsTable } from '@/features/wellness/components/meditations-table';

export const metadata: Metadata = {
  title: 'Meditasyonlar | Yoga Admin',
  description: 'Meditasyonları yönetin',
};

export default function MeditationsPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meditasyonlar</h2>
          <p className="text-muted-foreground">
            Meditasyon içeriklerini yönetin, düzenleyin ve yayınlayın
          </p>
        </div>
        <MeditationsTable />
      </div>
    </PageContainer>
  );
}
