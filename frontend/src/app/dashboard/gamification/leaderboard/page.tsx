import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { LeaderboardView } from '@/features/gamification/components/leaderboard-view';

export const metadata: Metadata = {
  title: 'Liderlik Tablosu | Gamification',
  description: 'Kullanıcı sıralamalarını görüntüleyin',
};

export default function LeaderboardPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Liderlik Tablosu</h2>
          <p className="text-muted-foreground">
            XP, seri, dakika ve oturum bazlı kullanıcı sıralamalarını görüntüleyin
          </p>
        </div>
        <LeaderboardView />
      </div>
    </PageContainer>
  );
}
