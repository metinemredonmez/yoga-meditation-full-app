import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BreathworkForm } from '@/features/wellness/components/breathwork-form';

export const metadata: Metadata = {
  title: 'Nefes Egzersizi Düzenle | Yoga Admin',
  description: 'Nefes egzersizini düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBreathworkPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <BreathworkForm breathworkId={id} />
    </PageContainer>
  );
}
