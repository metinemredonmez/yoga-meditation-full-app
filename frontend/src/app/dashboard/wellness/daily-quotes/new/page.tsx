import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyQuoteForm } from '@/features/wellness/components/daily-quote-form';

export const metadata: Metadata = {
  title: 'Yeni Günün Sözü | Yoga Admin',
  description: 'Yeni günün sözü oluştur',
};

export default function NewDailyQuotePage() {
  return (
    <PageContainer>
      <DailyQuoteForm />
    </PageContainer>
  );
}
