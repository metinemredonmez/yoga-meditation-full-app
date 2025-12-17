'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import {
  getUserOverview,
  getUserActivity,
  getUserLoginHistory,
  getUserActiveSessions,
  revokeUserSession,
  revokeAllUserSessions,
  getUserProgress,
  getUserPayments,
  extendUserSubscription,
  grantUserPremium,
  getUserSupport,
  addAdminNote,
  deleteAdminNote,
  toggleNotePin,
  addUserXP,
  grantUserBadge,
  grantUserTitle,
  addUserStreakFreeze,
  verifyUserEmail,
  verifyUserPhone,
  exportUserData,
  getTeacherProfile,
  updateInstructorStatus,
  updateInstructorTier,
  toggleInstructorVerified,
  toggleInstructorFeatured,
  updateInstructorCommission,
  banUser,
  unbanUser,
  warnUser,
  changeUserRole,
  resetUserPassword,
  getSubscriptionPlans,
  getAchievements,
  getTitles,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  IconCreditCard,
  IconHistory,
  IconShield,
  IconUser,
  IconActivity,
  IconTrophy,
  IconHeadphones,
  IconSettings,
  IconSchool,
  IconStar,
  IconFlame,
  IconDownload,
  IconPlus,
  IconTrash,
  IconPin,
  IconPinFilled,
  IconDevices,
  IconLogout,
  IconPhone,
  IconMapPin,
  IconWorld,
  IconCrown,
  IconGift,
  IconAward,
  IconRefresh,
  IconX,
  IconCheckbox,
  IconBadge,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// Types
