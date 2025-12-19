import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SoundscapeForm } from '@/features/wellness/components/soundscape-form';

export const metadata: Metadata = {
  title: 'Soundscape Düzenle | Yoga Admin',
  description: 'Ses ortamını düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSoundscapePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <SoundscapeForm soundscapeId={id} />
    </PageContainer>
  );
}
