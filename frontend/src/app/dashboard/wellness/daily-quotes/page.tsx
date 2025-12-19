import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DailyQuotesTable } from '@/features/wellness/components/daily-quotes-table';

export const metadata: Metadata = {
  title: 'Günün Sözleri | Yoga Admin',
  description: 'Günün sözlerini yönetin',
};

export default function DailyQuotesPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Günün Sözleri</h2>
          <p className="text-muted-foreground">
            Kullanıcılara gösterilecek günlük sözleri oluşturun ve yönetin
          </p>
        </div>
        <DailyQuotesTable />
      </div>
    </PageContainer>
  );
}
