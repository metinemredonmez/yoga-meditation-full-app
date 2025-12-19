import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BreathworkTable } from '@/features/wellness/components/breathwork-table';

export const metadata: Metadata = {
  title: 'Nefes Egzersizleri | Yoga Admin',
  description: 'Nefes egzersizlerini yönetin',
};

export default function BreathworkPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nefes Egzersizleri</h2>
          <p className="text-muted-foreground">
            Nefes egzersizlerini oluşturun, düzenleyin ve yönetin
          </p>
        </div>
        <BreathworkTable />
      </div>
    </PageContainer>
  );
}
