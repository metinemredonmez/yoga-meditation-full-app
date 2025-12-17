'use client';

import { useSocket } from '@/context/socket-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  IconUser,
  IconCreditCard,
  IconVideo,
  IconMessage,
  IconStar,
  IconActivity,
} from '@tabler/icons-react';

const activityIcons: Record<string, React.ReactNode> = {
  user: <IconUser className='h-4 w-4' />,
  payment: <IconCreditCard className='h-4 w-4' />,
  stream: <IconVideo className='h-4 w-4' />,
  comment: <IconMessage className='h-4 w-4' />,
  review: <IconStar className='h-4 w-4' />,
  default: <IconActivity className='h-4 w-4' />,
};

const activityColors: Record<string, string> = {
  user: 'bg-blue-500',
  payment: 'bg-green-500',
  stream: 'bg-purple-500',
  comment: 'bg-yellow-500',
  review: 'bg-orange-500',
  default: 'bg-gray-500',
};

export function RecentActivities() {
  const { recentActivities, isConnected } = useSocket();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getIcon = (type: string) => {
    return activityIcons[type] || activityIcons.default;
  };

  const getColor = (type: string) => {
    return activityColors[type] || activityColors.default;
  };

  if (!isConnected) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            Recent Activities
            <Badge variant='outline' className='text-xs text-muted-foreground'>
              Offline
            </Badge>
          </CardTitle>
          <CardDescription>Connect to see real-time activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
            <IconActivity className='h-8 w-8 mb-2 opacity-50' />
            <p className='text-sm'>Waiting for connection...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Recent Activities
          <Badge variant='outline' className='text-xs border-green-500/50 text-green-600'>
            <span className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1' />
            Live
          </Badge>
        </CardTitle>
        <CardDescription>Real-time platform activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {recentActivities.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <IconActivity className='h-8 w-8 mb-2 opacity-50' />
              <p className='text-sm'>No recent activities</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className='flex items-start gap-3'>
                <div className='relative'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='text-xs'>
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${getColor(activity.type)} flex items-center justify-center text-white`}
                  >
                    {getIcon(activity.type)}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm'>
                    <span className='font-medium'>{activity.userName}</span>{' '}
                    <span className='text-muted-foreground'>{activity.action}</span>
                    {activity.target && (
                      <span className='font-medium'> {activity.target}</span>
                    )}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
