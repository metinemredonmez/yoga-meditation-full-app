import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PodcastForm } from '@/features/podcasts/components/podcast-form';

export const metadata: Metadata = {
  title: 'Yeni Podcast | Yoga Admin',
  description: 'Yeni podcast oluşturun',
};

export default function NewPodcastPage() {
  return (
    <PageContainer>
      <PodcastForm />
    </PageContainer>
  );
}
