import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { MyClassesTable } from '@/features/instructor/components/my-classes-table';

export const metadata: Metadata = {
  title: 'Derslerim | Eğitmen Paneli',
  description: 'Kendi derslerinizi yönetin',
};

export default function MyClassesPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Derslerim</h2>
          <p className="text-muted-foreground">
            Oluşturduğunuz yoga derslerini görüntüleyin ve yönetin
          </p>
        </div>
        <MyClassesTable />
      </div>
    </PageContainer>
  );
}
