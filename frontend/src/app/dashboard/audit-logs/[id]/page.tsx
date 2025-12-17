import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { AuditLogDetail } from '@/features/audit-logs/components/audit-log-detail';

export const metadata: Metadata = {
  title: 'Audit Log Details | Yoga Admin',
  description: 'View audit log details',
};

interface AuditLogDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditLogDetailPage({ params }: AuditLogDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <AuditLogDetail id={id} />
    </PageContainer>
  );
}
