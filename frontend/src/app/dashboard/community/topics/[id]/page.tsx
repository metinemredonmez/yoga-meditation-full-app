import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { TopicDetail } from '@/features/community/components/topic-detail';

export const metadata: Metadata = {
  title: 'Konu Detayı | Yoga Admin',
  description: 'Forum konusu detayları',
};

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <TopicDetail id={id} />
    </PageContainer>
  );
}
