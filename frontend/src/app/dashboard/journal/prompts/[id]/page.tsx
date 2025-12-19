import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { JournalPromptForm } from '@/features/journal/components/journal-prompt-form';

export const metadata: Metadata = {
  title: 'Günlük Sorusu Düzenle | Yoga Admin',
  description: 'Günlük sorusunu düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJournalPromptPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <JournalPromptForm promptId={id} />
    </PageContainer>
  );
}
