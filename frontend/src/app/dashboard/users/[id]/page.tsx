'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getUserById, banUser, unbanUser, warnUser, changeUserRole, resetUserPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconMail,
  IconCalendar,
  IconClock,
  IconKey,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface UserDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  subscriptionStatus: string | null;
  totalClassesAttended: number;
  totalMinutesPracticed: number;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [warnMessage, setWarnMessage] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await getUserById(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!user) return;
    try {
      await banUser(user.id, banReason);
      toast.success('User banned successfully');
      loadUser();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    } finally {
      setBanDialogOpen(false);
      setBanReason('');
    }
  };

  const handleUnban = async () => {
    if (!user) return;
    try {
      await unbanUser(user.id);
      toast.success('User unbanned successfully');
      loadUser();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleWarn = async () => {
    if (!user || !warnMessage) return;
    try {
      await warnUser(user.id, warnMessage);
      toast.success('Warning sent successfully');
    } catch (error) {
      console.error('Failed to send warning:', error);
      toast.error('Failed to send warning');
    } finally {
      setWarnDialogOpen(false);
      setWarnMessage('');
    }
  };

  const handleRoleChange = async () => {
    if (!user || !newRole) return;
    try {
      await changeUserRole(user.id, newRole);
      toast.success('Role updated successfully');
      loadUser();
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error('Failed to change role');
    } finally {
      setRoleDialogOpen(false);
      setNewRole('');
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    try {
      await resetUserPassword(user.id);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setResetPasswordDialogOpen(false);
    }
  };

  const getInitials = (user: UserDetail) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: UserDetail) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'bg-purple-500/10 text-purple-500';
      case 'TEACHER': return 'bg-blue-500/10 text-blue-500';
      case 'STUDENT': return 'bg-green-500/10 text-green-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500';
      case 'BANNED': return 'bg-red-500/10 text-red-500';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center h-96'>
          <IconLoader2 className='h-8 w-8 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center h-96 gap-4'>
          <p className='text-muted-foreground'>User not found</p>
          <Button variant='outline' onClick={() => router.back()}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Go Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/users'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex-1'>
            <h2 className='text-2xl font-bold tracking-tight'>User Details</h2>
            <p className='text-muted-foreground'>View and manage user information</p>
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className='text-2xl'>{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-4'>
                <div>
                  <h3 className='text-xl font-semibold'>{getDisplayName(user)}</h3>
                  <p className='text-muted-foreground'>{user.email}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                  {user.subscriptionStatus && (
                    <Badge variant='outline'>{user.subscriptionStatus}</Badge>
                  )}
                </div>
                <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <IconMail className='h-4 w-4' />
                    {user.email}
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconCalendar className='h-4 w-4' />
                    Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </div>
                  {user.lastLoginAt && (
                    <div className='flex items-center gap-1'>
                      <IconClock className='h-4 w-4' />
                      Last login {format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setNewRole(user.role);
                    setRoleDialogOpen(true);
                  }}
                >
                  Change Role
                </Button>
                <Button variant='outline' onClick={() => setResetPasswordDialogOpen(true)}>
                  <IconKey className='mr-2 h-4 w-4' />
                  Reset Password
                </Button>
                <Button variant='outline' onClick={() => setWarnDialogOpen(true)}>
                  <IconAlertTriangle className='mr-2 h-4 w-4' />
                  Send Warning
                </Button>
                {user.status === 'BANNED' ? (
                  <Button variant='default' onClick={handleUnban}>
                    <IconCheck className='mr-2 h-4 w-4' />
                    Unban User
                  </Button>
                ) : (
                  <Button variant='destructive' onClick={() => setBanDialogOpen(true)}>
                    <IconBan className='mr-2 h-4 w-4' />
                    Ban User
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
            <TabsTrigger value='subscription'>Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Classes Attended</CardDescription>
                  <CardTitle className='text-3xl'>{user.totalClassesAttended || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Minutes Practiced</CardDescription>
                  <CardTitle className='text-3xl'>{user.totalMinutesPracticed || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Account Status</CardDescription>
                  <CardTitle className='text-3xl capitalize'>{user.status.toLowerCase()}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {user.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>{user.bio}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='activity'>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>User activity log will be displayed here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-center py-8'>
                  Activity log coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='subscription'>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Current subscription status and history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-center py-8'>
                  Subscription details coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {user.email}? They will not be able to access the platform.
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
            <DialogTitle>Send Warning</DialogTitle>
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

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ADMIN'>Admin</SelectItem>
                <SelectItem value='TEACHER'>Teacher</SelectItem>
                <SelectItem value='STUDENT'>Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRole || newRole === user.role}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to {user.email}. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
