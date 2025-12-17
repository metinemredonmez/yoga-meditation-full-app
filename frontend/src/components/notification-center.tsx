'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconInfoCircle,
  IconCircleCheck,
  IconAlertTriangle,
  IconCircleX,
  IconTrash,
} from '@tabler/icons-react';
import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    isConnected,
  } = useSocket();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <IconCircleCheck className='h-4 w-4 text-green-500' />;
      case 'warning':
        return <IconAlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'error':
        return <IconCircleX className='h-4 w-4 text-red-500' />;
      default:
        return <IconInfoCircle className='h-4 w-4 text-blue-500' />;
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markNotificationRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <IconBell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Connection indicator */}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2 w-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <div className='flex items-center justify-between px-4 py-2'>
          <h4 className='font-semibold'>Notifications</h4>
          <div className='flex items-center gap-1'>
            {unreadCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs'
                onClick={markAllNotificationsRead}
              >
                <IconChecks className='h-3 w-3 mr-1' />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs text-muted-foreground'
                onClick={clearNotifications}
              >
                <IconTrash className='h-3 w-3' />
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className='h-[300px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <IconBell className='h-8 w-8 mb-2 opacity-50' />
              <p className='text-sm'>No notifications</p>
            </div>
          ) : (
            <div className='flex flex-col'>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                    !notification.read && 'bg-muted/30'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className='mt-0.5'>{getIcon(notification.type)}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium truncate'>{notification.title}</p>
                      {!notification.read && (
                        <span className='h-2 w-2 rounded-full bg-blue-500 flex-shrink-0' />
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {notification.message}
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 flex-shrink-0'
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(notification.id);
                      }}
                    >
                      <IconCheck className='h-3 w-3' />
                    </Button>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className='p-2'>
              <Button
                variant='ghost'
                className='w-full text-sm'
                onClick={() => {
                  router.push('/dashboard/notifications');
                  setOpen(false);
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
