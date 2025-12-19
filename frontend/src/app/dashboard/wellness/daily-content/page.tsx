import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyContentManager } from '@/features/wellness/components/daily-content-manager';

export const metadata: Metadata = {
  title: 'Günlük İçerik | Yoga Admin',
  description: 'Günlük içerikleri yönetin',
};

export default function DailyContentPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Günlük İçerik</h2>
          <p className="text-muted-foreground">
            Her gün için özel içerikler planlayın ve yönetin
          </p>
        </div>
        <DailyContentManager />
      </div>
    </PageContainer>
  );
}
