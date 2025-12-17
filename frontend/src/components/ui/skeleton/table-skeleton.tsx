'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  showPagination?: boolean;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 10,
  showHeader = true,
  showPagination = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search/Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-hidden">
          {/* Header */}
          {showHeader && (
            <div className="flex border-b bg-muted/50 p-4">
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 px-2"
                  style={{ flex: i === 0 ? 2 : 1 }}
                >
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex border-b p-4 last:border-0"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="flex-1 px-2"
                  style={{ flex: colIndex === 0 ? 2 : 1 }}
                >
                  {colIndex === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-[140px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  ) : colIndex === columns - 1 ? (
                    <div className="flex gap-2 justify-end">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  ) : (
                    <Skeleton
                      className="h-4"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[150px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export default TableSkeleton;
