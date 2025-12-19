import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { TimerPresetForm } from '@/features/wellness/components/timer-preset-form';

export const metadata: Metadata = {
  title: 'Zamanlayıcı Preseti Düzenle | Yoga Admin',
  description: 'Zamanlayıcı presetini düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTimerPresetPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <TimerPresetForm presetId={id} />
    </PageContainer>
  );
}
