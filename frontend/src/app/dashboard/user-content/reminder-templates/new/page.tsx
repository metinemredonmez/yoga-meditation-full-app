import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ReminderTemplateForm } from '@/features/templates/components/reminder-template-form';

export const metadata: Metadata = {
  title: 'Yeni Hatırlatıcı Şablonu | Yoga Admin',
  description: 'Yeni hatırlatıcı şablonu oluştur',
};

export default function NewReminderTemplatePage() {
  return (
    <PageContainer>
      <ReminderTemplateForm />
    </PageContainer>
  );
}
