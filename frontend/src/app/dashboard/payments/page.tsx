import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PaymentsTable } from '@/features/financial/components/payments-table';

export const metadata: Metadata = {
  title: 'Payments | Yoga Admin',
  description: 'View and manage payments',
};

export default function PaymentsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Payments</h2>
            <p className='text-muted-foreground'>View payment history and process refunds</p>
          </div>
        </div>
        <PaymentsTable />
      </div>
    </PageContainer>
  );
}
