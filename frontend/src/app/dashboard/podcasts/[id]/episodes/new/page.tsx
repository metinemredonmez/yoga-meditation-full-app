import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { EpisodeForm } from '@/features/podcasts/components/episode-form';

export const metadata: Metadata = {
  title: 'Yeni Bölüm | Yoga Admin',
  description: 'Yeni podcast bölümü oluşturun',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewEpisodePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <EpisodeForm podcastId={id} />
    </PageContainer>
  );
}
