'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconLoader2, IconPlaylist, IconMusic } from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MyPlaylist {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  itemCount: number;
  totalDuration: number;
  status: 'DRAFT' | 'PUBLISHED';
  isPublic: boolean;
  playCount: number;
  createdAt: string;
}

const statusLabels: Record<string, string> = { DRAFT: 'Taslak', PUBLISHED: 'Yayında' };
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
};

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists] = useState<MyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MyPlaylist | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ title: '', description: '', coverImageUrl: '', isPublic: true });

  useEffect(() => { loadPlaylists(); }, [search]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      setPlaylists([
        { id: '1', title: 'Sabah Rutini', description: 'Güne enerjik başlamak için', coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', itemCount: 5, totalDuration: 1800, status: 'PUBLISHED', isPublic: true, playCount: 3240, createdAt: new Date().toISOString() },
        { id: '2', title: 'Uyku Öncesi', description: 'Rahatlatıcı içerikler', coverImageUrl: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=400', itemCount: 8, totalDuration: 3600, status: 'DRAFT', isPublic: false, playCount: 0, createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setSelectedPlaylist(null);
    setFormData({ title: '', description: '', coverImageUrl: '', isPublic: true });
    setEditDialog(true);
  };

  const handleEdit = (p: MyPlaylist) => {
    setSelectedPlaylist(p);
    setFormData({ title: p.title, description: p.description, coverImageUrl: p.coverImageUrl || '', isPublic: p.isPublic });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Başlık gerekli'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(selectedPlaylist ? 'Güncellendi' : 'Oluşturuldu');
      setEditDialog(false);
      loadPlaylists();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('Silindi');
    setDeleteDialog(false);
    loadPlaylists();
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconPlaylist className="h-5 w-5" />Playlistlerim</CardTitle>
              <CardDescription>İçeriklerinizi playlistler halinde organize edin</CardDescription>
            </div>
            <Button onClick={handleCreate}><IconPlus className="mr-2 h-4 w-4" />Yeni Playlist</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playlist</TableHead>
                  <TableHead>İçerik</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Görünürlük</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oynatma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : playlists.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz playlist oluşturmadınız</TableCell></TableRow>
                ) : playlists.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {p.coverImageUrl ? <img src={p.coverImageUrl} alt={p.title} className="w-full h-full object-cover" /> : <IconPlaylist className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.itemCount} içerik</TableCell>
                    <TableCell>{Math.floor(p.totalDuration / 60)} dk</TableCell>
                    <TableCell><Badge variant="outline">{p.isPublic ? 'Herkese Açık' : 'Özel'}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                    <TableCell>{p.playCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(p)}><IconEdit className="mr-2 h-4 w-4" />Düzenle</DropdownMenuItem>
                          <DropdownMenuItem><IconMusic className="mr-2 h-4 w-4" />İçerikleri Yönet</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedPlaylist(p); setDeleteDialog(true); }} className="text-destructive"><IconTrash className="mr-2 h-4 w-4" />Sil</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedPlaylist ? 'Düzenle' : 'Yeni Playlist'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2"><Label>Playlist Adı *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div><Label>Herkese Açık</Label><p className="text-sm text-muted-foreground">Tüm kullanıcılar görebilsin</p></div>
              <Switch checked={formData.isPublic} onCheckedChange={(c) => setFormData({...formData, isPublic: c})} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedPlaylist ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Sil</AlertDialogTitle><AlertDialogDescription>Bu playlist&apos;i silmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Sil</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
