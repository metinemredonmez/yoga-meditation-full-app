import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SleepStoryForm } from '@/features/wellness/components/sleep-story-form';

export const metadata: Metadata = {
  title: 'Uyku Hikayesi Düzenle | Yoga Admin',
  description: 'Uyku hikayesini düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSleepStoryPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <SleepStoryForm storyId={id} />
    </PageContainer>
  );
}
