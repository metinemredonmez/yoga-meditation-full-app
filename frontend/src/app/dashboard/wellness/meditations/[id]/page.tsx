import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MeditationForm } from '@/features/wellness/components/meditation-form';

export const metadata: Metadata = {
  title: 'Meditasyon Düzenle | Yoga Admin',
  description: 'Meditasyonu düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeditationPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <MeditationForm meditationId={id} />
    </PageContainer>
  );
}
