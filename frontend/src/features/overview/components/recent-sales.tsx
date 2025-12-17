'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { getUsers } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface RecentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

export function RecentSales() {
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentUsers();
  }, []);

  const loadRecentUsers = async () => {
    try {
      const data = await getUsers({ limit: 5 });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load recent users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user: RecentUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: RecentUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  if (loading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-8'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center animate-pulse'>
                <div className='h-9 w-9 rounded-full bg-muted'></div>
                <div className='ml-4 space-y-2 flex-1'>
                  <div className='h-4 bg-muted rounded w-24'></div>
                  <div className='h-3 bg-muted rounded w-32'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Latest registered users on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {users.length === 0 ? (
            <p className='text-muted-foreground text-sm text-center py-4'>
              No users found
            </p>
          ) : (
            users.map((user) => (
              <div key={user.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>{getInitials(user)}</AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1 flex-1 min-w-0'>
                  <p className='text-sm leading-none font-medium truncate'>
                    {getDisplayName(user)}
                  </p>
                  <p className='text-muted-foreground text-xs truncate'>
                    {user.email}
                  </p>
                </div>
                <div className='ml-2 flex flex-col items-end gap-1'>
                  <Badge variant='outline' className='text-xs'>
                    {user.role}
                  </Badge>
                  <span className='text-muted-foreground text-xs'>
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
