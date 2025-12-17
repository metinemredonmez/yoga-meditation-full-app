import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { AuditLogsTable } from '@/features/audit-logs/components/audit-logs-table';

export const metadata: Metadata = {
  title: 'Audit Logs | Yoga Admin',
  description: 'View system audit logs and activity history',
};

export default function AuditLogsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Audit Logs</h2>
            <p className='text-muted-foreground'>Track all admin actions and system changes</p>
          </div>
        </div>
        <AuditLogsTable />
      </div>
    </PageContainer>
  );
}
