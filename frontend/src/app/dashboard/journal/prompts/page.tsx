import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { JournalPromptsTable } from '@/features/journal/components/journal-prompts-table';

export const metadata: Metadata = {
  title: 'Günlük Soruları | Yoga Admin',
  description: 'Günlük sorularını yönetin',
};

export default function JournalPromptsPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Günlük Soruları</h2>
          <p className="text-muted-foreground">
            Kullanıcılar için günlük yazma sorularını oluşturun ve yönetin
          </p>
        </div>
        <JournalPromptsTable />
      </div>
    </PageContainer>
  );
}
