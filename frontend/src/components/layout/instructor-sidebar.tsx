'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getCurrentUser, clearSession } from '@/lib/auth';
import {
  IconBell,
  IconChevronsDown,
  IconLogout,
  IconUserCircle,
  IconHome,
  IconVideo,
  IconBook,
  IconChartBar,
  IconSettings,
  IconYoga,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const instructorNavItems = [
  {
    title: 'Dashboard',
    url: '/instructor',
    icon: IconHome,
  },
  {
    title: 'Derslerim',
    url: '/instructor/classes',
    icon: IconVideo,
  },
  {
    title: 'Programlarım',
    url: '/instructor/programs',
    icon: IconBook,
  },
  {
    title: 'Analitik',
    url: '/instructor/analytics',
    icon: IconChartBar,
  },
];

export function InstructorSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const router = useRouter();
  const [user, setUser] = React.useState<{ userId: string; email: string; role: string } | null>(null);

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/auth/sign-in');
  };

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'EG';

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/instructor'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-600 text-white'>
                  <IconYoga className='size-4' />
                </div>
                <div className='flex flex-col gap-0.5 leading-none'>
                  <span className='font-semibold'>Eğitmen Paneli</span>
                  <span className='text-xs text-muted-foreground'>Yoga Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarMenu>
            {instructorNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Ayarlar</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Profil"
                isActive={pathname === '/instructor/profile'}
              >
                <Link href="/instructor/profile">
                  <IconUserCircle className="h-4 w-4" />
                  <span>Profilim</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Bildirimler"
              >
                <Link href="/instructor/notifications">
                  <IconBell className="h-4 w-4" />
                  <span>Bildirimler</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg'>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>{user?.email || 'Eğitmen'}</span>
                    <span className='truncate text-xs text-muted-foreground'>Eğitmen</span>
                  </div>
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='h-8 w-8 rounded-lg'>
                      <AvatarFallback className='rounded-lg'>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>{user?.email || 'Eğitmen'}</span>
                      <span className='truncate text-xs text-muted-foreground'>Eğitmen</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/instructor/profile')}>
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profilim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/instructor/notifications')}>
                    <IconBell className='mr-2 h-4 w-4' />
                    Bildirimler
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/instructor/settings')}>
                    <IconSettings className='mr-2 h-4 w-4' />
                    Ayarlar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <IconLogout className='mr-2 h-4 w-4' />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
