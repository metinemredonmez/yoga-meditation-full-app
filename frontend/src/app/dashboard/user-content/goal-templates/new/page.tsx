import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { GoalTemplateForm } from '@/features/templates/components/goal-template-form';

export const metadata: Metadata = {
  title: 'Yeni Hedef Şablonu | Yoga Admin',
  description: 'Yeni hedef şablonu oluştur',
};

export default function NewGoalTemplatePage() {
  return (
    <PageContainer>
      <GoalTemplateForm />
    </PageContainer>
  );
}
