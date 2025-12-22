import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PodcastsTable } from '@/features/podcasts/components/podcasts-table';

export const metadata: Metadata = {
  title: 'Podcast\'ler | Yoga Admin',
  description: 'Podcast\'leri yönetin',
};

export default function PodcastsPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Podcast&apos;ler</h2>
            <p className="text-muted-foreground">
              Yoga, meditasyon ve wellness podcast&apos;lerini yönetin
            </p>
          </div>
        </div>
        <PodcastsTable />
      </div>
    </PageContainer>
  );
}
