'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconLoader2, IconBroadcast, IconCalendar, IconUsers, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MyLiveStream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  type: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  scheduledStartAt: string;
  scheduledEndAt: string;
  maxParticipants: number;
  currentParticipants: number;
  viewCount: number;
  level: string;
  createdAt: string;
}

const types = [
  { value: 'YOGA_CLASS', label: 'Yoga Dersi' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'QA_SESSION', label: 'Soru-Cevap' },
];

const levels = [
  { value: 'BEGINNER', label: 'Başlangıç' },
  { value: 'INTERMEDIATE', label: 'Orta' },
  { value: 'ADVANCED', label: 'İleri' },
  { value: 'ALL', label: 'Tüm Seviyeler' },
];

const statusLabels: Record<string, string> = { SCHEDULED: 'Planlandı', LIVE: 'Yayında', ENDED: 'Bitti', CANCELLED: 'İptal' };
const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  LIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  ENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  CANCELLED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
};

export default function MyLiveStreamsPage() {
  const [streams, setStreams] = useState<MyLiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedStream, setSelectedStream] = useState<MyLiveStream | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', type: 'YOGA_CLASS', level: 'BEGINNER', maxParticipants: 50, scheduledDate: '', scheduledTime: '', duration: 60,
  });

  useEffect(() => { loadStreams(); }, [search]);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const tomorrow = new Date(Date.now() + 86400000);
      const nextWeek = new Date(Date.now() + 604800000);
      setStreams([
        { id: '1', title: 'Sabah Yoga Akışı', description: 'Güne enerji dolu başlayın', thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', type: 'YOGA_CLASS', status: 'SCHEDULED', scheduledStartAt: tomorrow.toISOString(), scheduledEndAt: new Date(tomorrow.getTime() + 3600000).toISOString(), maxParticipants: 100, currentParticipants: 45, viewCount: 0, level: 'BEGINNER', createdAt: new Date().toISOString() },
        { id: '2', title: 'Akşam Meditasyonu', description: 'Günün stresini atın', thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', type: 'MEDITATION', status: 'SCHEDULED', scheduledStartAt: nextWeek.toISOString(), scheduledEndAt: new Date(nextWeek.getTime() + 2400000).toISOString(), maxParticipants: 200, currentParticipants: 12, viewCount: 0, level: 'ALL', createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setSelectedStream(null);
    setFormData({ title: '', description: '', type: 'YOGA_CLASS', level: 'BEGINNER', maxParticipants: 50, scheduledDate: '', scheduledTime: '', duration: 60 });
    setEditDialog(true);
  };

  const handleEdit = (s: MyLiveStream) => {
    setSelectedStream(s);
    const date = new Date(s.scheduledStartAt);
    setFormData({ title: s.title, description: s.description, type: s.type, level: s.level, maxParticipants: s.maxParticipants, scheduledDate: date.toISOString().split('T')[0], scheduledTime: date.toTimeString().slice(0, 5), duration: 60 });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scheduledDate) { toast.error('Gerekli alanları doldurun'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(selectedStream ? 'Güncellendi' : 'Canlı yayın planlandı');
      setEditDialog(false);
      loadStreams();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('İptal edildi');
    setDeleteDialog(false);
    loadStreams();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconBroadcast className="h-5 w-5" />Canlı Yayınlarım</CardTitle>
              <CardDescription>Canlı derslerinizi planlayın ve yönetin</CardDescription>
            </div>
            <Button onClick={handleCreate}><IconPlus className="mr-2 h-4 w-4" />Yeni Canlı Yayın</Button>
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
                  <TableHead>Yayın</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Katılımcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : streams.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz canlı yayın planlamadınız</TableCell></TableRow>
                ) : streams.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" /> : <IconBroadcast className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium">{s.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{s.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{types.find(t => t.value === s.type)?.label}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><IconCalendar className="h-4 w-4" />{formatDate(s.scheduledStartAt)}</div></TableCell>
                    <TableCell><Badge variant="outline">{levels.find(l => l.value === s.level)?.label}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1"><IconUsers className="h-4 w-4" />{s.currentParticipants}/{s.maxParticipants}</div></TableCell>
                    <TableCell><Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {s.status === 'SCHEDULED' && <DropdownMenuItem><IconPlayerPlay className="mr-2 h-4 w-4" />Yayını Başlat</DropdownMenuItem>}
                          {s.status === 'LIVE' && <DropdownMenuItem><IconPlayerStop className="mr-2 h-4 w-4" />Yayını Bitir</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => handleEdit(s)}><IconEdit className="mr-2 h-4 w-4" />Düzenle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedStream(s); setDeleteDialog(true); }} className="text-destructive"><IconTrash className="mr-2 h-4 w-4" />İptal Et</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{selectedStream ? 'Düzenle' : 'Yeni Canlı Yayın'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2"><Label>Başlık *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tür</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Seviye</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({...formData, level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{levels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Tarih *</Label><Input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Saat</Label><Input type="time" value={formData.scheduledTime} onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Süre (dk)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})} /></div>
              <div className="grid gap-2"><Label>Max Katılımcı</Label><Input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 50})} /></div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedStream ? 'Güncelle' : 'Planla'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>İptal Et</AlertDialogTitle><AlertDialogDescription>Bu yayını iptal etmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">İptal Et</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
