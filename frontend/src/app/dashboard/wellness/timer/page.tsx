import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { TimerPresetsTable } from '@/features/wellness/components/timer-presets-table';

export const metadata: Metadata = {
  title: 'Zamanlayıcı Presetleri | Yoga Admin',
  description: 'Zamanlayıcı presetlerini yönetin',
};

export default function TimerPresetsPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Zamanlayıcı Presetleri</h2>
          <p className="text-muted-foreground">
            Meditasyon zamanlayıcı presetlerini oluşturun ve yönetin
          </p>
        </div>
        <TimerPresetsTable />
      </div>
    </PageContainer>
  );
}