interface OverviewData {
  profile: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    phoneVerified: boolean;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    timezone: string;
  };
  accountStatus: {
    status: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    memberSince: string;
    lastLogin: string | null;
    lastIp: string | null;
  };
  quickStats: {
    classesCompleted: number;
    totalXP: number;
    level: number;
    badgesEarned: number;
    currentStreak: number;
    totalPracticeMinutes: number;
    programsCompleted: number;
    challengesJoined: number;
    totalSessions: number;
  };
  subscription: {
    plan: string;
    tier: string;
    status: string;
    provider: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
  } | null;
  equippedItems: {
    title: string | null;
    frame: string | null;
  };
  lifetimeValue: number;
  totalPayments: number;
  activeBan: {
    reason: string;
    expiresAt: string | null;
    createdAt: string;
  } | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [support, setSupport] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  // List data for selects
  const [plans, setPlans] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [warnMessage, setWarnMessage] = useState('');
  const [warnSeverity, setWarnSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  // Admin action dialogs
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState(100);
  const [xpReason, setXpReason] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [extendSubDialogOpen, setExtendSubDialogOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [grantPremiumDialogOpen, setGrantPremiumDialogOpen] = useState(false);
  const [grantPremiumDays, setGrantPremiumDays] = useState(30);
  const [grantPremiumPlanId, setGrantPremiumPlanId] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePinned, setNotePinned] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadOverview();
    loadHelperData();
  }, [userId]);

  // Load tab data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'activity':
        if (!activity) loadActivity();
        break;
      case 'progress':
        if (!progress) loadProgress();
        break;
      case 'payments':
        if (!payments) loadPayments();
        break;
      case 'support':
        if (!support) loadSupport();
        break;
      case 'teacher':
        if (!teacherProfile && overview?.accountStatus?.role === 'TEACHER') loadTeacherProfile();
        break;
    }
  }, [activeTab]);

  // Loaders
  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await getUserOverview(userId);
      setOverview(res.data);
    } catch (error) {
      console.error('Failed to load overview:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const loadHelperData = async () => {
    try {
      const [plansRes, badgesRes, titlesRes] = await Promise.all([
        getSubscriptionPlans().catch(() => ({ data: { plans: [] } })),
        getAchievements({ limit: 100 }).catch(() => ({ data: { achievements: [] } })),
        getTitles({ limit: 100 }).catch(() => ({ data: { titles: [] } })),
      ]);
      setPlans(plansRes.data?.plans || plansRes.plans || []);
      setBadges(badgesRes.data?.achievements || badgesRes.achievements || []);
      setTitles(titlesRes.data?.titles || titlesRes.titles || []);
    } catch (error) {
      console.error('Failed to load helper data:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const [activityRes, loginRes, sessionsRes] = await Promise.all([
        getUserActivity(userId, { limit: 50 }),
        getUserLoginHistory(userId, { limit: 20 }),
        getUserActiveSessions(userId),
      ]);
      setActivity(activityRes.data);
      setLoginHistory(loginRes.data);
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await getUserProgress(userId);
      setProgress(res.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await getUserPayments(userId, { limit: 50 });
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const loadSupport = async () => {
    try {
      const res = await getUserSupport(userId);
      setSupport(res.data);
    } catch (error) {
      console.error('Failed to load support data:', error);
    }
  };

  const loadTeacherProfile = async () => {
    try {
      const res = await getTeacherProfile(userId);
      setTeacherProfile(res.data);
    } catch (error) {
      console.error('Failed to load teacher profile:', error);
    }
  };

  // Action handlers
  const handleBan = async () => {
    try {
      await banUser(userId, banReason);
      toast.success('User banned successfully');
      loadOverview();
      loadSupport();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    } finally {
      setBanDialogOpen(false);
      setBanReason('');
    }
  };

  const handleUnban = async () => {
    try {
      await unbanUser(userId);
      toast.success('User unbanned successfully');
      loadOverview();
      loadSupport();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleWarn = async () => {
    if (!warnMessage) return;
    try {
      await warnUser(userId, warnMessage);
      toast.success('Warning sent successfully');
      loadSupport();
    } catch (error) {
      console.error('Failed to send warning:', error);
      toast.error('Failed to send warning');
    } finally {
      setWarnDialogOpen(false);
      setWarnMessage('');
    }
  };

  const handleRoleChange = async () => {
    if (!newRole) return;
    try {
      await changeUserRole(userId, newRole);
      toast.success('Role updated successfully');
      loadOverview();
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error('Failed to change role');
    } finally {
      setRoleDialogOpen(false);
      setNewRole('');
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetUserPassword(userId);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setResetPasswordDialogOpen(false);
    }
  };

  const handleAddXP = async () => {
    if (!xpAmount || !xpReason) return;
    try {
      await addUserXP(userId, xpAmount, xpReason);
      toast.success(`Added ${xpAmount} XP successfully`);
      loadOverview();
      loadProgress();
    } catch (error) {
      console.error('Failed to add XP:', error);
      toast.error('Failed to add XP');
    } finally {
      setXpDialogOpen(false);
      setXpAmount(100);
      setXpReason('');
    }
  };

  const handleGrantBadge = async () => {
    if (!selectedBadgeId) return;
    try {
      await grantUserBadge(userId, selectedBadgeId);
      toast.success('Badge granted successfully');
      loadProgress();
    } catch (error) {
      console.error('Failed to grant badge:', error);
      toast.error('Failed to grant badge');
    } finally {
      setBadgeDialogOpen(false);
      setSelectedBadgeId('');
    }
  };

  const handleGrantTitle = async () => {
    if (!selectedTitleId) return;
    try {
      await grantUserTitle(userId, selectedTitleId);
      toast.success('Title granted successfully');
      loadProgress();
    } catch (error) {
      console.error('Failed to grant title:', error);
      toast.error('Failed to grant title');
    } finally {
      setTitleDialogOpen(false);
      setSelectedTitleId('');
    }
  };

  const handleAddStreakFreeze = async () => {
    try {
      await addUserStreakFreeze(userId);
      toast.success('Streak freeze added');
      loadProgress();
    } catch (error) {
      console.error('Failed to add streak freeze:', error);
      toast.error('Failed to add streak freeze');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await verifyUserEmail(userId);
      toast.success('Email verified');
      loadOverview();
    } catch (error) {
      console.error('Failed to verify email:', error);
      toast.error('Failed to verify email');
    }
  };

  const handleVerifyPhone = async () => {
    try {
      await verifyUserPhone(userId);
      toast.success('Phone verified');
      loadOverview();
    } catch (error) {
      console.error('Failed to verify phone:', error);
      toast.error('Failed to verify phone');
    }
  };

  const handleExtendSubscription = async () => {
    if (!extendDays) return;
    try {
      await extendUserSubscription(userId, extendDays);
      toast.success(`Subscription extended by ${extendDays} days`);
      loadOverview();
      loadPayments();
    } catch (error) {
      console.error('Failed to extend subscription:', error);
      toast.error('Failed to extend subscription');
    } finally {
      setExtendSubDialogOpen(false);
      setExtendDays(30);
    }
  };

  const handleGrantPremium = async () => {
    if (!grantPremiumDays || !grantPremiumPlanId) return;
    try {
      await grantUserPremium(userId, grantPremiumDays, grantPremiumPlanId);
      toast.success(`Premium granted for ${grantPremiumDays} days`);
      loadOverview();
      loadPayments();
    } catch (error) {
      console.error('Failed to grant premium:', error);
      toast.error('Failed to grant premium');
    } finally {
      setGrantPremiumDialogOpen(false);
      setGrantPremiumDays(30);
      setGrantPremiumPlanId('');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent) return;
    try {
      await addAdminNote(userId, noteContent, notePinned);
      toast.success('Note added');
      loadSupport();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setNoteDialogOpen(false);
      setNoteContent('');
      setNotePinned(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteAdminNote(userId, noteId);
      toast.success('Note deleted');
      loadSupport();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleToggleNotePin = async (noteId: string) => {
    try {
      await toggleNotePin(userId, noteId);
      toast.success('Note pin toggled');
      loadSupport();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to toggle pin');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeUserSession(userId, sessionId);
      toast.success('Session revoked');
      setSessions(sessions.filter((s: any) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllUserSessions(userId);
      toast.success('All sessions revoked');
      setSessions([]);
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      toast.error('Failed to revoke sessions');
    }
  };

  const handleExportUserData = async () => {
    try {
      const data = await exportUserData(userId);
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${userId}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  // Helpers
  const getInitials = () => {
    if (overview?.profile?.firstName && overview?.profile?.lastName) {
      return `${overview.profile.firstName[0]}${overview.profile.lastName[0]}`.toUpperCase();
    }
    return overview?.profile?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (overview?.profile?.firstName && overview?.profile?.lastName) {
      return `${overview.profile.firstName} ${overview.profile.lastName}`;
    }
    return overview?.profile?.email?.split('@')[0] || 'Unknown User';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'bg-[#8b5cf6]/10 text-[#8b5cf6]';
      case 'TEACHER':
        return 'bg-[#f97316]/10 text-[#f97316]';
      case 'STUDENT':
        return 'bg-[#06b6d4]/10 text-[#06b6d4]';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'banned':
        return 'bg-red-500/10 text-red-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
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

  if (!overview) {
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
            <p className='text-muted-foreground'>Comprehensive user management</p>
          </div>
        </div>

        {/* User Profile Header Card */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={overview.profile.avatarUrl || undefined} />
                <AvatarFallback className='text-2xl'>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-4'>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-xl font-semibold'>{getDisplayName()}</h3>
                    {overview.equippedItems?.title && (
                      <Badge variant='outline' className='text-xs'>{overview.equippedItems.title}</Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground'>{overview.profile.email}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Badge className={getRoleBadgeColor(overview.accountStatus.role)}>
                    {overview.accountStatus.role}
                  </Badge>
                  <Badge className={getStatusBadgeColor(overview.accountStatus.status)}>
                    {overview.accountStatus.status}
                  </Badge>
                  {overview.subscription && (
                    <Badge variant='outline' className='bg-amber-500/10 text-amber-500'>
                      <IconCrown className='h-3 w-3 mr-1' />
                      {overview.subscription.plan}
                    </Badge>
                  )}
                  {overview.accountStatus.emailVerified && (
                    <Badge variant='outline' className='text-green-500'>
                      <IconMail className='h-3 w-3 mr-1' />
                      Email Verified
                    </Badge>
                  )}
                  {overview.accountStatus.twoFactorEnabled && (
                    <Badge variant='outline' className='text-blue-500'>
                      <IconShield className='h-3 w-3 mr-1' />
                      2FA
                    </Badge>
                  )}
                </div>
                <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <IconCalendar className='h-4 w-4' />
                    Joined {format(new Date(overview.accountStatus.memberSince), 'MMM d, yyyy')}
                  </div>
                  {overview.accountStatus.lastLogin && (
                    <div className='flex items-center gap-1'>
                      <IconClock className='h-4 w-4' />
                      Last login {formatDistanceToNow(new Date(overview.accountStatus.lastLogin))} ago
                    </div>
                  )}
                  {overview.profile.location && (
                    <div className='flex items-center gap-1'>
                      <IconMapPin className='h-4 w-4' />
                      {overview.profile.location}
                    </div>
                  )}
                  {overview.profile.timezone && (
                    <div className='flex items-center gap-1'>
                      <IconWorld className='h-4 w-4' />
                      {overview.profile.timezone}
                    </div>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setNewRole(overview.accountStatus.role);
                    setRoleDialogOpen(true);
                  }}
                >
                  Change Role
                </Button>
                <Button variant='outline' size='sm' onClick={() => setResetPasswordDialogOpen(true)}>
                  <IconKey className='mr-2 h-4 w-4' />
                  Reset Password
                </Button>
                <Button variant='outline' size='sm' onClick={() => setWarnDialogOpen(true)}>
                  <IconAlertTriangle className='mr-2 h-4 w-4' />
                  Send Warning
                </Button>
                {overview.accountStatus.status === 'banned' ? (
                  <Button variant='default' size='sm' onClick={handleUnban}>
                    <IconCheck className='mr-2 h-4 w-4' />
                    Unban User
                  </Button>
                ) : (
                  <Button variant='destructive' size='sm' onClick={() => setBanDialogOpen(true)}>
                    <IconBan className='mr-2 h-4 w-4' />
                    Ban User
                  </Button>
                )}
              </div>
            </div>

            {/* Active Ban Warning */}
            {overview.activeBan && (
              <div className='mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
                <div className='flex items-center gap-2 text-red-500'>
                  <IconBan className='h-5 w-5' />
                  <span className='font-medium'>User is currently banned</span>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Reason: {overview.activeBan.reason}
                </p>
                {overview.activeBan.expiresAt && (
                  <p className='text-sm text-muted-foreground'>
                    Expires: {format(new Date(overview.activeBan.expiresAt), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
          <TabsList className='flex flex-wrap'>
            <TabsTrigger value='overview' className='flex items-center gap-1'>
              <IconUser className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='activity' className='flex items-center gap-1'>
              <IconActivity className='h-4 w-4' />
              Activity
            </TabsTrigger>
            <TabsTrigger value='progress' className='flex items-center gap-1'>
              <IconTrophy className='h-4 w-4' />
              Progress
            </TabsTrigger>
            <TabsTrigger value='payments' className='flex items-center gap-1'>
              <IconCreditCard className='h-4 w-4' />
              Payments
            </TabsTrigger>
            <TabsTrigger value='support' className='flex items-center gap-1'>
              <IconHeadphones className='h-4 w-4' />
              Support
            </TabsTrigger>
            <TabsTrigger value='admin' className='flex items-center gap-1'>
              <IconSettings className='h-4 w-4' />
              Admin Actions
            </TabsTrigger>
            {overview.accountStatus.role === 'TEACHER' && (
              <TabsTrigger value='teacher' className='flex items-center gap-1'>
                <IconSchool className='h-4 w-4' />
                Teacher
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Level</CardDescription>
                  <CardTitle className='text-3xl flex items-center gap-2'>
                    {overview.quickStats.level}
                    <IconStar className='h-6 w-6 text-amber-500' />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-xs text-muted-foreground'>{overview.quickStats.totalXP.toLocaleString()} total XP</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Current Streak</CardDescription>
                  <CardTitle className='text-3xl flex items-center gap-2'>
                    {overview.quickStats.currentStreak}
                    <IconFlame className='h-6 w-6 text-orange-500' />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-xs text-muted-foreground'>days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Classes Completed</CardDescription>
                  <CardTitle className='text-3xl'>{overview.quickStats.classesCompleted}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-xs text-muted-foreground'>{overview.quickStats.totalPracticeMinutes} minutes total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardDescription>Lifetime Value</CardDescription>
                  <CardTitle className='text-3xl'>${overview.lifetimeValue.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-xs text-muted-foreground'>{overview.totalPayments} payments</p>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>Badges Earned</span>
                    <span className='font-medium'>{overview.quickStats.badgesEarned}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Programs Completed</span>
                    <span className='font-medium'>{overview.quickStats.programsCompleted}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Challenges Joined</span>
                    <span className='font-medium'>{overview.quickStats.challengesJoined}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total Sessions</span>
                    <span className='font-medium'>{overview.quickStats.totalSessions}</span>
                  </div>
                </CardContent>
              </Card>

              {overview.subscription ? (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <IconCrown className='h-5 w-5 text-amber-500' />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <div className='flex justify-between'>
                      <span>Plan</span>
                      <span className='font-medium'>{overview.subscription.plan}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Tier</span>
                      <Badge variant='outline'>{overview.subscription.tier}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span>Status</span>
                      <Badge className={overview.subscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                        {overview.subscription.status}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span>Period End</span>
                      <span className='text-sm'>{format(new Date(overview.subscription.currentPeriodEnd), 'MMM d, yyyy')}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Auto Renew</span>
                      <span>{overview.subscription.autoRenew ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Active Subscription</CardTitle>
                    <CardDescription>User is on free tier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={() => setGrantPremiumDialogOpen(true)}
                    >
                      <IconGift className='mr-2 h-4 w-4' />
                      Grant Premium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Activity */}
          <TabsContent value='activity' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconHistory className='h-5 w-5' />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[400px]'>
                    {activity?.activities?.length > 0 ? (
                      <div className='space-y-3'>
                        {activity.activities.map((a: any) => (
                          <div key={a.id} className='flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50'>
                            <div className='w-2 h-2 mt-2 rounded-full bg-primary' />
                            <div className='flex-1'>
                              <p className='text-sm'>{a.type}</p>
                              <p className='text-xs text-muted-foreground'>
                                {formatDistanceToNow(new Date(a.createdAt))} ago
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-8'>No activity recorded</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Login History & Sessions */}
              <div className='space-y-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <IconDevices className='h-5 w-5' />
                      Active Sessions ({sessions.length})
                    </CardTitle>
                    {sessions.length > 0 && (
                      <Button variant='destructive' size='sm' onClick={handleRevokeAllSessions}>
                        <IconLogout className='mr-2 h-4 w-4' />
                        Revoke All
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {sessions.length > 0 ? (
                      <div className='space-y-2'>
                        {sessions.map((s: any) => (
                          <div key={s.id} className='flex items-center justify-between p-2 rounded-lg border'>
                            <div>
                              <p className='text-sm font-medium'>{s.device}</p>
                              <p className='text-xs text-muted-foreground'>{s.ipAddress}</p>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRevokeSession(s.id)}
                            >
                              <IconX className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-4'>No active sessions</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Login History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-[200px]'>
                      {loginHistory?.loginHistory?.length > 0 ? (
                        <div className='space-y-2'>
                          {loginHistory.loginHistory.map((l: any) => (
                            <div key={l.id} className='flex items-center justify-between p-2 rounded-lg border'>
                              <div>
                                <p className='text-sm'>{l.device}</p>
                                <p className='text-xs text-muted-foreground'>{l.ipAddress}</p>
                              </div>
                              <div className='text-right'>
                                <p className='text-xs text-muted-foreground'>
                                  {format(new Date(l.createdAt), 'MMM d, HH:mm')}
                                </p>
                                {l.isRevoked && (
                                  <Badge variant='outline' className='text-xs'>Revoked</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-4'>No login history</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Progress */}
          <TabsContent value='progress' className='space-y-4'>
            {progress ? (
              <>
                {/* Level Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Level Progress</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white'>
                          {progress.level?.current || 1}
                        </div>
                        <div>
                          <p className='font-medium'>Level {progress.level?.current || 1}</p>
                          <p className='text-sm text-muted-foreground'>
                            {progress.level?.currentXP?.toLocaleString() || 0} / {progress.level?.xpForNextLevel?.toLocaleString() || 100} XP
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold'>{progress.level?.totalXP?.toLocaleString() || 0}</p>
                        <p className='text-sm text-muted-foreground'>Total XP</p>
                      </div>
                    </div>
                    <Progress value={progress.level?.progressPercent || 0} className='h-3' />
                    <div className='grid grid-cols-3 gap-4 text-center'>
                      <div>
                        <p className='text-2xl font-bold flex items-center justify-center gap-1'>
                          {progress.level?.currentStreak || 0}
                          <IconFlame className='h-5 w-5 text-orange-500' />
                        </p>
                        <p className='text-xs text-muted-foreground'>Current Streak</p>
                      </div>
                      <div>
                        <p className='text-2xl font-bold'>{progress.level?.longestStreak || 0}</p>
                        <p className='text-xs text-muted-foreground'>Longest Streak</p>
                      </div>
                      <div>
                        <p className='text-2xl font-bold'>{progress.level?.streakFreezeCount || 0}</p>
                        <p className='text-xs text-muted-foreground'>Streak Freezes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <span>Badges ({progress.badges?.earned?.length || 0} / {progress.badges?.totalAvailable || 0})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progress.badges?.earned?.length > 0 ? (
                      <div className='grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4'>
                        {progress.badges.earned.map((b: any) => (
                          <div key={b.id} className='flex flex-col items-center gap-1'>
                            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center'>
                              <IconBadge className='h-6 w-6 text-white' />
                            </div>
                            <p className='text-xs text-center truncate w-full'>{b.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-4'>No badges earned yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements in Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progress.achievements?.length > 0 ? (
                      <div className='space-y-3'>
                        {progress.achievements.slice(0, 5).map((a: any) => (
                          <div key={a.id} className='space-y-1'>
                            <div className='flex items-center justify-between'>
                              <span className='text-sm font-medium'>{a.name}</span>
                              <span className='text-xs text-muted-foreground'>
                                {a.currentValue} / {a.targetValue}
                              </span>
                            </div>
                            <Progress value={a.percentage} className='h-2' />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-4'>No achievements in progress</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Classes & Challenges */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {progress.recentClasses?.length > 0 ? (
                        <div className='space-y-2'>
                          {progress.recentClasses.slice(0, 5).map((c: any) => (
                            <div key={c.id} className='flex items-center gap-3 p-2 rounded-lg border'>
                              <div className='w-12 h-12 rounded bg-muted flex items-center justify-center'>
                                {c.thumbnailUrl ? (
                                  <img src={c.thumbnailUrl} alt='' className='w-full h-full object-cover rounded' />
                                ) : (
                                  <IconActivity className='h-6 w-6 text-muted-foreground' />
                                )}
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm font-medium truncate'>{c.title}</p>
                                <p className='text-xs text-muted-foreground'>{c.duration} min</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-4'>No classes completed</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Active Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {progress.challenges?.length > 0 ? (
                        <div className='space-y-2'>
                          {progress.challenges.slice(0, 5).map((c: any) => (
                            <div key={c.id} className='p-2 rounded-lg border'>
                              <p className='text-sm font-medium'>{c.title}</p>
                              <p className='text-xs text-muted-foreground'>
                                {c.daysCompleted} days completed
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-4'>No active challenges</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className='flex items-center justify-center h-48'>
                <IconLoader2 className='h-8 w-8 animate-spin' />
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Payments */}
          <TabsContent value='payments' className='space-y-4'>
            {payments ? (
              <>
                {/* Summary */}
                <div className='grid gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Lifetime Value</CardDescription>
                      <CardTitle className='text-2xl'>${payments.summary?.lifetimeValue?.toFixed(2) || '0.00'}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Successful Payments</CardDescription>
                      <CardTitle className='text-2xl'>{payments.summary?.successfulPayments || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Failed Payments</CardDescription>
                      <CardTitle className='text-2xl text-red-500'>{payments.summary?.failedPayments || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardDescription>Total Refunded</CardDescription>
                      <CardTitle className='text-2xl'>${payments.summary?.totalRefunded?.toFixed(2) || '0.00'}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Current Subscription */}
                {payments.currentSubscription && (
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between'>
                      <div>
                        <CardTitle className='flex items-center gap-2'>
                          <IconCrown className='h-5 w-5 text-amber-500' />
                          Current Subscription
                        </CardTitle>
                        <CardDescription>{payments.currentSubscription.plan}</CardDescription>
                      </div>
                      <Button variant='outline' onClick={() => setExtendSubDialogOpen(true)}>
                        Extend Subscription
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className='grid gap-2 md:grid-cols-4'>
                        <div>
                          <p className='text-sm text-muted-foreground'>Status</p>
                          <Badge className={payments.currentSubscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : ''}>
                            {payments.currentSubscription.status}
                          </Badge>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Provider</p>
                          <p className='font-medium'>{payments.currentSubscription.provider}</p>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Period End</p>
                          <p className='font-medium'>
                            {format(new Date(payments.currentSubscription.currentPeriodEnd), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Auto Renew</p>
                          <p className='font-medium'>{payments.currentSubscription.autoRenew ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {payments.payments?.items?.length > 0 ? (
                      <div className='space-y-2'>
                        {payments.payments.items.map((p: any) => (
                          <div key={p.id} className='flex items-center justify-between p-3 rounded-lg border'>
                            <div>
                              <p className='font-medium'>${p.amount?.toFixed(2)} {p.currency}</p>
                              <p className='text-sm text-muted-foreground'>
                                {format(new Date(p.createdAt), 'MMM d, yyyy HH:mm')}
                                {p.cardBrand && ` • ${p.cardBrand} ****${p.cardLast4}`}
                              </p>
                            </div>
                            <Badge className={
                              p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                              p.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-8'>No payment history</p>
                    )}
                  </CardContent>
                </Card>

                {/* Coupon Usages */}
                {payments.couponUsages?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Coupon Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        {payments.couponUsages.map((cu: any, i: number) => (
                          <div key={i} className='flex items-center justify-between p-3 rounded-lg border'>
                            <div>
                              <p className='font-medium'>{cu.code}</p>
                              <p className='text-sm text-muted-foreground'>
                                Saved ${cu.savedAmount?.toFixed(2)}
                              </p>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                              {format(new Date(cu.usedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className='flex items-center justify-center h-48'>
                <IconLoader2 className='h-8 w-8 animate-spin' />
              </div>
            )}
          </TabsContent>

          {/* Tab 5: Support */}
          <TabsContent value='support' className='space-y-4'>
            {support ? (
              <div className='grid gap-4 md:grid-cols-2'>
                {/* Warnings */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <IconAlertTriangle className='h-5 w-5 text-yellow-500' />
                      Warnings ({support.warnings?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-[300px]'>
                      {support.warnings?.length > 0 ? (
                        <div className='space-y-2'>
                          {support.warnings.map((w: any) => (
                            <div key={w.id} className='p-3 rounded-lg border'>
                              <div className='flex items-center justify-between mb-2'>
                                <Badge className={
                                  w.severity === 5 ? 'bg-red-500/10 text-red-500' :
                                  w.severity === 3 ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }>
                                  {w.severity === 5 ? 'HIGH' : w.severity === 3 ? 'MEDIUM' : 'LOW'}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {format(new Date(w.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <p className='text-sm'>{w.reason}</p>
                              <p className='text-xs text-muted-foreground mt-1'>By: {w.warnedBy}</p>
                              {w.acknowledgedAt && (
                                <Badge variant='outline' className='mt-2 text-xs'>
                                  <IconCheck className='h-3 w-3 mr-1' />
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-4'>No warnings</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Ban History */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <IconBan className='h-5 w-5 text-red-500' />
                      Ban History ({support.bans?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-[300px]'>
                      {support.bans?.length > 0 ? (
                        <div className='space-y-2'>
                          {support.bans.map((b: any) => (
                            <div key={b.id} className='p-3 rounded-lg border'>
                              <div className='flex items-center justify-between mb-2'>
                                <Badge className={b.isActive ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}>
                                  {b.isActive ? 'Active' : 'Lifted'}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {format(new Date(b.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <p className='text-sm'>{b.reason}</p>
                              <p className='text-xs text-muted-foreground mt-1'>By: {b.bannedBy}</p>
                              {b.unbannedAt && (
                                <p className='text-xs text-green-500 mt-1'>
                                  Unbanned: {format(new Date(b.unbannedAt), 'MMM d, yyyy')} by {b.unbannedBy}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-4'>No ban history</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Admin Notes */}
                <Card className='md:col-span-2'>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Admin Notes</CardTitle>
                    <Button size='sm' onClick={() => setNoteDialogOpen(true)}>
                      <IconPlus className='h-4 w-4 mr-2' />
                      Add Note
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {support.adminNotes?.length > 0 ? (
                      <div className='space-y-2'>
                        {support.adminNotes.map((n: any) => (
                          <div key={n.id} className='p-3 rounded-lg border'>
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <p className='text-sm'>{n.content}</p>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {n.author} • {format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}
                                </p>
                              </div>
                              <div className='flex items-center gap-1'>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleToggleNotePin(n.id)}
                                >
                                  {n.isPinned ? (
                                    <IconPinFilled className='h-4 w-4 text-primary' />
                                  ) : (
                                    <IconPin className='h-4 w-4' />
                                  )}
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleDeleteNote(n.id)}
                                >
                                  <IconTrash className='h-4 w-4 text-red-500' />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-center py-4'>No admin notes</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className='flex items-center justify-center h-48'>
                <IconLoader2 className='h-8 w-8 animate-spin' />
              </div>
            )}
          </TabsContent>

          {/* Tab 6: Admin Actions */}
          <TabsContent value='admin' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              {/* Gamification Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconTrophy className='h-5 w-5' />
                    Gamification Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button variant='outline' className='w-full justify-start' onClick={() => setXpDialogOpen(true)}>
                    <IconStar className='h-4 w-4 mr-2' />
                    Add XP
                  </Button>
                  <Button variant='outline' className='w-full justify-start' onClick={() => setBadgeDialogOpen(true)}>
                    <IconAward className='h-4 w-4 mr-2' />
                    Grant Badge
                  </Button>
                  <Button variant='outline' className='w-full justify-start' onClick={() => setTitleDialogOpen(true)}>
                    <IconCrown className='h-4 w-4 mr-2' />
                    Grant Title
                  </Button>
                  <Button variant='outline' className='w-full justify-start' onClick={handleAddStreakFreeze}>
                    <IconFlame className='h-4 w-4 mr-2' />
                    Add Streak Freeze
                  </Button>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconUser className='h-5 w-5' />
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {!overview.accountStatus.emailVerified && (
                    <Button variant='outline' className='w-full justify-start' onClick={handleVerifyEmail}>
                      <IconMail className='h-4 w-4 mr-2' />
                      Verify Email
                    </Button>
                  )}
                  {!overview.accountStatus.phoneVerified && (
                    <Button variant='outline' className='w-full justify-start' onClick={handleVerifyPhone}>
                      <IconPhone className='h-4 w-4 mr-2' />
                      Verify Phone
                    </Button>
                  )}
                  <Button variant='outline' className='w-full justify-start' onClick={handleExportUserData}>
                    <IconDownload className='h-4 w-4 mr-2' />
                    Export User Data
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconCreditCard className='h-5 w-5' />
                    Subscription Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {overview.subscription ? (
                    <Button variant='outline' className='w-full justify-start' onClick={() => setExtendSubDialogOpen(true)}>
                      <IconCalendar className='h-4 w-4 mr-2' />
                      Extend Subscription
                    </Button>
                  ) : (
                    <Button variant='outline' className='w-full justify-start' onClick={() => setGrantPremiumDialogOpen(true)}>
                      <IconGift className='h-4 w-4 mr-2' />
                      Grant Premium
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className='border-red-500/50'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-red-500'>
                    <IconAlertTriangle className='h-5 w-5' />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button variant='outline' className='w-full justify-start' onClick={() => setWarnDialogOpen(true)}>
                    <IconAlertTriangle className='h-4 w-4 mr-2' />
                    Send Warning
                  </Button>
                  {overview.accountStatus.status !== 'banned' ? (
                    <Button variant='destructive' className='w-full justify-start' onClick={() => setBanDialogOpen(true)}>
                      <IconBan className='h-4 w-4 mr-2' />
                      Ban User
                    </Button>
                  ) : (
                    <Button variant='default' className='w-full justify-start' onClick={handleUnban}>
                      <IconCheck className='h-4 w-4 mr-2' />
                      Unban User
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 7: Teacher (only for TEACHER role) */}
          {overview.accountStatus.role === 'TEACHER' && (
            <TabsContent value='teacher' className='space-y-4'>
              {teacherProfile ? (
                <>
                  {/* Teacher Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Instructor Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                          <p className='text-sm text-muted-foreground'>Display Name</p>
                          <p className='font-medium'>{teacherProfile.profile?.displayName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Status</p>
                          <Badge>{teacherProfile.profile?.status}</Badge>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Tier</p>
                          <Badge variant='outline'>{teacherProfile.profile?.tier}</Badge>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Commission Rate</p>
                          <p className='font-medium'>{teacherProfile.profile?.commissionRate}%</p>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Verified</p>
                          <p className='font-medium'>{teacherProfile.profile?.isVerified ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>Featured</p>
                          <p className='font-medium'>{teacherProfile.profile?.isFeatured ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <div className='grid gap-4 md:grid-cols-4'>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardDescription>Total Classes</CardDescription>
                        <CardTitle className='text-2xl'>{teacherProfile.stats?.totalClasses || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardDescription>Total Students</CardDescription>
                        <CardTitle className='text-2xl'>{teacherProfile.stats?.totalStudents || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardDescription>Average Rating</CardDescription>
                        <CardTitle className='text-2xl flex items-center gap-1'>
                          {teacherProfile.stats?.averageRating?.toFixed(1) || '0.0'}
                          <IconStar className='h-5 w-5 text-amber-500' />
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardDescription>Total Earnings</CardDescription>
                        <CardTitle className='text-2xl'>${teacherProfile.financial?.totalEarnings?.toFixed(2) || '0.00'}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </>
              ) : (
                <div className='flex items-center justify-center h-48'>
                  <IconLoader2 className='h-8 w-8 animate-spin' />
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban this user? They will not be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Reason for ban'
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
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Severity</Label>
              <Select value={warnSeverity} onValueChange={(v) => setWarnSeverity(v as 'LOW' | 'MEDIUM' | 'HIGH')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Message</Label>
              <Textarea
                placeholder='Warning message...'
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWarnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleWarn} disabled={!warnMessage}>Send Warning</Button>
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
                <SelectItem value='STUDENT'>Student</SelectItem>
                <SelectItem value='TEACHER'>Teacher</SelectItem>
                <SelectItem value='ADMIN'>Admin</SelectItem>
                <SelectItem value='SUPER_ADMIN'>Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={!newRole || newRole === overview?.accountStatus?.role}>
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
              This will send a password reset email to {overview?.profile?.email}. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Send Reset Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add XP Dialog */}
      <Dialog open={xpDialogOpen} onOpenChange={setXpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add XP</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Amount</Label>
              <Input
                type='number'
                value={xpAmount}
                onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Reason</Label>
              <Input
                placeholder='Reason for XP grant'
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setXpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddXP} disabled={!xpAmount || !xpReason}>Add XP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Badge Dialog */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Badge</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
              <SelectTrigger>
                <SelectValue placeholder='Select badge' />
              </SelectTrigger>
              <SelectContent>
                {badges.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setBadgeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantBadge} disabled={!selectedBadgeId}>Grant Badge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Title Dialog */}
      <Dialog open={titleDialogOpen} onOpenChange={setTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Title</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Select value={selectedTitleId} onValueChange={setSelectedTitleId}>
              <SelectTrigger>
                <SelectValue placeholder='Select title' />
              </SelectTrigger>
              <SelectContent>
                {titles.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTitleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantTitle} disabled={!selectedTitleId}>Grant Title</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendSubDialogOpen} onOpenChange={setExtendSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Label>Days to extend</Label>
            <Input
              type='number'
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setExtendSubDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExtendSubscription} disabled={!extendDays}>Extend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Premium Dialog */}
      <Dialog open={grantPremiumDialogOpen} onOpenChange={setGrantPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Premium</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Plan</Label>
              <Select value={grantPremiumPlanId} onValueChange={setGrantPremiumPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select plan' />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Days</Label>
              <Input
                type='number'
                value={grantPremiumDays}
                onChange={(e) => setGrantPremiumDays(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGrantPremiumDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantPremium} disabled={!grantPremiumDays || !grantPremiumPlanId}>
              Grant Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Note</Label>
              <Textarea
                placeholder='Write a note...'
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='pinNote'
                checked={notePinned}
                onChange={(e) => setNotePinned(e.target.checked)}
              />
              <Label htmlFor='pinNote'>Pin this note</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteContent}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
