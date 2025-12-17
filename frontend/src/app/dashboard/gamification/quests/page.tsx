import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { QuestsTable } from '@/features/gamification/components/quests-table';

export const metadata: Metadata = {
  title: 'Görevler | Gamification',
  description: 'Günlük, haftalık ve özel görevleri yönetin',
};

export default function QuestsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Görevler</h2>
          <p className="text-muted-foreground">
            Günlük, haftalık, aylık ve özel görevleri yönetin
          </p>
        </div>
        <QuestsTable />
      </div>
    </PageContainer>
  );
}
