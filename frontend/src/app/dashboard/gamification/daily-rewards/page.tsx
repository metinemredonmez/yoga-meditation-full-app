import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyRewardsTable } from '@/features/gamification/components/daily-rewards-table';

export const metadata: Metadata = {
  title: 'Günlük Ödüller | Gamification',
  description: 'Günlük giriş ödüllerini yapılandırın',
};

export default function DailyRewardsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Günlük Ödüller</h2>
          <p className="text-muted-foreground">
            Kullanıcıların her gün giriş yaparak kazanacağı ödülleri yapılandırın
          </p>
        </div>
        <DailyRewardsTable />
      </div>
    </PageContainer>
  );
}
