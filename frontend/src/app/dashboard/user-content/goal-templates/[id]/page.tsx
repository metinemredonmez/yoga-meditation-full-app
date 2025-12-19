import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { GoalTemplateForm } from '@/features/templates/components/goal-template-form';

export const metadata: Metadata = {
  title: 'Hedef Şablonu Düzenle | Yoga Admin',
  description: 'Hedef şablonunu düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGoalTemplatePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <GoalTemplateForm templateId={id} />
    </PageContainer>
  );
}
