import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MyProgramsTable } from '@/features/instructor/components/my-programs-table';

export const metadata: Metadata = {
  title: 'Programlarım | Eğitmen Paneli',
  description: 'Kendi programlarınızı yönetin',
};

export default function MyProgramsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Programlarım</h2>
          <p className="text-muted-foreground">
            Oluşturduğunuz yoga programlarını görüntüleyin ve yönetin
          </p>
        </div>
        <MyProgramsTable />
      </div>
    </PageContainer>
  );
}
