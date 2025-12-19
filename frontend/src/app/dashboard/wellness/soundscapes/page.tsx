import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { SoundscapesTable } from '@/features/wellness/components/soundscapes-table';

export const metadata: Metadata = {
  title: 'Soundscapes | Yoga Admin',
  description: 'Ses ortamlarını yönetin',
};

export default function SoundscapesPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Soundscapes</h2>
          <p className="text-muted-foreground">
            Ses ortamlarını oluşturun, düzenleyin ve yönetin
          </p>
        </div>
        <SoundscapesTable />
      </div>
    </PageContainer>
  );
}
