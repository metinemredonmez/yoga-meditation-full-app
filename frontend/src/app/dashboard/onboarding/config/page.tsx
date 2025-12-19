import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { OnboardingConfigManager } from '@/features/onboarding/components/onboarding-config';

export const metadata: Metadata = {
  title: 'Onboarding Yapılandırma | Yoga Admin',
  description: 'Onboarding akışını yapılandır',
};

export default function OnboardingConfigPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Onboarding Yapılandırma</h1>
          <p className="text-muted-foreground">
            Kullanıcı karşılama akışını düzenleyin
          </p>
        </div>
        <OnboardingConfigManager />
      </div>
    </PageContainer>
  );
}
