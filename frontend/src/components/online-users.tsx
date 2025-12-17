'use client';

import { useSocket } from '@/context/socket-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface OnlineUsersProps {
  maxDisplay?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineUsers({ maxDisplay = 5, showCount = true, size = 'md' }: OnlineUsersProps) {
  const { onlineUsers, isConnected } = useSocket();

  const onlineUsersList = Array.from(onlineUsers.values()).filter(
    (user) => user.status === 'online'
  );

  const displayUsers = onlineUsersList.slice(0, maxDisplay);
  const remainingCount = onlineUsersList.length - maxDisplay;

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  if (!isConnected) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <span className='h-2 w-2 rounded-full bg-red-500' />
        <span className='text-sm'>Offline</span>
      </div>
    );
  }

  if (onlineUsersList.length === 0) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <span className='h-2 w-2 rounded-full bg-green-500 animate-pulse' />
        <span className='text-sm'>No users online</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='flex items-center gap-2'>
        <div className='flex -space-x-2'>
          {displayUsers.map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className='relative'>
                  <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
                    <AvatarFallback className='text-xs'>
                      {user.userId.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 rounded-full border-2 border-background',
                      user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500',
                      size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className='font-medium'>User {user.userId.substring(0, 8)}</p>
                <p className='text-xs text-muted-foreground'>
                  {user.status === 'online' ? 'Online now' : 'Away'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className={cn(sizeClasses[size], 'border-2 border-background bg-muted')}>
                  <AvatarFallback className='text-xs'>+{remainingCount}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more users online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {showCount && (
          <Badge variant='outline' className='text-xs'>
            <span className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5' />
            {onlineUsersList.length} online
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
