import { YogaSpinner } from '@/components/ui/yoga-spinner';
import { DashboardStatsSkeleton } from '@/components/ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <YogaSpinner size="sm" text="" />
      </div>

      {/* Stats cards */}
      <DashboardStatsSkeleton />

      {/* Main content area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className='h-[350px] rounded-xl lg:col-span-4' />
        <Skeleton className='h-[350px] rounded-xl lg:col-span-3' />
      </div>

      {/* Bottom section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className='h-[300px] rounded-xl' />
        <Skeleton className='h-[300px] rounded-xl' />
      </div>
    </div>
  );
}
