'use client';

import { useState, useEffect } from 'react';
import { getMe, updateMe, changePassword, deleteAccount, getAvatarUploadUrl, uploadFileToS3 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { IconLoader2, IconUser, IconLock, IconTrash, IconCamera, IconUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export default function ProfileViewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMe();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateMe({ firstName, lastName, bio });
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Get presigned URL from backend
      const { uploadUrl, fileUrl } = await getAvatarUploadUrl(file.name, file.type);

      // Upload directly to S3
      await uploadFileToS3(uploadUrl, file);

      // Update user profile with new avatar URL
      await updateMe({ avatarUrl: fileUrl });

      toast.success('Avatar updated');
      loadProfile();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success('Account deleted');
      router.push('/auth/sign-in');
    } catch (error) {
      toast.error('Failed to delete account. Check your password.');
    } finally {
      setDeleting(false);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : profile?.email?.substring(0, 2).toUpperCase() || 'YA';

  if (loading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col gap-6 p-4 md:p-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Profile</h2>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue='profile' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='profile' className='gap-2'>
            <IconUser className='h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger value='security' className='gap-2'>
            <IconLock className='h-4 w-4' />
            Security
          </TabsTrigger>
          <TabsTrigger value='danger' className='gap-2'>
            <IconTrash className='h-4 w-4' />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile'>
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Profile Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept='image/*'
                  className='hidden'
                />
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    <Avatar className='h-20 w-20'>
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className='text-lg'>{userInitials}</AvatarFallback>
                    </Avatar>
                    <Button
                      size='icon'
                      variant='secondary'
                      className='absolute -bottom-1 -right-1 h-7 w-7 rounded-full'
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <IconLoader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        <IconCamera className='h-3 w-3' />
                      )}
                    </Button>
                  </div>
                  <div>
                    <p className='font-semibold'>
                      {profile?.firstName || profile?.lastName
                        ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
                        : 'No name set'}
                    </p>
                    <p className='text-sm text-muted-foreground'>{profile?.email}</p>
                    <p className='text-xs text-muted-foreground capitalize'>Role: {profile?.role?.toLowerCase()}</p>
                  </div>
                </div>
                <Separator />
                <div className='space-y-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder='Enter your first name'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder='Enter your last name'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='bio'>Bio</Label>
                    <Input
                      id='bio'
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder='Tell us about yourself'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={email}
                      disabled
                      className='bg-muted cursor-not-allowed'
                    />
                    <p className='text-xs text-muted-foreground'>Email cannot be changed</p>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className='w-full'>
                    {saving && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details and statistics</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground'>Account ID</span>
                    <span className='font-mono text-sm truncate max-w-[150px]'>{profile?.id}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground'>Role</span>
                    <span className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize'>
                      {profile?.role?.toLowerCase()}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground'>Member Since</span>
                    <span className='text-sm'>
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-muted-foreground'>Email Verified</span>
                    <span className='text-sm text-green-500'>Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='security'>
          <Card className='max-w-lg'>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-2'>
                <Label htmlFor='currentPassword'>Current Password</Label>
                <Input
                  id='currentPassword'
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder='Enter current password'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='newPassword'>New Password</Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className='w-full'
              >
                {changingPassword && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='danger'>
          <Card className='max-w-lg border-destructive'>
            <CardHeader>
              <CardTitle className='text-destructive'>Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive' className='w-full'>
                    <IconTrash className='mr-2 h-4 w-4' />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className='space-y-4'>
                      <p>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </p>
                      <div className='space-y-3 pt-2'>
                        <div className='grid gap-2'>
                          <Label htmlFor='deletePassword'>Enter your password</Label>
                          <Input
                            id='deletePassword'
                            type='password'
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder='Your current password'
                          />
                        </div>
                        <div className='grid gap-2'>
                          <Label htmlFor='deleteConfirm'>Type DELETE to confirm</Label>
                          <Input
                            id='deleteConfirm'
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder='DELETE'
                          />
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setDeleteConfirmText(''); setDeletePassword(''); }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      {deleting && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
