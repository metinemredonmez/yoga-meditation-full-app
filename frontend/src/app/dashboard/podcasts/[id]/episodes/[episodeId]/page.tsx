import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { EpisodeForm } from '@/features/podcasts/components/episode-form';

export const metadata: Metadata = {
  title: 'Bölüm Düzenle | Yoga Admin',
  description: 'Podcast bölümünü düzenleyin',
};

interface PageProps {
  params: Promise<{ id: string; episodeId: string }>;
}

export default async function EditEpisodePage({ params }: PageProps) {
  const { id, episodeId } = await params;

  return (
    <PageContainer>
      <EpisodeForm podcastId={id} episodeId={episodeId} />
    </PageContainer>
  );
}
