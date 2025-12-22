'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser, setSession } from '@/lib/auth';
import { getMyProfile, updateMyProfile, getAvatarUploadUrl, getSubscriptionStatus } from '@/lib/api';
import { toast } from 'sonner';
import { IconCamera, IconLoader2, IconCrown, IconCheck, IconAlertCircle } from '@tabler/icons-react';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phoneNumber?: string;
  createdAt?: string;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    plan?: {
      name: string;
      tier: string;
    };
    currentPeriodEnd?: string;
  };
  daysRemaining?: number;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, subRes] = await Promise.allSettled([
        getMyProfile(),
        getSubscriptionStatus(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const userData = profileRes.value.user || profileRes.value.users || profileRes.value;
        setProfile(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
        });
      } else {
        // Fallback to local user
        const currentUser = getCurrentUser();
        if (currentUser) {
          setProfile({
            id: currentUser.userId || '',
            email: currentUser.email,
            role: currentUser.role,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
          });
          setFormData({
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
          });
        }
      }

      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Profil yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : profile?.email ? profile.email.substring(0, 2).toUpperCase() : 'KU';

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Ad ve soyad bos olamaz');
      return;
    }

    setSaving(true);
    try {
      const result = await updateMyProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      const updatedUser = result.user || result.users || result;
      setProfile(prev => prev ? { ...prev, ...updatedUser } : null);

      // Update local session
      const currentUser = getCurrentUser();
      if (currentUser) {
        setSession({
          ...currentUser,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        });
      }

      setIsEditing(false);
      toast.success('Profil bilgileriniz guncellendi');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Profil guncellenirken bir hata olustu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
    });
    setIsEditing(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPEG, PNG, WebP ve GIF dosyalari kabul edilir');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 5MB olabilir');
      return;
    }

    setUploading(true);
    try {
      // Get presigned upload URL
      const { uploadUrl, fileUrl } = await getAvatarUploadUrl(file.name, file.type);

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Update profile with new image URL
      await updateMyProfile({ avatarUrl: fileUrl });

      setProfile(prev => prev ? { ...prev, avatarUrl: fileUrl } : null);
      toast.success('Profil fotografi guncellendi');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Fotograf yuklenirken bir hata olustu');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profilim</h2>
          <p className="text-muted-foreground">
            Hesap bilgilerinizi goruntuleyin ve guncelleyin.
          </p>
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Fotografi</CardTitle>
            <CardDescription>Profil fotografinizi yukleyin veya degistirin</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="Profil" />
                ) : null}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold">{userInitials}</AvatarFallback>
              </Avatar>
              <button
                onClick={handleImageClick}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <IconLoader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <IconCamera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : (
                <>
                  <p className="font-medium text-lg">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  {profile?.createdAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Uye tarihi: {formatDate(profile.createdAt)}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kisisel Bilgiler</CardTitle>
                <CardDescription>Temel hesap bilgileriniz</CardDescription>
              </div>
              {!isEditing && !loading && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Duzenle
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    E-posta adresinizi degistirmek icin destek ile iletisime gecin.
                  </p>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        'Kaydet'
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      Iptal
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCrown className="h-5 w-5" />
              Abonelik Durumu
            </CardTitle>
            <CardDescription>Mevcut abonelik planiniz</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : subscription?.hasActiveSubscription ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-lg">
                    {subscription.subscription?.plan?.name || 'Premium'}
                  </p>
                  <Badge className="bg-green-600">
                    <IconCheck className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
                {subscription.daysRemaining !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.daysRemaining} gun kaldi
                  </p>
                )}
                {subscription.subscription?.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Yenileme tarihi: {formatDate(subscription.subscription.currentPeriodEnd)}
                  </p>
                )}
                <Link href="/student/billing">
                  <Button variant="outline" size="sm" className="mt-2">
                    Aboneligi Yonet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Ucretsiz Plan</p>
                    <Badge variant="secondary">Aktif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Premium ozelliklere erismek icin yukseltin.
                  </p>
                </div>
                <Link href="/student/billing">
                  <Button variant="outline">
                    <IconCrown className="h-4 w-4 mr-2" />
                    Planlari Goruntule
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Guvenligi</CardTitle>
            <CardDescription>Sifre ve guvenlik ayarlari</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student/settings">
              <Button variant="outline">
                Guvenlik Ayarlarina Git
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
