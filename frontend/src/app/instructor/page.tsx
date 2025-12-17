import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { InstructorStats } from '@/features/instructor/components/instructor-stats';

export const metadata: Metadata = {
  title: 'Dashboard | Eğitmen Paneli',
  description: 'Eğitmen ana sayfası',
};

export default function InstructorDashboardPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hoş Geldiniz</h2>
          <p className="text-muted-foreground">
            Eğitmen panelinize hoş geldiniz. İşte içeriklerinize genel bir bakış.
          </p>
        </div>
        <InstructorStats />
      </div>
    </PageContainer>
  );
}
