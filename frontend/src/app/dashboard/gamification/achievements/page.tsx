import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { AchievementsTable } from '@/features/gamification/components/achievements-table';

export const metadata: Metadata = {
  title: 'Başarılar | Gamification',
  description: 'Kullanıcı başarılarını yönetin',
};

export default function AchievementsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Başarılar</h2>
          <p className="text-muted-foreground">
            Kullanıcıların kazanabileceği başarıları yönetin
          </p>
        </div>
        <AchievementsTable />
      </div>
    </PageContainer>
  );
}
