import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { InstructorProfileForm } from '@/features/instructor/components/instructor-profile-form';

export const metadata: Metadata = {
  title: 'Profilim | Eğitmen Paneli',
  description: 'Eğitmen profilinizi yönetin',
};

export default function InstructorProfilePage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profilim</h2>
          <p className="text-muted-foreground">
            Eğitmen profilinizi görüntüleyin ve güncelleyin
          </p>
        </div>
        <InstructorProfileForm />
      </div>
    </PageContainer>
  );
}
