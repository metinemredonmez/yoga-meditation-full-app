import { TableSkeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:p-6'>
      <TableSkeleton columns={6} rows={10} />
    </div>
  );
}
