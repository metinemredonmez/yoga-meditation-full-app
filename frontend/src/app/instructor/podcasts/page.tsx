'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconSend, IconLoader2, IconMicrophone, IconPhoto, IconX, IconCheck, IconMusic, IconPlayerPlay } from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MyPodcast {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  episodeCount: number;
  totalListens: number;
  subscriberCount: number;
  createdAt: string;
}

const categories = [
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'MINDFULNESS', label: 'Farkındalık' },
  { value: 'LIFESTYLE', label: 'Yaşam Tarzı' },
];

const statusLabels: Record<string, string> = { DRAFT: 'Taslak', PENDING: 'Onay Bekliyor', PUBLISHED: 'Yayında', REJECTED: 'Reddedildi' };
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export default function MyPodcastsPage() {
  const [podcasts, setPodcasts] = useState<MyPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<MyPodcast | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'WELLNESS', coverImageUrl: '', language: 'tr', isExplicit: false,
  });

  useEffect(() => { loadPodcasts(); }, [search]);

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      setPodcasts([
        { id: '1', title: 'Mindful Yaşam', description: 'Farkındalık ve yaşam kalitesi üzerine sohbetler', coverImageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400', category: 'MINDFULNESS', status: 'PUBLISHED', episodeCount: 24, totalListens: 15420, subscriberCount: 856, createdAt: new Date().toISOString() },
        { id: '2', title: 'Yoga Felsefesi', description: 'Yoganın derin anlamları', category: 'YOGA', status: 'DRAFT', episodeCount: 0, totalListens: 0, subscriberCount: 0, createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setSelectedPodcast(null);
    setFormData({ title: '', description: '', category: 'WELLNESS', coverImageUrl: '', language: 'tr', isExplicit: false });
    setEditDialog(true);
  };

  const handleEdit = (p: MyPodcast) => {
    setSelectedPodcast(p);
    setFormData({ title: p.title, description: p.description, category: p.category, coverImageUrl: p.coverImageUrl || '', language: 'tr', isExplicit: false });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Başlık gerekli'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(selectedPodcast ? 'Güncellendi' : 'Oluşturuldu');
      setEditDialog(false);
      loadPodcasts();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('Silindi');
    setDeleteDialog(false);
    loadPodcasts();
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconMicrophone className="h-5 w-5" />Podcastlerim</CardTitle>
              <CardDescription>Podcast serilerinizi oluşturun ve yönetin</CardDescription>
            </div>
            <Button onClick={handleCreate}><IconPlus className="mr-2 h-4 w-4" />Yeni Podcast</Button>
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
                  <TableHead>Podcast</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Bölüm</TableHead>
                  <TableHead>Dinlenme</TableHead>
                  <TableHead>Abone</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : podcasts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz podcast oluşturmadınız</TableCell></TableRow>
                ) : podcasts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {p.coverImageUrl ? <img src={p.coverImageUrl} alt={p.title} className="w-full h-full object-cover" /> : <IconMicrophone className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{categories.find(c => c.value === p.category)?.label}</TableCell>
                    <TableCell>{p.episodeCount}</TableCell>
                    <TableCell>{p.totalListens.toLocaleString()}</TableCell>
                    <TableCell>{p.subscriberCount.toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(p)}><IconEdit className="mr-2 h-4 w-4" />Düzenle</DropdownMenuItem>
                          <DropdownMenuItem><IconPlayerPlay className="mr-2 h-4 w-4" />Bölümler</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedPodcast(p); setDeleteDialog(true); }} className="text-destructive"><IconTrash className="mr-2 h-4 w-4" />Sil</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{selectedPodcast ? 'Düzenle' : 'Yeni Podcast'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2"><Label>Podcast Adı *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedPodcast ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Sil</AlertDialogTitle><AlertDialogDescription>Bu podcast&apos;i silmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Sil</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
