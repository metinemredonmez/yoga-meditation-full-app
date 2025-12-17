import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { InstructorAnalytics } from '@/features/instructor/components/instructor-analytics';

export const metadata: Metadata = {
  title: 'Analitik | Eğitmen Paneli',
  description: 'Performans istatistiklerinizi görüntüleyin',
};

export default function InstructorAnalyticsPage() {
  return (
    <PageContainer scrollable>
      <InstructorAnalytics />
    </PageContainer>
  );
}
