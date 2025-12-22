'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  IconLoader2,
  IconUpload,
  IconPlus,
  IconX,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTwitter,
  IconBrandFacebook,
  IconWorld,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { getInstructorProfile, updateInstructorProfile, uploadInstructorMedia } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InstructorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  specialties: string[];
  socialLinks: { platform: string; url: string }[];
  totalClasses: number;
  totalStudents: number;
  rating: number;
  joinedAt: string;
}

const socialPlatforms = [
  { id: 'instagram', label: 'Instagram', icon: IconBrandInstagram },
  { id: 'youtube', label: 'YouTube', icon: IconBrandYoutube },
  { id: 'twitter', label: 'Twitter', icon: IconBrandTwitter },
  { id: 'facebook', label: 'Facebook', icon: IconBrandFacebook },
  { id: 'website', label: 'Website', icon: IconWorld },
];

export function InstructorProfileForm() {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  // Form state
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getInstructorProfile();
      // Map backend data to frontend format
      const mappedProfile: InstructorProfile = {
        id: data.id,
        firstName: data.users?.firstName || data.displayName?.split(' ')[0] || '',
        lastName: data.users?.lastName || data.displayName?.split(' ').slice(1).join(' ') || '',
        email: data.users?.email || '',
        bio: data.bio || '',
        avatarUrl: data.profileImageUrl || '',
        specialties: data.specializations || [],
        socialLinks: data.socialLinks ? Object.entries(data.socialLinks).map(([platform, url]) => ({ platform, url: url as string })) : [],
        totalClasses: data.totalClasses || 0,
        totalStudents: data.totalStudents || 0,
        rating: parseFloat(data.averageRating) || 0,
        joinedAt: data.createdAt || '',
      };
      setProfile(mappedProfile);
      setBio(mappedProfile.bio || '');
      setSpecialties(mappedProfile.specialties || []);
      setSocialLinks(mappedProfile.socialLinks || []);
      setAvatarUrl(mappedProfile.avatarUrl || '');
      setAvatarUrlInput(mappedProfile.avatarUrl || '');
    } catch (error) {
      // Mock data
      const mockProfile: InstructorProfile = {
        id: '1',
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        email: 'ayse@yogaplatform.com',
        bio: 'Sertifikalı yoga eğitmeni. 10 yıllık deneyim. Vinyasa ve Hatha yoga uzmanlığı.',
        avatarUrl: '',
        specialties: ['Vinyasa', 'Hatha', 'Meditasyon', 'Nefes Teknikleri'],
        socialLinks: [
          { platform: 'instagram', url: 'https://instagram.com/ayseyoga' },
          { platform: 'youtube', url: 'https://youtube.com/@ayseyoga' },
        ],
        totalClasses: 45,
        totalStudents: 1250,
        rating: 4.9,
        joinedAt: '2022-01-15',
      };
      setProfile(mockProfile);
      setBio(mockProfile.bio);
      setSpecialties(mockProfile.specialties);
      setSocialLinks(mockProfile.socialLinks);
      setAvatarUrl(mockProfile.avatarUrl || '');
      setAvatarUrlInput(mockProfile.avatarUrl || '');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateInstructorProfile({
        bio,
        specialties,
        socialLinks,
        avatarUrl: avatarUrl || undefined,
      });
      toast.success('Profil güncellendi');
    } catch (error) {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty));
  };

  const updateSocialLink = (platform: string, url: string) => {
    const existing = socialLinks.find((l) => l.platform === platform);
    if (existing) {
      setSocialLinks(socialLinks.map((l) => (l.platform === platform ? { ...l, url } : l)));
    } else {
      setSocialLinks([...socialLinks, { platform, url }]);
    }
  };

  const getSocialLinkUrl = (platform: string) => {
    return socialLinks.find((l) => l.platform === platform)?.url || '';
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadInstructorMedia(file, 'image');
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        setAvatarUrlInput(result.url);
        setShowPhotoDialog(false);
        toast.success('Fotoğraf yüklendi');
      } else {
        toast.error('Fotoğraf yüklenemedi');
      }
    } catch (error) {
      toast.error('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUrlSave = () => {
    if (avatarUrlInput) {
      setAvatarUrl(avatarUrlInput);
      setShowPhotoDialog(false);
      toast.success('Fotoğraf URL\'si güncellendi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
          <CardDescription>Temel bilgileriniz ve istatistikleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                onClick={() => setShowPhotoDialog(true)}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconUpload className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </h3>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="font-semibold text-2xl">{profile?.totalClasses}</div>
                  <div className="text-muted-foreground">Ders</div>
                </div>
                <div>
                  <div className="font-semibold text-2xl">{profile?.totalStudents?.toLocaleString()}</div>
                  <div className="text-muted-foreground">Öğrenci</div>
                </div>
                <div>
                  <div className="font-semibold text-2xl flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {profile?.rating?.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground">Puan</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>Hakkımda</CardTitle>
          <CardDescription>Kendinizi tanıtan bir açıklama yazın</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Yoga yolculuğunuz, deneyimleriniz ve öğretim tarzınız hakkında bilgi verin..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Uzmanlık Alanları</CardTitle>
          <CardDescription>Yoga stilleri ve özel becerileriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="gap-1 pr-1">
                {specialty}
                <button
                  onClick={() => removeSpecialty(specialty)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Yeni uzmanlık alanı"
              onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
            />
            <Button onClick={addSpecialty} variant="outline">
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Sosyal Medya</CardTitle>
          <CardDescription>Sosyal medya hesaplarınızı bağlayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{platform.label}</span>
                </div>
                <Input
                  value={getSocialLinkUrl(platform.id)}
                  onChange={(e) => updateSocialLink(platform.id, e.target.value)}
                  placeholder={`${platform.label} URL`}
                  className="flex-1"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Değişiklikleri Kaydet
        </Button>
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil Fotoğrafı</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Current Photo Preview */}
            <div className="flex justify-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl || avatarUrlInput} />
                <AvatarFallback className="text-3xl">
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Upload Option */}
            <div className="space-y-2">
              <Label>Dosyadan Yükle</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maksimum 5MB, JPG, PNG veya GIF formatında
              </p>
            </div>

            <Separator />

            {/* URL Option */}
            <div className="space-y-2">
              <Label>veya URL Girin</Label>
              <div className="flex gap-2">
                <Input
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button onClick={handleUrlSave} variant="outline" disabled={!avatarUrlInput}>
                  Kaydet
                </Button>
              </div>
            </div>

            {/* Remove Photo */}
            {avatarUrl && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setAvatarUrl('');
                  setAvatarUrlInput('');
                  setShowPhotoDialog(false);
                  toast.success('Fotoğraf kaldırıldı');
                }}
              >
                Fotoğrafı Kaldır
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
