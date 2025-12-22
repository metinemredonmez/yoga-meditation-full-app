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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconLoader2, IconMoon, IconClock } from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MySleepStory {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
  coverImageUrl?: string;
  duration: number;
  category: string;
  narratorName: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  isPremium: boolean;
  playCount: number;
  averageRating: number;
  createdAt: string;
}

const categories = [
  { value: 'NATURE', label: 'Doğa' },
  { value: 'FANTASY', label: 'Fantezi' },
  { value: 'CITY', label: 'Şehir' },
  { value: 'TRAVEL', label: 'Seyahat' },
  { value: 'AMBIENT', label: 'Ambient' },
];

const statusLabels: Record<string, string> = { DRAFT: 'Taslak', PENDING: 'Onay Bekliyor', PUBLISHED: 'Yayında', REJECTED: 'Reddedildi' };
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export default function MySleepStoriesPage() {
  const [stories, setStories] = useState<MySleepStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<MySleepStory | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'NATURE', narratorName: '', duration: 30, audioUrl: '', coverImageUrl: '', isPremium: false,
  });

  useEffect(() => { loadStories(); }, [search]);

  const loadStories = async () => {
    setLoading(true);
    try {
      setStories([
        { id: '1', title: 'Gizemli Orman Yolculuğu', description: 'Huzurlu bir orman yolculuğuna çıkın', audioUrl: '', coverImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400', duration: 1800, category: 'NATURE', narratorName: 'Elif Yıldız', status: 'PUBLISHED', isPremium: false, playCount: 15620, averageRating: 4.85, createdAt: new Date().toISOString() },
        { id: '2', title: 'Yağmurlu Gece', description: 'Pencereye vuran yağmur sesi eşliğinde', audioUrl: '', coverImageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400', duration: 2700, category: 'AMBIENT', narratorName: 'Zeynep Arslan', status: 'DRAFT', isPremium: true, playCount: 0, averageRating: 0, createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setSelectedStory(null);
    setFormData({ title: '', description: '', category: 'NATURE', narratorName: '', duration: 30, audioUrl: '', coverImageUrl: '', isPremium: false });
    setEditDialog(true);
  };

  const handleEdit = (s: MySleepStory) => {
    setSelectedStory(s);
    setFormData({ title: s.title, description: s.description, category: s.category, narratorName: s.narratorName, duration: Math.floor(s.duration / 60), audioUrl: s.audioUrl || '', coverImageUrl: s.coverImageUrl || '', isPremium: s.isPremium });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Başlık gerekli'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(selectedStory ? 'Güncellendi' : 'Oluşturuldu');
      setEditDialog(false);
      loadStories();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('Silindi');
    setDeleteDialog(false);
    loadStories();
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconMoon className="h-5 w-5" />Uyku Hikayelerim</CardTitle>
              <CardDescription>Dinleyicileriniz için uyku hikayeleri oluşturun</CardDescription>
            </div>
            <Button onClick={handleCreate}><IconPlus className="mr-2 h-4 w-4" />Yeni Hikaye</Button>
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
                  <TableHead>Hikaye</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Anlatıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Dinlenme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : stories.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz hikaye oluşturmadınız</TableCell></TableRow>
                ) : stories.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {s.coverImageUrl ? <img src={s.coverImageUrl} alt={s.title} className="w-full h-full object-cover" /> : <IconMoon className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">{s.title}{s.isPremium && <Badge variant="secondary" className="text-xs">Premium</Badge>}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{s.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{categories.find(c => c.value === s.category)?.label}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><IconClock className="h-4 w-4" />{Math.floor(s.duration / 60)} dk</div></TableCell>
                    <TableCell>{s.narratorName || '-'}</TableCell>
                    <TableCell><Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge></TableCell>
                    <TableCell>{s.playCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(s)}><IconEdit className="mr-2 h-4 w-4" />Düzenle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedStory(s); setDeleteDialog(true); }} className="text-destructive"><IconTrash className="mr-2 h-4 w-4" />Sil</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{selectedStory ? 'Düzenle' : 'Yeni Uyku Hikayesi'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2"><Label>Hikaye Adı *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Süre (dk)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 1})} /></div>
            </div>
            <div className="grid gap-2"><Label>Anlatıcı Adı</Label><Input value={formData.narratorName} onChange={(e) => setFormData({...formData, narratorName: e.target.value})} /></div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div><Label>Premium İçerik</Label><p className="text-sm text-muted-foreground">Sadece premium üyelere göster</p></div>
              <Switch checked={formData.isPremium} onCheckedChange={(c) => setFormData({...formData, isPremium: c})} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedStory ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Sil</AlertDialogTitle><AlertDialogDescription>Bu hikayeyi silmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Sil</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
