import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MoodEntriesTable } from '@/features/user-content/components/mood-entries-table';

export const metadata: Metadata = {
  title: 'Mood Kayıtları | Yoga Admin',
  description: 'Kullanıcı mood kayıtlarını görüntüle',
};

export default function MoodEntriesPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Mood Kayıtları</h1>
          <p className="text-muted-foreground">
            Kullanıcıların mood kayıtlarını görüntüleyin (salt okunur)
          </p>
        </div>
        <MoodEntriesTable />
      </div>
    </PageContainer>
  );
}
