'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminReminderTemplates,
  deleteReminderTemplate,
} from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconLoader2,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconBell,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface ReminderTemplate {
  id: string;
  title: string;
  titleEn?: string;
  type: string;
  message?: string;
  messageEn?: string;
  time?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  MORNING: { label: 'Sabah', color: 'bg-amber-500' },
  EVENING: { label: 'Akşam', color: 'bg-indigo-500' },
  PRACTICE: { label: 'Pratik', color: 'bg-violet-500' },
  MOOD: { label: 'Mood Kayıt', color: 'bg-pink-500' },
  JOURNAL: { label: 'Günlük', color: 'bg-emerald-500' },
  HYDRATION: { label: 'Su İçme', color: 'bg-cyan-500' },
  POSTURE: { label: 'Duruş', color: 'bg-orange-500' },
  BREAK: { label: 'Mola', color: 'bg-green-500' },
  BEDTIME: { label: 'Yatma Vakti', color: 'bg-slate-500' },
  CUSTOM: { label: 'Özel', color: 'bg-gray-500' },
};

export function ReminderTemplatesTable() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

      const data = await getAdminReminderTemplates(params);
      setTemplates(data.templates || data.reminderTemplates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteReminderTemplate(selectedTemplate.id);
      toast.success('Şablon silindi');
      setDeleteDialog(false);
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(TYPE_OPTIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => router.push('/dashboard/user-content/reminder-templates/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Şablon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Hatırlatıcı şablonu bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Şablon Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Saat</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <span className="text-2xl">{template.icon || '🔔'}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.titleEn && (
                          <p className="text-xs text-muted-foreground">
                            {template.titleEn}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${TYPE_OPTIONS[template.type]?.color || 'bg-gray-500'} text-white`}
                      >
                        {TYPE_OPTIONS[template.type]?.label || template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {template.message || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {template.time ? (
                        <div className="flex items-center gap-1">
                          <IconClock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-sm">{template.time}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{template.sortOrder}</span>
                    </TableCell>
                    <TableCell>
                      <Switch checked={template.isActive} disabled />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/user-content/reminder-templates/${template.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedTemplate?.title}&quot; şablonunu silmek istediğinize
              emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
