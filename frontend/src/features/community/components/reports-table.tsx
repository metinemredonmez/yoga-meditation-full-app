'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getContentReports,
  getContentReportStats,
  resolveContentReport,
  dismissContentReport,
  updateContentReportStatus,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconLoader2,
  IconRefresh,
  IconDots,
  IconEye,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconFlag,
  IconMessage,
  IconUser,
  IconFileText,
  IconBan,
  IconAlertOctagon,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Report {
  id: string;
  reason: string;
  description?: string;
  contentType: 'TOPIC' | 'POST' | 'COMMENT' | 'USER';
  contentId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  reporter?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  reportedUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  resolvedBy?: {
    id: string;
    email: string;
  };
  resolution?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface ReportStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  dismissed: number;
  byType: {
    TOPIC: number;
    POST: number;
    COMMENT: number;
    USER: number;
  };
}

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<string>('NO_ACTION');
  const [resolveNotes, setResolveNotes] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        getContentReports({
          status: statusFilter !== 'all' ? statusFilter as any : undefined,
          contentType: typeFilter !== 'all' ? typeFilter as any : undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        getContentReportStats(),
      ]);
      setReports(reportsData.data || []);
      setPagination(prev => ({ ...prev, total: reportsData.pagination?.total || 0 }));
      setStats(statsData.data || null);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (report: Report, newStatus: string) => {
    try {
      await updateContentReportStatus(report.id, newStatus as any);
      toast.success('Durum güncellendi');
      loadData();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;
    try {
      await resolveContentReport(selectedReport.id, {
        action: resolveAction as any,
        notes: resolveNotes || undefined,
      });
      toast.success('Rapor çözüldü');
      setResolveDialog(false);
      setSelectedReport(null);
      setResolveAction('NO_ACTION');
      setResolveNotes('');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDismiss = async (report: Report) => {
    try {
      await dismissContentReport(report.id);
      toast.success('Rapor reddedildi');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Bekliyor</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">İnceleniyor</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="border-green-500 text-green-600">Çözüldü</Badge>;
      case 'DISMISSED':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPIC':
        return <Badge className="bg-purple-500/10 text-purple-600"><IconFileText className="h-3 w-3 mr-1" />Konu</Badge>;
      case 'POST':
        return <Badge className="bg-blue-500/10 text-blue-600"><IconMessage className="h-3 w-3 mr-1" />Yanıt</Badge>;
      case 'COMMENT':
        return <Badge className="bg-green-500/10 text-green-600"><IconMessage className="h-3 w-3 mr-1" />Yorum</Badge>;
      case 'USER':
        return <Badge className="bg-orange-500/10 text-orange-600"><IconUser className="h-3 w-3 mr-1" />Kullanıcı</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      SPAM: 'Spam',
      HARASSMENT: 'Taciz',
      INAPPROPRIATE: 'Uygunsuz İçerik',
      HATE_SPEECH: 'Nefret Söylemi',
      VIOLENCE: 'Şiddet',
      MISINFORMATION: 'Yanlış Bilgi',
      OTHER: 'Diğer',
    };
    return reasons[reason] || reason;
  };

  const getActionLabel = (action: string) => {
    const actions: Record<string, string> = {
      WARNING: 'Uyarı Verildi',
      CONTENT_REMOVED: 'İçerik Silindi',
      USER_SUSPENDED: 'Kullanıcı Askıya Alındı',
      USER_BANNED: 'Kullanıcı Yasaklandı',
      NO_ACTION: 'İşlem Yapılmadı',
    };
    return actions[action] || action;
  };

  const getUserName = (user?: { firstName: string | null; lastName: string | null; email: string }) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || 'Anonim';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Rapor</CardTitle>
              <IconFlag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İnceleniyor</CardTitle>
              <IconEye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Çözülen</CardTitle>
              <IconCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
              <IconX className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="PENDING">Bekliyor</SelectItem>
            <SelectItem value="UNDER_REVIEW">İnceleniyor</SelectItem>
            <SelectItem value="RESOLVED">Çözüldü</SelectItem>
            <SelectItem value="DISMISSED">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPagination(p => ({ ...p, page: 1 })); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tür Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="TOPIC">Konu</SelectItem>
            <SelectItem value="POST">Yanıt</SelectItem>
            <SelectItem value="COMMENT">Yorum</SelectItem>
            <SelectItem value="USER">Kullanıcı</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadData}>
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Rapor bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rapor</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Sebep</TableHead>
                  <TableHead>Raporlayan</TableHead>
                  <TableHead>Raporlanan</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs">
                      {report.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{getTypeBadge(report.contentType)}</TableCell>
                    <TableCell>{getReasonLabel(report.reason)}</TableCell>
                    <TableCell className="text-sm">{getUserName(report.reporter)}</TableCell>
                    <TableCell className="text-sm">{getUserName(report.reportedUser)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: tr })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedReport(report); setViewDialog(true); }}>
                            <IconEye className="mr-2 h-4 w-4" />
                            Detayları Gör
                          </DropdownMenuItem>
                          {report.status === 'PENDING' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(report, 'UNDER_REVIEW')}>
                              <IconEye className="mr-2 h-4 w-4" />
                              İncelemeye Al
                            </DropdownMenuItem>
                          )}
                          {(report.status === 'PENDING' || report.status === 'UNDER_REVIEW') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedReport(report); setResolveDialog(true); }}>
                                <IconCheck className="mr-2 h-4 w-4" />
                                Çöz
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDismiss(report)}>
                                <IconX className="mr-2 h-4 w-4" />
                                Reddet
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Toplam {pagination.total} rapor
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rapor Detayları</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Rapor ID</Label>
                  <p className="font-mono text-sm">{selectedReport.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Durum</Label>
                  <p>{getStatusBadge(selectedReport.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tür</Label>
                  <p>{getTypeBadge(selectedReport.contentType)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sebep</Label>
                  <p>{getReasonLabel(selectedReport.reason)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Raporlayan</Label>
                  <p>{getUserName(selectedReport.reporter)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Raporlanan Kullanıcı</Label>
                  <p>{getUserName(selectedReport.reportedUser)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rapor Tarihi</Label>
                  <p>{format(new Date(selectedReport.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
                </div>
                {selectedReport.resolvedAt && (
                  <div>
                    <Label className="text-muted-foreground">Çözüm Tarihi</Label>
                    <p>{format(new Date(selectedReport.resolvedAt), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
                  </div>
                )}
              </div>
              {selectedReport.description && (
                <div>
                  <Label className="text-muted-foreground">Açıklama</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedReport.description}</p>
                </div>
              )}
              {selectedReport.resolution && (
                <div>
                  <Label className="text-muted-foreground">Çözüm</Label>
                  <p className="mt-1">{getActionLabel(selectedReport.resolution)}</p>
                </div>
              )}
              {selectedReport.resolutionNotes && (
                <div>
                  <Label className="text-muted-foreground">Çözüm Notları</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedReport.resolutionNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raporu Çöz</DialogTitle>
            <DialogDescription>
              Bu rapor için yapılacak işlemi seçin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>İşlem</Label>
              <Select value={resolveAction} onValueChange={setResolveAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_ACTION">
                    <div className="flex items-center">
                      <IconCheck className="mr-2 h-4 w-4" />
                      İşlem Yapılmadı
                    </div>
                  </SelectItem>
                  <SelectItem value="WARNING">
                    <div className="flex items-center">
                      <IconAlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                      Uyarı Ver
                    </div>
                  </SelectItem>
                  <SelectItem value="CONTENT_REMOVED">
                    <div className="flex items-center">
                      <IconX className="mr-2 h-4 w-4 text-red-500" />
                      İçeriği Sil
                    </div>
                  </SelectItem>
                  <SelectItem value="USER_SUSPENDED">
                    <div className="flex items-center">
                      <IconAlertOctagon className="mr-2 h-4 w-4 text-orange-500" />
                      Kullanıcıyı Askıya Al
                    </div>
                  </SelectItem>
                  <SelectItem value="USER_BANNED">
                    <div className="flex items-center">
                      <IconBan className="mr-2 h-4 w-4 text-red-600" />
                      Kullanıcıyı Yasakla
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notlar (Opsiyonel)</Label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Çözüm hakkında not ekleyin..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleResolve}>
              Çöz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
