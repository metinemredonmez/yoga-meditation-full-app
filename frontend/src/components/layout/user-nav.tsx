'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getCurrentUser, clearSession } from '@/lib/auth';
import { getMe } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import * as React from 'react';
import { IconUser, IconCreditCard, IconSettings, IconLogout, IconBell } from '@tabler/icons-react';

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ userId: string; email: string; role: string; firstName?: string; lastName?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      let currentUser = getCurrentUser();

      // If no session in memory, try to restore from API
      if (!currentUser) {
        try {
          const response = await getMe();
          if (response) {
            currentUser = {
              userId: response.id,
              email: response.email,
              role: response.role,
              firstName: response.firstName,
              lastName: response.lastName,
            };
          }
        } catch (error) {
          console.error('Failed to get user:', error);
        }
      }

      setUser(currentUser);
      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await clearSession();
  };

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email
      ? user.email.substring(0, 2).toUpperCase()
      : 'YA';

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  // Determine base path based on user role or current pathname
  const isStudentArea = pathname.startsWith('/student');
  const isStudent = user?.role === 'STUDENT' || isStudentArea;
  const basePath = isStudent ? '/student' : '/dashboard';

  // Always show the avatar, even if loading
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback className='bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold'>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56'
        align='end'
        sideOffset={10}
        forceMount
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {displayName}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.role || 'Loading...'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`${basePath}/profile`)}>
            <IconUser className='mr-2 h-4 w-4' />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`${basePath}/billing`)}>
            <IconCreditCard className='mr-2 h-4 w-4' />
            Faturalama
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`${basePath}/notifications`)}>
            <IconBell className='mr-2 h-4 w-4' />
            Bildirimler
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`${basePath}/settings`)}>
            <IconSettings className='mr-2 h-4 w-4' />
            Ayarlar
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
          <IconLogout className='mr-2 h-4 w-4' />
          Cikis Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
