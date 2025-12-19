import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { TimerPresetForm } from '@/features/wellness/components/timer-preset-form';

export const metadata: Metadata = {
  title: 'Yeni Zamanlayıcı Preseti | Yoga Admin',
  description: 'Yeni zamanlayıcı preseti oluştur',
};

export default function NewTimerPresetPage() {
  return (
    <PageContainer>
      <TimerPresetForm />
    </PageContainer>
  );
}
