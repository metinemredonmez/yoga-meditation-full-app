import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ReminderTemplatesTable } from '@/features/templates/components/reminder-templates-table';

export const metadata: Metadata = {
  title: 'Hatırlatıcı Şablonları | Yoga Admin',
  description: 'Hatırlatıcı şablonlarını yönet',
};

export default function ReminderTemplatesPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Hatırlatıcı Şablonları</h1>
          <p className="text-muted-foreground">
            Kullanıcılar için hazır hatırlatıcı şablonları oluşturun
          </p>
        </div>
        <ReminderTemplatesTable />
      </div>
    </PageContainer>
  );
}
