import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { EpisodesTable } from '@/features/podcasts/components/episodes-table';

export const metadata: Metadata = {
  title: 'Podcast Bölümleri | Yoga Admin',
  description: 'Podcast bölümlerini yönetin',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodesPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <EpisodesTable podcastId={id} />
    </PageContainer>
  );
}
