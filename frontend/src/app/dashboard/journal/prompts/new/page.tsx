import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { JournalPromptForm } from '@/features/journal/components/journal-prompt-form';

export const metadata: Metadata = {
  title: 'Yeni Günlük Sorusu | Yoga Admin',
  description: 'Yeni günlük sorusu oluştur',
};

export default function NewJournalPromptPage() {
  return (
    <PageContainer>
      <JournalPromptForm />
    </PageContainer>
  );
}
