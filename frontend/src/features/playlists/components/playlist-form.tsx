'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminPlaylistById,
  createPlaylist,
  updatePlaylist,
  addPlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
  getAdminMeditations,
  getAdminBreathworkSessions,
  getAdminSoundscapes,
  getAdminSleepStories,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  IconLoader2,
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconBrain,
  IconWind,
  IconMusic,
  IconMoon,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface PlaylistFormProps {
  playlistId?: string;
}

interface PlaylistItem {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  duration?: number;
  coverImage?: string;
  note?: string;
  sortOrder: number;
}

const TYPE_OPTIONS = [
  { value: 'SYSTEM', label: 'Sistem (Herkes görür)' },
  { value: 'CURATED', label: 'Editör Seçimi' },
  { value: 'COURSE', label: 'Kurs/Program' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'MIXED', label: 'Karışık' },
  { value: 'MEDITATION', label: 'Sadece Meditasyon' },
  { value: 'BREATHWORK', label: 'Sadece Nefes' },
  { value: 'SOUNDSCAPE', label: 'Sadece Ses' },
  { value: 'SLEEP', label: 'Sadece Uyku' },
];

const ITEM_CONTENT_TYPES = [
  { value: 'MEDITATION', label: 'Meditasyon', icon: IconBrain },
  { value: 'BREATHWORK', label: 'Nefes', icon: IconWind },
  { value: 'SOUNDSCAPE', label: 'Ses', icon: IconMusic },
  { value: 'SLEEP_STORY', label: 'Uyku Hikayesi', icon: IconMoon },
];

const COLOR_OPTIONS = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1',
];

