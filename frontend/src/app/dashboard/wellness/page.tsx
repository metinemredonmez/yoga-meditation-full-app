import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { WellnessOverview } from '@/features/wellness/components/wellness-overview';

export const metadata: Metadata = {
  title: 'Wellness | Yoga Admin',
  description: 'Wellness modülü genel bakış',
};

export default function WellnessPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wellness</h2>
          <p className="text-muted-foreground">
            Meditasyon, nefes egzersizleri, sesler ve diğer wellness içeriklerini yönetin
          </p>
        </div>
        <WellnessOverview />
      </div>
    </PageContainer>
  );
}
