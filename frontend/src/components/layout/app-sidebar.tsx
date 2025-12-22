'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { getNavItemsForRole } from '@/config/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getCurrentUser, clearSession } from '@/lib/auth';
import { getMe } from '@/lib/api';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const company = {
  name: 'Yoga Admin',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Yoga Admin' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const router = useRouter();
  const [user, setUser] = React.useState<{ userId: string; email: string; role: string } | null>(null);
  const [navItems, setNavItems] = React.useState<ReturnType<typeof getNavItemsForRole>>([]);

  React.useEffect(() => {
    const loadUser = async () => {
      let currentUser = getCurrentUser();

      // If no session in memory, try to restore from API (using HttpOnly cookie)
      if (!currentUser) {
        try {
          const response = await getMe();
          currentUser = response.user ? {
            userId: response.user.id,
            email: response.user.email,
            role: response.user.role,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
          } : null;
        } catch (error) {
          // User is not authenticated or token expired
          console.error('Failed to get user:', error);
          currentUser = null;
        }
      }

      setUser(currentUser);

      // Get role-based nav items - map INSTRUCTOR to TEACHER if needed
      let effectiveRole = currentUser?.role;
      if (effectiveRole === 'INSTRUCTOR') {
        effectiveRole = 'TEACHER';
      }

      // Always load nav items, use SUPER_ADMIN as fallback for admin panel access
      const roleToUse = effectiveRole || 'SUPER_ADMIN';
      const items = getNavItemsForRole(roleToUse);
      setNavItems(items);
    };

    loadUser();
  }, []);

  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  const handleLogout = async () => {
    await clearSession();
  };

  const activeTenant = tenants[0];

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'YA';

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher
          tenants={tenants}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Profile moved to header */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