export function PlaylistForm({ playlistId }: PlaylistFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = !!playlistId;

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    coverImage: '',
    color: '#8B5CF6',
    type: 'SYSTEM',
    contentType: 'MIXED',
    isSystem: true,
    isPublic: true,
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
  });

  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    contentType: 'MEDITATION',
    contentId: '',
    note: '',
  });

  // Content options
  const [meditations, setMeditations] = useState<any[]>([]);
  const [breathworks, setBreathworks] = useState<any[]>([]);
  const [soundscapes, setSoundscapes] = useState<any[]>([]);
  const [sleepStories, setSleepStories] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (playlistId) {
      loadPlaylist();
    }
    loadContentOptions();
  }, [playlistId]);

  const loadPlaylist = async () => {
    setLoading(true);
    try {
      const data = await getAdminPlaylistById(playlistId!);
      const playlist = data.playlist || data;
      setFormData({
        name: playlist.name || '',
        nameEn: playlist.nameEn || '',
        description: playlist.description || '',
        descriptionEn: playlist.descriptionEn || '',
        coverImage: playlist.coverImage || '',
        color: playlist.color || '#8B5CF6',
        type: playlist.type || 'SYSTEM',
        contentType: playlist.contentType || 'MIXED',
        isSystem: playlist.isSystem ?? true,
        isPublic: playlist.isPublic ?? true,
        isFeatured: playlist.isFeatured ?? false,
        isPublished: playlist.isPublished ?? true,
        sortOrder: playlist.sortOrder || 0,
      });
      setItems(playlist.items || []);
    } catch (error) {
      console.error('Failed to load playlist:', error);
      toast.error('Playlist yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadContentOptions = async () => {
    setLoadingContent(true);
    try {
      const [meditationsData, breathworksData, soundscapesData, sleepStoriesData] =
        await Promise.all([
          getAdminMeditations({ isPublished: true, limit: 100 }),
          getAdminBreathworkSessions({ isPublished: true, limit: 100 }),
          getAdminSoundscapes({ isPublished: true, limit: 100 }),
          getAdminSleepStories({ isPublished: true, limit: 100 }),
        ]);

      setMeditations(meditationsData.meditations || []);
      setBreathworks(breathworksData.sessions || breathworksData.breathworkSessions || []);
      setSoundscapes(soundscapesData.soundscapes || []);
      setSleepStories(sleepStoriesData.stories || sleepStoriesData.sleepStories || []);
    } catch (error) {
      console.error('Failed to load content options:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Playlist adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updatePlaylist(playlistId!, formData);
        toast.success('Playlist güncellendi');
      } else {
        await createPlaylist(formData);
        toast.success('Playlist oluşturuldu');
      }
      router.push('/dashboard/playlists');
    } catch (error: any) {
      console.error('Failed to save playlist:', error);
      toast.error(error.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.contentId) {
      toast.error('İçerik seçimi zorunludur');
      return;
    }

    setAddingItem(true);
    try {
      await addPlaylistItem(playlistId!, newItem);
      toast.success('İçerik eklendi');
      setAddItemDialog(false);
      setNewItem({ contentType: 'MEDITATION', contentId: '', note: '' });
      loadPlaylist();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ekleme başarısız');
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removePlaylistItem(playlistId!, itemId);
      toast.success('İçerik kaldırıldı');
      loadPlaylist();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Kaldırma başarısız');
    }
  };

  const getContentOptions = () => {
    switch (newItem.contentType) {
      case 'MEDITATION':
        return meditations;
      case 'BREATHWORK':
        return breathworks;
      case 'SOUNDSCAPE':
        return soundscapes;
      case 'SLEEP_STORY':
        return sleepStories;
      default:
        return [];
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'MEDITATION':
        return <IconBrain className="h-4 w-4" />;
      case 'BREATHWORK':
        return <IconWind className="h-4 w-4" />;
      case 'SOUNDSCAPE':
        return <IconMusic className="h-4 w-4" />;
      case 'SLEEP_STORY':
        return <IconMoon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} dk`;
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/playlists')}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Playlist Düzenle' : 'Yeni Playlist'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Mevcut playlisti düzenleyin' : 'Yeni bir playlist oluşturun'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          {isEditing && <TabsTrigger value="items">İçerikler</TabsTrigger>}
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Temel Bilgiler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Playlist Adı (TR) *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Sabah Meditasyonları"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nameEn">Playlist Adı (EN)</Label>
                        <Input
                          id="nameEn"
                          value={formData.nameEn}
                          onChange={(e) =>
                            setFormData({ ...formData, nameEn: e.target.value })
                          }
                          placeholder="Morning Meditations"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (TR)</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Güne enerjik başlamak için..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descriptionEn">Açıklama (EN)</Label>
                        <Textarea
                          id="descriptionEn"
                          value={formData.descriptionEn}
                          onChange={(e) =>
                            setFormData({ ...formData, descriptionEn: e.target.value })
                          }
                          placeholder="Start your day with energy..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tip *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contentType">İçerik Tipi *</Label>
                        <Select
                          value={formData.contentType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, contentType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Görsel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverImage">Kapak Görseli URL</Label>
                      <Input
                        id="coverImage"
                        value={formData.coverImage}
                        onChange={(e) =>
                          setFormData({ ...formData, coverImage: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tema Rengi</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`h-8 w-8 rounded-full border-2 transition-all ${
                              formData.color === color
                                ? 'border-foreground scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>İşlemler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button type="submit" className="w-full" disabled={saving}>
                      {saving ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : isEditing ? (
                        'Güncelle'
                      ) : (
                        'Oluştur'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/playlists')}
                    >
                      İptal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {isEditing && (
            <TabsContent value="items" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Playlist İçerikleri</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAddItemDialog(true)}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    İçerik Ekle
                  </Button>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz içerik eklenmemiş
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            {getContentIcon(item.contentType)}
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              {item.note && (
                                <p className="text-xs text-muted-foreground">{item.note}</p>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(item.duration)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Yayın Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sistem Playlist</Label>
                    <p className="text-xs text-muted-foreground">
                      Sistem playlistleri tüm kullanıcılara görünür
                    </p>
                  </div>
                  <Switch
                    checked={formData.isSystem}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isSystem: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Herkese Açık</Label>
                    <p className="text-xs text-muted-foreground">
                      Playlist herkese görünür mü?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublic: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Öne Çıkan</Label>
                    <p className="text-xs text-muted-foreground">
                      Ana sayfada öne çıkarsın mı?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFeatured: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yayınla</Label>
                    <p className="text-xs text-muted-foreground">
                      Playlist aktif mi?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublished: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sıralama</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialog} onOpenChange={setAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İçerik Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>İçerik Tipi</Label>
              <Select
                value={newItem.contentType}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, contentType: value, contentId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CONTENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>İçerik</Label>
              <Select
                value={newItem.contentId}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, contentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="İçerik seçin" />
                </SelectTrigger>
                <SelectContent>
                  {getContentOptions().map((content: any) => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.title || content.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Not (opsiyonel)</Label>
              <Input
                value={newItem.note}
                onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                placeholder="Bu içerik için not..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleAddItem} disabled={addingItem}>
              {addingItem ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Ekle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
