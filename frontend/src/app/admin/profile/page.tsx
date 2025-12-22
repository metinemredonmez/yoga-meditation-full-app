'use client';

import { useState, useEffect, useRef } from 'react';
import { getMe, updateMe, changePassword, getAvatarUploadUrl, uploadFileToS3 } from '@/lib/api';
import { toast } from 'sonner';

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

export default function AdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

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
      toast.error('Profil yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateMe({ firstName, lastName, bio });
      toast.success('Profil guncellendi');
      loadProfile();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Profil guncellenemedi';
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

    if (!file.type.startsWith('image/')) {
      toast.error('Lutfen bir resim dosyasi secin');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim 5MB\'dan kucuk olmali');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { uploadUrl, fileUrl } = await getAvatarUploadUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file);
      await updateMe({ avatarUrl: fileUrl });
      toast.success('Avatar guncellendi');
      loadProfile();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Avatar yuklenemedi';
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Sifreler eslesmiyor');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Sifre en az 6 karakter olmali');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Sifre degistirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Sifre degistirilemedi. Mevcut sifrenizi kontrol edin.');
    } finally {
      setChangingPassword(false);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : profile?.email?.substring(0, 2).toUpperCase() || 'AD';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profil Ayarlari</h1>
        <p className="text-gray-500">Hesap bilgilerinizi yonetin</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profil Bilgileri
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Guvenlik
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Kisisel Bilgiler</h2>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  ) : (
                    <span>📷</span>
                  )}
                </button>
              </div>
              <div>
                <p className="font-semibold">
                  {profile?.firstName || profile?.lastName
                    ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
                    : 'Isim belirtilmedi'}
                </p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize">
                  {profile?.role?.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adinizi girin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Soyadinizi girin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kendinizden bahsedin"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email degistirilemez</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Degisiklikleri Kaydet
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Hesap Bilgileri</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-500">Hesap ID</span>
                <span className="font-mono text-sm truncate max-w-[150px]">{profile?.id}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-500">Rol</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize">
                  {profile?.role?.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-500">Uyelik Tarihi</span>
                <span className="text-sm">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500">Email Dogrulama</span>
                <span className="text-sm text-green-600">Dogrulandi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Sifre Degistir</h2>
            <p className="text-sm text-gray-500 mb-6">Hesabinizi guvenli tutmak icin sifrenizi duzenli olarak degistirin</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Sifre</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut sifreniz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Sifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni sifreniz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Sifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni sifrenizi tekrar girin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingPassword && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Sifreyi Degistir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
