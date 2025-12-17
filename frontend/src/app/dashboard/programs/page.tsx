import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ProgramsTable } from '@/features/content/components/programs-table';

export const metadata: Metadata = {
  title: 'Programlar | Yoga Admin',
  description: 'Yoga programlarını yönet',
};

export default function ProgramsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Programlar</h2>
          <p className="text-muted-foreground">
            Yoga, pilates ve meditasyon programlarını yönetin
          </p>
        </div>
        <ProgramsTable />
      </div>
    </PageContainer>
  );
}
