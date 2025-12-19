import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MoodTagsTable } from '@/features/user-content/components/mood-tags-table';

export const metadata: Metadata = {
  title: 'Mood Etiketleri | Yoga Admin',
  description: 'Mood etiketlerini yönet',
};

export default function MoodTagsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mood Etiketleri</h2>
          <p className="text-muted-foreground">
            Kullanıcıların mood kayıtlarında kullanacağı etiketleri yönetin
          </p>
        </div>
        <MoodTagsTable />
      </div>
    </PageContainer>
  );
}
