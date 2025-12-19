import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ReminderTemplateForm } from '@/features/templates/components/reminder-template-form';

export const metadata: Metadata = {
  title: 'Hatırlatıcı Şablonu Düzenle | Yoga Admin',
  description: 'Hatırlatıcı şablonunu düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReminderTemplatePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <ReminderTemplateForm templateId={id} />
    </PageContainer>
  );
}
