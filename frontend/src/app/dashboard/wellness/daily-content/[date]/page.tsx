import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyContentForm } from '@/features/wellness/components/daily-content-form';

export const metadata: Metadata = {
  title: 'Günlük İçerik Düzenle | Yoga Admin',
  description: 'Günlük içeriği düzenle',
};

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function EditDailyContentPage({ params }: PageProps) {
  const { date } = await params;

  return (
    <PageContainer>
      <DailyContentForm date={date} />
    </PageContainer>
  );
}
