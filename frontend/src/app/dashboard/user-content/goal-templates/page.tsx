import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { GoalTemplatesTable } from '@/features/templates/components/goal-templates-table';

export const metadata: Metadata = {
  title: 'Hedef Şablonları | Yoga Admin',
  description: 'Hedef şablonlarını yönet',
};

export default function GoalTemplatesPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Hedef Şablonları</h1>
          <p className="text-muted-foreground">
            Kullanıcılar için hazır hedef şablonları oluşturun
          </p>
        </div>
        <GoalTemplatesTable />
      </div>
    </PageContainer>
  );
}
