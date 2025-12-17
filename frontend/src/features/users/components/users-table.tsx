'use client';
import { useEffect, useState, useCallback } from 'react';
import { getUsers, banUser, unbanUser, warnUser } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconDots,
  IconBan,
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconEye,
  IconSearch,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { onlineUsers } = useSocket();

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  // Warn dialog
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [userToWarn, setUserToWarn] = useState<User | null>(null);
  const [warnMessage, setWarnMessage] = useState('');

  // Check if user is online
  const isUserOnline = (userId: string) => {
    const presence = onlineUsers.get(userId);
    return presence?.status === 'online';
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getUsers(params);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBan = async () => {
    if (!userToBan) return;
    try {
      await banUser(userToBan.id, banReason);
      toast.success('User banned successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    } finally {
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason('');
    }
  };

  const handleUnban = async (user: User) => {
    try {
      await unbanUser(user.id);
      toast.success('User unbanned successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleWarn = async () => {
    if (!userToWarn || !warnMessage) return;
    try {
      await warnUser(userToWarn.id, warnMessage);
      toast.success('Warning sent successfully');
    } catch (error) {
      console.error('Failed to send warning:', error);
      toast.error('Failed to send warning');
    } finally {
      setWarnDialogOpen(false);
      setUserToWarn(null);
      setWarnMessage('');
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    if (!role) return 'bg-gray-500/10 text-gray-500';
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-[#8b5cf6]/10 text-[#8b5cf6]'; // Violet - donut chart palette
      case 'TEACHER':
        return 'bg-[#f97316]/10 text-[#f97316]'; // Orange - donut chart palette
      case 'STUDENT':
        return 'bg-[#06b6d4]/10 text-[#06b6d4]'; // Cyan - donut chart palette
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-500';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500';
      case 'BANNED':
        return 'bg-red-500/10 text-red-500';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search users...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Role' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Roles</SelectItem>
            <SelectItem value='ADMIN'>Admin</SelectItem>
            <SelectItem value='TEACHER'>Teacher</SelectItem>
            <SelectItem value='STUDENT'>Student</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='ACTIVE'>Active</SelectItem>
            <SelectItem value='BANNED'>Banned</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <div className='relative'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                            isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-400'
                          )}
                          title={isUserOnline(user.id) ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div>
                        <p className='font-medium'>{getDisplayName(user)}</p>
                        <p className='text-sm text-muted-foreground'>{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {user.lastLoginAt
                      ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>
                            <IconEye className='mr-2 h-4 w-4' />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setUserToWarn(user);
                            setWarnDialogOpen(true);
                          }}
                        >
                          <IconAlertTriangle className='mr-2 h-4 w-4' />
                          Send Warning
                        </DropdownMenuItem>
                        {user.status === 'BANNED' ? (
                          <DropdownMenuItem onClick={() => handleUnban(user)}>
                            <IconCheck className='mr-2 h-4 w-4' />
                            Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => {
                              setUserToBan(user);
                              setBanDialogOpen(true);
                            }}
                          >
                            <IconBan className='mr-2 h-4 w-4' />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {userToBan?.email}? They will not be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Reason for ban (optional)'
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} className='bg-destructive text-destructive-foreground'>
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warn Dialog */}
      <Dialog open={warnDialogOpen} onOpenChange={setWarnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Warning to {userToWarn?.email}</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Warning message...'
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWarnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWarn} disabled={!warnMessage}>
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
