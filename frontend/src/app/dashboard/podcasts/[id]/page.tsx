import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PodcastForm } from '@/features/podcasts/components/podcast-form';

export const metadata: Metadata = {
  title: 'Podcast Düzenle | Yoga Admin',
  description: 'Podcast bilgilerini düzenleyin',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPodcastPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <PodcastForm podcastId={id} />
    </PageContainer>
  );
}
