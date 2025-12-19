import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyQuoteForm } from '@/features/wellness/components/daily-quote-form';

export const metadata: Metadata = {
  title: 'Günün Sözü Düzenle | Yoga Admin',
  description: 'Günün sözünü düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDailyQuotePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <DailyQuoteForm quoteId={id} />
    </PageContainer>
  );
}
