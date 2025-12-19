import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { OnboardingStatsView } from '@/features/onboarding/components/onboarding-stats';

export const metadata: Metadata = {
  title: 'Onboarding İstatistikleri | Yoga Admin',
  description: 'Onboarding istatistiklerini görüntüle',
};

export default function OnboardingStatsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Onboarding İstatistikleri</h1>
          <p className="text-muted-foreground">
            Kullanıcı karşılama akışı analizi
          </p>
        </div>
        <OnboardingStatsView />
      </div>
    </PageContainer>
  );
}
