import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SleepStoryForm } from '@/features/wellness/components/sleep-story-form';

export const metadata: Metadata = {
  title: 'Yeni Uyku Hikayesi | Yoga Admin',
  description: 'Yeni uyku hikayesi oluştur',
};

export default function NewSleepStoryPage() {
  return (
    <PageContainer>
      <SleepStoryForm />
    </PageContainer>
  );
}
