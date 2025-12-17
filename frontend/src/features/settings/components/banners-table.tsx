'use client';
import { useEffect, useState } from 'react';
import { getBanners, createBanner, updateBanner, deleteBanner, getAnnouncements } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { IconLoader2, IconPlus, IconPencil, IconTrash, IconPhoto } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: 'home_top' | 'home_middle' | 'program_page';
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isActive: boolean;
  createdAt: string;
}

export function BannersTable() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    position: 'home_top' as 'home_top' | 'home_middle' | 'program_page',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bannersData, announcementsData] = await Promise.all([
        getBanners(),
        getAnnouncements(),
      ]);
      setBanners(bannersData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Failed to load CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      position: 'home_top',
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setEditingBanner(null);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      isActive: banner.isActive,
      startDate: banner.startDate?.split('T')[0] || '',
      endDate: banner.endDate?.split('T')[0] || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl) {
      toast.error('Title and image URL are required');
      return;
    }
    setSaving(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        toast.success('Banner updated');
      } else {
        await createBanner(formData);
        toast.success('Banner created');
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id);
      toast.success('Banner deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'home_top': return 'Home Top';
      case 'home_middle': return 'Home Middle';
      case 'program_page': return 'Program Page';
      default: return position;
    }
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <Tabs defaultValue='banners' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='banners'>Banners</TabsTrigger>
        <TabsTrigger value='announcements'>Announcements</TabsTrigger>
      </TabsList>

      <TabsContent value='banners'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Banners</CardTitle>
              <CardDescription>Manage promotional banners</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className='mr-2 h-4 w-4' />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-lg'>
                <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
                  <DialogDescription>Configure banner settings</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Image URL</Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Link URL</Label>
                    <Input
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Position</Label>
                    <Select value={formData.position} onValueChange={(v: any) => setFormData({ ...formData, position: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='home_top'>Home Top</SelectItem>
                        <SelectItem value='home_middle'>Home Middle</SelectItem>
                        <SelectItem value='program_page'>Program Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Start Date</Label>
                      <Input
                        type='date'
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>End Date</Label>
                      <Input
                        type='date'
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
                    {editingBanner ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              {banners.length === 0 ? (
                <p className='col-span-2 text-center text-muted-foreground py-8'>No banners configured</p>
              ) : (
                banners.map((banner) => (
                  <div key={banner.id} className='border rounded-lg overflow-hidden'>
                    <div className='aspect-video bg-muted flex items-center justify-center'>
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className='w-full h-full object-cover' />
                      ) : (
                        <IconPhoto className='h-12 w-12 text-muted-foreground' />
                      )}
                    </div>
                    <div className='p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-medium'>{banner.title}</h4>
                        <Badge variant={banner.isActive ? 'default' : 'outline'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground mb-2'>{getPositionLabel(banner.position)}</p>
                      <div className='flex gap-2'>
                        <Button size='sm' variant='outline' onClick={() => openEditDialog(banner)}>
                          <IconPencil className='h-4 w-4' />
                        </Button>
                        <Button size='sm' variant='outline' onClick={() => handleDelete(banner.id)}>
                          <IconTrash className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='announcements'>
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>System-wide announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {announcements.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No announcements</p>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className='flex items-start justify-between p-4 border rounded-lg'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-medium'>{announcement.title}</span>
                        <Badge variant={getAnnouncementTypeColor(announcement.type) as any}>
                          {announcement.type}
                        </Badge>
                        {announcement.isActive && <Badge variant='outline'>Active</Badge>}
                      </div>
                      <p className='text-sm text-muted-foreground'>{announcement.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
