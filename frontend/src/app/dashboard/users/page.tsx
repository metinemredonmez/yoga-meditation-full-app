import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { UsersTable } from '@/features/users/components/users-table';

export const metadata: Metadata = {
  title: 'Users | Yoga Admin',
  description: 'Manage platform users',
};

export default function UsersPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Users</h2>
            <p className='text-muted-foreground'>Manage and monitor platform users</p>
          </div>
        </div>
        <UsersTable />
      </div>
    </PageContainer>
  );
}
