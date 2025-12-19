import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MeditationForm } from '@/features/wellness/components/meditation-form';

export const metadata: Metadata = {
  title: 'Yeni Meditasyon | Yoga Admin',
  description: 'Yeni meditasyon oluştur',
};

export default function NewMeditationPage() {
  return (
    <PageContainer>
      <MeditationForm />
    </PageContainer>
  );
}
