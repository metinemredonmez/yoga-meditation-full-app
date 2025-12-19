import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SoundscapeForm } from '@/features/wellness/components/soundscape-form';

export const metadata: Metadata = {
  title: 'Yeni Soundscape | Yoga Admin',
  description: 'Yeni ses ortamı oluştur',
};

export default function NewSoundscapePage() {
  return (
    <PageContainer>
      <SoundscapeForm />
    </PageContainer>
  );
}
