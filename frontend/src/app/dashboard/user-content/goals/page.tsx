import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { UserGoalsTable } from '@/features/user-content/components/user-goals-table';

export const metadata: Metadata = {
  title: 'Kullanıcı Hedefleri | Yoga Admin',
  description: 'Kullanıcı hedeflerini görüntüle',
};

export default function UserGoalsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Hedefleri</h1>
          <p className="text-muted-foreground">
            Kullanıcıların hedeflerini ve ilerlemelerini görüntüleyin (salt okunur)
          </p>
        </div>
        <UserGoalsTable />
      </div>
    </PageContainer>
  );
}
