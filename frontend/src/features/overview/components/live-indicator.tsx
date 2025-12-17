'use client';

import { useSocket } from '@/context/socket-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LiveIndicator() {
  const { isConnected } = useSocket();

  return (
    <Badge
      variant='outline'
      className={cn(
        'flex items-center gap-1.5 px-2 py-1',
        isConnected
          ? 'border-green-500/50 text-green-600 dark:text-green-400'
          : 'border-red-500/50 text-red-600 dark:text-red-400'
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        )}
      />
      {isConnected ? 'Live' : 'Offline'}
    </Badge>
  );
}
