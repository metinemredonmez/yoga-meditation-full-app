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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, IconSend,
  IconLoader2, IconWind, IconPhoto, IconX, IconCheck, IconMusic, IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MyBreathwork {
  id: string;
  title: string;
  description: string;
  pattern: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  audioUrl?: string;
  coverImage?: string;
  totalDuration: number;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  isPremium: boolean;
  playCount: number;
  createdAt: string;
}

const categories = [
  { value: 'CALM', label: 'Sakinleştirici' },
  { value: 'ENERGY', label: 'Enerji Verici' },
  { value: 'SLEEP', label: 'Uyku' },
  { value: 'FOCUS', label: 'Odaklanma' },
  { value: 'ANXIETY', label: 'Kaygı Giderici' },
  { value: 'MORNING', label: 'Sabah' },
  { value: 'EVENING', label: 'Akşam' },
];

const patterns = [
  { value: 'BOX_BREATHING', label: 'Kutu Nefesi (4-4-4-4)' },
  { value: 'FOUR_SEVEN_EIGHT', label: '4-7-8 Nefesi' },
  { value: 'RELAXING_BREATH', label: 'Gevşeme Nefesi' },
  { value: 'ENERGIZING_BREATH', label: 'Enerji Nefesi' },
  { value: 'CUSTOM', label: 'Özel' },
];

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak', PENDING: 'Onay Bekliyor', PUBLISHED: 'Yayında', REJECTED: 'Reddedildi',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export default function MyBreathworkPage() {
  const [breathworks, setBreathworks] = useState<MyBreathwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedBreathwork, setSelectedBreathwork] = useState<MyBreathwork | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', pattern: 'BOX_BREATHING', category: 'CALM',
    difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED', inhale: 4, hold1: 4, exhale: 4, hold2: 4,
    cycles: 4, audioUrl: '', coverImage: '', isPremium: false, benefits: '',
  });

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBreathworks(); }, [search]);

  const loadBreathworks = async () => {
    setLoading(true);
    try {
      setBreathworks([
        { id: '1', title: 'Kutu Nefesi', description: 'Navy SEAL tekniği', pattern: 'BOX_BREATHING',
          inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 4, totalDuration: 256, category: 'CALM',
          difficulty: 'BEGINNER', status: 'PUBLISHED', isPremium: false, playCount: 2450, createdAt: new Date().toISOString() },
        { id: '2', title: '4-7-8 Uyku Nefesi', description: 'Uykuya dalmayı kolaylaştırır', pattern: 'FOUR_SEVEN_EIGHT',
          inhale: 4, hold1: 7, exhale: 8, hold2: 0, cycles: 4, totalDuration: 304, category: 'SLEEP',
          difficulty: 'BEGINNER', status: 'DRAFT', isPremium: false, playCount: 0, createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setSelectedBreathwork(null);
    setFormData({ title: '', description: '', pattern: 'BOX_BREATHING', category: 'CALM',
      difficulty: 'BEGINNER', inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 4,
      audioUrl: '', coverImage: '', isPremium: false, benefits: '' });
    setEditDialog(true);
  };

  const handleEdit = (b: MyBreathwork) => {
    setSelectedBreathwork(b);
    setFormData({ title: b.title, description: b.description, pattern: b.pattern, category: b.category,
      difficulty: b.difficulty, inhale: b.inhale, hold1: b.hold1, exhale: b.exhale, hold2: b.hold2,
      cycles: b.cycles, audioUrl: b.audioUrl || '', coverImage: b.coverImage || '', isPremium: b.isPremium, benefits: '' });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Başlık gerekli'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(selectedBreathwork ? 'Güncellendi' : 'Oluşturuldu');
      setEditDialog(false);
      loadBreathworks();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('Silindi');
    setDeleteDialog(false);
    loadBreathworks();
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconWind className="h-5 w-5" />
                Nefes Çalışmalarım
              </CardTitle>
              <CardDescription>Kendi nefes egzersizlerinizi oluşturun</CardDescription>
            </div>
            <Button onClick={handleCreate}><IconPlus className="mr-2 h-4 w-4" />Yeni Nefes Çalışması</Button>
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
                  <TableHead>Nefes Çalışması</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : breathworks.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz nefes çalışması oluşturmadınız</TableCell></TableRow>
                ) : breathworks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <IconWind className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-sm text-muted-foreground">{b.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{`${b.inhale}-${b.hold1}-${b.exhale}-${b.hold2}`}</TableCell>
                    <TableCell>{Math.floor(b.totalDuration / 60)} dk</TableCell>
                    <TableCell>{categories.find(c => c.value === b.category)?.label}</TableCell>
                    <TableCell><Badge className={statusColors[b.status]}>{statusLabels[b.status]}</Badge></TableCell>
                    <TableCell>{b.playCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(b)}><IconEdit className="mr-2 h-4 w-4" />Düzenle</DropdownMenuItem>
                          {b.status === 'DRAFT' && <DropdownMenuItem><IconSend className="mr-2 h-4 w-4" />Onaya Gönder</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => { setSelectedBreathwork(b); setDeleteDialog(true); }} className="text-destructive">
                            <IconTrash className="mr-2 h-4 w-4" />Sil
                          </DropdownMenuItem>
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

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBreathwork ? 'Düzenle' : 'Yeni Nefes Çalışması'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Bilgiler</TabsTrigger>
              <TabsTrigger value="pattern">Nefes Deseni</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Başlık *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Açıklama</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Kategori</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Seviye</Label>
                  <Select value={formData.difficulty} onValueChange={(v: any) => setFormData({...formData, difficulty: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Başlangıç</SelectItem>
                      <SelectItem value="INTERMEDIATE">Orta</SelectItem>
                      <SelectItem value="ADVANCED">İleri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pattern" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Nefes Deseni</Label>
                <Select value={formData.pattern} onValueChange={(v) => setFormData({...formData, pattern: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{patterns.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label>Nefes Al (sn)</Label>
                  <Input type="number" value={formData.inhale} onChange={(e) => setFormData({...formData, inhale: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label>Tut 1 (sn)</Label>
                  <Input type="number" value={formData.hold1} onChange={(e) => setFormData({...formData, hold1: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label>Nefes Ver (sn)</Label>
                  <Input type="number" value={formData.exhale} onChange={(e) => setFormData({...formData, exhale: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label>Tut 2 (sn)</Label>
                  <Input type="number" value={formData.hold2} onChange={(e) => setFormData({...formData, hold2: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Döngü Sayısı</Label>
                <Input type="number" value={formData.cycles} onChange={(e) => setFormData({...formData, cycles: parseInt(e.target.value) || 1})} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>Premium İçerik</Label><p className="text-sm text-muted-foreground">Sadece premium üyelere göster</p></div>
                <Switch checked={formData.isPremium} onCheckedChange={(c) => setFormData({...formData, isPremium: c})} />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedBreathwork ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu nefes çalışmasını silmek istediğinize emin misiniz?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
