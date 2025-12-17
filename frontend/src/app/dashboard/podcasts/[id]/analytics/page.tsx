import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PodcastAnalytics } from '@/features/podcasts/components/podcast-analytics';

export const metadata: Metadata = {
  title: 'Podcast Analitik | Yoga Admin',
  description: 'Podcast performans analitikleri',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PodcastAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <PodcastAnalytics podcastId={id} />
    </PageContainer>
  );
}
