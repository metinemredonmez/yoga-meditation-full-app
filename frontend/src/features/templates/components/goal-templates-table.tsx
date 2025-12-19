'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminGoalTemplates,
  deleteGoalTemplate,
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
  IconTarget,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface GoalTemplate {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  type: string;
  targetValue: number;
  unit: string;
  period: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  PRACTICE: { label: 'Pratik', color: 'bg-violet-500' },
  MEDITATION: { label: 'Meditasyon', color: 'bg-indigo-500' },
  BREATHWORK: { label: 'Nefes', color: 'bg-cyan-500' },
  MINDFULNESS: { label: 'Farkındalık', color: 'bg-emerald-500' },
  FITNESS: { label: 'Fitness', color: 'bg-orange-500' },
  WELLNESS: { label: 'Sağlık', color: 'bg-pink-500' },
  LEARNING: { label: 'Öğrenme', color: 'bg-amber-500' },
  STREAK: { label: 'Seri', color: 'bg-red-500' },
  CUSTOM: { label: 'Özel', color: 'bg-gray-500' },
};

const PERIOD_OPTIONS: Record<string, string> = {
  DAILY: 'Günlük',
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
  CUSTOM: 'Özel',
};

export function GoalTemplatesTable() {
  const router = useRouter();
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (periodFilter && periodFilter !== 'all') params.period = periodFilter;

      const data = await getAdminGoalTemplates(params);
      setTemplates(data.templates || data.goalTemplates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, periodFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteGoalTemplate(selectedTemplate.id);
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
                <SelectTrigger className="w-[150px]">
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

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Periyot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(PERIOD_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => router.push('/dashboard/user-content/goal-templates/new')}>
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
              Hedef şablonu bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Şablon Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Periyot</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <span className="text-2xl">{template.icon || '🎯'}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {template.description}
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
                      <span className="font-mono">
                        {template.targetValue} {template.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PERIOD_OPTIONS[template.period] || template.period}
                      </Badge>
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
                              router.push(`/dashboard/user-content/goal-templates/${template.id}`)
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
