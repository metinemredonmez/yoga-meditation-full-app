import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BreathworkForm } from '@/features/wellness/components/breathwork-form';

export const metadata: Metadata = {
  title: 'Yeni Nefes Egzersizi | Yoga Admin',
  description: 'Yeni nefes egzersizi oluştur',
};

export default function NewBreathworkPage() {
  return (
    <PageContainer>
      <BreathworkForm />
    </PageContainer>
  );
}
