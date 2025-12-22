'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconLoader2,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconMail,
  IconBell,
  IconDeviceMobile,
  IconEye,
  IconCode,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { getNotificationTemplatesConfig, updateNotificationTemplatesConfig } from '@/lib/api';

interface NotificationTemplate {
  id: string;
  name: string;
  slug: string;
  type: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
  category: 'TRANSACTIONAL' | 'MARKETING' | 'SYSTEM' | 'REMINDER';
  subject?: string;
  title: string;
  body: string;
  htmlBody?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function NotificationTemplates() {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'EMAIL' as NotificationTemplate['type'],
    category: 'TRANSACTIONAL' as NotificationTemplate['category'],
    subject: '',
    title: '',
    body: '',
    htmlBody: '',
    variables: '',
  });

  useEffect(() => {
    setMounted(true);
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { templates: data } = await getNotificationTemplatesConfig();
      setTemplates(data || []);
    } catch (error) {
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const openEditDialog = (template?: NotificationTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        slug: template.slug,
        type: template.type,
        category: template.category,
        subject: template.subject || '',
        title: template.title,
        body: template.body,
        htmlBody: template.htmlBody || '',
        variables: template.variables.join(', '),
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: '',
        slug: '',
        type: 'EMAIL',
        category: 'TRANSACTIONAL',
        subject: '',
        title: '',
        body: '',
        htmlBody: '',
        variables: '',
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newTemplate: NotificationTemplate = {
        id: selectedTemplate?.id || `template-${Date.now()}`,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        type: formData.type,
        category: formData.category,
        subject: formData.type === 'EMAIL' ? formData.subject : undefined,
        title: formData.title,
        body: formData.body,
        htmlBody: formData.type === 'EMAIL' ? formData.htmlBody : undefined,
        variables: formData.variables.split(',').map(v => v.trim()).filter(Boolean),
        isActive: true,
        createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedTemplates: NotificationTemplate[];
      if (selectedTemplate) {
        updatedTemplates = templates.map(t => t.id === selectedTemplate.id ? newTemplate : t);
      } else {
        updatedTemplates = [...templates, newTemplate];
      }

      await updateNotificationTemplatesConfig(updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success(selectedTemplate ? 'Şablon güncellendi' : 'Şablon oluşturuldu');
      setEditDialog(false);
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      const updatedTemplates = templates.filter(t => t.id !== selectedTemplate.id);
      await updateNotificationTemplatesConfig(updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success('Şablon silindi');
      setDeleteDialog(false);
    } catch (error) {
      toast.error('Şablon silinemedi');
    }
  };

  const handleDuplicate = async (template: NotificationTemplate) => {
    try {
      const duplicate: NotificationTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Kopya)`,
        slug: `${template.slug}-copy`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedTemplates = [...templates, duplicate];
      await updateNotificationTemplatesConfig(updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success('Şablon kopyalandı');
    } catch (error) {
      toast.error('Şablon kopyalanamadı');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <IconMail className="h-4 w-4 text-blue-500" />;
      case 'PUSH':
        return <IconDeviceMobile className="h-4 w-4 text-green-500" />;
      case 'SMS':
        return <IconDeviceMobile className="h-4 w-4 text-purple-500" />;
      case 'IN_APP':
        return <IconBell className="h-4 w-4 text-orange-500" />;
      default:
        return <IconBell className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'TRANSACTIONAL':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">İşlemsel</Badge>;
      case 'MARKETING':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">Pazarlama</Badge>;
      case 'SYSTEM':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">Sistem</Badge>;
      case 'REMINDER':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Hatırlatıcı</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  // SSR hydration fix - render nothing until mounted
  if (!mounted) {
    return null;
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bildirim Şablonları</h2>
          <p className="text-muted-foreground">E-posta ve push bildirim şablonlarını yönetin</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Şablon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tür" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="EMAIL">E-posta</SelectItem>
            <SelectItem value="PUSH">Push</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="IN_APP">Uygulama İçi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            <SelectItem value="TRANSACTIONAL">İşlemsel</SelectItem>
            <SelectItem value="MARKETING">Pazarlama</SelectItem>
            <SelectItem value="SYSTEM">Sistem</SelectItem>
            <SelectItem value="REMINDER">Hatırlatıcı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şablon</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Değişkenler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{template.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <span className="text-sm">{template.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(template.category)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs font-mono">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.isActive ? (
                      <Badge className="bg-green-500/10 text-green-600">Aktif</Badge>
                    ) : (
                      <Badge variant="outline">Pasif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedTemplate(template);
                          setPreviewDialog(true);
                        }}>
                          <IconEye className="mr-2 h-4 w-4" />
                          Önizle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(template)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <IconCopy className="mr-2 h-4 w-4" />
                          Kopyala
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setDeleteDialog(true);
                          }}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Şablon Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Hoş Geldiniz"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="welcome"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tür</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">E-posta</SelectItem>
                    <SelectItem value="PUSH">Push</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="IN_APP">Uygulama İçi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSACTIONAL">İşlemsel</SelectItem>
                    <SelectItem value="MARKETING">Pazarlama</SelectItem>
                    <SelectItem value="SYSTEM">Sistem</SelectItem>
                    <SelectItem value="REMINDER">Hatırlatıcı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'EMAIL' && (
              <div>
                <Label>Konu (Subject)</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Yoga App'e Hoş Geldiniz!"
                />
              </div>
            )}

            <div>
              <Label>Başlık</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Hoş Geldiniz"
              />
            </div>

            <div>
              <Label>İçerik</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Merhaba {{firstName}}, ..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Değişkenler için {'{{degiskenAdi}}'} formatını kullanın
              </p>
            </div>

            {formData.type === 'EMAIL' && (
              <div>
                <Label>HTML İçerik (Opsiyonel)</Label>
                <Textarea
                  value={formData.htmlBody}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlBody: e.target.value }))}
                  placeholder="<h1>Hoş Geldiniz {{firstName}}!</h1>"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            )}

            <div>
              <Label>Değişkenler</Label>
              <Input
                value={formData.variables}
                onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                placeholder="firstName, lastName, email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Virgülle ayırarak değişken adlarını girin
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Şablon Önizleme</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                {selectedTemplate.type === 'EMAIL' && selectedTemplate.subject && (
                  <div className="mb-3 pb-3 border-b">
                    <Label className="text-xs text-muted-foreground">Konu</Label>
                    <p className="font-medium">{selectedTemplate.subject}</p>
                  </div>
                )}
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Başlık</Label>
                  <p className="font-medium">{selectedTemplate.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">İçerik</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedTemplate.body}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Değişkenler</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.variables.map((v) => (
                    <Badge key={v} variant="secondary" className="font-mono text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedTemplate.htmlBody && (
                <div>
                  <Label className="text-xs text-muted-foreground">HTML Önizleme</Label>
                  <div
                    className="mt-1 p-4 border rounded-lg bg-white dark:bg-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTemplate.htmlBody) }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedTemplate?.name}&quot; şablonunu silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
